import { knownArtistSignals } from "@/taste-rules";
import type {
  CandidateForScoring,
  ScoreResult,
  TrackKnowledge
} from "@/lib/types";
import { artistParts } from "./text";
import {
  artistRecord,
  buildModel,
  type LearnedModel
} from "./learn";

/**
 * Score a candidate against a learned taste model.
 *
 * The static rules in `taste-rules.ts` act as a cold-start prior; once the
 * library contains rated tracks, per-artist hit-rates and empirical phrase
 * associations adjust the score so it self-corrects toward what actually
 * created craving for this listener.
 */
export function scoreWithModel(
  candidate: CandidateForScoring,
  model: LearnedModel
): ScoreResult {
  let score = 48;
  let evidence = 0;
  const explanations: string[] = [];
  const risks: string[] = [];
  const parts = artistParts(candidate.artist);

  // ---- Artist signal, learned from real outcomes ----
  const record = artistRecord(model, candidate.artist);
  const { tens: loved, eights: liked, ones: rejected } = record;
  const decided = loved + rejected;
  const hitRate = decided > 0 ? loved / decided : null;

  if (loved > 0) {
    // Base reward scales with proven 10s; amplified when the artist's
    // decided hit-rate is high, dampened when it is shaky.
    const base = Math.min(14, loved * 4);
    const bonus = Math.round(base * (0.6 + 0.4 * (hitRate ?? 1)));
    score += bonus;
    evidence += loved;
    explanations.push(
      `${loved} known 10/10 ${loved === 1 ? "track" : "tracks"} from this artist (+${bonus}).`
    );
  }

  if (liked > 0) {
    score += Math.min(4, liked * 2);
    evidence += liked;
    explanations.push("This artist has produced at least one solid 8/10.");
  }

  if (rejected > 0) {
    const penalty = Math.min(13, rejected * 7);
    score -= penalty;
    evidence += rejected;
    risks.push(
      `${rejected} known false ${rejected === 1 ? "positive" : "positives"} from this artist (-${penalty}).`
    );
  }

  // Explicit hand-authored priors (cold-start). Down-weighted once we have
  // enough real outcomes for the artist to trust the learned signal instead.
  const explicitSignals = parts
    .map((part) => knownArtistSignals[part])
    .filter(Boolean);
  if (explicitSignals.length) {
    const best = explicitSignals.sort((a, b) => b.bonus - a.bonus)[0];
    const trust = decided >= 3 ? 0.5 : 1;
    const bonus = Math.round(best.bonus * trust);
    score += bonus;
    evidence += 2;
    explanations.push(`${best.label} (+${bonus}).`);
    if (best.caution) risks.push(best.caution);
  }

  if (loved > 0 && rejected > 0) {
    score -= 4;
    risks.unshift(
      "Artist match is unreliable here. Requires song-level validation."
    );
    if (hitRate !== null) {
      explanations.push(
        `Learned artist hit-rate is ${Math.round(hitRate * 100)}% across decided tracks.`
      );
    }
  }

  // ---- Song-level signal: selected, normalized reason chips only ----
  for (const reason of candidate.reasons ?? []) {
    if (reason.polarity === "trajectory" || reason.weight === 0) continue;
    const assoc = model.reasonAssoc.get(reason.slug) ?? 0;
    const weight =
      reason.polarity === "negative"
        ? reason.weight + Math.min(0, assoc)
        : reason.weight + Math.max(0, assoc);
    score += weight;
    evidence += 1;
    if (reason.polarity === "negative") {
      risks.push(`Negative reason: ${reason.label} (${weight}).`);
    } else {
      explanations.push(
        `Positive reason: ${reason.label} (+${weight})${assoc > 0 ? " — reinforced by your 10s" : ""}.`
      );
    }
  }

  if ((candidate.reasons ?? []).length === 0) {
    risks.push(
      "No structured song-level reasons were selected, so this score is exploratory."
    );
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const confidence: ScoreResult["confidence"] =
    evidence >= 6 ? "high" : evidence >= 3 ? "medium" : "low";

  let suggestedAction: ScoreResult["suggestedAction"];
  if (score >= 82) suggestedAction = "must sample";
  else if (score >= 66) suggestedAction = "worth sampling";
  else if (score >= 53) suggestedAction = "likely 8/10";
  else if (score >= 32) suggestedAction = "likely false positive";
  else suggestedAction = "reject";

  if (!explanations.length) {
    explanations.push(
      "No strong match yet; the score stays near the neutral prior."
    );
  }

  return { score, confidence, explanations, risks, suggestedAction };
}

/** Convenience: build a model from history and score a single candidate. */
export function scoreCandidate(
  candidate: CandidateForScoring,
  tracks: TrackKnowledge[]
): ScoreResult {
  return scoreWithModel(candidate, buildModel(tracks));
}

export { buildModel } from "./learn";
