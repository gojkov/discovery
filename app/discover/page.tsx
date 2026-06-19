import { Radar, Sparkles, KeyRound, ArrowRight } from "lucide-react";
import { runDiscovery } from "@/app/actions";
import { Card, Eyebrow } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/lib/db";
import { lastfmConfigured } from "@/lib/integrations/lastfm";
import { spotifyConfigured } from "@/lib/integrations/spotify";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const lastfm = lastfmConfigured();
  const spotify = spotifyConfigured();
  const tenCount = await db.track.count({ where: { rating: 10 } });

  return (
    <div className="space-y-8">
      <div>
        <Eyebrow>Active sourcing</Eyebrow>
        <h1 className="text-4xl font-medium tracking-tight text-fg">
          Discover new candidates
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Seed from your{" "}
          <span className="tabular font-semibold text-fg">{tenCount}</span>{" "}
          proven 10s, pull similar tracks from Last.fm, dedupe against everything
          you already know, score them with your learned model, and drop the best
          straight into the candidate lab.
        </p>
      </div>

      {lastfm ? (
        <Card className="!border-cyan/20 !bg-[linear-gradient(145deg,rgba(92,214,255,0.08),rgba(161,129,255,0.05))]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cyan/15 text-cyan">
                <Radar size={20} />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-fg">
                  Last.fm connected
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {spotify
                    ? "Spotify links will be attached to each find."
                    : "Add Spotify keys to also attach play links (optional)."}
                </p>
              </div>
            </div>
            <form action={runDiscovery}>
              <SubmitButton
                pendingLabel="Scouting…"
                className="rounded-full bg-cyan px-5 py-3 text-sm font-semibold text-ink shadow-glow"
              >
                Run discovery <ArrowRight size={16} />
              </SubmitButton>
            </form>
          </div>
        </Card>
      ) : (
        <Card className="!border-amber/25">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber/15 text-amber">
              <KeyRound size={20} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-fg">
                Add a Last.fm API key to switch this on
              </h2>
              <ol className="mt-3 space-y-2 text-sm text-muted">
                <li>
                  1. Create a free key at{" "}
                  <span className="font-mono text-cyan">
                    last.fm/api/account/create
                  </span>
                  .
                </li>
                <li>
                  2. Add{" "}
                  <span className="font-mono text-fg">LASTFM_API_KEY=…</span> to{" "}
                  <span className="font-mono text-fg">discovery/.env</span>.
                </li>
                <li>3. Restart the dev server and reload this page.</li>
              </ol>
              <p className="mt-3 text-sm text-subtle">
                Optional: add{" "}
                <span className="font-mono">SPOTIFY_CLIENT_ID</span> /{" "}
                <span className="font-mono">SPOTIFY_CLIENT_SECRET</span> for play
                links.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {[
          [Sparkles, "Seeded by your loves", "Only your 10/10 tracks drive the search — taste in, taste out."],
          [Radar, "Deduped & fresh", "Anything already in your library or queue is filtered out automatically."],
          [ArrowRight, "Pre-scored", "Each find arrives ranked and reasoned, ready to sample."]
        ].map(([Icon, title, copy]) => (
          <Card key={String(title)}>
            <Icon className="text-cyan" size={20} />
            <h3 className="mt-5 text-base font-semibold text-fg">
              {String(title)}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">{String(copy)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
