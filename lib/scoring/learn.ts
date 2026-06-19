import type { TrackKnowledge } from "@/lib/types";
import { artistParts } from "./text";

export type ArtistStat = {
  tens: number;
  eights: number;
  fives: number;
  ones: number;
};

export type LearnedModel = {
  /** Per normalized artist-part listening record. */
  artists: Map<string, ArtistStat>;
  /**
   * Empirical association per reason slug: how much more often the selected
   * reason shows up in proven 10s than in proven 1s. Positive => the reason has
   * predicted craving for THIS listener; negative => it predicted regret.
   */
  reasonAssoc: Map<string, number>;
  corpusSize: number;
};

const emptyStat = (): ArtistStat => ({ tens: 0, eights: 0, fives: 0, ones: 0 });

/** Build the learned model once from the full track history. */
export function buildModel(tracks: TrackKnowledge[]): LearnedModel {
  const artists = new Map<string, ArtistStat>();
  for (const track of tracks) {
    for (const part of artistParts(track.artist)) {
      const stat = artists.get(part) ?? emptyStat();
      if (track.rating === 10) stat.tens += 1;
      else if (track.rating === 8) stat.eights += 1;
      else if (track.rating === 1) stat.ones += 1;
      else stat.fives += 1;
      artists.set(part, stat);
    }
  }

  const counts = new Map<string, { in10: number; in1: number }>();
  for (const track of tracks) {
    for (const reason of track.reasons ?? []) {
      const count = counts.get(reason.slug) ?? { in10: 0, in1: 0 };
      if (track.rating === 10) count.in10 += 1;
      else if (track.rating === 1) count.in1 += 1;
      counts.set(reason.slug, count);
    }
  }
  const reasonAssoc = new Map(
    [...counts].map(([slug, count]) => [
      slug,
      Math.max(-4, Math.min(6, count.in10 - count.in1))
    ])
  );

  return { artists, reasonAssoc, corpusSize: tracks.length };
}

/** Aggregate listening record across all of a candidate's artist parts. */
export function artistRecord(model: LearnedModel, artist: string): ArtistStat {
  const total = emptyStat();
  for (const part of artistParts(artist)) {
    const stat = model.artists.get(part);
    if (!stat) continue;
    total.tens += stat.tens;
    total.eights += stat.eights;
    total.fives += stat.fives;
    total.ones += stat.ones;
  }
  return total;
}
