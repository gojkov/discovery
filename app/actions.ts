"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { discoverCandidates } from "@/lib/discover";
import { buildModel, scoreWithModel } from "@/lib/scoring";
import { loadKnowledge } from "@/lib/scoring/knowledge";
import { reasonSignals, selectedReasonIds } from "@/lib/reasons";
import {
  candidateSchema,
  mergeReasonSchema,
  dismissStatSchema,
  parseForm,
  promoteStatSchema,
  rateSchema,
  reasonIdSchema,
  reasonSchema,
  reviewSchema,
  trackSchema,
  updateReasonSchema,
  updateTrackSchema
} from "@/lib/validation";

const revalidateAll = () => {
  revalidatePath("/");
  revalidatePath("/tracks");
  revalidatePath("/candidates");
  revalidatePath("/reasons");
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function activeReasons(ids: string[]) {
  if (!ids.length) return [];
  return db.tasteReason.findMany({
    where: { id: { in: ids }, active: true, mergedIntoId: null }
  });
}

async function replaceTrackReasons(trackId: string, reasonIds: string[]) {
  await db.trackReason.deleteMany({ where: { trackId } });
  if (reasonIds.length) {
    await db.trackReason.createMany({
      data: reasonIds.map((reasonId) => ({ trackId, reasonId }))
    });
  }
}

async function createRatingEvent(input: {
  trackId?: string;
  candidateId?: string;
  rating: number;
  previousRating?: number | null;
  context: string;
  note?: string;
  reasonIds?: string[];
}) {
  await db.ratingEvent.create({
    data: {
      trackId: input.trackId,
      candidateId: input.candidateId,
      rating: input.rating,
      previousRating: input.previousRating,
      context: input.context,
      note: input.note ?? "",
      reasons: input.reasonIds?.length
        ? {
            create: input.reasonIds.map((reasonId) => ({
              reason: { connect: { id: reasonId } }
            }))
          }
        : undefined
    }
  });
}

async function rescoreCandidatesNow() {
  const [knowledge, candidates] = await Promise.all([
    loadKnowledge(),
    db.candidate.findMany({
      include: {
        reasons: {
          where: {
            phase: "suggestion",
            reason: { active: true, mergedIntoId: null }
          },
          include: { reason: true }
        }
      }
    })
  ]);
  const model = buildModel(knowledge);

  await Promise.all(
    candidates.map((candidate) => {
      const result = scoreWithModel(
        {
          title: candidate.title,
          artist: candidate.artist,
          reasons: reasonSignals(candidate.reasons)
        },
        model
      );
      return db.candidate.update({
        where: { id: candidate.id },
        data: {
          predictedScore: result.score,
          confidence: result.confidence,
          explanation: JSON.stringify(result.explanations),
          risks: JSON.stringify(result.risks),
          suggestedAction: result.suggestedAction
        }
      });
    })
  );
}

export async function addTrack(formData: FormData) {
  const data = parseForm(trackSchema, formData);
  const reasons = await activeReasons(selectedReasonIds(formData));
  const previous = await db.track.findUnique({
    where: { title_artist: { title: data.title, artist: data.artist } }
  });
  const fields = {
    album: data.album ?? null,
    year: data.year ?? null,
    notes: data.notes,
    source: data.source || "manual",
    tags: previous?.tags ?? "[]",
    rating: data.rating
  };

  const track = await db.track.upsert({
    where: { title_artist: { title: data.title, artist: data.artist } },
    create: { title: data.title, artist: data.artist, ...fields },
    update: fields
  });
  await replaceTrackReasons(track.id, reasons.map((reason) => reason.id));
  await createRatingEvent({
    trackId: track.id,
    rating: data.rating,
    previousRating: previous?.rating,
    context: previous ? "re-rate" : "manual",
    note: data.notes,
    reasonIds: reasons.map((reason) => reason.id)
  });

  revalidateAll();
}

export async function updateTrack(formData: FormData) {
  const data = parseForm(updateTrackSchema, formData);
  const reasons = await activeReasons(selectedReasonIds(formData));
  const previous = await db.track.findUniqueOrThrow({ where: { id: data.id } });
  const track = await db.track.update({
    where: { id: data.id },
    data: {
      title: data.title,
      artist: data.artist,
      album: data.album ?? null,
      year: data.year ?? null,
      notes: data.notes,
      source: data.source || "manual",
      rating: data.rating
    }
  });
  await replaceTrackReasons(track.id, reasons.map((reason) => reason.id));
  if (previous.rating !== data.rating) {
    await createRatingEvent({
      trackId: track.id,
      rating: data.rating,
      previousRating: previous.rating,
      context: "re-rate",
      note: data.notes,
      reasonIds: reasons.map((reason) => reason.id)
    });
  }
  revalidateAll();
}

export async function rateTrack(formData: FormData) {
  const data = parseForm(rateSchema, formData);
  const previous = await db.track.findUniqueOrThrow({ where: { id: data.id } });
  await db.track.update({
    where: { id: data.id },
    data: { rating: data.rating }
  });
  if (previous.rating !== data.rating) {
    await createRatingEvent({
      trackId: data.id,
      rating: data.rating,
      previousRating: previous.rating,
      context: "re-rate"
    });
  }
  revalidateAll();
}

export async function addCandidate(formData: FormData) {
  const data = parseForm(candidateSchema, formData);
  const reasons = await activeReasons(selectedReasonIds(formData));
  const result = scoreWithModel(
    {
      title: data.title,
      artist: data.artist,
      reasons
    },
    buildModel(await loadKnowledge())
  );

  const fields = {
    sourceLink: data.sourceLink ?? null,
    whySuggested: data.whySuggested,
    tags: "[]",
    predictedScore: result.score,
    confidence: result.confidence,
    explanation: JSON.stringify(result.explanations),
    risks: JSON.stringify(result.risks),
    suggestedAction: result.suggestedAction
  };

  const candidate = await db.candidate.upsert({
    where: { title_artist: { title: data.title, artist: data.artist } },
    create: { title: data.title, artist: data.artist, ...fields },
    update: fields
  });
  await db.candidateReason.deleteMany({
    where: { candidateId: candidate.id, phase: "suggestion" }
  });
  if (reasons.length) {
    await db.candidateReason.createMany({
      data: reasons.map((reason) => ({
        candidateId: candidate.id,
        reasonId: reason.id,
        phase: "suggestion"
      }))
    });
  }

  revalidatePath("/");
  revalidatePath("/candidates");
  redirect("/candidates");
}

export async function reviewCandidate(formData: FormData) {
  const data = parseForm(reviewSchema, formData);
  const reasons = await activeReasons(
    selectedReasonIds(formData, "outcomeReasonIds")
  );
  const candidate = await db.candidate.update({
    where: { id: data.id },
    data: {
      status: data.status,
      finalRating: data.finalRating,
      notesAfterListening: data.notesAfterListening
    }
  });
  await db.candidateReason.deleteMany({
    where: { candidateId: candidate.id, phase: "outcome" }
  });
  if (reasons.length) {
    await db.candidateReason.createMany({
      data: reasons.map((reason) => ({
        candidateId: candidate.id,
        reasonId: reason.id,
        phase: "outcome"
      }))
    });
  }

  if (data.status === "promoted" && data.finalRating) {
    const previous = await db.track.findUnique({
      where: {
        title_artist: { title: candidate.title, artist: candidate.artist }
      }
    });
    const track = await db.track.upsert({
      where: {
        title_artist: { title: candidate.title, artist: candidate.artist }
      },
      create: {
        title: candidate.title,
        artist: candidate.artist,
        notes: data.notesAfterListening,
        source: "candidate",
        tags: "[]",
        rating: data.finalRating
      },
      update: {
        notes: data.notesAfterListening,
        rating: data.finalRating
      }
    });
    await replaceTrackReasons(track.id, reasons.map((reason) => reason.id));
    await createRatingEvent({
      trackId: track.id,
      candidateId: candidate.id,
      rating: data.finalRating,
      previousRating: previous?.rating,
      context: "candidate-review",
      note: data.notesAfterListening,
      reasonIds: reasons.map((reason) => reason.id)
    });
  }

  revalidateAll();
}

export async function rescoreAllCandidates() {
  await rescoreCandidatesNow();
  revalidatePath("/");
  revalidatePath("/candidates");
}

export async function runDiscovery() {
  await discoverCandidates();
  revalidatePath("/");
  revalidatePath("/candidates");
  redirect("/candidates");
}

export async function promoteStreamStat(formData: FormData) {
  const data = parseForm(promoteStatSchema, formData);
  const stat = await db.streamStat.findUnique({
    where: { spotifyUri: data.spotifyUri }
  });
  if (!stat) return;

  // Promote into the authoritative manual library.
  const previous = await db.track.findUnique({
    where: { spotifyUri: stat.spotifyUri }
  });
  const track = await db.track.upsert({
    where: { title_artist: { title: stat.title, artist: stat.artist } },
    create: {
      title: stat.title,
      artist: stat.artist,
      album: stat.album,
      rating: data.rating,
      source: "spotify-behavior",
      tags: "[]",
      notes: "",
      spotifyUri: stat.spotifyUri
    },
    update: { rating: data.rating, spotifyUri: stat.spotifyUri }
  });
  await createRatingEvent({
    trackId: track.id,
    rating: data.rating,
    previousRating: previous?.rating,
    context: "spotify-review"
  });
  await db.streamStat.update({
    where: { spotifyUri: data.spotifyUri },
    data: { reviewed: true }
  });

  revalidatePath("/");
  revalidatePath("/tracks");
  revalidatePath("/review");
}

export async function dismissStreamStat(formData: FormData) {
  const data = parseForm(dismissStatSchema, formData);
  await db.streamStat.update({
    where: { spotifyUri: data.spotifyUri },
    data: { reviewed: true }
  });
  revalidatePath("/review");
}

export async function createTasteReason(formData: FormData) {
  const data = parseForm(reasonSchema, formData);
  const base = slugify(data.label);
  let slug = base;
  let suffix = 2;
  while (await db.tasteReason.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix++}`;
  }
  const max = await db.tasteReason.aggregate({ _max: { sortOrder: true } });
  await db.tasteReason.create({
    data: {
      ...data,
      weight:
        data.polarity === "trajectory"
          ? 0
          : data.polarity === "negative"
            ? -Math.abs(data.weight)
            : Math.abs(data.weight),
      slug,
      userDefined: true,
      sortOrder: (max._max.sortOrder ?? 0) + 1
    }
  });
  revalidatePath("/reasons");
}

export async function updateTasteReason(formData: FormData) {
  const data = parseForm(updateReasonSchema, formData);
  await db.tasteReason.update({
    where: { id: data.id },
    data: {
      label: data.label,
      polarity: data.polarity,
      category: data.category,
      weight:
        data.polarity === "trajectory"
          ? 0
          : data.polarity === "negative"
            ? -Math.abs(data.weight)
            : Math.abs(data.weight),
      sortOrder: data.sortOrder
    }
  });
  await rescoreCandidatesNow();
  revalidateAll();
}

export async function retireTasteReason(formData: FormData) {
  const { id } = parseForm(reasonIdSchema, formData);
  await db.tasteReason.update({ where: { id }, data: { active: false } });
  await rescoreCandidatesNow();
  revalidateAll();
}

export async function restoreTasteReason(formData: FormData) {
  const { id } = parseForm(reasonIdSchema, formData);
  await db.tasteReason.update({
    where: { id },
    data: { active: true, mergedIntoId: null }
  });
  await rescoreCandidatesNow();
  revalidateAll();
}

export async function mergeTasteReason(formData: FormData) {
  const { sourceId, targetId } = parseForm(mergeReasonSchema, formData);
  if (sourceId === targetId) throw new Error("A reason cannot merge into itself.");
  await db.tasteReason.findFirstOrThrow({
    where: { id: targetId, active: true, mergedIntoId: null }
  });

  const [trackLinks, candidateLinks] = await Promise.all([
    db.trackReason.findMany({ where: { reasonId: sourceId } }),
    db.candidateReason.findMany({ where: { reasonId: sourceId } })
  ]);

  for (const link of trackLinks) {
    await db.trackReason.upsert({
      where: {
        trackId_reasonId: { trackId: link.trackId, reasonId: targetId }
      },
      create: { trackId: link.trackId, reasonId: targetId },
      update: {}
    });
  }
  for (const link of candidateLinks) {
    await db.candidateReason.upsert({
      where: {
        candidateId_reasonId_phase: {
          candidateId: link.candidateId,
          reasonId: targetId,
          phase: link.phase
        }
      },
      create: {
        candidateId: link.candidateId,
        reasonId: targetId,
        phase: link.phase
      },
      update: {}
    });
  }
  await Promise.all([
    db.trackReason.deleteMany({ where: { reasonId: sourceId } }),
    db.candidateReason.deleteMany({ where: { reasonId: sourceId } })
  ]);
  // RatingEventReason rows intentionally keep the original reason id so
  // historical judgments remain exactly as recorded.
  await db.tasteReason.update({
    where: { id: sourceId },
    data: { active: false, mergedIntoId: targetId }
  });
  await rescoreCandidatesNow();
  revalidateAll();
}
