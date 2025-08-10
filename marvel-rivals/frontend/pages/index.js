import Link from 'next/link';
import { getOptions, getHeroesMeta, getMapsMeta, getPatchNotes } from '../lib/api';

export default function Home({ peek }) {
  return (
    <div className="grid" style={{ gridTemplateColumns:'1fr', gap:16 }}>
      <div className="section">
        <div style={{ fontWeight:800, marginBottom:8 }}>Welcome</div>
        <div>Browse heroes, maps, patch notes, leaderboards, and search players.</div>
      </div>

      <div className="section">
        <div style={{ fontWeight:700, marginBottom:8 }}>Quick Links</div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <Link className="button" href="/heroes">Heroes</Link>
          <Link className="button" href="/maps">Maps</Link>
          <Link className="button" href="/patch-notes">Patch Notes</Link>
          <Link className="button" href="/leaderboards">Leaderboards</Link>
          <Link className="button" href="/player">Player Search</Link>
        </div>
      </div>

      <div className="section">
        <div style={{ fontWeight:700, marginBottom:8 }}>Latest (peek)</div>
        <pre style={{ whiteSpace:'pre-wrap', overflowX:'auto' }}>{JSON.stringify(peek, null, 2)}</pre>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const [opts, heroes, maps, notes] = await Promise.all([
      getOptions(), getHeroesMeta(), getMapsMeta(), getPatchNotes()
    ]);
    return { props: { peek: { seasons: opts.seasons?.slice(0,5), platforms: opts.platforms, heroesCount: (heroes?.length||0), mapsCount: (maps?.length||0), notesCount: (Array.isArray(notes)?notes.length:(notes?.notes||[]).length) } } };
  } catch (e) {
    return { props: { peek: { error: String(e) } } };
  }
}
