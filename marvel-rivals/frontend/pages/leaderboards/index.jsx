// pages/leaderboards/index.jsx
import Head from "next/head";
import Link from "next/link";
import { fetchLeaderboards } from "@/lib/api";

/**
 * Normalize query params safely.
 */
function normalizeQuery(query) {
  const type = query?.type === "heroes" ? "heroes" : "player";

  const deviceParam =
    typeof query?.device === "string" ? query.device.toLowerCase() : "";
  const device = ["pc", "ps", "xbox"].includes(deviceParam) ? deviceParam : "pc";

  const season =
    typeof query?.season === "string" && query.season.trim()
      ? query.season
      : "current";

  const version =
    typeof query?.version === "string" && query.version.trim()
      ? query.version
      : "season_3.5";

  return { type, device, season, version };
}

/**
 * Server-side data fetch
 */
export async function getServerSideProps({ query }) {
  const { type, device, season, version } = normalizeQuery(query);
  const data = await fetchLeaderboards({ type, device, season, version });

  return { props: { data: data ?? null, type, device, season, version } };
}

/**
 * Small helpers to pick values safely from potentially different API shapes.
 */
const pick = (obj, keys, fallback = "") =>
  keys.find((k) => obj?.[k] !== undefined) ? obj[keys.find((k) => obj?.[k] !== undefined)] : fallback;

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  // common wrappers like {items:[]}, {results:[]}, {data:[]}
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export default function LeaderboardsPage({ data, type, device, season, version }) {
  const rows = toArray(data);

  return (
    <>
      <Head>
        <title>Leaderboards — Marvel Rivals</title>
        <meta name="robots" content="index,follow" />
      </Head>

      <main style={{ padding: "16px", maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 8 }}>Leaderboards</h1>

        <p style={{ margin: "6px 0 16px" }}>
          Type: <b>{type}</b> · Platform: <b>{device}</b> · Season: <b>{season}</b>{" "}
          · Version: <b>{version}</b>
        </p>

        {/* Simple filters as links */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {["pc", "ps", "xbox"].map((d) => (
            <Link
              key={d}
              href={{ pathname: "/leaderboards", query: { type, device: d, season, version } }}
              legacyBehavior
            >
              <a
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  textDecoration: "none",
                  background: d === device ? "#f2f2f2" : "transparent",
                }}
              >
                {d.toUpperCase()}
              </a>
            </Link>
          ))}
          {["player", "heroes"].map((t) => (
            <Link
              key={t}
              href={{ pathname: "/leaderboards", query: { type: t, device, season, version } }}
              legacyBehavior
            >
              <a
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  textDecoration: "none",
                  background: t === type ? "#f2f2f2" : "transparent",
                }}
              >
                {t}
              </a>
            </Link>
          ))}
        </div>

        {/* Data table */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 720,
            }}
          >
            <thead>
              <tr>
                <th style={th}>#</th>
                <th style={th}>{type === "heroes" ? "Hero" : "Player"}</th>
                <th style={th}>Rank Score</th>
                <th style={th}>Level</th>
                <th style={th}>KDA</th>
                <th style={th}>Wins</th>
                <th style={th}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td style={td} colSpan={7}>
                    No leaderboard data yet.
                  </td>
                </tr>
              )}

              {rows.map((r, i) => {
                const rank = pick(r, ["rank", "placement", "position"], i + 1);
                const name =
                  type === "heroes"
                    ? pick(r, ["hero", "heroName", "name"], "—")
                    : pick(r, ["player", "username", "name", "nickname"], "—");
                const score = pick(r, ["rankScore", "mmr", "score", "rating"], "—");
                const level = pick(r, ["level", "lvl", "accountLevel"], "—");
                const kda = pick(r, ["kda", "KDA", "kd", "kdRatio"], "—");
                const wins = pick(r, ["wins", "win", "totalWins"], "—");
                const updated = pick(r, ["updatedAt", "lastUpdated", "updated"], "—");

                return (
                  <tr key={`${name}-${i}`}>
                    <td style={td}>{rank}</td>
                    <td style={td}>{name}</td>
                    <td style={td}>{score}</td>
                    <td style={td}>{level}</td>
                    <td style={td}>{kda}</td>
                    <td style={td}>{wins}</td>
                    <td style={td}>{String(updated).replace("T", " ").replace("Z", "")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Debug block (toggle by commenting out) */}
        {/* <pre style={{ marginTop: 20, background: "#fafafa", padding: 12, borderRadius: 8 }}>
          {JSON.stringify({ type, device, season, version, sample: rows[0] }, null, 2)}
        </pre> */}
      </main>
    </>
  );
}

const th = {
  textAlign: "left",
  padding: "8px",
  borderBottom: "1px solid #eee",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const td = {
  padding: "8px",
  borderBottom: "1px solid #f3f3f3",
  whiteSpace: "nowrap",
};
