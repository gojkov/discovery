import { z } from "zod";
import { CANDIDATE_STATUSES } from "@/lib/types";

const trimmed = (v: unknown) => String(v ?? "").trim();

const requiredText = z.preprocess(trimmed, z.string().min(1, "is required"));
const optionalText = z.preprocess(trimmed, z.string());

const optionalString = z.preprocess(
  (v) => trimmed(v) || undefined,
  z.string().optional()
);

const optionalUrl = z.preprocess(
  (v) => trimmed(v) || undefined,
  z.string().url("must be a valid URL").optional()
);

const optionalYear = z.preprocess(
  (v) => (trimmed(v) ? Number(trimmed(v)) : undefined),
  z.number().int().min(1900).max(2100).optional()
);

const rating = z.preprocess(
  (v) => Number(trimmed(v)),
  z.union([z.literal(10), z.literal(8), z.literal(5), z.literal(1)])
);

const optionalRating = z.preprocess(
  (v) => (trimmed(v) ? Number(trimmed(v)) : null),
  z.union([
    z.literal(10),
    z.literal(8),
    z.literal(5),
    z.literal(1),
    z.null()
  ])
);

const status = z.enum(CANDIDATE_STATUSES);

export const trackSchema = z.object({
  title: requiredText,
  artist: requiredText,
  album: optionalString,
  year: optionalYear,
  source: optionalText,
  notes: optionalText,
  rating
});

export const updateTrackSchema = trackSchema.extend({ id: requiredText });

export const rateSchema = z.object({ id: requiredText, rating });

export const candidateSchema = z.object({
  title: requiredText,
  artist: requiredText,
  sourceLink: optionalUrl,
  whySuggested: optionalText
});

export const reviewSchema = z.object({
  id: requiredText,
  status,
  finalRating: optionalRating,
  notesAfterListening: optionalText
});

export const promoteStatSchema = z.object({
  spotifyUri: requiredText,
  rating: z.preprocess(
    (v) => Number(trimmed(v)),
    z.union([z.literal(10), z.literal(8), z.literal(5), z.literal(1)])
  )
});

export const dismissStatSchema = z.object({ spotifyUri: requiredText });

export const reasonSchema = z.object({
  label: requiredText,
  polarity: z.enum(["positive", "negative", "trajectory"]),
  category: requiredText,
  weight: z.preprocess(
    (v) => Number(trimmed(v)),
    z.number().int().min(-20).max(20)
  )
});

export const updateReasonSchema = reasonSchema.extend({
  id: requiredText,
  sortOrder: z.preprocess(
    (v) => Number(trimmed(v)),
    z.number().int().min(0).max(10000)
  )
});

export const reasonIdSchema = z.object({ id: requiredText });
export const mergeReasonSchema = z.object({
  sourceId: requiredText,
  targetId: requiredText
});

/** Parse FormData against a schema, throwing a readable error on failure. */
export function parseForm<S extends z.ZodType>(
  schema: S,
  formData: FormData
): z.infer<S> {
  const result = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join(".") || "form"} ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid input: ${detail}`);
  }
  return result.data;
}
