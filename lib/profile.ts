import {
  negativeTasteRules,
  positiveTasteRules,
  type TasteRule
} from "@/taste-rules";
import type { TrackKnowledge } from "@/lib/types";
import { matchesRule, normalize, parseTags } from "@/lib/scoring/text";

type ProfileTrack = Omit<TrackKnowledge, "tags"> & {
  tags?: string[] | string;
};

function ruleCount(tracks: ProfileTrack[], rule: TasteRule, ratings: number[]) {
  return tracks.filter((track) => {
    if (!ratings.includes(track.rating)) return false;
    const text = normalize([track.notes ?? "", ...parseTags(track.tags)].join(" "));
    return matchesRule(text, rule);
  }).length;
}

export function buildTasteProfile(tracks: ProfileTrack[]) {
  const artistMap = new Map<
    string,
    { artist: string; tens: number; eights: number; skips: number }
  >();

  for (const track of tracks) {
    const key = track.artist.toLowerCase();
    const current = artistMap.get(key) ?? {
      artist: track.artist,
      tens: 0,
      eights: 0,
      skips: 0
    };
    if (track.rating === 10) current.tens += 1;
    if (track.rating === 8) current.eights += 1;
    if (track.rating === 1) current.skips += 1;
    artistMap.set(key, current);
  }

  const artists = [...artistMap.values()];
  const topArtists = artists
    .filter((artist) => artist.tens > 0)
    .sort((a, b) => b.tens - a.tens || a.artist.localeCompare(b.artist));
  const mixedArtists = artists
    .filter((artist) => artist.tens > 0 && artist.skips > 0)
    .sort((a, b) => b.tens + b.skips - (a.tens + a.skips));

  const strongestPositiveRules = positiveTasteRules
    .map((rule) => ({
      phrase: rule.phrase,
      count: ruleCount(tracks, rule, [10]),
      weight: rule.weight
    }))
    .sort((a, b) => b.count - a.count || b.weight - a.weight);

  const strongestNegativeRules = negativeTasteRules
    .map((rule) => ({
      phrase: rule.phrase,
      count: ruleCount(tracks, rule, [1]),
      weight: rule.weight
    }))
    .sort((a, b) => b.count - a.count || a.weight - b.weight);

  const learnings: string[] = [];
  for (const artist of mixedArtists) {
    learnings.push(
      `${artist.artist} remains mixed: ${artist.tens} loved, ${artist.skips} rejected.`
    );
  }
  if (artists.some((artist) => artist.artist.toLowerCase() === "jmsn")) {
    learnings.push("Artist match alone is weak for JMSN.");
  }
  if (
    strongestPositiveRules.find((rule) => rule.phrase === "catchy but sincere")
      ?.count
  ) {
    learnings.push("Songs described as catchy + sincere are high signal.");
  }
  if (tracks.some((track) => track.rating === 8)) {
    learnings.push("Songs that are only pleasant are often 8/10, not 10/10.");
  }

  return {
    counts: {
      tens: tracks.filter((track) => track.rating === 10).length,
      eights: tracks.filter((track) => track.rating === 8).length,
      fives: tracks.filter((track) => track.rating === 5).length,
      skips: tracks.filter((track) => track.rating === 1).length
    },
    topArtists,
    mixedArtists,
    strongestPositiveRules,
    strongestNegativeRules,
    learnings
  };
}
