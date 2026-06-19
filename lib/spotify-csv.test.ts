import { describe, expect, it } from "vitest";
import { parseSpotifyCsv } from "@/lib/spotify-csv";

describe("parseSpotifyCsv", () => {
  it("parses quoted commas, a BOM, and audio features", () => {
    const csv =
      '﻿"Track URI","Track Name","Artist Name(s)","Genres","Danceability","Energy","Valence","Tempo"\n' +
      'spotify:track:1,"Hello, Goodbye","The Beatles","rock;pop",0.5,0.8,0.6,120\n';
    const rows = parseSpotifyCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Hello, Goodbye");
    expect(rows[0].artist).toBe("The Beatles");
    expect(rows[0].genres).toEqual(["rock", "pop"]);
    expect(rows[0].audioFeatures.energy).toBe(0.8);
    expect(rows[0].uri).toBe("spotify:track:1");
  });

  it("dedupes on URI and skips partial rows", () => {
    const csv =
      "Track URI,Track Name,Artist Name(s)\n" +
      "uri1,Song A,Artist A\n" +
      "uri1,Song A,Artist A\n" +
      ",,\n" +
      "uri2,Song B,Artist B\n";
    const rows = parseSpotifyCsv(csv);
    expect(rows.map((r) => r.title)).toEqual(["Song A", "Song B"]);
  });

  it("handles newlines embedded inside quoted fields", () => {
    const csv =
      "Track Name,Artist Name(s)\n" +
      '"Multi\nLine Title","Some Artist"\n';
    const rows = parseSpotifyCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Multi\nLine Title");
  });

  it("returns nothing for a header-only file", () => {
    expect(parseSpotifyCsv("Track Name,Artist Name(s)\n")).toEqual([]);
  });
});
