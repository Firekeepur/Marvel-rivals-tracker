  useEffect(()=>{ getOptions().then(setOpts).catch(()=>{}); }, []);

  async function doSearch() {
    setPlayer(null); setPred(null);
    try {
      const p = await findPlayer(query, { season: pick.season });
      setPlayer(p);
      try { setPred(await getPredictionsForPlayer(p?.id || query, pick)); } catch(e) { setPred({ available:false, reason:String(e) }); }
    } catch (e) {
      setPlayer({ error: String(e) });
    }
  }

  return (
    <div className="grid" style={{ gridTemplateColumns:'1fr', gap:16 }}>
      <div className="section">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>Player Search</div>
          <SeasonPlatformPicker seasons={opts.seasons} platforms={opts.platforms} value={pick} onChange={setPick} />
        </div>
        <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
          <input className="input" placeholder="Player ID or username" value={query} onChange={e=>setQuery(e.target.value)} />
          <button className="button" disabled={!query} onClick={doSearch}>Search</button>
        </div>
      </div>

      <div className="section">
        <div style={{ fontWeight:700, marginBottom:8 }}>Player</div>
        <pre style={{ whiteSpace:'pre-wrap', overflowX:'auto' }}>{player ? JSON.stringify(player, null, 2) : 'Search to load.'}</pre>
      </div>

      <div className="section">
        <div style={{ fontWeight:700, marginBottom:8 }}>Predictions (on-demand)</div>
        <pre style={{ whiteSpace:'pre-wrap', overflowX:'auto' }}>{pred ? JSON.stringify(pred, null, 2) : 'Will compute when player is searched.'}</pre>
      </div>
    </div>
  );
}
EOF

npm install
npm run dev
ls -R pages
nano pages/leaderboards.js
nano pages/heroes/index.js
nano pages/maps/index.js
mkdir -p pages/heroes pages/maps
nano pages/maps/index.js
nano pages/patch-notes.js
nano pages/leaderboards.js
ls
nano lib/api.js
echo "SITE_URL=http://127.0.0.1:3000" > .env.local
npm run dev
cat > lib/api.js <<'EOF'
// lib/api.js

// Server needs absolute URLs during SSR
const SERVER_BASE = process.env.SITE_URL || 'http://127.0.0.1:3000';
// Browser can use relative; Next rewrites /api/* -> :4000 via next.config.js
const CLIENT_BASE = '';

function base() {
  return typeof window === 'undefined' ? SERVER_BASE : CLIENT_BASE;
}

async function http(url) {
  const r = await fetch(url, { headers: { 'content-type': 'application/json' } });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  const ct = r.headers.get('content-type') || '';
  return ct.includes('application/json') ? r.json() : r.text();
}

function abs(path) {
  const b = base();
  if (b && path.startsWith('/')) return new URL(path, b).toString();
  return path;
}

export const API_BASE = '/api'; // proxied in next.config.js

export async function getOptions() {
  const seasons = await http(abs(`${API_BASE}/options/seasons`));
  const platforms = await http(abs(`${API_BASE}/options/platforms`));
  return {
    seasons: ['current', ...(seasons?.seasons || [])],
    platforms: platforms?.platforms || ['pc', 'ps', 'xbox'],
  };
}

export async function getHeroesMeta() { return http(abs(`${API_BASE}/meta/heroes`)); }
export async function getMapsMeta()   { return http(abs(`${API_BASE}/meta/maps`)); }
export async function getPatchNotes() { return http(abs(`${API_BASE}/meta/patch-notes`)); }

export async function getPlayerLeaderboard({ season, device, page, limit } = {}) {
  const u = new URL(`${API_BASE}/players/leaderboard`, base() || 'http://localhost');
  if (season) u.searchParams.set('season', season);
  if (device) u.searchParams.set('device', device);
  if (page)   u.searchParams.set('page', page);
  if (limit)  u.searchParams.set('limit', limit);
  return http(abs(u.toString().replace(/^https?:\/\/localhost/, '')));
}

