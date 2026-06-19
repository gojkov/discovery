import { Flame, CircleX, Check, X } from "lucide-react";
import { dismissStreamStat, promoteStreamStat } from "@/app/actions";
import { Badge, Card, Eyebrow } from "@/components/ui";
import { CoverArt } from "@/components/cover-art";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/lib/db";
import { fetchTrackImages } from "@/lib/integrations/spotify";
import { behaviorEvidence } from "@/lib/scoring/behavior";
import { normalize } from "@/lib/scoring/text";

export const dynamic = "force-dynamic";

type Row = {
  spotifyUri: string;
  title: string;
  artist: string;
  plays: number;
  completions: number;
  skips: number;
  backbtns: number;
  distinctDays: number;
  saved: boolean;
  banned: boolean;
};

function evidenceFor(row: Row) {
  return behaviorEvidence({
    plays: row.plays,
    completions: row.completions,
    skips: row.skips,
    backbtns: row.backbtns,
    distinctDays: row.distinctDays,
    saved: row.saved,
    banned: row.banned
  });
}

export default async function ReviewPage() {
  const [loves, rejects, tracks] = await Promise.all([
    db.streamStat.findMany({
      where: { reviewed: false, derivedRating: 10 },
      orderBy: { craving: "desc" },
      take: 30
    }),
    db.streamStat.findMany({
      where: { reviewed: false, derivedRating: 1 },
      orderBy: { craving: "asc" },
      take: 15
    }),
    db.track.findMany({ select: { title: true, artist: true } })
  ]);

  // Hide anything already in the curated library.
  const manual = new Set(tracks.map((t) => `${normalize(t.title)}|${normalize(t.artist)}`));
  const fresh = (rows: Row[]) =>
    rows.filter((r) => !manual.has(`${normalize(r.title)}|${normalize(r.artist)}`));
  const loveRows = fresh(loves);
  const rejectRows = fresh(rejects);

  // One batched Spotify call for the cover art of everything on screen.
  const images = await fetchTrackImages(
    [...loveRows, ...rejectRows].map((r) => r.spotifyUri)
  );

  return (
    <div className="space-y-8">
      <div>
        <Eyebrow>From your listening history</Eyebrow>
        <h1 className="text-4xl font-medium tracking-tight text-fg">
          Review what your behavior suggests
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Inferred from plays, skips, and replays. Confirm to add
          to your authoritative library — or dismiss. Either way it leaves the
          queue.
        </p>
      </div>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-lime/15 text-lime">
            <Flame size={16} />
          </span>
          <h2 className="text-lg font-semibold text-fg">
            Likely 10s{" "}
            <span className="tabular text-subtle">({loveRows.length})</span>
          </h2>
        </div>
        {loveRows.length === 0 ? (
          <Card className="text-sm text-muted">
            No pending loves — all caught up.
          </Card>
        ) : (
          <div className="space-y-3">
            {loveRows.map((row) => (
              <Card key={row.spotifyUri} className="!p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <CoverArt
                      src={images.get(row.spotifyUri)}
                      alt={`${row.title} cover`}
                      size={48}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold text-fg">
                          {row.title}
                        </h3>
                        {row.saved && <Badge tone="good">saved</Badge>}
                      </div>
                      <p className="text-sm text-muted">{row.artist}</p>
                      <p className="tabular mt-1 font-mono text-xs text-subtle">
                        {evidenceFor(row)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={promoteStreamStat}>
                      <input type="hidden" name="spotifyUri" value={row.spotifyUri} />
                      <input type="hidden" name="rating" value="10" />
                      <SubmitButton
                        pendingLabel="Adding…"
                        className="rounded-full bg-lime px-4 py-2 text-sm font-semibold text-ink"
                      >
                        <Check size={15} /> Confirm 10
                      </SubmitButton>
                    </form>
                    <form action={dismissStreamStat}>
                      <input type="hidden" name="spotifyUri" value={row.spotifyUri} />
                      <SubmitButton
                        pendingLabel="…"
                        className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-muted hover:text-fg"
                      >
                        <X size={15} /> Dismiss
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-coral/15 text-coral">
            <CircleX size={16} />
          </span>
          <h2 className="text-lg font-semibold text-fg">
            Likely false positives{" "}
            <span className="tabular text-subtle">({rejectRows.length})</span>
          </h2>
        </div>
        {rejectRows.length === 0 ? (
          <Card className="text-sm text-muted">No pending rejects.</Card>
        ) : (
          <div className="space-y-3">
            {rejectRows.map((row) => (
              <Card key={row.spotifyUri} className="!p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <CoverArt
                      src={images.get(row.spotifyUri)}
                      alt={`${row.title} cover`}
                      size={48}
                    />
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-fg">
                        {row.title}
                      </h3>
                      <p className="text-sm text-muted">{row.artist}</p>
                      <p className="tabular mt-1 font-mono text-xs text-subtle">
                        {evidenceFor(row)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={promoteStreamStat}>
                      <input type="hidden" name="spotifyUri" value={row.spotifyUri} />
                      <input type="hidden" name="rating" value="1" />
                      <SubmitButton
                        pendingLabel="Adding…"
                        className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-ink"
                      >
                        <Check size={15} /> Confirm 1
                      </SubmitButton>
                    </form>
                    <form action={dismissStreamStat}>
                      <input type="hidden" name="spotifyUri" value={row.spotifyUri} />
                      <SubmitButton
                        pendingLabel="…"
                        className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-muted hover:text-fg"
                      >
                        <X size={15} /> Dismiss
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
