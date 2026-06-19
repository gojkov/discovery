"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { scoreCandidate } from "@/lib/scoring";
import { normalizeTags, type Rating } from "@/lib/types";

const required = (formData: FormData, name: string) => {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const optional = (formData: FormData, name: string) => {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
};

export async function addTrack(formData: FormData) {
  const title = required(formData, "title");
  const artist = required(formData, "artist");
  const rating = Number(formData.get("rating")) as Rating;
  const yearValue = optional(formData, "year");

  await db.track.upsert({
    where: { title_artist: { title, artist } },
    create: {
      title,
      artist,
      album: optional(formData, "album"),
      year: yearValue ? Number(yearValue) : null,
      notes: optional(formData, "notes") ?? "",
      source: optional(formData, "source") ?? "manual",
      tags: JSON.stringify(normalizeTags(formData.get("tags"))),
      rating
    },
    update: {
      album: optional(formData, "album"),
      year: yearValue ? Number(yearValue) : null,
      notes: optional(formData, "notes") ?? "",
      source: optional(formData, "source") ?? "manual",
      tags: JSON.stringify(normalizeTags(formData.get("tags"))),
      rating
    }
  });

  revalidatePath("/");
  revalidatePath("/tracks");
  revalidatePath("/candidates");
}

export async function updateTrack(formData: FormData) {
  const id = required(formData, "id");
  const rating = Number(formData.get("rating")) as Rating;
  const yearValue = optional(formData, "year");

  await db.track.update({
    where: { id },
    data: {
      title: required(formData, "title"),
      artist: required(formData, "artist"),
      album: optional(formData, "album"),
      year: yearValue ? Number(yearValue) : null,
      notes: optional(formData, "notes") ?? "",
      source: optional(formData, "source") ?? "manual",
      tags: JSON.stringify(normalizeTags(formData.get("tags"))),
      rating
    }
  });
  revalidatePath("/");
  revalidatePath("/tracks");
  revalidatePath("/candidates");
}

export async function rateTrack(formData: FormData) {
  const id = required(formData, "id");
  const rating = Number(required(formData, "rating")) as Rating;
  await db.track.update({ where: { id }, data: { rating } });
  revalidatePath("/");
  revalidatePath("/tracks");
  revalidatePath("/candidates");
}

export async function addCandidate(formData: FormData) {
  const title = required(formData, "title");
  const artist = required(formData, "artist");
  const whySuggested = optional(formData, "whySuggested") ?? "";
  const tags = normalizeTags(formData.get("tags"));
  const tracks = await db.track.findMany();
  const result = scoreCandidate(
    { title, artist, whySuggested, tags },
    tracks.map((track) => ({
      title: track.title,
      artist: track.artist,
      rating: track.rating,
      notes: track.notes,
      tags: JSON.parse(track.tags)
    }))
  );

  await db.candidate.upsert({
    where: { title_artist: { title, artist } },
    create: {
      title,
      artist,
      sourceLink: optional(formData, "sourceLink"),
      whySuggested,
      tags: JSON.stringify(tags),
      predictedScore: result.score,
      confidence: result.confidence,
      explanation: JSON.stringify(result.explanations),
      risks: JSON.stringify(result.risks),
      suggestedAction: result.suggestedAction
    },
    update: {
      sourceLink: optional(formData, "sourceLink"),
      whySuggested,
      tags: JSON.stringify(tags),
      predictedScore: result.score,
      confidence: result.confidence,
      explanation: JSON.stringify(result.explanations),
      risks: JSON.stringify(result.risks),
      suggestedAction: result.suggestedAction
    }
  });

  revalidatePath("/");
  revalidatePath("/candidates");
  redirect("/candidates");
}

export async function reviewCandidate(formData: FormData) {
  const id = required(formData, "id");
  const status = required(formData, "status");
  const ratingValue = optional(formData, "finalRating");
  const finalRating = ratingValue ? Number(ratingValue) : null;
  const notesAfterListening =
    optional(formData, "notesAfterListening") ?? "";
  const candidate = await db.candidate.update({
    where: { id },
    data: { status, finalRating, notesAfterListening }
  });

  if (status === "promoted" && finalRating) {
    await db.track.upsert({
      where: {
        title_artist: { title: candidate.title, artist: candidate.artist }
      },
      create: {
        title: candidate.title,
        artist: candidate.artist,
        notes: notesAfterListening,
        source: "candidate",
        tags: candidate.tags,
        rating: finalRating
      },
      update: {
        notes: notesAfterListening,
        tags: candidate.tags,
        rating: finalRating
      }
    });
  }

  revalidatePath("/");
  revalidatePath("/tracks");
  revalidatePath("/candidates");
}

export async function rescoreAllCandidates() {
  const [tracks, candidates] = await Promise.all([
    db.track.findMany(),
    db.candidate.findMany()
  ]);
  const knowledge = tracks.map((track) => ({
    title: track.title,
    artist: track.artist,
    rating: track.rating,
    notes: track.notes,
    tags: JSON.parse(track.tags) as string[]
  }));

  await Promise.all(
    candidates.map((candidate) => {
      const result = scoreCandidate(
        {
          title: candidate.title,
          artist: candidate.artist,
          whySuggested: candidate.whySuggested,
          notes: candidate.notesAfterListening,
          tags: JSON.parse(candidate.tags)
        },
        knowledge
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
