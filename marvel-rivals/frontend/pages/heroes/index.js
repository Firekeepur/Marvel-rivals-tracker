import Link from 'next/link';
import { getHeroesMeta } from '../../lib/api';

export async function getServerSideProps() {
  try {
    const data = await getHeroesMeta();
    const heroes = Array.isArray(data) ? data : (data?.heroes || []);
    return { props: { heroes } };
  } catch (e) {
    return { props: { heroes: [], error: String(e) } };
  }
}

export default function HeroesPage({ heroes, error }) {
  if (error) return <pre style={{ padding: 16 }}>{error}</pre>;
  return (
    <div style={{ padding: 16 }}>
      <h1>Heroes</h1>
      {heroes.length === 0 ? (
        <p>No heroes found.</p>
      ) : (
        <ul>
          {heroes.map(h => (
            <li key={h.id || h.heroId || h.name}>
              <Link href={`/heroes/${h.id || h.heroId}`}>{h.name || h.id || h.heroId}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
