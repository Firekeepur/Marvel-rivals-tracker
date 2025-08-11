export default function LeaderboardTable({ rows = [], compact }) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800">
      <table className="table-base">
        <thead className="bg-neutral-900/60">
          <tr>
            <th className="th-base">#</th>
            <th className="th-base">Player</th>
            <th className="th-base">MMR</th>
            <th className="th-base">Wins</th>
            <th className="th-base">Win%</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {rows.map((r, i) => (
            <tr key={r.id || i} className="hover:bg-neutral-900/40">
              <td className="td-base">{i + 1}</td>
              <td className="td-base">{r.name || r.player || "—"}</td>
              <td className="td-base">{r.mmr ?? "—"}</td>
              <td className="td-base">{r.wins ?? "—"}</td>
              <td className="td-base">{r.winRate ? `${r.winRate}%` : "—"}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr><td className="td-base text-neutral-400" colSpan={5}>No data.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
