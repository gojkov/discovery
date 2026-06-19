import { addTrack, rateTrack, updateTrack } from "@/app/actions";
import { Card, Eyebrow, Badge, buttonClass, inputClass } from "@/components/ui";
import { db } from "@/lib/db";
import { parseStringList } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TracksPage() {
  const tracks = await db.track.findMany({
    orderBy: [{ rating: "desc" }, { artist: "asc" }, { title: "asc" }]
  });

  return (
    <div className="space-y-8">
      <div>
        <Eyebrow>Known taste</Eyebrow>
        <h1 className="text-4xl font-black tracking-[-0.04em]">Track library</h1>
        <p className="mt-3 max-w-2xl text-cream/50">
          Every decisive love and rejection makes future rankings less naive.
        </p>
      </div>

      <Card>
        <h2 className="text-xl font-black">Add or update a track</h2>
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
          <input
            className={`${inputClass} md:col-span-2`}
            name="tags"
            placeholder="Tags, comma separated — e.g. melody-first, strong chorus"
          />
          <textarea
            className={`${inputClass} min-h-28 md:col-span-2`}
            name="notes"
            placeholder="What landed or failed?"
          />
          <div className="md:col-span-2">
            <button className={buttonClass}>Save track</button>
          </div>
        </form>
      </Card>

      <div className="overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-panel/90 shadow-card backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-5 sm:px-6">
          <h2 className="font-black">{tracks.length} known tracks</h2>
          <span className="text-xs font-bold text-cream/35">Tap any grade to re-rate</span>
        </div>
        <div className="divide-y divide-white/[0.07]">
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
              <article key={track.id} className="px-5 py-5 sm:px-6">
                <div className="grid gap-5 lg:grid-cols-[minmax(13rem,0.8fr)_minmax(18rem,1.2fr)_auto] lg:items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <Badge tone={tone}>{track.rating}/10</Badge>
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-cream/25">
                        {track.source}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-black tracking-tight">{track.title}</h3>
                    <p className="text-sm text-cream/45">{track.artist}</p>
                  </div>
                  <div>
                    {track.notes && <p className="text-sm leading-6 text-cream/55">{track.notes}</p>}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {parseStringList(track.tags).map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
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
                        className={`grid size-10 place-items-center rounded-full border text-xs font-black transition ${
                          track.rating === rating
                            ? "border-cyan bg-cyan text-ink shadow-[0_0_22px_rgba(70,232,255,0.3)]"
                            : "border-white/10 bg-white/[0.04] text-cream/45 hover:border-pink/60 hover:text-pink"
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </form>
                </div>
                <details className="mt-4 border-t border-white/[0.06] pt-4">
                  <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.16em] text-cyan/70 transition hover:text-cyan">
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
                    <input
                      className={`${inputClass} md:col-span-2`}
                      name="tags"
                      defaultValue={parseStringList(track.tags).join(", ")}
                      placeholder="Tags"
                    />
                    <textarea
                      className={`${inputClass} min-h-24 md:col-span-2`}
                      name="notes"
                      defaultValue={track.notes}
                      placeholder="What landed or failed?"
                    />
                    <div className="md:col-span-2">
                      <button className={buttonClass}>Update track</button>
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
