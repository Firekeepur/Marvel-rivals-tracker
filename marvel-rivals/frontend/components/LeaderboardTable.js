export default function LeaderboardTable({ data }) {
  if (!data) return null;

  const rows = Array.isArray(data?.data) ? data.data : (data?.result || data?.rows || []);
  if (!rows?.length) return <div>No leaderboard data.</div>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            {Object.keys(rows[0]).slice(0, 8).map((k) => (
              <th key={k} style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 50).map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
              {Object.values(r).slice(0, 8).map((v, j) => (
                <td key={j} style={{ padding: '8px' }}>
                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
