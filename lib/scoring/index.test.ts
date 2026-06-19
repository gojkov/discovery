import { describe, expect, it } from "vitest";
import { scoreCandidate } from "@/lib/scoring";
import type { TrackKnowledge } from "@/lib/types";

const history: TrackKnowledge[] = [
  { title: "good2kno", artist: "CUBE", rating: 10 },
  { title: "Rendezvous", artist: "CUBE", rating: 10 },
  { title: "Wax Drip", artist: "Landon Sears", rating: 10 },
  { title: "Loading Screen", artist: "Landon Sears", rating: 1 },
  { title: "Levy", artist: "JMSN", rating: 10 },
  { title: "Other", artist: "JMSN", rating: 1 }
];

describe("scoreCandidate", () => {
  it("strongly rewards CUBE but stays within 100", () => {
    const result = scoreCandidate(
      {
        title: "New Song",
        artist: "CUBE",
        tags: ["strong chorus", "immediate attention"]
      },
      history
    );
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.suggestedAction).toBe("must sample");
  });

  it("warns when an artist has both 10s and skips", () => {
    const result = scoreCandidate(
      { title: "Unknown", artist: "Landon Sears" },
      history
    );
    expect(result.risks.join(" ")).toContain("Requires song-level validation");
    expect(result.score).toBeLessThan(85);
  });

  it("penalizes known negative language", () => {
    const result = scoreCandidate(
      {
        title: "Neon",
        artist: "New Artist",
        whySuggested: "bright synth-pop like Blinding Lights"
      },
      history
    );
    expect(result.score).toBeLessThan(40);
    expect(result.risks.length).toBeGreaterThan(0);
  });

  it("treats catchy and sincere as a strong song-level signal", () => {
    const plain = scoreCandidate(
      { title: "A", artist: "Unknown" },
      history
    );
    const signaled = scoreCandidate(
      {
        title: "B",
        artist: "Unknown",
        whySuggested: "catchy and sincere with a strong chorus"
      },
      history
    );
    expect(signaled.score).toBeGreaterThan(plain.score + 15);
  });
});

describe("scoreCandidate — learning from history", () => {
  it("reinforces a phrase that co-occurs with proven 10s", () => {
    const noEvidence: TrackKnowledge[] = [
      { title: "x", artist: "Zed", rating: 10 }
    ];
    const withEvidence: TrackKnowledge[] = [
      { title: "a", artist: "Zed", rating: 10, tags: ["strong chorus"] },
      { title: "b", artist: "Yan", rating: 10, notes: "big chorus all the way" }
    ];
    const cand = { title: "New", artist: "Unknown", tags: ["strong chorus"] };
    expect(scoreCandidate(cand, withEvidence).score).toBeGreaterThan(
      scoreCandidate(cand, noEvidence).score
    );
  });

  it("deepens a penalty when a phrase co-occurs with skips", () => {
    const regret: TrackKnowledge[] = [
      { title: "r1", artist: "Q", rating: 1, notes: "pleasant but no craving" },
      { title: "r2", artist: "W", rating: 1, tags: ["good but no craving"] }
    ];
    const cand = {
      title: "c",
      artist: "Unknown",
      whySuggested: "pleasant, no craving"
    };
    expect(scoreCandidate(cand, regret).score).toBeLessThan(
      scoreCandidate(cand, []).score
    );
  });

  it("rewards a clean artist over a mixed one via learned hit-rate", () => {
    const clean: TrackKnowledge[] = Array.from({ length: 3 }, (_, i) => ({
      title: `c${i}`,
      artist: "Pure",
      rating: 10
    }));
    const mixed: TrackKnowledge[] = [
      ...Array.from({ length: 3 }, (_, i) => ({
        title: `m${i}`,
        artist: "Mix",
        rating: 10 as const
      })),
      { title: "m4", artist: "Mix", rating: 1 },
      { title: "m5", artist: "Mix", rating: 1 }
    ];
    expect(scoreCandidate({ title: "n", artist: "Pure" }, clean).score).toBeGreaterThan(
      scoreCandidate({ title: "n", artist: "Mix" }, mixed).score
    );
  });

  it("still scores from static rules on a cold start (no history)", () => {
    const result = scoreCandidate(
      {
        title: "x",
        artist: "Nobody",
        whySuggested: "strong chorus, immediate attention, replay craving"
      },
      []
    );
    expect(result.score).toBeGreaterThan(60);
  });
});
