// ---------- Environment helpers ----------
const S3_BASE =
  (process.env.NEXT_PUBLIC_S3_BASE_URL || "").replace(/\/+$/, ""); // trim trailing slash
const S3_LB_BASE    = process.env.S3_LB_BASE || "data/leaderboards";
const S3_LB_SEASON  = process.env.S3_LB_SEASON || "current/season_3";
const PATHS = {
  heroes: process.env.S3_META_HEROES,    // e.g. "data/heroes/heroes.json"
  maps: process.env.S3_META_MAPS,        // e.g. "data/maps/maps.json"
  patchNotes: process.env.S3_META_PATCH, // e.g. "data/patch_notes/patch_notes.json"
};

// Internal API (your Node/Express or Docker service that serves leaderboards)
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000")
  .replace(/\/+$/, "");

// ---------- Utilities ----------
const s3Url = (path) => {
  if (!S3_BASE) throw new Error("NEXT_PUBLIC_S3_BASE_URL (or _URI) is not set");
  if (!path) throw new Error("S3 path is missing");
  return `${S3_BASE}/${String(path).replace(/^\/+/, "")}`;
};

async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}
// ---------- S3 metadata ----------
export async function getHeroesMeta() {
  return fetchJSON(s3Url(PATHS.heroes));
}

export async function getMapsMeta() {
  return fetchJSON(s3Url(PATHS.maps));
}

export async function getPatchNotes() {
  // We now know the shape is:
  // { total_patches: number, formatted_patches: Array<Note> }
  const json = await fetchJSON(s3Url(PATHS.patchNotes), { cache: "no-store" });
  return Array.isArray(json?.formatted_patches) ? json.formatted_patches : [];
}

// Helpful for images in S3 (icons, costumes, etc.)
export function getS3ImageUrl(relativePath) {
  return s3Url(relativePath);
}

// ---------- Leaderboards (internal API) ----------

export async function fetchLeaderboards({
  type = "player",
  device = "pc",
  season = "current",
  version = "season_3.5",
} = {}) {
  // NOTE: the file extension must be .json (NOT .jso)
  const path = `data/leaderboards/${type}/${season}/${version}/${device}.json`;
  const url = `${S3_BASE}/${path}`;
  return fetchJSON(url);
}

// Optional: hero stats (if referenced by your pages)
export async function getHeroStats({
  season,
  device,
  page = 1,
  limit = 50,
} = {}) {
  const params = new URLSearchParams();
  if (season != null && season !== "") params.set("season", String(season));
  if (device) params.set("device", device);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const url = `${API_BASE}/leaderboards/heroes/stats?${params.toString()}`;
  return fetchJSON(url, { cache: "no-store" });
}

// Alias: some pages import `getLeaderboards` (plural)
export async function getLeaderboards(opts) {
  return getPlayerLeaderboard(opts);
}

// ---------- External Marvel API passthrough (keep if used) ----------
export const MARVEL_API_V1 = process.env.MARVEL_API_BASE_V1;
export const MARVEL_API_V2 = process.env.MARVEL_API_BASE_V2;

export async function fetchFromMarvelApi(path, opts = {}) {
  if (!MARVEL_API_V2) throw new Error("MARVEL_API_BASE_V2 is not set");
  return fetchJSON(`${MARVEL_API_V2}/${String(path).replace(/^\/+/, "")}`, opts);
}
