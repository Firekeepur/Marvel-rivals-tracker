import { useState, useEffect } from "react";
import { getAllHeroStats } from "../lib/api";

export default function HeroStatsCard({ season = "3.5", platform = "pc" }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    getAllHeroStats({ season, platform }).then(setData);
  }, [season, platform]);

  if (!data) return <div className="text-center py-4">Loading hero stats...</div>;

  if (!data.items || data.items.length === 0) {
    return <div className="text-center py-4">No hero stats available.</div>;
  }

  const startIdx = (page - 1) * perPage;
  const pageItems = data.items.slice(startIdx, startIdx + perPage);

  return (
    <div className="bg-gray-800 text-white rounded-lg p-4 shadow-lg">
      <h2 className="text-xl font-bold mb-4">
        Hero Stats – Season {season} ({platform.toUpperCase()})
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {pageItems.map(({ hero, stats }) => (
          <div
            key={hero.id}
            className="bg-gray-900 p-3 rounded shadow-md flex flex-col items-center"
          >
            <img
              src={hero.image || "/placeholder-hero.png"}
              alt={hero.name || "Unknown Hero"}
              className="w-20 h-20 object-cover rounded mb-2"
            />
            <h3 className="text-lg font-semibold">{hero.name || `Hero ${hero.id}`}</h3>

            {stats.unavailable ? (
              <p className="text-red-400 text-sm mt-2">Not available</p>
            ) : (
              <div className="mt-2 text-sm">
                <p>K/D: {stats.kd ?? "N/A"}</p>
                <p>Win Rate: {stats.winRate ? `${stats.winRate}%` : "N/A"}</p>
                <p>Matches: {stats.matches ?? "N/A"}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-4 mt-4">
        <button
          className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Prev
        </button>
        <span className="px-2 py-1">{page}</span>
        <button
          className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
          disabled={startIdx + perPage >= data.items.length}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
