export const API_BASE = '/api'; // proxied by Next.js rewrites

async function http(path, init) {
  const r = await fetch(path, init);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  const type = r.headers.get('content-type') || '';
  return type.includes('application/json') ? r.json() : r.text();
}

export async function getOptions() {
  const [seasons, platforms] = await Promise.all([
    http(`${API_BASE}/options/seasons`),
    http(`${API_BASE}/options/platforms`)
  ]);
  return { seasons: seasons.seasons || [], platforms: platforms.platforms || [] };
}

export async function getPlayerLeaderboard({ season, device, page, limit } = {}) {
  const u = new URL(`${API_BASE}/players/leaderboard`, location.origin);
  if (season) u.searchParams.set('season', season);
  if (device) u.searchParams.set('device', device);
  if (page)   u.searchParams.set('page', page);
  if (limit)  u.searchParams.set('limit', limit);
  return http(u.toString());
}

export async function getHeroStats(id, { season, device } = {}) {
  const u = new URL(`${API_BASE}/heroes/${id}/stats`, location.origin);
  if (season) u.searchParams.set('season', season);
  if (device) u.searchParams.set('device', device);
  return http(u.toString());
}

export async function findPlayer(idOrName, params = {}) {
  const u = new URL(`${API_BASE}/players/${encodeURIComponent(idOrName)}`, location.origin);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return http(u.toString());
}

export async function listAssets(prefix, { token, max = 50, expires = 900 } = {}) {
  const u = new URL(`${API_BASE}/assets/list`, location.origin);
  if (prefix) u.searchParams.set('prefix', prefix);
  if (token)  u.searchParams.set('token', token);
  u.searchParams.set('max', String(max));
  u.searchParams.set('expires', String(expires));
  return http(u.toString());
}

// Predictions — now relative too
export async function getPredictionsForPlayer(playerId, { season, device } = {}) {
  const u = new URL(`${API_BASE}/analytics/predict`, location.origin);
  u.searchParams.set('player', playerId);
  if (season) u.searchParams.set('season', season);
  if (device) u.searchParams.set('device', device);
  return http(u.toString());
}
