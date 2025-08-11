// pages/index.js
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import AllHeroStatsGrid from "@/components/AllHeroStatsGrid";

function QuickCard({ href, title, desc }) {
  return (
    <Link href={href} className="block">
      <div className="rounded-lg bg-gray-900 hover:bg-gray-800 transition p-4 shadow border border-gray-800">
        <div className="text-base font-semibold text-white">{title}</div>
        <div className="text-sm text-gray-400 mt-1">{desc}</div>
      </div>
    </Link>
  );
}

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const onSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/player?name=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 text-white">
      {/* Top quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickCard href="/heroes"       title="Heroes"       desc="Browse all heroes & abilities" />
        <QuickCard href="/skins"        title="Skins"        desc="Cosmetics and variants" />
        <QuickCard href="/maps"         title="Maps"         desc="Pool, lanes & rotations" />
        <QuickCard href="/leaderboards" title="Leaderboards" desc="Top players by platform" />
      </div>

      {/* Player search */}
      <div className="mt-6">
        <form onSubmit={onSearch} className="flex gap-2">
          <input
            className="flex-1 rounded bg-gray-900 border border-gray-800 px-3 py-2 outline-none focus:border-gray-600"
            placeholder="Search player (PC/PSN/XBOX username)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 font-semibold"
          >
            Search
          </button>
        </form>
      </div>

      {/* All heroes stats grid */}
      <div className="mt-6">
        <AllHeroStatsGrid />
      </div>
    </div>
  );
}
