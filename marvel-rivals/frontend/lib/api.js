// frontend/lib/api.js

// ---------- Env & constants ----------
const S3_BASE = (process.env.NEXT_PUBLIC_S3_BASE_URL || "").replace(/\/+$/, "");
if (!S3_BASE) {
  throw new Error("Missing NEXT_PUBLIC_S3_BASE_URL");
}

// Defaults match your bucket contents
const PATHS = {
  heroes: process.env.S3_META_HEROES || "data/heroes/heroes.json",
  maps: process.env.S3_META_MAPS || "data/maps/maps.json",
  patchNotes:
    process.env.S3_META_PATCH || "data/patch_notes/patch_notes.json",
};

// Devices & seasons based on your jobs script
export const DEVICES = ["pc", "psn", "xbox"];
export const PAST_SEASONS = ["0", "1", "1.5", "2", "2.5", "3"]; // all have data
export const CURRENT_SEASON = process.env.NEXT_PUBLIC_SEASON || "3.5";
export const ALL_SEASONS = [...PAST_SEASONS, CURRENT_SEASON];

// ---------- Utils ----------
const s3Url = (path) =>
  `${S3_BASE}/${String(path).replace(/^\/+/, "").replace(/\/+$/, "")}`;

// ----- fetch helper: return null on 404 so UI can show "Not available" -----
async function fetchJSONOrNull(url, init = {}) {
  const res = await fetch(url, { cache: "no-store", ...init });
  if (res.status === 404) return null;            // <- S3 key not present yet
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// keep strict version for metadata we expect to exist
async function fetchJSON(url, init = {}) {
  const res = await fetch(url, { cache: "no-store", ...init });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  return res.json();
}

const seasonPath = ({ current = true, season = CURRENT_SEASON } = {}) =>
  `${current ? "current" : "past"}/season_${season}`;

// Helpful for images in S3 (icons, costumes, etc.)
export const getS3ImageUrl = (relativePath) => s3Url(relativePath);

// ---------- S3 metadata ----------
export const getHeroesMeta = () => fetchJSON(s3Url(PATHS.heroes));
export const getMapsMeta = () => fetchJSON(s3Url(PATHS.maps));

export async function getPatchNotes() {
  // Your file shape: { total_patches, formatted_patches: [...] }
  const json = await fetchJSON(s3Url(PATHS.patchNotes));
  return Array.isArray(json?.formatted_patches) ? json.formatted_patches : [];
}

// ---------- Player leaderboards ----------
/**
 * Fetch the top player leaderboard for a device/season.
 * S3 path produced by your jobs script:
 * leaderboards/player/{current|past}/season_{N}/{device}.json
 */
export async function fetchPlayerLeaderboard({ device = "pc", season = CURRENT_SEASON, current = true } = {}) {
  const path = `leaderboards/player/${seasonPath({ current, season })}/${device}.json`;
  return fetchJSON(s3Url(path));
}

// ---------- Hero leaderboards & stats ----------
/**
 * Per-hero leaderboard (top players on that hero)
 * leaderboards/heroes/leaderboard/{current|past}/season_{N}/{device}/hero_{ID}.json
 */

export async function fetchHeroLeaderboard({ heroId, device = "pc", season = CURRENT_SEASON, current = true } = {}) {
  if (!heroId && heroId !== 0) throw new Error("heroId is required");
  const path = `leaderboards/heroes/leaderboard/${seasonPath({ current, season })}/${device}/hero_${heroId}.json`;
  return fetchJSONOrNull(s3Url(path));
}

/**
 * Per-hero aggregated stats
 * leaderboards/heroes/stats/{current|past}/season_{N}/{device}/hero_{ID}.json
 */
// ----- hero leaderboard (top players on a hero) — if empty, return null -----

export async function fetchHeroStats({ heroId, device = "pc", season = CURRENT_SEASON, current = true } = {}) {
  if (!heroId && heroId !== 0) throw new Error("heroId is required");
  const path = `leaderboards/heroes/stats/${seasonPath({ current, season })}/${device}/hero_${heroId}.json`;
  return fetchJSONOrNull(s3Url(path)); // null means "Not available"
}

export function heroStatsAvailable(data) {
  if (!data) return false;                 // null → not available
  if (Array.isArray(data) && data.length === 0) return false;
  if (typeof data === "object" && Object.keys(data).length === 0) return false;
  return true;
}

/**
 * Convenience: fetch multiple heroes' stats at once.
 */
export async function fetchManyHeroStats({
  heroIds = [],
  device = "pc",
  season = CURRENT_SEASON,
  current = true,
} = {}) {
  const jobs = heroIds.map((id) =>
    fetchHeroStats({ heroId: id, device, season, current }).then((data) => ({
      heroId: id,
      data,
    }))
  );
  return Promise.allSettled(jobs).then((results) =>
    results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value)
  );
}

// ---------- Section helpers for your new homepage ----------
export async function getHomeSections({
  device = "pc",
  season = CURRENT_SEASON,
  current = true,
} = {}) {
  // Heroes, Skins, Maps, Leaderboards (top players)
  const [heroes, maps, players] = await Promise.all([
    getHeroesMeta(),
    getMapsMeta(),
    fetchPlayerLeaderboard({ device, season, current }),
  ]);

  return {
    heroes, // from data/heroes/heroes.json
    maps, // from data/maps/maps.json
    // Skins: you only have images in images/costumes/* — no manifest yet.
    // You can wire a manifest later; for now return empty list.
    skins: [],
    leaderboards: players,
  };
}
