export default function PatchNotesList({ notes }) {
  if (!notes) return <div>Loading…</div>;
  const rows = Array.isArray(notes) ? notes : (notes?.notes || notes?.data || []);
  if (!rows?.length) return <div>No patch notes found.</div>;
  return (
    <div style={{ display:'grid', gap:12 }}>
      {rows.map((n, i)=>(
        <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:12, background:'white' }}>
          <div style={{ fontWeight:700 }}>{n.title || n.version || n.id || 'Patch'}</div>
          {n.date && <div style={{ fontSize:12, color:'#6b7280' }}>{n.date}</div>}
          {n.description && <div style={{ marginTop:6 }}>{n.description}</div>}
        </div>
      ))}
    </div>
  );
}
