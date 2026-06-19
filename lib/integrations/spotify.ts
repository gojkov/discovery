/**
 * Spotify adapter — metadata + resolvable play links.
 *
 * Uses the client-credentials flow (app token, no user login) for `search`,
 * which remains available. Note: Audio Features, Recommendations, and Related
 * Artists were deprecated for newly-created apps (Nov 2024), so this adapter
 * deliberately sticks to search/metadata and leaves discovery to Last.fm.
 *
 * Create an app at https://developer.spotify.com/dashboard and set
 * SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET.
 */

export const spotifyConfigured = () =>
  Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5000) {
    return cachedToken.value;
  }
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Spotify credentials are not set.");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(8000)
  });
  if (!res.ok) throw new Error(`Spotify token HTTP ${res.status}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000
  };
  return cachedToken.value;
}

export type SpotifyMatch = {
  url: string;
  uri: string;
  image: string | null;
  artistId: string | null;
  artistName: string | null;
};

type SpotifyImage = { url: string };
type SpotifyArtist = { id?: string; name?: string };
type SpotifyTrackObj = {
  id?: string;
  uri?: string;
  external_urls?: { spotify?: string };
  album?: { images?: SpotifyImage[] };
  artists?: SpotifyArtist[];
};

// Prefer the medium (~300px) image, falling back to the largest available.
const pickImage = (t?: SpotifyTrackObj): string | null =>
  t?.album?.images?.[1]?.url ?? t?.album?.images?.[0]?.url ?? null;

const trackId = (uri: string) => uri.replace(/^spotify:track:/, "");

/** Resolve a track to its Spotify URL + cover art, or null if not found. */
export async function findTrackLink(
  title: string,
  artist: string
): Promise<SpotifyMatch | null> {
  if (!spotifyConfigured()) return null;
  try {
    const token = await getToken();
    const url = new URL("https://api.spotify.com/v1/search");
    url.search = new URLSearchParams({
      q: `track:${title} artist:${artist}`,
      type: "track",
      limit: "1"
    }).toString();
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { tracks?: { items?: SpotifyTrackObj[] } };
    const hit = json.tracks?.items?.[0];
    if (!hit?.external_urls?.spotify || !hit.uri) return null;
    return {
      url: hit.external_urls.spotify,
      uri: hit.uri,
      image: pickImage(hit),
      artistId: hit.artists?.[0]?.id ?? null,
      artistName: hit.artists?.[0]?.name ?? null
    };
  } catch {
    // Link enrichment is optional; never fail discovery over it.
    return null;
  }
}

/**
 * The primary Spotify artist id behind a known track URI. Used to learn the
 * *real* identity of a listener's artists (so a same-named impostor can't
 * inherit their taste signal).
 */
export async function primaryArtistId(trackUri: string): Promise<string | null> {
  if (!spotifyConfigured()) return null;
  try {
    const token = await getToken();
    const res = await fetch(
      `https://api.spotify.com/v1/tracks/${trackId(trackUri)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000)
      }
    );
    if (!res.ok) return null;
    const t = (await res.json()) as SpotifyTrackObj;
    return t.artists?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve cover art for known track URIs → a uri → image-URL map.
 *
 * Uses the single-track endpoint with bounded concurrency: Spotify's batch
 * `/v1/tracks?ids=` is 403 for newly-created apps (Nov 2024 restrictions),
 * but `/v1/tracks/{id}` still works. Missing/unconfigured entries are absent.
 */
export async function fetchTrackImages(
  uris: string[]
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!spotifyConfigured() || uris.length === 0) return out;
  try {
    const token = await getToken();
    const ids = [...new Set(uris.map(trackId))];
    const CONCURRENCY = 8;
    for (let i = 0; i < ids.length; i += CONCURRENCY) {
      const results = await Promise.all(
        ids.slice(i, i + CONCURRENCY).map(async (id) => {
          try {
            const res = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
              signal: AbortSignal.timeout(8000)
            });
            if (!res.ok) return null;
            const t = (await res.json()) as SpotifyTrackObj;
            const img = pickImage(t);
            return img && t.id ? ([`spotify:track:${t.id}`, img] as const) : null;
          } catch {
            return null;
          }
        })
      );
      for (const r of results) if (r) out.set(r[0], r[1]);
    }
  } catch {
    // Cover art is decorative; never throw.
  }
  return out;
}
