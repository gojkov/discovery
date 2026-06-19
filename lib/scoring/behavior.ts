/**
 * Turns raw behavioral aggregates (from the Spotify export) into taste signal:
 * a discrete derived rating for confident cases, and a continuous 0–100
 * "craving" score used as a prior even when the rating is inconclusive.
 */

export type BehaviorInput = {
  plays: number;
  completions: number;
  skips: number;
  backbtns: number;
  distinctDays: number;
  saved: boolean;
  banned: boolean;
};

const skipRate = (b: BehaviorInput) => (b.plays ? b.skips / b.plays : 0);

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

/**
 * Derive a 10/8/5/1 rating from behavior, or null when there isn't enough
 * signal to label confidently (those rows still contribute their `craving`
 * prior, just not a hard rating).
 */
export function deriveRating(b: BehaviorInput): number | null {
  if (b.banned) return 1;
  const sr = skipRate(b);
  // High exposure, never finished, mostly skipped → a hard false positive.
  const contradicted = b.plays >= 6 && b.completions === 0 && sr >= 0.7;

  if (b.completions >= 5 && sr < 0.35 && b.distinctDays >= 3) return 10;
  if (contradicted && !b.saved) return 1;
  if (b.saved && !contradicted) return 8; // an explicit save is strong positive
  if (b.completions >= 2 && sr < 0.45 && b.distinctDays >= 2) return 8;
  if (b.plays >= 4) return 5;
  return null;
}

/**
 * Continuous 0–100 craving score. Monotonic: rises with completions, replays
 * (backbtn), and sustained interest (distinct days); falls with skip rate.
 */
export function craving(b: BehaviorInput): number {
  const sr = skipRate(b);
  let score = 40;
  score += Math.min(35, b.completions * 3); // finishing it is the core signal
  score += Math.min(15, b.backbtns * 2); // pressing back = wanting it again
  score += Math.min(10, b.distinctDays); // sustained over time
  score -= Math.round(sr * 45); // skipping pushes it down
  if (b.saved) score += 8;
  if (b.banned) return clamp(score, 0, 5);
  return clamp(Math.round(score), 0, 100);
}

/** Human-readable evidence line for the review queue. */
export function behaviorEvidence(b: BehaviorInput): string {
  const sr = b.plays ? Math.round((100 * b.skips) / b.plays) : 0;
  const parts = [
    `${b.completions} completion${b.completions === 1 ? "" : "s"}`,
    `${sr}% skip`,
    `${b.distinctDays} day${b.distinctDays === 1 ? "" : "s"}`
  ];
  if (b.backbtns) parts.push(`${b.backbtns} replay${b.backbtns === 1 ? "" : "s"}`);
  if (b.saved) parts.push("saved");
  if (b.banned) parts.push("banned");
  return parts.join(" · ");
}
