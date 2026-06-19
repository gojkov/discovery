import { db } from "@/lib/db";
import { buildModel, scoreWithModel } from "@/lib/scoring";
import { normalize, parseTags } from "@/lib/scoring/text";
import {
  artistTopTracks,
  lastfmConfigured,
  similarTracks,
  type SimilarTrack
} from "@/lib/integrations/lastfm";
import { findTrackLink } from "@/lib/integrations/spotify";
import type { TrackKnowledge } from "@/lib/types";

const dedupeKey = (title: string, artist: string) =>
  `${normalize(title)}|||${normalize(artist)}`;

export type DiscoveryReport = {
  configured: boolean;
  seeds: number;
  found: number;
  inserted: number;
  top: { title: string; artist: string; score: number; action: string }[];
};

/**
 * Pull genuinely new candidates from Last.fm seeded on the listener's proven
 * 10s, dedupe against everything already known, score them with the learned
 * model, and insert the best as candidates (enriched with a Spotify link).
 */
export async function discoverCandidates(opts?: {
  seedLimit?: number;
  insertLimit?: number;
}): Promise<DiscoveryReport> {
  if (!lastfmConfigured()) {
    return { configured: false, seeds: 0, found: 0, inserted: 0, top: [] };
  }
  const seedLimit = opts?.seedLimit ?? 8;
  const insertLimit = opts?.insertLimit ?? 25;

  const [tracks, candidates] = await Promise.all([
    db.track.findMany(),
    db.candidate.findMany()
  ]);
  const known = new Set(
    [...tracks, ...candidates].map((t) => dedupeKey(t.title, t.artist))
  );

  const seeds = tracks.filter((t) => t.rating === 10).slice(0, seedLimit);
  const pool = new Map<string, SimilarTrack>();
  for (const seed of seeds) {
    try {
      let sims = await similarTracks(seed.artist, seed.title);
      if (!sims.length) sims = await artistTopTracks(seed.artist);
      for (const s of sims) {
        const key = dedupeKey(s.title, s.artist);
        if (known.has(key)) continue;
        const existing = pool.get(key);
        if (!existing || s.match > existing.match) pool.set(key, s);
      }
    } catch {
      // One bad seed shouldn't sink the whole run.
    }
  }

  const knowledge: TrackKnowledge[] = tracks.map((t) => ({
    title: t.title,
    artist: t.artist,
    rating: t.rating,
    notes: t.notes,
    tags: parseTags(t.tags)
  }));
  const model = buildModel(knowledge);

  const scored = [...pool.values()]
    .map((s) => {
      const whySuggested = `Last.fm: similar to ${s.seed} (match ${s.match.toFixed(2)})`;
      return { ...s, whySuggested, result: scoreWithModel({ title: s.title, artist: s.artist, whySuggested }, model) };
    })
    .sort((a, b) => b.result.score - a.result.score)
    .slice(0, insertLimit);

  let inserted = 0;
  for (const item of scored) {
    const link = await findTrackLink(item.title, item.artist);
    await db.candidate.upsert({
      where: { title_artist: { title: item.title, artist: item.artist } },
      create: {
        title: item.title,
        artist: item.artist,
        sourceLink: link?.url ?? null,
        whySuggested: item.whySuggested,
        tags: "[]",
        predictedScore: item.result.score,
        confidence: item.result.confidence,
        explanation: JSON.stringify(item.result.explanations),
        risks: JSON.stringify(item.result.risks),
        suggestedAction: item.result.suggestedAction
      },
      // Never clobber a candidate the user has already reviewed.
      update: {}
    });
    inserted += 1;
  }

  return {
    configured: true,
    seeds: seeds.length,
    found: pool.size,
    inserted,
    top: scored.slice(0, 6).map((s) => ({
      title: s.title,
      artist: s.artist,
      score: s.result.score,
      action: s.result.suggestedAction
    }))
  };
}