export async function getHeroStats(id, { season, device } = {}) {
  const u = new URL(`${API_BASE}/heroes/${id}/stats`, base() || 'http://localhost');
  if (season) u.searchParams.set('season', season);
  if (device) u.searchParams.set('device', device);
  return http(abs(u.toString().replace(/^https?:\/\/localhost/, '')));
}

export async function getHeroLeaderboard(id, { season, device } = {}) {
  const u = new URL(`${API_BASE}/heroes/${id}/leaderboard`, base() || 'http://localhost');
  if (season) u.searchParams.set('season', season);
  if (device) u.searchParams.set('device', device);
  return http(abs(u.toString().replace(/^https?:\/\/localhost/, '')));
}

export async function findPlayer(idOrName, params = {}) {
  const u = new URL(`${API_BASE}/players/${encodeURIComponent(idOrName)}`, base() || 'http://localhost');
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return http(abs(u.toString().replace(/^https?:\/\/localhost/, '')));
}

export async function listAssets(prefix, { token, max = 60, expires = 900 } = {}) {
  const u = new URL(`${API_BASE}/assets/list`, base() || 'http://localhost');
  if (prefix) u.searchParams.set('prefix', prefix);
  if (token)  u.searchParams.set('token', token);
  u.searchParams.set('max', String(max));
  u.searchParams.set('expires', String(expires));
  return http(abs(u.toString().replace(/^https?:\/\/localhost/, '')));
}

export async function getPredictionsForPlayer(playerId, { season, device } = {}) {
  const u = new URL(`${API_BASE}/analytics/predict`, base() || 'http://localhost');
  u.searchParams.set('player', playerId);
  if (season) u.searchParams.set('season', season);
  if (device) u.searchParams.set('device', device);
  return http(abs(u.toString().replace(/^https?:\/\/localhost/, '')));
}
EOF

ls
cd lib
ls
nano api.js
cd ..
npm run dev
ls -la pages | grep heroes
ls -la pages/heroes
cat > 'pages/heroes/index.js' <<'EOF'
import Link from 'next/link';
import { getHeroesMeta } from '../../lib/api';

export async function getServerSideProps() {
  try {
    const data = await getHeroesMeta();
    return { props: { heroes: data?.heroes || [] } };
  } catch (e) {
    return { props: { heroes: [], error: String(e) } };
  }
}

