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

export type SpotifyMatch = { url: string; uri: string };

/** Resolve a track to its Spotify URL, or null if not found/unconfigured. */
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
    const json = (await res.json()) as {
      tracks?: { items?: { uri: string; external_urls?: { spotify?: string } }[] };
    };
    const hit = json.tracks?.items?.[0];
    if (!hit?.external_urls?.spotify) return null;
    return { url: hit.external_urls.spotify, uri: hit.uri };
  } catch {
    // Link enrichment is optional; never fail discovery over it.
    return null;
  }
}
