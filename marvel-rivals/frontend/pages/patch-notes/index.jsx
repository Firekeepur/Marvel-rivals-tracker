// pages/patch-notes/index.jsx
import React from "react";
import Head from "next/head";
import { getPatchNotes } from "../../lib/api";

// A tiny helper to render whatever shape your S3 notes have, safely.
function NoteCard({ note, idx }) {
  const title =
    note?.title ||
    note?.name ||
    note?.version ||
    note?.id ||
    `Patch ${idx + 1}`;

  // Try a few common date fields
  const date =
    note?.date || note?.released_at || note?.releaseDate || note?.updated_at;

  // Accept a few common content fields
  const summary =
    note?.summary || note?.description || note?.notes || note?.content;

  // Optional lists people often include in patch notes
  const features = note?.features || note?.changes || note?.highlights;
  const bugfixes = note?.bugfixes || note?.fixes;

  return (
    <article className="max-w-3xl w-full mx-auto mb-6 rounded-2xl shadow p-5 border">
      <header className="mb-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        {date ? (
          <p className="text-sm opacity-70">{new Date(date).toLocaleString()}</p>
        ) : null}
      </header>

      {summary ? (
        typeof summary === "string" ? (
          // If your S3 file contains HTML in `content`, this will render it.
          // If it’s plain text/markdown, it’ll just show as text.
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: summary }}
          />
        ) : (
          <pre className="overflow-auto text-sm bg-gray-50 p-3 rounded">
            {JSON.stringify(summary, null, 2)}
          </pre>
        )
      ) : null}

      {Array.isArray(features) && features.length > 0 && (
        <section className="mt-4">
          <h3 className="font-medium mb-1">Highlights</h3>
          <ul className="list-disc pl-5 space-y-1">
            {features.map((item, i) => (
              <li key={i}>{typeof item === "string" ? item : JSON.stringify(item)}</li>
            ))}
          </ul>
        </section>
      )}

      {Array.isArray(bugfixes) && bugfixes.length > 0 && (
        <section className="mt-4">
          <h3 className="font-medium mb-1">Bug Fixes</h3>
          <ul className="list-disc pl-5 space-y-1">
            {bugfixes.map((item, i) => (
              <li key={i}>{typeof item === "string" ? item : JSON.stringify(item)}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Fallback: show the raw object so we can quickly adjust if the shape is different */}
      {!summary && !features && !bugfixes && (
        <pre className="mt-3 overflow-auto text-sm bg-gray-50 p-3 rounded">
          {JSON.stringify(note, null, 2)}
        </pre>
      )}
    </article>
  );
}

export default function PatchNotesPage({ notes }) {
  const hasNotes = Array.isArray(notes) && notes.length > 0;

  return (
    <>
      <Head>
        <title>Patch Notes</title>
        <meta name="description" content="Latest Marvel Rivals patch notes" />
      </Head>

      <main className="px-4 py-8">
        <div className="max-w-3xl mx-auto mb-6">
          <h1 className="text-2xl font-bold">Patch Notes</h1>
          {!hasNotes && (
            <p className="mt-2 text-sm opacity-70">
              No notes found. If this persists, check your S3 path and CORS.
            </p>
          )}
        </div>

        {hasNotes &&
          notes.map((n, i) => <NoteCard key={n?.id ?? i} note={n} idx={i} />)}
      </main>
    </>
  );
}

export async function getServerSideProps() {
  try {
    const data = await getPatchNotes();

    // Support either { notes: [...] } or raw array in S3 JSON
    const notes = Array.isArray(data) ? data : data?.notes ?? [];

    return {
      props: {
        notes,
      },
    };
  } catch (err) {
    console.error("Patch notes fetch failed:", err);
    return {
      props: {
        notes: [],
      },
    };
  }
}
