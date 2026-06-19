export type SpotifyCsvRow = {
  "Track URI"?: string;
  "Track Name"?: string;
  "Artist Name(s)"?: string;
  Genres?: string;
  Danceability?: string;
  Energy?: string;
  Valence?: string;
  Tempo?: string;
};

export type ImportedSpotifyTrack = {
  uri?: string;
  title: string;
  artist: string;
  genres: string[];
  audioFeatures: {
    danceability?: number;
    energy?: number;
    valence?: number;
    tempo?: number;
  };
};

/**
 * Future adapter boundary.
 *
 * Expected mapping:
 * Track URI -> uri
 * Track Name -> title
 * Artist Name(s) -> artist
 * Genres -> genres[]
 * Danceability, Energy, Valence, Tempo -> audioFeatures
 *
 * A production parser should handle quoted commas, BOMs, alternate export
 * headers, duplicates, and partial rows. The MVP deliberately leaves upload
 * disabled until a real Spotify export can be used as a fixture.
 */
export function parseSpotifyCsv(_csv: string): ImportedSpotifyTrack[] {
  throw new Error("Spotify CSV import is waiting for a real export fixture.");
}