export default function HeroesPage({ heroes, error }) {
  if (error) return <pre style={{padding:16}}>{error}</pre>;
  return (
    <div style={{ padding: 16 }}>
      <h1>Heroes</h1>
      {heroes.length === 0 ? (
        <p>No heroes found.</p>
      ) : (
        <ul>
          {heroes.map(h => (
            <li key={h.id}>
              <Link href={`/heroes/${h.id}`}>{h.name || h.id}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
EOF

cat > 'pages/maps/index.js' <<'EOF'
import Link from 'next/link';
import { getMapsMeta } from '../../lib/api';

export async function getServerSideProps() {
  try {
    const data = await getMapsMeta();
    return { props: { maps: data?.maps || [] } };
  } catch (e) {
    return { props: { maps: [], error: String(e) } };
  }
}

export default function MapsPage({ maps, error }) {
  if (error) return <pre style={{padding:16}}>{error}</pre>;
  return (
    <div style={{ padding: 16 }}>
      <h1>Maps</h1>
      {maps.length === 0 ? (
        <p>No maps found.</p>
      ) : (
        <ul>
          {maps.map(m => (
            <li key={m.id}>
              <Link href={`/maps/${m.id}`}>{m.name || m.id}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
EOF

npm run dev
cat > 'pages/heroes/index.js' <<'EOF'
import Link from 'next/link';
import { getHeroesMeta } from '../../lib/api';

export async function getServerSideProps() {
  try {
    const data = await getHeroesMeta();
    const heroes = Array.isArray(data) ? data : (data?.heroes || []);
    return { props: { heroes } };
  } catch (e) {
    return { props: { heroes: [], error: String(e) } };
  }
}

export default function HeroesPage({ heroes, error }) {
  if (error) return <pre style={{ padding: 16 }}>{error}</pre>;
  return (
    <div style={{ padding: 16 }}>
      <h1>Heroes</h1>
      {heroes.length === 0 ? (
        <p>No heroes found.</p>
      ) : (
        <ul>
          {heroes.map(h => (
            <li key={h.id || h.heroId || h.name}>
              <Link href={`/heroes/${h.id || h.heroId}`}>{h.name || h.id || h.heroId}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
EOF

npm run dev
cat > 'pages/patch-notes/index.js' <<'EOF'
import { getPatchNotes } from '../../lib/api';

export async function getServerSideProps() {
  try {
    const data = await getPatchNotes();
    // tolerate multiple shapes
    const notes = Array.isArray(data) ? data : (data?.notes || data?.patchNotes || []);
    return { props: { notes } };
  } catch (e) {
    return { props: { notes: [], error: String(e) } };
  }
}

export default function PatchNotesPage({ notes, error }) {
  if (error) return <pre style={{ padding: 16 }}>{error}</pre>;
  return (
    <div style={{ padding: 16 }}>
      <h1>Patch Notes</h1>
      {(!notes || notes.length === 0) ? (
        <p>No patch notes found.</p>
      ) : (
        <ul>
          {notes.map((n, i) => (
            <li key={n.id || n.version || i} style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>
                {n.title || n.version || `Patch ${i + 1}`}
              </h3>
              <small>{n.date || n.publishedAt || ''}</small>
              {n.summary && <p>{n.summary}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
EOF

mkdir -p 'pages/patch-notes'
cat > 'pages/patch-notes/index.js' <<'EOF'
import { getPatchNotes } from '../../lib/api';

export async function getServerSideProps() {
  try {
    const data = await getPatchNotes();
    // tolerate multiple shapes
    const notes = Array.isArray(data) ? data : (data?.notes || data?.patchNotes || []);
    return { props: { notes } };
  } catch (e) {
    return { props: { notes: [], error: String(e) } };
  }
}

export default function PatchNotesPage({ notes, error }) {
  if (error) return <pre style={{ padding: 16 }}>{error}</pre>;
  return (
    <div style={{ padding: 16 }}>
      <h1>Patch Notes</h1>
      {(!notes || notes.length === 0) ? (
        <p>No patch notes found.</p>
      ) : (
        <ul>
          {notes.map((n, i) => (
            <li key={n.id || n.version || i} style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>
                {n.title || n.version || `Patch ${i + 1}`}
              </h3>
              <small>{n.date || n.publishedAt || ''}</small>
              {n.summary && <p>{n.summary}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
EOF

cat > 'pages/leaderboards/index.js' <<'EOF'
import { getOptions, getPlayerLeaderboard } from '../../lib/api';

export async function getServerSideProps(ctx) {
  const { season = 'current', device = 'pc', page = '1', limit = '50' } = ctx.query || {};
  try {
    const [opts, data] = await Promise.all([
      getOptions(),
      getPlayerLeaderboard({ season, device, page, limit })
    ]);

    // normalize leaderboard entries
    const entries =
      data?.entries ||
      data?.rankings ||
      data?.players ||
      (Array.isArray(data) ? data : data?.data) ||
      [];

    return {
      props: {
        season, device, page: Number(page), limit: Number(limit),
        options: opts || { seasons: ['current'], platforms: ['pc','ps','xbox'] },
        entries
      }
    };
  } catch (e) {
    return {
      props: {
        season, device, page: Number(page), limit: Number(limit),
        options: { seasons: ['current'], platforms: ['pc','ps','xbox'] },
        entries: [], error: String(e)
      }
    };
  }
}

export default function LeaderboardsPage({ season, device, page, limit, options, entries, error }) {
  return (
    <div style={{ padding: 16 }}>
      <h1>Leaderboards</h1>

      <form method="get" style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <label>
          Season:{' '}
          <select name="season" defaultValue={season}>
            {(options?.seasons || ['current']).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Platform:{' '}
          <select name="device" defaultValue={device}>
            {(options?.platforms || ['pc','ps','xbox']).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <input type="hidden" name="limit" value={limit} />
        <button type="submit">Go</button>
      </form>

      {error && <pre style={{ padding: 12, background: '#fee' }}>{error}</pre>}

      {entries.length === 0 ? (
        <p>No leaderboard data.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table cellPadding="6" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th align="left">#</th>
                <th align="left">Player</th>
                <th align="right">Rating</th>
                <th align="right">Wins</th>
                <th align="right">Losses</th>
                <th align="right">Games</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => {
                const rank = e.rank || e.position || (i + 1 + (page - 1) * limit);
                const name = e.name || e.playerName || e.nickname || e.player_id || e.id;
                const rating = e.rating || e.mmr || e.score || e.elo || '';
                const wins = e.wins ?? e.win ?? '';
                const losses = e.losses ?? e.loss ?? '';
                const games = e.games ?? (Number(wins || 0) + Number(losses || 0));
                return (
                  <tr key={e.id || e.player_id || name || i} style={{ borderTop: '1px solid #eee' }}>
                    <td>{rank}</td>
                    <td>{name}</td>
                    <td align="right">{rating}</td>
                    <td align="right">{wins}</td>
                    <td align="right">{losses}</td>
                    <td align="right">{games}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        {page > 1 && (
          <a href={`?season=${encodeURIComponent(season)}&device=${device}&page=${page - 1}&limit=${limit}`}>Prev</a>
        )}
        {entries.length === limit && (
          <a href={`?season=${encodeURIComponent(season)}&device=${device}&page=${page + 1}&limit=${limit}`}>Next</a>
        )}
      </div>
    </div>
  );
}
EOF

mkdir -p 'pages/leaderboards'
cat > 'pages/leaderboards/index.js' <<'EOF'
import { getOptions, getPlayerLeaderboard } from '../../lib/api';

export async function getServerSideProps(ctx) {
  const { season = 'current', device = 'pc', page = '1', limit = '50' } = ctx.query || {};
  try {
    const [opts, data] = await Promise.all([
      getOptions(),
      getPlayerLeaderboard({ season, device, page, limit })
    ]);

    // normalize leaderboard entries
    const entries =
      data?.entries ||
      data?.rankings ||
      data?.players ||
      (Array.isArray(data) ? data : data?.data) ||
      [];

    return {
      props: {
        season, device, page: Number(page), limit: Number(limit),
        options: opts || { seasons: ['current'], platforms: ['pc','ps','xbox'] },
        entries
      }
    };
  } catch (e) {
    return {
      props: {
        season, device, page: Number(page), limit: Number(limit),
        options: { seasons: ['current'], platforms: ['pc','ps','xbox'] },
        entries: [], error: String(e)
      }
    };
  }
}

export default function LeaderboardsPage({ season, device, page, limit, options, entries, error }) {
  return (
    <div style={{ padding: 16 }}>
      <h1>Leaderboards</h1>

      <form method="get" style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <label>
          Season:{' '}
          <select name="season" defaultValue={season}>
            {(options?.seasons || ['current']).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Platform:{' '}
          <select name="device" defaultValue={device}>
            {(options?.platforms || ['pc','ps','xbox']).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <input type="hidden" name="limit" value={limit} />
        <button type="submit">Go</button>
      </form>

      {error && <pre style={{ padding: 12, background: '#fee' }}>{error}</pre>}

      {entries.length === 0 ? (
        <p>No leaderboard data.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table cellPadding="6" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th align="left">#</th>
                <th align="left">Player</th>
                <th align="right">Rating</th>
                <th align="right">Wins</th>
                <th align="right">Losses</th>
                <th align="right">Games</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => {
                const rank = e.rank || e.position || (i + 1 + (page - 1) * limit);
                const name = e.name || e.playerName || e.nickname || e.player_id || e.id;
                const rating = e.rating || e.mmr || e.score || e.elo || '';
                const wins = e.wins ?? e.win ?? '';
                const losses = e.losses ?? e.loss ?? '';
                const games = e.games ?? (Number(wins || 0) + Number(losses || 0));
                return (
                  <tr key={e.id || e.player_id || name || i} style={{ borderTop: '1px solid #eee' }}>
                    <td>{rank}</td>
                    <td>{name}</td>
                    <td align="right">{rating}</td>
                    <td align="right">{wins}</td>
                    <td align="right">{losses}</td>
                    <td align="right">{games}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        {page > 1 && (
          <a href={`?season=${encodeURIComponent(season)}&device=${device}&page=${page - 1}&limit=${limit}`}>Prev</a>
        )}
        {entries.length === limit && (
          <a href={`?season=${encodeURIComponent(season)}&device=${device}&page=${page + 1}&limit=${limit}`}>Next</a>
        )}
      </div>
    </div>
  );
}
EOF

npm run dev 
rm -f pages/patch-notes.js
# ensure folder exists
mkdir -p 'pages/patch-notes'
# overwrite with a clean, minimal page
cat > 'pages/patch-notes/index.jsx' <<'EOF'
import React from 'react';
import { getPatchNotes } from '../../lib/api';

export async function getServerSideProps() {
  try {
    const data = await getPatchNotes();
    const notes = Array.isArray(data) ? data : (data?.notes || data?.patchNotes || []);
    return { props: { notes } };
  } catch (e) {
    return { props: { notes: [], error: String(e) } };
  }
}

export default function Page({ notes, error }) {
  if (error) return <pre style={{ padding: 16 }}>{error}</pre>;
  return (
    <div style={{ padding: 16 }}>
      <h1>Patch Notes</h1>
      {(!notes || notes.length === 0) ? (
        <p>No patch notes found.</p>
      ) : (
        <ul>
          {notes.map((n, i) => (
            <li key={n.id || n.version || i} style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>{n.title || n.version || `Patch ${i + 1}`}</h3>
              <small>{n.date || n.publishedAt || ''}</small>
              {n.summary && <p>{n.summary}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
EOF

npm run dev 
rm -f pages/leaderboards.js
rm -f pages/patch-notes/index.js
mkdir -p 'pages/leaderboards'
cat > 'pages/leaderboards/index.jsx' <<'EOF'
import React from 'react';
import { getPlayerLeaderboard } from '../../lib/api';

export async function getServerSideProps({ query }) {
  const season = query.season || 'current';
  const device = query.device || 'pc';
  const page   = query.page   || '1';
  const limit  = query.limit  || '50';

  try {
    const data = await getPlayerLeaderboard({ season, device, page, limit });
    const rows = data?.rows || data?.players || data || [];
    return { props: { rows, season, device, page: Number(page), limit: Number(limit) } };
  } catch (e) {
    return { props: { rows: [], season, device, page: Number(page), limit: Number(limit), error: String(e) } };
  }
}

export default function Page({ rows, season, device, error }) {
  if (error) return <pre style={{ padding: 16 }}>{error}</pre>;

  return (
    <div style={{ padding: 16 }}>
      <h1>Leaderboards</h1>
      <p>Season: <b>{season}</b> · Platform: <b>{device}</b></p>
      {(!rows || rows.length === 0) ? (
        <p>No leaderboard data.</p>
      ) : (
        <table border="1" cellPadding="6" cellSpacing="0">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Rating</th>
              <th>Wins</th>
              <th>Losses</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id || r.playerId || i}>
                <td>{r.rank || i + 1}</td>
                <td>{r.name || r.playerName || r.player_id || r.id}</td>
                <td>{r.rating ?? r.mmrs ?? r.mmr ?? '-'}</td>
                <td>{r.wins ?? '-'}</td>
                <td>{r.losses ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
EOF

npm run dev
cat > pages/leaderboards/index.jsx <<'EOF'
import React from 'react';
import { getPlayerLeaderboard } from '../../lib/api';

// Helpers that turn "maybe object" fields into numbers/strings
const num = (v) => {
  if (v == null) return undefined;
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '') return Number(v);
  if (typeof v === 'object') {
    // grab a useful field if present
    if ('value' in v && typeof v.value !== 'object') return Number(v.value);
    if ('rank_score' in v && typeof v.rank_score !== 'object') return Number(v.rank_score);
  }
  return undefined;
};
const text = (v) => {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (typeof v === 'object') {
    // prefer common id/name fields
    return (
      v.name || v.playerName || v.player_id || v.id ||
      v.tag || v.handle || ''
    );
  }
  return String(v);
};

// Try to normalize a row from whatever the API gives us
function flattenRow(r, i) {
  const name =
    r.name ?? r.playerName ?? r.player_name ?? r.player_id ?? r.id ?? `#${i + 1}`;

  // rating can live in many places or be an object
  const rating =
    num(r.rating) ??
    num(r.mmr) ??
    num(r.mmrs) ??
    num(r.rank_score) ??
    num(r?.stats?.rank_score);

  const wins = num(r.wins) ?? num(r.win_count);
  const losses =
    num(r.losses) ??
    num(r.loss_count) ??
    (num(r.battle_count) != null && num(r.win_count) != null
      ? num(r.battle_count) - num(r.win_count)
      : undefined);

  const level = num(r.level) ?? num(r.max_level) ?? num(r.season_max_level);
  const updated = r.update_time ?? r.updated_at ?? r.last_updated;

  return {
    key: r.id ?? r.player_id ?? i,
    rank: r.rank ?? (r.position ?? i + 1),
    name: text(name) || `#${i + 1}`,
    rating: rating ?? '-',
    wins: wins ?? '-',
    losses: losses ?? (wins != null ? '-' : '-'),
    level: level ?? '-',
    updated: text(updated) || '',
  };
}

export async function getServerSideProps({ query }) {
  const season = query.season || 'current';
  const device = query.device || 'pc';
  const page   = query.page   || '1';
  const limit  = query.limit  || '50';

  try {
    const data = await getPlayerLeaderboard({ season, device, page, limit });
    const rowsRaw = data?.rows || data?.players || data?.data || data || [];
    const rows = Array.isArray(rowsRaw) ? rowsRaw.map(flattenRow) : [];
    return { props: { rows, season, device, page: Number(page), limit: Number(limit) } };
  } catch (e) {
    return { props: { rows: [], season, device, page: Number(page), limit: Number(limit), error: String(e) } };
  }
}

export default function Page({ rows, season, device, error }) {
  if (error) return <pre style={{ padding: 16 }}>{error}</pre>;

  return (
    <div style={{ padding: 16 }}>
      <h1>Leaderboards</h1>
      <p>Season: <b>{season}</b> · Platform: <b>{device}</b></p>

      {(!rows || rows.length === 0) ? (
        <p>No leaderboard data.</p>
      ) : (
        <table border="1" cellPadding="6" cellSpacing="0" style={{ width: '100%', maxWidth: 900 }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Rating</th>
              <th>Wins</th>
              <th>Losses</th>
              <th>Level</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.key}>
                <td>{r.rank}</td>
                <td>{r.name}</td>
                <td>{r.rating}</td>
                <td>{r.wins}</td>
                <td>{r.losses}</td>
                <td>{r.level}</td>
                <td>{r.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
EOF

npm run dev
ls -la pages/leaderboards
ls -la pages/patch-notes
# delete the duplicates, keep ONLY the .jsx versions we just wrote
rm -f pages/leaderboards/index.js pages/leaderboards.js
rm -f pages/patch-notes/index.js pages/patch-notes.js
# clear the build cache and restart dev
rm -rf .next
npm run dev
ls -R pages | sed -n '1,200p'
nano pages/leaderboards/index.jsx
rm -rf .next
npm run dev
ls
cd pages/
lss
ls
nano patch-notes/index.jsx
npm run dev
ls
cd ..
ls
nano lib/api.js
npm run dev
nano lib/api.js
npm run dev
head -n 40 data/patch_notes/patch_notes.json
ls
cd marvel-rivals/
ls
npm run dev
ls
cd frontend/
npm run dev
cd marvel-rivals/
ls
cd api/
ls
nano .env
cd ...
cd ..
nano .env
cd api/
ls
cd ..
ls
nano lib/api.js
cd api
ls
cd ..
cd frontend/
ls
nano lib/api.js
nano .env
cd ..
nano .env
ls
cd frontend/
ls
nano pages/patch-notes/index.jsx
nano lib/api.js
nano pages/patch-notes/index.jsx
npm dev run
npm run dev
nano .env
cd ..
nano .env
npm run dev
ls
cd frontend/
npm run dev
nano .env
ls
cd ..
nano .env
nano pages/patch-notes/index.jsx
ls
cd frontend/
nano pages/patch-notes/index.jsx
cd ..
ls
cd api
ls
cd ..
ls
cd frontend/
ls
nano lib/api.js
npm run dev
ls
nano .env
npm run dev
cd ..
ls
nano api/lib/api.js
cd frontend/
ls
nano lib/api.js
npm run dev
nano lib/api.js
npm run dev
nano lib/api.js
npm run dev
nano lib/api.js
npm run dev
nano lib/api.js
npm run dev
nano lib/api.js
npm run dev
nano lib/api.js
npm run dev
nano lib/api.js
npm run dev
nano .env
nano lib/api.js
cd pages/
ls
cd leaderboards/
ls/
nano index.jsx 
cd ..
ls
cd ..
ls
npm run dev
nano pages/leaderboards/index.jsx 
npm run dev
nano pages/leaderboards/index.jsx 
ls
nano lib/api.js
nano pages/leaderboards/index.jsx 
npm run dev
cd marvel-rivals/
ls
cd frontend/
ls
cd lib
ls
cd ..
nano jsconfig.json
npm run dev
nano pages/leaderboards/index.jsx 
cd ..
ls
cd ..
ls
cd marvel_rivals_stats/scripts/
ls
nano upload_leaderboards_and_hero_stats.py 
python3 upload_leaderboards_and_hero_stats.py 
nano upload_leaderboards_and_hero_stats.py 
python3 upload_leaderboards_and_hero_stats.py 
nano upload_leaderboards_and_hero_stats.py 
python3 upload_leaderboards_and_hero_stats.py 
nano upload_leaderboards_and_hero_stats.py 
python3 upload_leaderboards_and_hero_stats.py 
cd ..
git branch
git add --all
git commit -m "Force update to main branch with latest changes"
git push origin main --force
git . add
git add .
ls
git push origin main --force
git push marvel-rivals
git push
ls
cd marvel-rivals/
ld
ls
cd api
ls
cd node_modules/
ls
cd ..
ls
cd frontend/
ls
nano lib/api.js
ls
cd pages/
ls
nano index.js 
cd leaderboards/
ls
nano index.jsx 
cd ..
npm run dev
sls
ls
nano lib/api.js
npm run dev
nano lib/api.js
npm run dev
ls
nano lib/api.json
nano lib/api.js
ls
cd pages/
ls
nano index.js 
cd ..
nano lib/api.js
