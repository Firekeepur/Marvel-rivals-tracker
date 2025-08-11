import Navbar from "../../components/Navbar";

export default function Skins() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="text-xl font-semibold">Skins</h1>
        <p className="mt-2 text-zinc-400 text-sm">
          Coming soon. (We’ll wire this to your S3 costumes listing.)
        </p>
      </main>
    </div>
  );
}
