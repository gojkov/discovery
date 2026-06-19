/**
 * Import a Spotify GDPR export into the local StreamStat table.
 *
 *   npm run import:spotify -- "<path to extracted export>"   (defaults to ./spotify-export)
 *
 * Reads the "Extended Streaming History" audio JSON + "Account Data"
 * YourLibrary.json, aggregates behavior per track, derives ratings + craving,
 * and replaces the StreamStat table (idempotent — safe to re-run). Stores only
 * track-level aggregates; no IPs or other PII from the raw export.
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  createAggregator,
  parseLibrary,
  type StreamRecord
} from "@/lib/integrations/spotify-export";
import { craving, deriveRating } from "@/lib/scoring/behavior";

const prisma = new PrismaClient();

/** Find a subdirectory (one level deep) whose name matches a pattern. */
function findDir(root: string, pattern: RegExp): string | null {
  if (!fs.existsSync(root)) return null;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory() && pattern.test(entry.name)) {
      return path.join(root, entry.name);
    }
  }
  return pattern.test(path.basename(root)) ? root : null;
}

function findFile(root: string, name: string): string | null {
  const direct = path.join(root, name);
  if (fs.existsSync(direct)) return direct;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const nested = path.join(root, entry.name, name);
      if (fs.existsSync(nested)) return nested;
    }
  }
  return null;
}

async function main() {
  const root = path.resolve(process.argv[2] ?? "spotify-export");
  console.log(`Reading export from: ${root}`);

  const historyDir = findDir(root, /Extended Streaming History/i);
  if (!historyDir) {
    throw new Error(
      `Could not find an "Extended Streaming History" folder under ${root}.`
    );
  }

  // Aggregate audio streams file-by-file (never hold all 128 MB at once).
  const agg = createAggregator();
  const files = fs
    .readdirSync(historyDir)
    .filter((f) => /^Streaming_History_Audio.*\.json$/i.test(f));
  console.log(`Aggregating ${files.length} streaming-history files…`);
  for (const f of files) {
    const records = JSON.parse(
      fs.readFileSync(path.join(historyDir, f), "utf8")
    ) as StreamRecord[];
    agg.add(records);
  }
  const stats = agg.finalize();
  console.log(`Aggregated ${stats.length} unique tracks.`);

  // Cross-reference the library for saved/banned flags.
  const libPath = findFile(root, "YourLibrary.json");
  const library = libPath
    ? parseLibrary(JSON.parse(fs.readFileSync(libPath, "utf8")))
    : { savedUris: new Set<string>(), bannedUris: new Set<string>(), followedArtists: [] };
  console.log(
    `Library: ${library.savedUris.size} saved, ${library.bannedUris.size} banned.`
  );

  const rows = stats.map((s) => {
    const saved = library.savedUris.has(s.spotifyUri);
    const banned = library.bannedUris.has(s.spotifyUri);
    const input = {
      plays: s.plays,
      completions: s.completions,
      skips: s.skips,
      backbtns: s.backbtns,
      distinctDays: s.distinctDays,
      saved,
      banned
    };
    return {
      spotifyUri: s.spotifyUri,
      title: s.title,
      artist: s.artist,
      album: s.album,
      plays: s.plays,
      completions: s.completions,
      skips: s.skips,
      backbtns: s.backbtns,
      msPlayed: Math.min(s.msPlayed, 2_147_483_647),
      distinctDays: s.distinctDays,
      firstPlayed: new Date(s.firstPlayed),
      lastPlayed: new Date(s.lastPlayed),
      saved,
      banned,
      derivedRating: deriveRating(input),
      craving: craving(input)
    };
  });

  // Idempotent: StreamStat is fully derived from the export, so replace it.
  console.log("Writing StreamStat rows…");
  await prisma.streamStat.deleteMany({});
  const CHUNK = 1000;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await prisma.streamStat.createMany({ data: rows.slice(i, i + CHUNK) });
  }

  const tens = rows.filter((r) => r.derivedRating === 10).length;
  const ones = rows.filter((r) => r.derivedRating === 1).length;
  const eights = rows.filter((r) => r.derivedRating === 8).length;
  console.log(
    `Done. ${rows.length} tracks · ${tens} loves (10) · ${eights} good (8) · ${ones} rejects (1) · ${rows.filter((r) => r.saved).length} saved.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
