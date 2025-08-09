export default function HeroStatsPanel({ stats, heroId, season, device }) {
  if (!heroId) return null;
  if (!stats) return <div style={{ marginTop: 12 }}>Loading stats for hero {heroId}…</div>;

  const keys = Object.keys(stats).slice(0, 20);
  return (
    <div style={{ marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>
        Hero {heroId} — Season {season} — {device}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
        {keys.map((k) => (
          <div key={k} style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 6, padding: 8 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{k}</div>
            <div style={{ fontWeight: 600 }}>{typeof stats[k] === 'object' ? JSON.stringify(stats[k]) : String(stats[k])}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
