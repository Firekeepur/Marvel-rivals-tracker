export default function MapCard({ map }) {
  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:10, background:'white' }}>
      <div style={{ fontWeight:700 }}>{map?.name || 'Map'}</div>
      <div style={{ fontSize:12, color:'#6b7280' }}>{map?.mode || ''}</div>
    </div>
  );
}
