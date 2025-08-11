// frontend/pages/index.js
import { useState } from "react";
import Head from "next/head";
import Link from "next/link";

import Navbar from "../components/Navbar";
import PlayerSearch from "../components/PlayerSearch";
import SeasonPlatformPicker from "../components/SeasonPlatformPicker";
import HeroStatsCard from "../components/HeroStatsCard";

export default function Home() {
  // Defaults per your setup
  const [season, setSeason] = useState("3.5"); // current season
  const [platform, setPlatform] = useState("pc"); // pc | psn | xbox

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>RivalsMeta — Marvel Rivals Tracker</title>
        <meta name="description" content="Marvel Rivals stats, leaderboards, maps, heroes and more." />
      </Head>

      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Quick links row */}
        <section aria-label="Primary sections" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/heroes"
            className="rounded-lg bg-gray-800 hover:bg-gray-700 transition px-4 py-3 text-center font-medium"
          >
            Heroes
          </Link>
          <Link
            href="/skins"
            className="rounded-lg bg-gray-800 hover:bg-gray-700 transition px-4 py-3 text-center font-medium"
          >
            Skins
          </Link>
          <Link
            href="/maps"
            className="rounded-lg bg-gray-800 hover:bg-gray-700 transition px-4 py-3 text-center font-medium"
          >
            Maps
          </Link>
          <Link
            href="/leaderboards"
            className="rounded-lg bg-gray-800 hover:bg-gray-700 transition px-4 py-3 text-center font-medium"
          >
            Leaderboards
          </Link>
        </section>

        {/* Search + season/platform picker */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="w-full sm:max-w-xl">
            <PlayerSearch />
          </div>

          <div className="w-full sm:w-auto">
            <SeasonPlatformPicker
              season={season}
              platform={platform}
              onSeasonChange={setSeason}
              onPlatformChange={setPlatform}
            />
          </div>
        </section>

        {/* Hero stats card (10 per page handled inside the card) */}
        <section>
          <HeroStatsCard season={season} platform={platform} />
        </section>
      </main>
    </div>
  );
}
