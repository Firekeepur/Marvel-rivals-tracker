// Load .env automatically
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { getJsonFromS3 } from './s3.js';
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const BUCKET_NAME = process.env.BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const MARVEL_API_KEY = process.env.MARVEL_API_KEY;
const V1 = process.env.MARVEL_API_BASE_V1;
const V2 = process.env.MARVEL_API_BASE_V2;

// S3 keys/prefixes
const S3_META_HEROES = process.env.S3_META_HEROES || 'data/heroes/heroes.json';
const S3_META_MAPS   = process.env.S3_META_MAPS   || 'data/maps/maps.json';
const S3_META_PATCH  = process.env.S3_META_PATCH  || 'data/patch_notes/patch_notes.json';

const S3_PREFIX_PLAYER_LB  = process.env.S3_PREFIX_PLAYER_LB  || 'leaderboards/player';
const S3_PREFIX_HERO_LB    = process.env.S3_PREFIX_HERO_LB    || 'leaderboards/hero';
const S3_PREFIX_HERO_STATS = process.env.S3_PREFIX_HERO_STATS || 'leaderboards/heroes/stats';

// -------- helpers --------
const s3 = new S3Client({ region: AWS_REGION });

async function listPrefixes(prefix) {
  const out = await s3.send(new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix.endsWith('/') ? prefix : `${prefix}/`,
    Delimiter: '/',
    MaxKeys: 1000,
  }));
  return (out.CommonPrefixes || []).map(p => p.Prefix);
}

async function listObjects(prefix, token, max = 60) {
  return s3.send(new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
    ContinuationToken: token,
    MaxKeys: Math.min(Number(max) || 60, 1000),
  }));
}

