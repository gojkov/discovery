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
