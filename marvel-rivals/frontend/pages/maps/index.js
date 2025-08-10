import Link from 'next/link';
import { getMapsMeta } from '../../lib/api';

export async function getServerSideProps() {
  try {
    const data = await getMapsMeta();
    return { props: { maps: data?.maps || [] } };
  } catch (e) {
    return { props: { maps: [], error: String(e) } };
  }
}

export default function MapsPage({ maps, error }) {
  if (error) return <pre style={{padding:16}}>{error}</pre>;
  return (
    <div style={{ padding: 16 }}>
      <h1>Maps</h1>
      {maps.length === 0 ? (
        <p>No maps found.</p>
      ) : (
        <ul>
          {maps.map(m => (
            <li key={m.id}>
              <Link href={`/maps/${m.id}`}>{m.name || m.id}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
