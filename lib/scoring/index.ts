import {
  knownArtistSignals,
  negativeTasteRules,
  positiveTasteRules,
  type TasteRule
} from "@/taste-rules";
import type {
  CandidateForScoring,
  ScoreResult,
  TrackKnowledge
} from "@/lib/types";

const normalize = (value: string) =>
  value.toLowerCase().replace(/[&,+/]/g, " ").replace(/\s+/g, " ").trim();

const artistParts = (artist: string) => {
  const whole = normalize(artist);
  return Array.from(
    new Set([
      whole,
      ...artist
        .split(/&|,|\/|\band\b|\bfeat\.?\b|\bx\b/i)
        .map(normalize)
        .filter(Boolean)
    ])
  );
};

function matchesRule(text: string, rule: TasteRule) {
  return [rule.phrase, ...(rule.aliases ?? [])].some((phrase) =>
    text.includes(normalize(phrase))
  );
}

export function scoreCandidate(
  candidate: CandidateForScoring,
  tracks: TrackKnowledge[]
): ScoreResult {
  let score = 48;
  let evidence = 0;
  const explanations: string[] = [];
  const risks: string[] = [];
  const parts = artistParts(candidate.artist);
  const text = normalize(
    [
      candidate.title,
      candidate.artist,
      candidate.whySuggested,
      candidate.notes,
      ...(candidate.tags ?? [])
    ]
      .filter(Boolean)
      .join(" ")
  );

  const artistHistory = tracks.filter((track) =>
    artistParts(track.artist).some((part) => parts.includes(part))
  );
  const loved = artistHistory.filter((track) => track.rating === 10);
  const liked = artistHistory.filter((track) => track.rating === 8);
  const rejected = artistHistory.filter((track) => track.rating === 1);

  if (loved.length) {
    const bonus = Math.min(14, loved.length * 4);
    score += bonus;
    evidence += loved.length;
    explanations.push(
      `${loved.length} known 10/10 ${loved.length === 1 ? "track" : "tracks"} from this artist (+${bonus}).`
    );
  }

  if (liked.length) {
    score += Math.min(4, liked.length * 2);
    evidence += liked.length;
    explanations.push("This artist has produced at least one solid 8/10.");
  }

  if (rejected.length) {
    const penalty = Math.min(13, rejected.length * 7);
    score -= penalty;
    evidence += rejected.length;
    risks.push(
      `${rejected.length} known false ${rejected.length === 1 ? "positive" : "positives"} from this artist (-${penalty}).`
    );
  }

  const explicitSignals = parts
    .map((part) => knownArtistSignals[part])
    .filter(Boolean);
  if (explicitSignals.length) {
    const best = explicitSignals.sort((a, b) => b.bonus - a.bonus)[0];
    score += best.bonus;
    evidence += 2;
    explanations.push(`${best.label} (+${best.bonus}).`);
    if (best.caution) risks.push(best.caution);
  }

  const mixed = loved.length > 0 && rejected.length > 0;
  if (mixed) {
    score -= 4;
    risks.unshift(
      "Artist match is unreliable here. Requires song-level validation."
    );
  }

  for (const rule of positiveTasteRules) {
    if (matchesRule(text, rule)) {
      score += rule.weight;
      evidence += 1;
      explanations.push(`Positive signal: ${rule.phrase} (+${rule.weight}).`);
    }
  }

  for (const rule of negativeTasteRules) {
    if (matchesRule(text, rule)) {
      score += rule.weight;
      evidence += 1;
      risks.push(`Negative signal: ${rule.phrase} (${rule.weight}).`);
    }
  }

  if ((candidate.tags ?? []).length === 0 && !candidate.whySuggested?.trim()) {
    risks.push("Little song-level evidence was provided, so this score is exploratory.");
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
    explanations.push("No strong match yet; the score stays near the neutral prior.");
  }

  return { score, confidence, explanations, risks, suggestedAction };
}
