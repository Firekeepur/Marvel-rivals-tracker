export default function HeroCard({ hero }) {
  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:10, background:'white' }}>
      <div style={{ fontWeight:700 }}>{hero?.name || hero?.heroName || 'Hero'}</div>
      <div style={{ fontSize:12, color:'#6b7280' }}>{hero?.role || hero?.class || ''}</div>
    </div>
  );
}
