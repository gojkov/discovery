import {
  negativeTasteRules,
  positiveTasteRules
} from "@/taste-rules";
import type { TrackKnowledge } from "@/lib/types";
import { artistParts, matchesRule, normalize, parseTags } from "./text";

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
   * Empirical association per rule phrase: how much more often the phrase
   * shows up in proven 10s than in proven 1s. Positive => the phrase has
   * predicted craving for THIS listener; negative => it predicted regret.
   */
  phraseAssoc: Map<string, number>;
  corpusSize: number;
};

const emptyStat = (): ArtistStat => ({ tens: 0, eights: 0, fives: 0, ones: 0 });

function trackText(track: TrackKnowledge): string {
  return normalize([track.notes ?? "", ...parseTags(track.tags)].join(" "));
}

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

  const texts = tracks.map((track) => ({ text: trackText(track), rating: track.rating }));
  const phraseAssoc = new Map<string, number>();
  for (const rule of [...positiveTasteRules, ...negativeTasteRules]) {
    let in10 = 0;
    let in1 = 0;
    for (const { text, rating } of texts) {
      if (!matchesRule(text, rule)) continue;
      if (rating === 10) in10 += 1;
      else if (rating === 1) in1 += 1;
    }
    // Bounded so a single noisy example can't dominate the static prior.
    phraseAssoc.set(rule.phrase, Math.max(-4, Math.min(6, in10 - in1)));
  }

  return { artists, phraseAssoc, corpusSize: tracks.length };
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
