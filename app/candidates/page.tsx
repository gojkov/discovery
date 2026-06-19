import {
  addCandidate,
  rescoreAllCandidates,
  reviewCandidate
} from "@/app/actions";
import { Badge, Card, Eyebrow, inputClass } from "@/components/ui";
import { CoverArt } from "@/components/cover-art";
import { SubmitButton } from "@/components/submit-button";
import { ReasonChips } from "@/components/reason-chips";
import { db } from "@/lib/db";
import { fetchTrackImages } from "@/lib/integrations/spotify";
import { parseStringList } from "@/lib/types";

export const dynamic = "force-dynamic";

function scoreTone(score: number): "good" | "violet" | "warn" | "bad" {
  if (score >= 82) return "good";
  if (score >= 66) return "violet";
  if (score >= 45) return "warn";
  return "bad";
}

const trackUriFromLink = (link: string | null): string | null => {
  const m = link?.match(/track\/([A-Za-z0-9]+)/);
  return m ? `spotify:track:${m[1]}` : null;
};

export default async function CandidatesPage() {
  const [candidates, reasons] = await Promise.all([
    db.candidate.findMany({
      include: { reasons: { include: { reason: true } } },
      orderBy: [{ predictedScore: "desc" }, { createdAt: "desc" }]
    }),
    db.tasteReason.findMany({
      where: { active: true, mergedIntoId: null },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }]
    })
  ]);

  // Backfill cover art for candidates that predate the stored image field,
  // by resolving the Spotify track id out of their source link.
  const missing = candidates
    .filter((c) => !c.image)
    .map((c) => trackUriFromLink(c.sourceLink))
    .filter((u): u is string => Boolean(u));
  const fetched = await fetchTrackImages(missing);
  const coverFor = (c: (typeof candidates)[number]) =>
    c.image ?? fetched.get(trackUriFromLink(c.sourceLink) ?? "") ?? null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Eyebrow>Listening queue</Eyebrow>
          <h1 className="text-4xl font-medium tracking-tight text-fg">
            Candidate lab
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Rank first. Listen outside the app. Then teach the engine what
            actually created craving.
          </p>
        </div>
        <form action={rescoreAllCandidates}>
          <SubmitButton
            pendingLabel="Re-scoring…"
            className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-fg hover:border-cyan/50 hover:text-cyan"
          >
            Re-score all with latest learnings
          </SubmitButton>
        </form>
      </div>

      <Card className="!border-cyan/15 !bg-[linear-gradient(145deg,rgba(92,214,255,0.07),rgba(161,129,255,0.05))]">
        <h2 className="text-xl font-semibold text-fg">Add a song to test</h2>
        <form action={addCandidate} className="mt-5 grid gap-4 md:grid-cols-2">
          <input className={inputClass} name="title" placeholder="Track title" required />
          <input className={inputClass} name="artist" placeholder="Artist" required />
          <input
            className={inputClass}
            name="sourceLink"
            type="url"
            placeholder="Spotify / Apple / YouTube link"
          />
          <ReasonChips reasons={reasons} />
          <textarea
            className={`${inputClass} min-h-28 md:col-span-2`}
            name="whySuggested"
            placeholder="Why was this suggested? Include any song-level clues."
          />
          <div className="md:col-span-2">
            <SubmitButton
              pendingLabel="Scoring…"
              className="rounded-full bg-cyan px-5 py-3 text-sm font-semibold text-ink shadow-glow"
            >
              Score candidate
            </SubmitButton>
          </div>
        </form>
      </Card>

      {candidates.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-xl font-semibold text-fg">The queue is empty.</p>
          <p className="mt-2 text-sm text-muted">
            Add your first candidate above; no Spotify export required.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          {candidates.map((candidate, index) => {
            const explanations = parseStringList(candidate.explanation);
            const risks = parseStringList(candidate.risks);
            return (
              <Card key={candidate.id}>
                <div className="grid gap-6 lg:grid-cols-[5rem_1fr_13rem]">
                  <div className="space-y-2">
                    <CoverArt
                      src={coverFor(candidate)}
                      alt={`${candidate.title} cover`}
                      size={64}
                    />
                    <div className="grid size-16 place-items-center rounded-2xl border border-cyan/30 bg-cyan/10 text-cyan shadow-glow">
                      <span className="tabular text-2xl font-semibold">
                        {candidate.predictedScore}
                      </span>
                    </div>
                    <p className="tabular text-center font-mono text-[10px] uppercase tracking-eyebrow text-subtle">
                      #{index + 1}
                    </p>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold text-fg">
                        {candidate.title}
                      </h2>
                      <Badge tone={scoreTone(candidate.predictedScore)}>
                        {candidate.suggestedAction}
                      </Badge>
                      <Badge>{candidate.confidence} confidence</Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium text-muted">
                      {candidate.artist}
                    </p>
                    {candidate.whySuggested && (
                      <p className="mt-4 text-sm leading-6 text-muted">
                        {candidate.whySuggested}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-1">
                      {candidate.reasons
                        .filter(({ phase }) => phase === "suggestion")
                        .map(({ reason }) => (
                          <Badge key={reason.id}>{reason.label}</Badge>
                        ))}
                    </div>
                    <details className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
                      <summary className="cursor-pointer text-sm font-semibold text-fg">
                        Why this score
                      </summary>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="font-mono text-xs font-medium uppercase tracking-eyebrow text-cyan/80">
                            Evidence
                          </p>
                          <ul className="mt-2 space-y-2 text-sm text-muted">
                            {explanations.map((item) => (
                              <li key={item}>+ {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-mono text-xs font-medium uppercase tracking-eyebrow text-coral">
                            Risks
                          </p>
                          <ul className="mt-2 space-y-2 text-sm text-muted">
                            {risks.length ? (
                              risks.map((item) => <li key={item}>– {item}</li>)
                            ) : (
                              <li>No specific risk flags yet.</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </details>
                  </div>
                  <form action={reviewCandidate} className="space-y-3">
                    <input type="hidden" name="id" value={candidate.id} />
                    <select className={inputClass} name="status" defaultValue={candidate.status}>
                      <option value="unreviewed">Unreviewed</option>
                      <option value="sampled">Sampled</option>
                      <option value="promoted">Promoted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <select
                      className={inputClass}
                      name="finalRating"
                      defaultValue={candidate.finalRating ?? ""}
                    >
                      <option value="">Final rating</option>
                      <option value="10">10 — obsession</option>
                      <option value="8">8 — good</option>
                      <option value="5">5 — neutral</option>
                      <option value="1">1 — skip</option>
                    </select>
                    <textarea
                      className={`${inputClass} min-h-24`}
                      name="notesAfterListening"
                      defaultValue={candidate.notesAfterListening}
                      placeholder="What landed or failed?"
                    />
                    <ReasonChips
                      reasons={reasons}
                      name="outcomeReasonIds"
                      selected={candidate.reasons
                        .filter(({ phase }) => phase === "outcome")
                        .map(({ reasonId }) => reasonId)}
                      includeTrajectory
                    />
                    <SubmitButton
                      pendingLabel="Saving…"
                      className="w-full rounded-full bg-fg px-5 py-3 text-sm font-semibold text-ink hover:bg-cyan hover:shadow-glow"
                    >
                      Save review
                    </SubmitButton>
                    {candidate.sourceLink && (
                      <a
                        href={candidate.sourceLink}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-center text-xs font-medium text-cyan underline"
                      >
                        Open source link
                      </a>
                    )}
                  </form>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