// season detection (future-proof)
function parseSeasonToken(str) {
  const n = Number(str);
  return Number.isFinite(n) ? n : NaN;
}
let LATEST_SEASON = String(process.env.CURRENT_SEASON ?? '3');
async function detectLatestSeason() {
  try {
    const roots = [
      `${S3_PREFIX_PLAYER_LB}/past/`,
      `${S3_PREFIX_HERO_LB}/past/`,
      `${S3_PREFIX_HERO_STATS}/past/`,
    ];
    const seen = new Set();
    for (const root of roots) {
      const seasons = await listPrefixes(root); // .../past/season_3.5/
      for (const p of seasons) {
        const m = p.match(/season_([^/]+)\//);
        if (m) seen.add(m[1]);
      }
    }
    const nums = Array.from(seen).map(parseSeasonToken).filter(Number.isFinite);
    if (nums.length) {
      const envNum = parseSeasonToken(String(process.env.CURRENT_SEASON ?? ''));
      const maxPast = Math.max(...nums);
      const latest = Number.isFinite(envNum) ? Math.max(envNum, maxPast) : maxPast;
      LATEST_SEASON = String(latest);
    }
  } catch (e) {
    console.warn('detectLatestSeason failed; keeping', LATEST_SEASON, e.message);
  }
  return LATEST_SEASON;
}
await detectLatestSeason();
setInterval(detectLatestSeason, 15 * 60 * 1000);

function isPastSeason(requested) {
  if (!requested) return false;
  if (requested.toLowerCase() === 'current') return false;
  const reqNum = parseSeasonToken(requested);
  const latestNum = parseSeasonToken(LATEST_SEASON);
  if (!Number.isFinite(reqNum) || !Number.isFinite(latestNum)) return false;
  return reqNum < latestNum;
}
function normalizeSeason(q) {
  if (!q || String(q).toLowerCase() === 'current') return LATEST_SEASON;
  return String(q);
}

const API_HEADERS = { 'x-api-key': MARVEL_API_KEY, 'Content-Type': 'application/json' };

// -------- health & options --------
app.get('/healthz', (_req, res) => res.type('text/plain').send('ok'));
app.get('/options/season-latest', (_req, res) => res.json({ latest: LATEST_SEASON }));

app.get('/options/seasons', async (_req, res) => {
  try {
    const roots = [
      `${S3_PREFIX_PLAYER_LB}/past/`,
      `${S3_PREFIX_HERO_LB}/past/`,
      `${S3_PREFIX_HERO_STATS}/past/`,
    ];
    const set = new Set([LATEST_SEASON]);
    for (const root of roots) {
      const seasons = await listPrefixes(root);
      for (const s of seasons) {
        const m = s.match(/season_([^/]+)\//);
        if (m) set.add(m[1]);
      }
    }
    const seasons = Array.from(set)
      .filter(s => Number.isFinite(parseSeasonToken(s)))
      .sort((a,b) => parseSeasonToken(a) - parseSeasonToken(b));
    res.json({ seasons });
  } catch (e) { res.status(500).json({ error: 'options_seasons_failed' }); }
});

app.get('/options/platforms', async (_req, res) => {
  try {
    const root = `${S3_PREFIX_PLAYER_LB}/past/`;
    const seasons = await listPrefixes(root);
    const set = new Set();
    for (const s of seasons) {
      const plats = await listPrefixes(s);
      plats.forEach(p => {
        const segs = p.split('/').filter(Boolean);
        const last = segs[segs.length - 1];
        if (last) set.add(last);
      });
    }
    res.json({ platforms: Array.from(set).sort() });
  } catch (e) { res.status(500).json({ error: 'options_platforms_failed' }); }
});

// -------- metadata (JSON from S3) --------
app.get('/meta/heroes', async (_req, res) => {
  try {
    const data = await getJsonFromS3(S3_META_HEROES);
    if (!data) return res.status(404).json({ error: 'heroes.json not found in S3' });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/meta/maps', async (_req, res) => {
  try {
    const data = await getJsonFromS3(S3_META_MAPS);
    if (!data) return res.status(404).json({ error: 'maps.json not found in S3' });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/meta/patch-notes', async (_req, res) => {
  try {
    const data = await getJsonFromS3(S3_META_PATCH);
    if (!data) return res.status(404).json({ error: 'patch_notes.json not found in S3' });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// -------- assets (images/files) --------
app.get('/assets/list', async (req, res) => {
  try {
    const prefix = String(req.query.prefix || '');
    const token  = req.query.token ? String(req.query.token) : undefined;
    const max    = req.query.max ? Number(req.query.max) : 60;
    const exp    = req.query.expires ? Number(req.query.expires) : 900;

    const out = await listObjects(prefix, token, max);
    const items = await Promise.all((out.Contents || []).map(async o => ({
      key: o.Key,
      size: o.Size,
      etag: o.ETag,
      lastModified: o.LastModified,
      url: await getSignedUrl(s3, new GetObjectCommand({
        Bucket: BUCKET_NAME, Key: o.Key
      }), { expiresIn: exp }),
    })));

    res.json({ prefix, nextToken: out.IsTruncated ? out.NextContinuationToken : null, items, expires: exp });
  } catch (e) { res.status(500).json({ error: 'assets_list_failed' }); }
});

// -------- leaderboards / stats --------
app.get('/players/leaderboard', async (req, res) => {
  try {
    const season = normalizeSeason(String(req.query.season || 'current'));
    const device = req.query.device;
    const page   = req.query.page;
    const limit  = req.query.limit;

    if (device && isPastSeason(season)) {
      const key = `${S3_PREFIX_PLAYER_LB}/past/season_${season}/${device}.json`;
      const cached = await getJsonFromS3(key);
      if (cached) return res.json(cached);
    }

    const url = new URL(`${V2}/players/leaderboard`);
    url.searchParams.set('season', season);
    if (device) url.searchParams.set('device', device);
    if (page)   url.searchParams.set('page', page);
    if (limit)  url.searchParams.set('limit', limit);

    const r = await fetch(url, { headers: API_HEADERS });
    if (!r.ok) return res.status(r.status).json({ error: await r.text() });
    res.json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/heroes/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const season = normalizeSeason(String(req.query.season || 'current'));
    const device = req.query.device;

    if (device && isPastSeason(season)) {
      const key = `${S3_PREFIX_HERO_STATS}/past/season_${season}/${device}/hero_${id}.json`;
      const cached = await getJsonFromS3(key);
      if (cached) return res.json(cached);
    }

    const url = new URL(`${V1}/heroes/hero/${id}/stats`);
    url.searchParams.set('season', season);

    const r = await fetch(url, { headers: API_HEADERS });
    if (r.status === 404) return res.status(404).json({ not_found: true });
    if (!r.ok) return res.status(r.status).json({ error: await r.text() });
    res.json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/heroes/:id/leaderboard', async (req, res) => {
  try {
    const { id } = req.params;
    const device = req.query.device;
    const season = normalizeSeason(String(req.query.season || 'current'));

    if (device && isPastSeason(season)) {
      const key = `${S3_PREFIX_HERO_LB}/past/season_${season}/${device}/${id}.json`;
      const cached = await getJsonFromS3(key);
      if (cached) return res.json(cached);
    }

    const url = new URL(`${V1}/heroes/leaderboard/${id}`);
    if (device) url.searchParams.set('platform', device);

    const r = await fetch(url, { headers: API_HEADERS });
    if (!r.ok) return res.status(r.status).json({ error: await r.text() });
    res.json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// dynamic player/match (always live)
app.get('/players/:id', async (req, res) => {
  try {
    const url = new URL(`${V2}/players/${req.params.id}`);
    for (const [k, v] of Object.entries(req.query)) url.searchParams.set(k, v);
    const r = await fetch(url, { headers: API_HEADERS });
    if (!r.ok) return res.status(r.status).json({ error: await r.text() });
    res.json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/matches/:id', async (req, res) => {
  try {
    const url = new URL(`${V2}/matches/${req.params.id}`);
    const r = await fetch(url, { headers: API_HEADERS });
    if (!r.ok) return res.status(r.status).json({ error: await r.text() });
    res.json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/matches', async (req, res) => {
  try {
    const url = new URL(`${V2}/matches`);
    for (const [k, v] of Object.entries(req.query)) url.searchParams.set(k, v);
    const r = await fetch(url, { headers: API_HEADERS });
    if (!r.ok) return res.status(r.status).json({ error: await r.text() });
    res.json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, '0.0.0.0', () => console.log(`API listening on :${PORT}`));
