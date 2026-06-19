import { db } from "@/lib/db";
import type { TrackKnowledge } from "@/lib/types";
import { normalize, parseTags } from "./text";

const key = (title: string, artist: string) =>
  `${normalize(title)}|${normalize(artist)}`;

/**
 * The taste corpus the scorer learns from: behavioral labels mined from the
 * Spotify export (StreamStat rows with a derived rating) merged with the
 * curated manual library. Manual verdicts always win on conflict.
 */
export async function loadKnowledge(): Promise<TrackKnowledge[]> {
  const [tracks, stats] = await Promise.all([
    db.track.findMany(),
    db.streamStat.findMany({
      where: { derivedRating: { not: null } },
      select: { title: true, artist: true, derivedRating: true }
    })
  ]);

  const byKey = new Map<string, TrackKnowledge>();
  // Behavioral first (lower priority).
  for (const s of stats) {
    byKey.set(key(s.title, s.artist), {
      title: s.title,
      artist: s.artist,
      rating: s.derivedRating as number,
      tags: []
    });
  }
  // Manual ratings override behavioral for the same track.
  for (const t of tracks) {
    byKey.set(key(t.title, t.artist), {
      title: t.title,
      artist: t.artist,
      rating: t.rating,
      notes: t.notes,
      tags: parseTags(t.tags)
    });
  }
  return [...byKey.values()];
}
