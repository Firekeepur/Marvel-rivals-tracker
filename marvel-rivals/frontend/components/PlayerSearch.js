import { useRouter } from "next/router";
import { useState } from "react";

export default function PlayerSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/player?name=${encodeURIComponent(q.trim())}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow"
    >
      <label className="block text-sm text-zinc-300 mb-2">
        Search for a player
      </label>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Enter player name or ID"
          className="flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
        <button
          type="submit"
          className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
        >
          Search
        </button>
      </div>
    </form>
  );
}
