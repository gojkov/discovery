/**
 * Last.fm adapter — the primary discovery source.
 *
 * `track.getSimilar` and `artist.getTopTracks` are stable, free endpoints that
 * need only an API key (no OAuth). Seeded from your proven 10s, they surface
 * genuinely new candidate songs that the scoring engine then ranks.
 *
 * Get a key at https://www.last.fm/api/account/create and set LASTFM_API_KEY.
 */

const BASE = "https://ws.audioscrobbler.com/2.0/";

export type SimilarTrack = {
  title: string;
  artist: string;
  /** Last.fm similarity match, 0–1 (or playcount-derived for top tracks). */
  match: number;
  seed: string;
};

export const lastfmConfigured = () => Boolean(process.env.LASTFM_API_KEY);

type LastfmTrack = {
  name?: string;
  artist?: { name?: string } | string;
  match?: string;
};

function readArtist(artist: LastfmTrack["artist"]): string {
  if (!artist) return "";
  return typeof artist === "string" ? artist : (artist.name ?? "");
}

async function call(
  params: Record<string, string>
): Promise<Record<string, unknown>> {
  const key = process.env.LASTFM_API_KEY;
  if (!key) throw new Error("LASTFM_API_KEY is not set.");
  const url = new URL(BASE);
  url.search = new URLSearchParams({
    ...params,
    api_key: key,
    format: "json"
  }).toString();

  const res = await fetch(url, {
    headers: { "User-Agent": "soundslikeme" },
    // Discovery is best-effort; never hang the request indefinitely.
    signal: AbortSignal.timeout(8000)
  });
  if (!res.ok) throw new Error(`Last.fm HTTP ${res.status}`);
  const json = (await res.json()) as Record<string, unknown>;
  if ("error" in json) {
    throw new Error(`Last.fm error: ${String(json.message ?? json.error)}`);
  }
  return json;
}

/** Tracks similar to a given seed track. */
export async function similarTracks(
  artist: string,
  track: string,
  limit = 20
): Promise<SimilarTrack[]> {
  const json = await call({
    method: "track.getsimilar",
    artist,
    track,
    autocorrect: "1",
    limit: String(limit)
  });
  const container = json.similartracks as { track?: LastfmTrack[] } | undefined;
  const rows = container?.track ?? [];
  return rows
    .map((row) => ({
      title: row.name ?? "",
      artist: readArtist(row.artist),
      match: Number(row.match ?? 0),
      seed: `${track} — ${artist}`
    }))
    .filter((row) => row.title && row.artist);
}

/** An artist's top tracks — a fallback seed when a track has no similars. */
export async function artistTopTracks(
  artist: string,
  limit = 10
): Promise<SimilarTrack[]> {
  const json = await call({
    method: "artist.gettoptracks",
    artist,
    autocorrect: "1",
    limit: String(limit)
  });
  const container = json.toptracks as { track?: LastfmTrack[] } | undefined;
  const rows = container?.track ?? [];
  return rows
    .map((row, index) => ({
      title: row.name ?? "",
      artist: readArtist(row.artist) || artist,
      // No match score on this endpoint; approximate from rank.
      match: Math.max(0.1, 1 - index / Math.max(1, rows.length)),
      seed: `top tracks — ${artist}`
    }))
    .filter((row) => row.title && row.artist);
}
