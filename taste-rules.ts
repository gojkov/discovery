export type TasteRule = {
  phrase: string;
  weight: number;
  aliases?: string[];
};

export const positiveTasteRules: TasteRule[] = [
  { phrase: "melody-first", weight: 9, aliases: ["great melody", "beautiful melody", "melodic"] },
  { phrase: "strong chorus", weight: 10, aliases: ["big chorus", "chorus is the main thing"] },
  { phrase: "immediate attention", weight: 9, aliases: ["first play", "instant", "hooked immediately"] },
  { phrase: "keeps attention the whole song", weight: 10, aliases: ["keeps my attention", "never loses me"] },
  { phrase: "replay/craving potential", weight: 11, aliases: ["replay", "craving", "need to hear"] },
  { phrase: "groove/pocket", weight: 6, aliases: ["groove", "pocket"] },
  { phrase: "catchy but sincere", weight: 9, aliases: ["catchy and sincere", "sincere"] },
  { phrase: "modern polished production", weight: 5, aliases: ["polished", "modern production"] },
  { phrase: "low listener fatigue", weight: 5, aliases: ["not tiring", "easy replay"] },
  { phrase: "clear song identity within first 30 seconds", weight: 8, aliases: ["clear identity", "distinct immediately"] },
  { phrase: "feels effortless", weight: 6, aliases: ["effortless"] },
  { phrase: "not just impressive, but lovable", weight: 8, aliases: ["lovable", "special"] },
  { phrase: "chorus creates the main value", weight: 9, aliases: ["chorus carries", "main value is chorus"] },
  { phrase: "song feels like it fits me", weight: 10, aliases: ["fits me", "made for me"] }
];

export const negativeTasteRules: TasteRule[] = [
  { phrase: "interesting but not memorable", weight: -8, aliases: ["not memorable", "forgettable"] },
  { phrase: "groove without melody", weight: -10, aliases: ["only groove", "groove but no melody"] },
  { phrase: "artist similarity without song-level magic", weight: -9, aliases: ["artist similarity", "because i like the artist"] },
  { phrase: "generic algorithmic alt-R&B vibe", weight: -11, aliases: ["generic alt-r&b", "algorithmic r&b"] },
  { phrase: "bright Blinding Lights-style synth-pop melody", weight: -14, aliases: ["blinding lights", "bright synth-pop", "synthwave"] },
  { phrase: "dramatic/arena-style chorus", weight: -10, aliases: ["arena chorus", "dramatic chorus"] },
  { phrase: "vocal theatrics as the main appeal", weight: -9, aliases: ["vocal theatrics", "showy vocals"] },
  { phrase: "too much falsetto dependence", weight: -8, aliases: ["falsetto", "falsetto-heavy"] },
  { phrase: "good but no craving", weight: -6, aliases: ["pleasant", "fine", "no craving"] },
  { phrase: "songs I won't skip but never seek out", weight: -5, aliases: ["won't skip", "never seek"] },
  { phrase: "false positives from artists I normally like", weight: -10, aliases: ["false positive", "normally like this artist"] }
];

export const knownArtistSignals: Record<
  string,
  { bonus: number; label: string; caution?: string }
> = {
  cube: { bonus: 17, label: "very high positive artist signal" },
  "landon sears": {
    bonus: 10,
    label: "high positive artist signal",
    caution: "Landon Sears has both replay monsters and a known false positive."
  },
  jmsn: {
    bonus: 3,
    label: "mixed artist signal",
    caution: "Only a specific subset of JMSN songs works."
  },
  "3ee": { bonus: 12, label: "strong positive artist signal" },
  "jesse gold": { bonus: 8, label: "positive artist signal" },
  sumin: { bonus: 8, label: "positive artist signal" },
  slom: { bonus: 8, label: "positive artist signal" },
  "ann paris": { bonus: 12, label: "strong signal from Timeless" },
  "daniel brown": { bonus: 12, label: "strong signal from Timeless" },
  "remi soul": { bonus: 12, label: "strong signal from EASEYOURMIND V2" }
};
