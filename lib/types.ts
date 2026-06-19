export const RATINGS = [10, 8, 5, 1] as const;
export type Rating = (typeof RATINGS)[number];

export const CANDIDATE_STATUSES = [
  "unreviewed",
  "sampled",
  "rejected",
  "promoted"
] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

export type TrackKnowledge = {
  title: string;
  artist: string;
  rating: number;
  notes?: string;
  tags?: string[];
};

export type CandidateForScoring = {
  title: string;
  artist: string;
  whySuggested?: string;
  notes?: string;
  tags?: string[];
};

export type ScoreResult = {
  score: number;
  confidence: "low" | "medium" | "high";
  explanations: string[];
  risks: string[];
  suggestedAction:
    | "must sample"
    | "worth sampling"
    | "likely 8/10"
    | "likely false positive"
    | "reject";
};

export { parseTags as parseStringList } from "@/lib/scoring/text";

export function normalizeTags(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}
