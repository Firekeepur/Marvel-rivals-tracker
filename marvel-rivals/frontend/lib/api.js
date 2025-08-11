// frontend/lib/api.js
// Fetch straight from S3 (no /pages/api routes needed)

const S3_BASE = (process.env.NEXT_PUBLIC_S3_BASE_URL || "").replace(/\/+$/, "");

// --- helpers ---
function seasonSegment(season) {
  return season === "3.5" ? "current" : "past";
}

async function fetchJSON(url, { cache = "no-store" } = {}) {
  try {
    const res = await fetch(url, { cache });
    if (!res.ok) return null; // 404/500 -> treat as missing
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Limit concurrency so we don't spam S3 with 50+ parallel requests.
 */
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return results;
}

// --- core data ---

export async function getHeroes() {
  const url = `${S3_BASE}/data/heroes/heroes.json`;
  return (await fetchJSON(url)) || [];
}

export async function getMaps() {
  const url = `${S3_BASE}/data/maps/maps.json`;
  return (await fetchJSON(url)) || [];
}

export async function getPatchNotes() {
  const url = `${S3_BASE}/data/patch_notes/patch_notes.json`;
  return (await fetchJSON(url)) || [];
}

// --- leaderboards ---

/**
 * Player leaderboard (top players)
 * S3: leaderboards/player/{current|past}/season_{season}/{platform}.json
 */
export async function getPlayerLeaderboard({ season = "3.5", platform = "pc" } = {}) {
  const seg = seasonSegment(season);
  const url = `${S3_BASE}/leaderboards/player/${seg}/season_${season}/${platform}.json`;
  const data = await fetchJSON(url);
  return data || { entries: [], unavailable: !data, message: data ? undefined : "not available" };
}

/**
 * Hero leaderboard (top players for a specific hero)
 * S3: leaderboards/heroes/leaderboard/{current|past}/season_{season}/{platform}/hero_{heroId}.json
 */
export async function getHeroLeaderboard({ heroId, season = "3.5", platform = "pc" }) {
  if (!heroId) throw new Error("heroId is required");
  const seg = seasonSegment(season);
  const url = `${S3_BASE}/leaderboards/heroes/leaderboard/${seg}/season_${season}/${platform}/hero_${heroId}.json`;
  const data = await fetchJSON(url);
  return data || { entries: [], unavailable: !data, message: "not available" };
}

// --- hero stats ---

/**
 * Single hero stats
 * S3: leaderboards/heroes/stats/{current|past}/season_{season}/{platform}/hero_{heroId}.json
 */
export async function getHeroStatsForHero({ heroId, season = "3.5", platform = "pc" }) {
  if (!heroId) throw new Error("heroId is required");
  const seg = seasonSegment(season);
  const url = `${S3_BASE}/leaderboards/heroes/stats/${seg}/season_${season}/${platform}/hero_${heroId}.json`;
  const data = await fetchJSON(url);
  // When 3.5 isn’t available yet, return a shape you can detect
  return data || { unavailable: true, message: "not available", heroId, season, platform };
}

/**
 * All hero stats for a season+platform
 * - Reads heroes list to get IDs
 * - Fetches each hero’s stats file (limited concurrency)
 * - If a file is missing (e.g. season 3.5 right now), returns {unavailable:true} for that hero
 */
export async function getAllHeroStats({ season = "3.5", platform = "pc", concurrency = 8 } = {}) {
  const heroes = await getHeroes();
  const heroIds = heroes.map(h => h.id).filter(Boolean);

  const stats = await mapWithConcurrency(heroIds, concurrency, async (id) => {
    const one = await getHeroStatsForHero({ heroId: id, season, platform });
    // Normalize by attaching hero meta for easy rendering
    const meta = heroes.find(h => h.id === id) || { id };
    return { hero: meta, stats: one };
  });

  return {
    season,
    platform,
    items: stats,
  };
}

// --- convenience for navbar cards ---

export async function getHomeTopData({ season = "3.5", platform = "pc" } = {}) {
  const [heroes, maps, patchNotes, playerLb] = await Promise.all([
    getHeroes(),
    getMaps(),
    getPatchNotes(),
    getPlayerLeaderboard({ season, platform }),
  ]);
  return { heroes, maps, patchNotes, playerLeaderboard: playerLb };
}
