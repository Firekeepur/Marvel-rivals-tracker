export default function LeaderboardTable({ data }) {
  if (!data) return <div>Loading…</div>;
  if (data.error) return <div style={{ color: 'crimson' }}>{String(data.error)}</div>;

  const rows = Array.isArray(data?.data) ? data.data : (data?.result || data?.rows || []);
  if (!rows?.length) return <div>No data.</div>;

  const cols = Object.keys(rows[0]).slice(0, 10);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>{cols.map(c => <th key={c} style={{ textAlign:'left', borderBottom:'1px solid #eee', padding:8 }}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.slice(0,100).map((r,i)=>(
            <tr key={i} style={{ borderBottom:'1px solid #f5f5f5' }}>
              {cols.map(c => <td key={c} style={{ padding:8 }}>{typeof r[c]==='object' ? JSON.stringify(r[c]) : String(r[c])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
