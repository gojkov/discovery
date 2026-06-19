import { describe, expect, it } from "vitest";
import { scoreCandidate } from "@/lib/scoring";
import type { ReasonSignal } from "@/lib/reasons";
import type { TrackKnowledge } from "@/lib/types";

const reason = (
  slug: string,
  label: string,
  polarity: "positive" | "negative",
  weight: number
): ReasonSignal => ({ slug, label, polarity, weight, category: "test" });

const chorus = reason("strong-chorus", "strong chorus", "positive", 10);
const noCraving = reason("good-but-no-craving", "good but no craving", "negative", -6);

const history: TrackKnowledge[] = [
  { title: "good2kno", artist: "CUBE", rating: 10 },
  { title: "Rendezvous", artist: "CUBE", rating: 10 },
  { title: "Wax Drip", artist: "Landon Sears", rating: 10 },
  { title: "Loading Screen", artist: "Landon Sears", rating: 1 },
  { title: "Levy", artist: "JMSN", rating: 10 },
  { title: "Other", artist: "JMSN", rating: 1 }
];

describe("scoreCandidate", () => {
  it("strongly rewards proven artists plus selected positive reasons", () => {
    const result = scoreCandidate(
      { title: "New Song", artist: "CUBE", reasons: [chorus] },
      history
    );
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  it("warns when an artist has both 10s and skips", () => {
    const result = scoreCandidate(
      { title: "Unknown", artist: "Landon Sears" },
      history
    );
    expect(result.risks.join(" ")).toContain("Requires song-level validation");
  });

  it("scores only structured reasons, never arbitrary prose", () => {
    const plain = scoreCandidate({ title: "A", artist: "Unknown" }, history);
    const selected = scoreCandidate(
      { title: "B", artist: "Unknown", reasons: [chorus] },
      history
    );
    expect(selected.score).toBe(plain.score + chorus.weight);
  });

  it("learns reason associations only from selected reason ids", () => {
    const reinforced: TrackKnowledge[] = [
      { title: "a", artist: "Zed", rating: 10, reasons: [chorus] },
      { title: "b", artist: "Yan", rating: 10, reasons: [chorus] }
    ];
    const candidate = { title: "New", artist: "Unknown", reasons: [chorus] };
    expect(scoreCandidate(candidate, reinforced).score).toBeGreaterThan(
      scoreCandidate(candidate, []).score
    );
  });

  it("deepens a selected negative reason associated with rejects", () => {
    const regret: TrackKnowledge[] = [
      { title: "r1", artist: "Q", rating: 1, reasons: [noCraving] },
      { title: "r2", artist: "W", rating: 1, reasons: [noCraving] }
    ];
    const candidate = {
      title: "c",
      artist: "Unknown",
      reasons: [noCraving]
    };
    expect(scoreCandidate(candidate, regret).score).toBeLessThan(
      scoreCandidate(candidate, []).score
    );
  });
});
