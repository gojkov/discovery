"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { discoverCandidates } from "@/lib/discover";
import { buildModel, scoreWithModel } from "@/lib/scoring";
import { normalizeTags, parseStringList } from "@/lib/types";
import {
  candidateSchema,
  parseForm,
  rateSchema,
  reviewSchema,
  trackSchema,
  updateTrackSchema
} from "@/lib/validation";
import type { TrackKnowledge } from "@/lib/types";

const revalidateAll = () => {
  revalidatePath("/");
  revalidatePath("/tracks");
  revalidatePath("/candidates");
};

const toKnowledge = (tracks: {
  title: string;
  artist: string;
  rating: number;
  notes: string;
  tags: string;
}[]): TrackKnowledge[] =>
  tracks.map((track) => ({
    title: track.title,
    artist: track.artist,
    rating: track.rating,
    notes: track.notes,
    tags: parseStringList(track.tags)
  }));

export async function addTrack(formData: FormData) {
  const data = parseForm(trackSchema, formData);
  const fields = {
    album: data.album ?? null,
    year: data.year ?? null,
    notes: data.notes,
    source: data.source || "manual",
    tags: JSON.stringify(normalizeTags(formData.get("tags"))),
    rating: data.rating
  };

  await db.track.upsert({
    where: { title_artist: { title: data.title, artist: data.artist } },
    create: { title: data.title, artist: data.artist, ...fields },
    update: fields
  });

  revalidateAll();
}

export async function updateTrack(formData: FormData) {
  const data = parseForm(updateTrackSchema, formData);
  await db.track.update({
    where: { id: data.id },
    data: {
      title: data.title,
      artist: data.artist,
      album: data.album ?? null,
      year: data.year ?? null,
      notes: data.notes,
      source: data.source || "manual",
      tags: JSON.stringify(normalizeTags(formData.get("tags"))),
      rating: data.rating
    }
  });
  revalidateAll();
}

export async function rateTrack(formData: FormData) {
  const data = parseForm(rateSchema, formData);
  await db.track.update({
    where: { id: data.id },
    data: { rating: data.rating }
  });
  revalidateAll();
}

export async function addCandidate(formData: FormData) {
  const data = parseForm(candidateSchema, formData);
  const tags = normalizeTags(formData.get("tags"));
  const tracks = await db.track.findMany();
  const result = scoreWithModel(
    {
      title: data.title,
      artist: data.artist,
      whySuggested: data.whySuggested,
      tags
    },
    buildModel(toKnowledge(tracks))
  );

  const fields = {
    sourceLink: data.sourceLink ?? null,
    whySuggested: data.whySuggested,
    tags: JSON.stringify(tags),
    predictedScore: result.score,
    confidence: result.confidence,
    explanation: JSON.stringify(result.explanations),
    risks: JSON.stringify(result.risks),
    suggestedAction: result.suggestedAction
  };

  await db.candidate.upsert({
    where: { title_artist: { title: data.title, artist: data.artist } },
    create: { title: data.title, artist: data.artist, ...fields },
    update: fields
  });

  revalidatePath("/");
  revalidatePath("/candidates");
  redirect("/candidates");
}

export async function reviewCandidate(formData: FormData) {
  const data = parseForm(reviewSchema, formData);
  const candidate = await db.candidate.update({
    where: { id: data.id },
    data: {
      status: data.status,
      finalRating: data.finalRating,
      notesAfterListening: data.notesAfterListening
    }
  });

  if (data.status === "promoted" && data.finalRating) {
    await db.track.upsert({
      where: {
        title_artist: { title: candidate.title, artist: candidate.artist }
      },
      create: {
        title: candidate.title,
        artist: candidate.artist,
        notes: data.notesAfterListening,
        source: "candidate",
        tags: candidate.tags,
        rating: data.finalRating
      },
      update: {
        notes: data.notesAfterListening,
        tags: candidate.tags,
        rating: data.finalRating
      }
    });
  }

  revalidateAll();
}

export async function rescoreAllCandidates() {
  const [tracks, candidates] = await Promise.all([
    db.track.findMany(),
    db.candidate.findMany()
  ]);
  // Build the learned model once, then score every candidate against it.
  const model = buildModel(toKnowledge(tracks));

  await Promise.all(
    candidates.map((candidate) => {
      const result = scoreWithModel(
        {
          title: candidate.title,
          artist: candidate.artist,
          whySuggested: candidate.whySuggested,
          notes: candidate.notesAfterListening,
          tags: parseStringList(candidate.tags)
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
  revalidatePath("/");
  revalidatePath("/candidates");
}

export async function runDiscovery() {
  await discoverCandidates();
  revalidatePath("/");
  revalidatePath("/candidates");
  redirect("/candidates");
}
