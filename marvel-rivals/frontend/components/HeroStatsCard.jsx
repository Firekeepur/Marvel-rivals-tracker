import { useState, useEffect } from "react";
import { fetchHeroStats, heroStatsAvailable, DEVICES, ALL_SEASONS, CURRENT_SEASON } from "@/lib/api";

export default function HeroStatsCard({ heroId }) {
  const [season, setSeason] = useState(CURRENT_SEASON);
  const [device, setDevice] = useState("pc");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      const data = await fetchHeroStats({ heroId, device, season, current: season === CURRENT_SEASON });
      setStats(data);
      setLoading(false);
    }
    loadStats();
  }, [heroId, device, season]);

  return (
    <div className="p-4 bg-gray-900 rounded-lg shadow-md text-white">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">Hero Stats</h2>
        <div className="flex gap-2">
          <select value={season} onChange={(e) => setSeason(e.target.value)} className="bg-gray-800 px-2 py-1 rounded">
            {ALL_SEASONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={device} onChange={(e) => setDevice(e.target.value)} className="bg-gray-800 px-2 py-1 rounded">
            {DEVICES.map((d) => (
              <option key={d} value={d}>{d.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-sm opacity-70">Loading...</div>
      ) : !heroStatsAvailable(stats) ? (
        <div className="text-sm opacity-70">Not available</div>
      ) : (
        <div className="text-sm">
          {/* Replace this with proper stat rendering */}
          <pre className="overflow-auto">{JSON.stringify(stats, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
