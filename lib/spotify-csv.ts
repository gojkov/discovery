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

/** Parse a single CSV line honoring quoted fields and escaped (`""`) quotes. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out;
}

/** Split CSV text into logical rows, respecting newlines inside quotes. */
function splitRows(csv: string): string[] {
  const rows: string[] = [];
  let row = "";
  let inQuotes = false;
  for (let i = 0; i < csv.length; i += 1) {
    const ch = csv[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      row += ch;
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && csv[i + 1] === "\n") i += 1;
      if (row.trim()) rows.push(row);
      row = "";
    } else {
      row += ch;
    }
  }
  if (row.trim()) rows.push(row);
  return rows;
}

const num = (value: string | undefined): number | undefined => {
  if (value == null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Parse a Spotify-style CSV export into normalized tracks.
 *
 * Handles a UTF-8 BOM, quoted commas/newlines, escaped quotes, header
 * aliases, partial rows (missing trailing columns), and de-duplicates on
 * URI (falling back to title+artist). Imported metadata is intended to
 * *enrich* listening verdicts, never override them.
 */
export function parseSpotifyCsv(csv: string): ImportedSpotifyTrack[] {
  const clean = csv.replace(/^﻿/, "");
  const rows = splitRows(clean);
  if (rows.length < 2) return [];

  const header = splitCsvLine(rows[0]).map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) =>
    header.findIndex((h) => names.includes(h));

  const idx = {
    uri: col("track uri", "uri", "spotify uri"),
    title: col("track name", "name", "title"),
    artist: col("artist name(s)", "artist name", "artist", "artists"),
    genres: col("genres", "genre"),
    danceability: col("danceability"),
    energy: col("energy"),
    valence: col("valence"),
    tempo: col("tempo")
  };

  const at = (cells: string[], i: number) =>
    i >= 0 && i < cells.length ? cells[i].trim() : "";

  const seen = new Set<string>();
  const tracks: ImportedSpotifyTrack[] = [];

  for (let r = 1; r < rows.length; r += 1) {
    const cells = splitCsvLine(rows[r]);
    const title = at(cells, idx.title);
    const artist = at(cells, idx.artist);
    if (!title || !artist) continue; // skip partial/empty rows

    const uri = at(cells, idx.uri) || undefined;
    const key = (uri ?? `${title}::${artist}`).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    tracks.push({
      uri,
      title,
      artist,
      genres: at(cells, idx.genres)
        .split(/[;,]/)
        .map((g) => g.trim())
        .filter(Boolean),
      audioFeatures: {
        danceability: num(at(cells, idx.danceability)),
        energy: num(at(cells, idx.energy)),
        valence: num(at(cells, idx.valence)),
        tempo: num(at(cells, idx.tempo))
      }
    });
  }

  return tracks;
}
