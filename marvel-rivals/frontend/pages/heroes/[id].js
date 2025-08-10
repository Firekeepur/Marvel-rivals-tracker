import { useEffect, useState } from 'react';
import { getOptions, getPlayerLeaderboard } from '../lib/api';
import SeasonPlatformPicker from '../components/SeasonPlatformPicker';
import LeaderboardTable from '../components/LeaderboardTable';

export default function Leaderboards() {
  const [opts, setOpts] = useState({ seasons:['current'], platforms:['pc','ps','xbox'] });
  const [pick, setPick] = useState({ season:'current', device:'pc' });
  const [lb, setLb] = useState(null);

  useEffect(()=>{ getOptions().then(setOpts).catch(()=>{}); }, []);
  useEffect(()=>{
    setLb(null);
    getPlayerLeaderboard(pick).then(setLb).catch(e=>setLb({ error:String(e) }));
  }, [pick.season, pick.device]);

  return (
    <div className="grid" style={{ gridTemplateColumns:'1fr', gap:16 }}>
      <div className="section">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:800 }}>Player Leaderboard</div>
          <SeasonPlatformPicker seasons={opts.seasons} platforms={opts.platforms} value={pick} onChange={setPick} />
        </div>
      </div>
      <div className="section">
        <LeaderboardTable data={lb} />
      </div>
    </div>
  );
}
