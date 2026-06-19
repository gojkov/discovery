import { Database, FileUp, LockKeyhole } from "lucide-react";
import { Card, Eyebrow } from "@/components/ui";

export default function SpotifyImportPage() {
  return (
    <div className="space-y-8">
      <div>
        <Eyebrow>Future adapter</Eyebrow>
        <h1 className="text-4xl font-black tracking-[-0.04em]">
          Spotify CSV import
        </h1>
        <p className="mt-3 max-w-2xl text-cream/50">
          This boundary is ready, but deliberately dormant until there is a
          real export to validate against.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {[
          [FileUp, "Bring your export", "No account connection or streaming access required."],
          [Database, "Map metadata", "Track URI, names, genres, danceability, energy, valence, and tempo."],
          [LockKeyhole, "Stay local", "Imported metadata will live in the same local SQLite database."]
        ].map(([Icon, title, copy]) => (
          <Card key={String(title)}>
            <Icon className="text-cyan" />
            <h2 className="mt-6 text-lg font-black">{String(title)}</h2>
            <p className="mt-2 text-sm leading-6 text-cream/45">{String(copy)}</p>
          </Card>
        ))}
      </div>
      <Card className="border-dashed !bg-transparent text-center">
        <span className="inline-flex rounded-full border border-pink/20 bg-pink/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-pink">
          Waiting for Spotify Export
        </span>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-cream/50">
          Use the engine now with manual seeds and candidates. Once the CSV
          arrives, the adapter can enrich song-level evidence without replacing
          your actual listening verdicts.
        </p>
      </Card>
    </div>
  );
}
