import type { Rating } from "@/lib/types";

type SeedTrack = {
  title: string;
  artist: string;
  rating: Rating;
  notes?: string;
  tags?: string[];
};

const tens = [
  ["good2kno", "CUBE"],
  ["Rendezvous", "CUBE"],
  ["Lidocaine Lullaby", "CUBE"],
  ["With You", "Jessica Simpson"],
  ["Beautiful Soul", "Jesse McCartney"],
  ["SUPERSONICS", "3ee"],
  ["Timeless", "Ann Paris & Daniel Brown"],
  ["Selfish", "Anna Margo"],
  ["After Sunset", "jeebanoff"],
  ["Just Say", "Coco & Breezy"],
  ["Levy", "JMSN"],
  ["Wax Drip", "Landon Sears"],
  ["EASEYOURMIND V2", "Remi Soul"],
  ["Charlotte", "1000 Beasts"],
  ["Notice Me", "Kyleaux"],
  ["GIRLLIKEU", "3ee"],
  ["Down 4 Me", "Jesse Gold"],
  ["So Good to Me", "Ben Westbeech"],
  ["FOMO", "ELHAE"],
  ["2MANYTHINGS", "Gwen Bunn"],
  ["Mink Coat", "Jessica Jolia"],
  ["Shark!", "Landon Sears"],
  ["We Gone", "Paper Diamond"],
  ["Break the Tide", "Edwin"],
  ["Survival", "Hope Tala"],
  ["Trust", "Justin Bieber"],
  ["Next 2 U", "ego apartment"],
  ["THE GONLAN SONG", "SUMIN & Slom"],
  ["Money Can't Buy", "Charli Taft"],
  ["Last Love", "Sinead Harnett"],
  ["Company", "Paradise & JayDon"],
  ["Talk is Cheap", "JMSN"],
  ["Need Me", "TAKUMA & Lawrence Gabriel"],
  ["Lipstick", "Landon Sears"],
  ["honeydream (Jersey club mix)", "LUKEY"],
  ["fell off", "Stirmouth"],
  ["loves me (not)", "8rae"]
] as const;

const specialNotes: Record<string, { notes: string; tags: string[] }> = {
  "Ann Paris & Daniel Brown|Timeless": {
    notes: "Top 2 right now. Good2kno-level from first play.",
    tags: ["immediate attention", "replay/craving potential", "feels effortless"]
  },
  "Remi Soul|EASEYOURMIND V2": {
    notes: "Top 2 right now. Good2kno-level from first play.",
    tags: ["immediate attention", "replay/craving potential", "song feels like it fits me"]
  },
  "CUBE|good2kno": {
    notes: "Keeps my attention the entire time. Perfect from first play.",
    tags: ["keeps attention the whole song", "immediate attention", "clear song identity within first 30 seconds"]
  },
  "SUMIN & Slom|THE GONLAN SONG": {
    notes: "Beautiful melody, the kind of R&B melody I like. Chorus is the main thing.",
    tags: ["melody-first", "strong chorus", "chorus creates the main value"]
  },
  "Jesse Gold|Down 4 Me": {
    notes: "Catchy and sincere. Felt like it fit me.",
    tags: ["catchy but sincere", "song feels like it fits me"]
  },
  "JMSN|Levy": {
    notes: "10/10, but falsetto is the least favorite part.",
    tags: ["replay/craving potential", "too much falsetto dependence"]
  }
};

export const seedTracks: SeedTrack[] = [
  ...tens.map(([title, artist]) => {
    const detail = specialNotes[`${artist}|${title}`];
    return {
      title,
      artist,
      rating: 10 as const,
      notes: detail?.notes ?? "",
      tags: detail?.tags ?? []
    };
  }),
  {
    title: "More",
    artist: "Chxrry",
    rating: 8,
    notes: "True 8/10. I won't change it often when it's on, but I rarely need to hear it specifically.",
    tags: ["good but no craving", "songs I won't skip but never seek out"]
  },
  {
    title: "Blinding Lights",
    artist: "The Weeknd",
    rating: 1,
    notes: "Hate it. That style of melody seems new but I hate it. Strong hard-negative pattern.",
    tags: ["bright Blinding Lights-style synth-pop melody", "false positive"]
  },
  {
    title: "Loading Screen",
    artist: "Landon Sears",
    rating: 1,
    notes: "Algorithms thought I'd love it, but I don't.",
    tags: ["artist similarity without song-level magic", "false positive"]
  },
  {
    title: "Party",
    artist: "MALIA",
    rating: 1,
    notes: "Algorithmic false positive. Won't be played again.",
    tags: ["generic algorithmic alt-R&B vibe", "false positive"]
  },
  {
    title: "Footwork",
    artist: "Beau Diako",
    rating: 1,
    notes: "Algorithmic false positive. Won't be played again.",
    tags: ["interesting but not memorable", "false positive"]
  },
  {
    title: "Artist-level caution",
    artist: "JMSN",
    rating: 1,
    notes: "Most JMSN after Love Me / Levy / Inferno fails. Artist similarity only works for a specific subset.",
    tags: ["artist similarity without song-level magic", "false positive"]
  }
];
