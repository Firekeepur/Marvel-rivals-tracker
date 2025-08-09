import { useEffect, useMemo, useState } from 'react';
import SeasonPlatformPicker from '../components/SeasonPlatformPicker';
import LeaderboardTable from '../components/LeaderboardTable';
import HeroStatsPanel from '../components/HeroStatsPanel';
import PredictionsPanel from '../components/PredictionsPanel';
import { API_BASE, getOptions, getPlayerLeaderboard, getHeroStats, findPlayer, getPredictionsForPlayer } from '../lib/api';

export default function Home() {
  const [opts, setOpts] = useState({ seasons: ['current'], platforms: ['pc', 'ps', 'xbox'] });
  const [pick, setPick] = useState({ season: 'current', device: 'pc' });

  const [lb, setLb] = useState(null);
  const [heroId, setHeroId] = useState('');
  const [heroStats, setHeroStats] = useState(null);

  const [playerQuery, setPlayerQuery] = useState('');
  const [player, setPlayer] = useState(null);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    getOptions().then(setOpts).catch(() => {});
  }, []);

  useEffect(() => {
    setLb(null);
    getPlayerLeaderboard({ season: pick.season, device: pick.device })
      .then(setLb)
      .catch((e) => setLb({ error: e.message }));
  }, [pick.season, pick.device]);

  useEffect(() => {
    if (!heroId) { setHeroStats(null); return; }
    setHeroStats(null);
    getHeroStats(heroId, { season: pick.season, device: pick.device })
      .then(setHeroStats)
      .catch((e) => setHeroStats({ error: e.message }));
  }, [heroId, pick.season, pick.device]);

  async function searchPlayer() {
    setPlayer(null);
    setPrediction(null);
    try {
      const p = await findPlayer(playerQuery, { season: pick.season });
      setPlayer(p);
      const pred = await getPredictionsForPlayer(p?.id || playerQuery);
      setPrediction(pred);
    } catch (e) {
      setPlayer({ error: e.message });
    }
  }

  return (
    <div className="container">
      <header className="header">
        <div><b>Marvel Rivals — Stats</b></div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>API: {API_BASE}</div>
      </header>

      <div className="card" style={{ marginBottom: 16 }}>
        <SeasonPlatformPicker
          seasons={[ 'current', ...opts.seasons.filter(s => s !== 'current') ]}
          platforms={opts.platforms}
          value={pick}
          onChange={setPick}
        />
      </div>

      <div className="grid">
        <div className="card">
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700 }}>Player Leaderboard</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Season: {pick.season} • {pick.device}</div>
          </div>
          {lb?.error ? <div style={{ color: 'crimson' }}>{lb.error}</div> : <LeaderboardTable data={lb} />}
        </div>

        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Hero Stats</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input className="input" placeholder="Hero ID (e.g., 1011)" value={heroId} onChange={(e) => setHeroId(e.target.value)} />
            <button className="button" disabled={!heroId} onClick={() => setHeroId(heroId)}>Load</button>
          </div>
          <HeroStatsPanel stats={heroStats} heroId={heroId} season={pick.season} device={pick.device} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Player Search</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input className="input" placeholder="Player ID or username" value={playerQuery} onChange={(e) => setPlayerQuery(e.target.value)} />
          <button className="button" onClick={searchPlayer} disabled={!playerQuery}>Search</button>
        </div>
        {player && (
          <div style={{ marginTop: 12 }}>
            <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{JSON.stringify(player, null, 2)}</pre>
          </div>
        )}
        <PredictionsPanel prediction={prediction} />
      </div>
    </div>
  );
}
