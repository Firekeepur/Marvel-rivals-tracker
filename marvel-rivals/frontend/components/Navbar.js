import Link from 'next/link';

export default function Navbar() {
  return (
    <nav style={{ borderBottom: '1px solid #e5e7eb', background: 'white' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 16px', display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 800 }}>Marvel Rivals — Stats</div>
        <div style={{ display: 'flex', gap: 14 }}>
          <Link href="/">Home</Link>
          <Link href="/heroes">Heroes</Link>
          <Link href="/maps">Maps</Link>
          <Link href="/patch-notes">Patch Notes</Link>
          <Link href="/leaderboards">Leaderboards</Link>
          <Link href="/player">Player Search</Link>
        </div>
      </div>
    </nav>
  );
}
