import { useEffect, useState } from 'react';
import { findPlayer, getPredictionsForPlayer } from '../lib/api';
import SeasonPlatformPicker from '../components/SeasonPlatformPicker';

export default function Player() {
  const [opts, setOpts] = useState({ seasons:['current'], platforms:['pc','ps','xbox'] });
  const [pick, setPick] = useState({ season:'current', device:'pc' });
  const [query, setQuery] = useState('');
  const [player, setPlayer] = useState(null);
  const [pred, setPred] = useState(null);

  async function doSearch() {
    setPlayer(null); setPred(null);
    try {
      const p = await findPlayer(query, { season: pick.season });
      setPlayer(p);
      try { setPred(await getPredictionsForPlayer(p?.id || query, pick)); } catch(e) { setPred({ available:false, reason:String(e) }); }
    } catch (e) {
      setPlayer({ error: String(e) });
    }
  }

  return (
    <div className="grid" style={{ gridTemplateColumns:'1fr', gap:16 }}>
      <div className="section">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>Player Search</div>
          <SeasonPlatformPicker seasons={opts.seasons} platforms={opts.platforms} value={pick} onChange={setPick} />
        </div>
        <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
          <input className="input" placeholder="Player ID or username" value={query} onChange={e=>setQuery(e.target.value)} />
          <button className="button" disabled={!query} onClick={doSearch}>Search</button>
        </div>
      </div>

      <div className="section">
        <div style={{ fontWeight:700, marginBottom:8 }}>Player</div>
        <pre style={{ whiteSpace:'pre-wrap', overflowX:'auto' }}>{player ? JSON.stringify(player, null, 2) : 'Search to load.'}</pre>
      </div>

      <div className="section">
        <div style={{ fontWeight:700, marginBottom:8 }}>Predictions (on-demand)</div>
        <pre style={{ whiteSpace:'pre-wrap', overflowX:'auto' }}>{pred ? JSON.stringify(pred, null, 2) : 'Will compute when player is searched.'}</pre>
      </div>
    </div>
  );
}
