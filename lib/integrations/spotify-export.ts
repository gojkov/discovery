/**
 * Parser for the Spotify GDPR export ("Extended Streaming History" +
 * "Account Data"). Pure, side-effect-free, and unit-testable.
 *
 * The export is BEHAVIORAL, not acoustic: it carries play/skip/replay events,
 * not audio features. We aggregate those events per track into a signal the
 * scoring engine can learn from.
 */

export type StreamRecord = {
  ts: string;
  ms_played?: number;
  master_metadata_track_name?: string | null;
  master_metadata_album_artist_name?: string | null;
  master_metadata_album_album_name?: string | null;
  spotify_track_uri?: string | null;
  reason_end?: string | null;
  skipped?: boolean | null;
};

export type AggregatedStat = {
  spotifyUri: string;
  title: string;
  artist: string;
  album: string | null;
  plays: number;
  completions: number;
  skips: number;
  backbtns: number;
  msPlayed: number;
  distinctDays: number;
  firstPlayed: string;
  lastPlayed: string;
};

type Internal = Omit<AggregatedStat, "distinctDays"> & { days: Set<string> };

/**
 * Streaming aggregator. Feed it records file-by-file (so 128 MB of history
 * never needs to live in one array), then finalize.
 */
export function createAggregator() {
  const map = new Map<string, Internal>();

  function add(records: StreamRecord[]) {
    for (const r of records) {
      const uri = r.spotify_track_uri;
      if (!uri) continue; // skip podcasts/videos/local files
      const day = r.ts?.slice(0, 10) ?? "";
      let s = map.get(uri);
      if (!s) {
        s = {
          spotifyUri: uri,
          title: r.master_metadata_track_name ?? "",
          artist: r.master_metadata_album_artist_name ?? "",
          album: r.master_metadata_album_album_name ?? null,
          plays: 0,
          completions: 0,
          skips: 0,
          backbtns: 0,
          msPlayed: 0,
          firstPlayed: r.ts,
          lastPlayed: r.ts,
          days: new Set()
        };
        map.set(uri, s);
      }
      s.plays += 1;
      s.msPlayed += r.ms_played ?? 0;
      if (r.reason_end === "trackdone") s.completions += 1;
      if (r.reason_end === "fwdbtn" || r.skipped === true) s.skips += 1;
      if (r.reason_end === "backbtn") s.backbtns += 1;
      if (day) s.days.add(day);
      if (r.ts < s.firstPlayed) s.firstPlayed = r.ts;
      if (r.ts > s.lastPlayed) s.lastPlayed = r.ts;
      // Keep the most complete metadata we see.
      if (!s.title && r.master_metadata_track_name)
        s.title = r.master_metadata_track_name;
      if (!s.artist && r.master_metadata_album_artist_name)
        s.artist = r.master_metadata_album_artist_name;
    }
  }

  function finalize(): AggregatedStat[] {
    return [...map.values()]
      .filter((s) => s.title && s.artist)
      .map(({ days, ...rest }) => ({ ...rest, distinctDays: days.size }));
  }

  return { add, finalize };
}

/** Convenience one-shot aggregation (used in tests). */
export function aggregateStreamingHistory(
  records: StreamRecord[]
): AggregatedStat[] {
  const agg = createAggregator();
  agg.add(records);
  return agg.finalize();
}

export type LibrarySummary = {
  savedUris: Set<string>;
  bannedUris: Set<string>;
  followedArtists: string[];
};

type LibraryFile = {
  tracks?: { uri?: string }[];
  bannedTracks?: { uri?: string }[];
  artists?: { name?: string }[];
};

/** Extract saved/banned track URIs and followed artists from YourLibrary.json. */
export function parseLibrary(library: LibraryFile): LibrarySummary {
  const uris = (rows?: { uri?: string }[]) =>
    new Set((rows ?? []).map((r) => r.uri).filter((u): u is string => Boolean(u)));
  return {
    savedUris: uris(library.tracks),
    bannedUris: uris(library.bannedTracks),
    followedArtists: (library.artists ?? [])
      .map((a) => a.name)
      .filter((n): n is string => Boolean(n))
  };
}
