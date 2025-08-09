export default async function ApiTest() {
  const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
  let data = null, err = null;

  try {
    const r = await fetch(`${base}/players/leaderboard?season=3&device=pc&limit=50`, { cache: "no-store" });
    if (!r.ok) throw new Error(await r.text());
    data = await r.json();
  } catch (e) {
    err = e.message;
  }

  return (
    <main style={{ padding: 24, fontFamily: "monospace" }}>
      <h1>API Test</h1>
      {err ? <pre style={{ color: "crimson" }}>{err}</pre> : <pre>{JSON.stringify(data, null, 2)}</pre>}
    </main>
  );
}
