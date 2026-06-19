import type { ReasonSignal } from "@/lib/reasons";

type ProfileTrack = {
  artist: string;
  rating: number;
  reasons?: ReasonSignal[];
};

export function buildTasteProfile(tracks: ProfileTrack[]) {
  const artistMap = new Map<
    string,
    { artist: string; tens: number; eights: number; skips: number }
  >();
  const reasonMap = new Map<
    string,
    { phrase: string; polarity: string; weight: number; count: number }
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

    for (const reason of track.reasons ?? []) {
      const supports =
        (reason.polarity === "positive" && track.rating === 10) ||
        (reason.polarity === "negative" && track.rating === 1);
      if (!supports) continue;
      const entry = reasonMap.get(reason.slug) ?? {
        phrase: reason.label,
        polarity: reason.polarity,
        weight: reason.weight,
        count: 0
      };
      entry.count += 1;
      reasonMap.set(reason.slug, entry);
    }
  }

  const artists = [...artistMap.values()];
  const topArtists = artists
    .filter((artist) => artist.tens > 0)
    .sort((a, b) => b.tens - a.tens || a.artist.localeCompare(b.artist));
  const mixedArtists = artists
    .filter((artist) => artist.tens > 0 && artist.skips > 0)
    .sort((a, b) => b.tens + b.skips - (a.tens + a.skips));
  const rankedReasons = [...reasonMap.values()].sort(
    (a, b) => b.count - a.count || Math.abs(b.weight) - Math.abs(a.weight)
  );

  const learnings = mixedArtists.map(
    (artist) =>
      `${artist.artist} remains mixed: ${artist.tens} loved, ${artist.skips} rejected.`
  );
  const strongestPositive = rankedReasons.find(
    (reason) => reason.polarity === "positive" && reason.count >= 2
  );
  if (strongestPositive) {
    learnings.push(
      `${strongestPositive.phrase} appears on ${strongestPositive.count} confirmed 10s.`
    );
  }
  if (!learnings.length) {
    learnings.push("More rated tracks with selected reasons are needed for a reliable learning.");
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
    strongestPositiveRules: rankedReasons.filter(
      (reason) => reason.polarity === "positive"
    ),
    strongestNegativeRules: rankedReasons.filter(
      (reason) => reason.polarity === "negative"
    ),
    learnings
  };
}
