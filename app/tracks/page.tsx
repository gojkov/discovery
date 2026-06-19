import { addTrack, rateTrack, updateTrack } from "@/app/actions";
import { Card, Eyebrow, Badge, buttonClass, inputClass } from "@/components/ui";
import { CoverArt } from "@/components/cover-art";
import { SubmitButton } from "@/components/submit-button";
import { ReasonChips } from "@/components/reason-chips";
import { db } from "@/lib/db";
import { fetchTrackImages } from "@/lib/integrations/spotify";

export const dynamic = "force-dynamic";

export default async function TracksPage() {
  const [tracks, reasons] = await Promise.all([
    db.track.findMany({
      include: { reasons: { include: { reason: true } } },
      orderBy: [{ rating: "desc" }, { artist: "asc" }, { title: "asc" }]
    }),
    db.tasteReason.findMany({
      where: { active: true, mergedIntoId: null },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }]
    })
  ]);
  // Cover art for tracks linked to a Spotify URI (promoted from history).
  const images = await fetchTrackImages(
    tracks.map((t) => t.spotifyUri).filter((u): u is string => Boolean(u))
  );

  return (
    <div className="space-y-8">
      <div>
        <Eyebrow>Known taste</Eyebrow>
        <h1 className="text-4xl font-medium tracking-tight text-fg">
          Track library
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Every decisive love and rejection makes future rankings less naive.
        </p>
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-fg">Add or update a track</h2>
        <form action={addTrack} className="mt-5 grid gap-4 md:grid-cols-2">
          <input className={inputClass} name="title" placeholder="Track title" required />
          <input className={inputClass} name="artist" placeholder="Artist" required />
          <input className={inputClass} name="album" placeholder="Album (optional)" />
          <input className={inputClass} name="year" type="number" placeholder="Release year" />
          <select className={inputClass} name="source" defaultValue="manual">
            <option value="manual">Manual</option>
            <option value="Spotify">Spotify</option>
            <option value="Apple">Apple</option>
            <option value="YouTube">YouTube</option>
          </select>
          <select className={inputClass} name="rating" defaultValue="10">
            <option value="10">10 — obsession / replay monster</option>
            <option value="8">8 — good, rarely seek it</option>
            <option value="5">5 — neutral / forgettable</option>
            <option value="1">1 — skip / false positive</option>
          </select>
          <ReasonChips reasons={reasons} />
          <textarea
            className={`${inputClass} min-h-28 md:col-span-2`}
            name="notes"
            placeholder="What landed or failed?"
          />
          <div className="md:col-span-2">
            <SubmitButton className={buttonClass} pendingLabel="Saving…">
              Save track
            </SubmitButton>
          </div>
        </form>
      </Card>

      <div className="overflow-hidden rounded-4xl border border-white/[0.08] bg-panel/80 shadow-card backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-5 sm:px-7">
          <h2 className="font-semibold text-fg">
            <span className="tabular">{tracks.length}</span> known tracks
          </h2>
          <span className="text-xs text-subtle">Tap any grade to re-rate</span>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {tracks.map((track) => {
            const tone =
              track.rating === 10
                ? "good"
                : track.rating === 1
                  ? "bad"
                  : track.rating === 8
                    ? "violet"
                    : "neutral";
            return (
              <article key={track.id} className="px-5 py-5 sm:px-7">
                <div className="grid gap-5 lg:grid-cols-[minmax(13rem,0.8fr)_minmax(18rem,1.2fr)_auto] lg:items-start">
                  <div className="flex items-start gap-3">
                    <CoverArt
                      src={track.spotifyUri ? images.get(track.spotifyUri) : null}
                      alt={`${track.title} cover`}
                      size={52}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <Badge tone={tone}>
                          <span className="tabular">{track.rating}/10</span>
                        </Badge>
                        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-subtle">
                          {track.source}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold tracking-tight text-fg">
                        {track.title}
                      </h3>
                      <p className="text-sm text-muted">{track.artist}</p>
                    </div>
                  </div>
                  <div>
                    {track.notes && (
                      <p className="text-sm leading-6 text-muted">
                        {track.notes}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {track.reasons.map(({ reason }) => (
                        <Badge key={reason.id}>{reason.label}</Badge>
                      ))}
                    </div>
                  </div>
                  <form action={rateTrack} className="flex flex-wrap gap-2 lg:justify-end">
                    <input type="hidden" name="id" value={track.id} />
                    {[10, 8, 5, 1].map((rating) => (
                      <button
                        key={rating}
                        name="rating"
                        value={rating}
                        aria-label={`Rate ${track.title} ${rating} out of 10`}
                        aria-pressed={track.rating === rating}
                        className={`tabular grid size-10 place-items-center rounded-2xl border text-xs font-semibold transition ${
                          track.rating === rating
                            ? "border-cyan bg-cyan text-ink shadow-glow"
                            : "border-white/10 bg-white/[0.04] text-muted hover:border-pink/60 hover:text-pink"
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </form>
                </div>
                <details className="mt-4 border-t border-white/[0.06] pt-4">
                  <summary className="cursor-pointer font-mono text-xs font-medium uppercase tracking-eyebrow text-cyan/80 transition hover:text-cyan">
                    Edit track details
                  </summary>
                  <form action={updateTrack} className="mt-4 grid gap-3 md:grid-cols-2">
                    <input type="hidden" name="id" value={track.id} />
                    <input className={inputClass} name="title" defaultValue={track.title} required />
                    <input className={inputClass} name="artist" defaultValue={track.artist} required />
                    <input className={inputClass} name="album" defaultValue={track.album ?? ""} placeholder="Album" />
                    <input className={inputClass} name="year" type="number" defaultValue={track.year ?? ""} placeholder="Year" />
                    <select className={inputClass} name="source" defaultValue={track.source}>
                      <option value="manual">Manual</option>
                      <option value="Spotify">Spotify</option>
                      <option value="Apple">Apple</option>
                      <option value="YouTube">YouTube</option>
                      <option value="candidate">Candidate</option>
                    </select>
                    <select className={inputClass} name="rating" defaultValue={track.rating}>
                      <option value="10">10 — obsession</option>
                      <option value="8">8 — good</option>
                      <option value="5">5 — neutral</option>
                      <option value="1">1 — skip</option>
                    </select>
                    <ReasonChips
                      reasons={reasons}
                      selected={track.reasons.map(({ reasonId }) => reasonId)}
                      includeTrajectory
                    />
                    <textarea
                      className={`${inputClass} min-h-24 md:col-span-2`}
                      name="notes"
                      defaultValue={track.notes}
                      placeholder="What landed or failed?"
                    />
                    <div className="md:col-span-2">
                      <SubmitButton className={buttonClass} pendingLabel="Updating…">
                        Update track
                      </SubmitButton>
                    </div>
                  </form>
                </details>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
