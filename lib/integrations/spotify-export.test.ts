import { describe, expect, it } from "vitest";
import {
  aggregateStreamingHistory,
  parseLibrary,
  type StreamRecord
} from "@/lib/integrations/spotify-export";

const rec = (over: Partial<StreamRecord>): StreamRecord => ({
  ts: "2024-01-01T00:00:00Z",
  ms_played: 200000,
  master_metadata_track_name: "Song",
  master_metadata_album_artist_name: "Artist",
  master_metadata_album_album_name: "Album",
  spotify_track_uri: "spotify:track:1",
  reason_end: "trackdone",
  skipped: false,
  ...over
});

describe("aggregateStreamingHistory", () => {
  it("counts completions, skips, replays, plays, and distinct days", () => {
    const stats = aggregateStreamingHistory([
      rec({ ts: "2024-01-01T00:00:00Z", reason_end: "trackdone" }),
      rec({ ts: "2024-01-02T00:00:00Z", reason_end: "trackdone" }),
      rec({ ts: "2024-01-02T01:00:00Z", reason_end: "fwdbtn" }),
      rec({ ts: "2024-01-03T00:00:00Z", reason_end: "backbtn" }),
      rec({ ts: "2024-01-03T02:00:00Z", skipped: true, reason_end: "endplay" })
    ]);
    expect(stats).toHaveLength(1);
    const s = stats[0];
    expect(s.plays).toBe(5);
    expect(s.completions).toBe(2);
    expect(s.skips).toBe(2); // one fwdbtn + one skipped=true
    expect(s.backbtns).toBe(1);
    expect(s.distinctDays).toBe(3);
    expect(s.firstPlayed).toBe("2024-01-01T00:00:00Z");
    expect(s.lastPlayed).toBe("2024-01-03T02:00:00Z");
  });

  it("ignores records without a track URI (podcasts/video/local)", () => {
    const stats = aggregateStreamingHistory([
      rec({ spotify_track_uri: null }),
      rec({ spotify_track_uri: "spotify:track:2" })
    ]);
    expect(stats.map((s) => s.spotifyUri)).toEqual(["spotify:track:2"]);
  });

  it("separates distinct tracks", () => {
    const stats = aggregateStreamingHistory([
      rec({ spotify_track_uri: "spotify:track:a" }),
      rec({ spotify_track_uri: "spotify:track:b" }),
      rec({ spotify_track_uri: "spotify:track:b" })
    ]);
    expect(stats).toHaveLength(2);
    expect(stats.find((s) => s.spotifyUri === "spotify:track:b")?.plays).toBe(2);
  });
});

describe("parseLibrary", () => {
  it("extracts saved/banned URIs and followed artists", () => {
    const summary = parseLibrary({
      tracks: [{ uri: "spotify:track:1" }, { uri: "spotify:track:2" }],
      bannedTracks: [{ uri: "spotify:track:9" }],
      artists: [{ name: "CUBE" }, { name: "JMSN" }]
    });
    expect(summary.savedUris.has("spotify:track:1")).toBe(true);
    expect(summary.bannedUris.has("spotify:track:9")).toBe(true);
    expect(summary.followedArtists).toEqual(["CUBE", "JMSN"]);
  });
});
