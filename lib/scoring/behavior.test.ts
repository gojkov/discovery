import { describe, expect, it } from "vitest";
import { craving, deriveRating, type BehaviorInput } from "@/lib/scoring/behavior";

const b = (over: Partial<BehaviorInput>): BehaviorInput => ({
  plays: 0,
  completions: 0,
  skips: 0,
  backbtns: 0,
  distinctDays: 0,
  saved: false,
  banned: false,
  ...over
});

describe("deriveRating", () => {
  it("rates a replay monster 10", () => {
    expect(
      deriveRating(b({ plays: 400, completions: 370, skips: 40, distinctDays: 60 }))
    ).toBe(10);
  });

  it("rates a high-exposure hard skip 1", () => {
    expect(
      deriveRating(b({ plays: 24, completions: 0, skips: 24, distinctDays: 10 }))
    ).toBe(1);
  });

  it("treats a banned track as 1 regardless of plays", () => {
    expect(deriveRating(b({ banned: true, completions: 10, plays: 10 }))).toBe(1);
  });

  it("rates an explicit save 8 when not contradicted", () => {
    expect(deriveRating(b({ saved: true, plays: 2, completions: 1 }))).toBe(8);
  });

  it("returns null when there is too little signal", () => {
    expect(deriveRating(b({ plays: 1, completions: 1 }))).toBeNull();
  });

  it("does not hard-reject a saved track even if skipped a lot", () => {
    expect(
      deriveRating(b({ saved: true, plays: 8, completions: 0, skips: 8 }))
    ).not.toBe(1);
  });
});

describe("craving", () => {
  it("is higher for a replay monster than a hard skip", () => {
    const monster = craving(b({ plays: 400, completions: 370, backbtns: 20, distinctDays: 60 }));
    const skip = craving(b({ plays: 24, completions: 0, skips: 24, distinctDays: 10 }));
    expect(monster).toBeGreaterThan(skip);
  });

  it("increases monotonically with completions (skip rate held constant)", () => {
    const low = craving(b({ plays: 20, completions: 3, skips: 2 }));
    const high = craving(b({ plays: 20, completions: 8, skips: 2 }));
    expect(high).toBeGreaterThan(low);
  });

  it("decreases as skip rate rises", () => {
    const clean = craving(b({ plays: 20, completions: 5, skips: 1 }));
    const skippy = craving(b({ plays: 20, completions: 5, skips: 15 }));
    expect(skippy).toBeLessThan(clean);
  });

  it("stays within 0–100 and caps banned low", () => {
    const v = craving(b({ plays: 400, completions: 370, banned: true }));
    expect(v).toBeLessThanOrEqual(5);
    expect(v).toBeGreaterThanOrEqual(0);
  });
});
