import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildTasteProfile } from "@/lib/profile";
import { parseStringList } from "@/lib/types";
import { reasonSignals } from "@/lib/reasons";

export const dynamic = "force-dynamic";

const csvCell = (value: unknown) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string }> }
) {
  const { kind } = await params;

  if (kind === "tracks") {
    const tracks = await db.track.findMany({
      include: { reasons: { include: { reason: true } } },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(
      tracks.map((track) => ({
        ...track,
        tags: undefined,
        reasons: reasonSignals(track.reasons)
      })),
      {
        headers: {
          "Content-Disposition": 'attachment; filename="soundslikeme-tracks.json"'
        }
      }
    );
  }

  if (kind === "candidates") {
    const candidates = await db.candidate.findMany({
      include: { reasons: { include: { reason: true } } },
      orderBy: { predictedScore: "desc" }
    });
    return NextResponse.json(
      candidates.map((candidate) => ({
        ...candidate,
        tags: undefined,
        reasons: candidate.reasons.map(({ phase, reason }) => ({
          phase,
          ...reason
        })),
        explanation: parseStringList(candidate.explanation),
        risks: parseStringList(candidate.risks)
      })),
      {
        headers: {
          "Content-Disposition": 'attachment; filename="soundslikeme-candidates.json"'
        }
      }
    );
  }

  if (kind === "rankings") {
    const candidates = await db.candidate.findMany({
      orderBy: { predictedScore: "desc" }
    });
    const headers = [
      "rank",
      "title",
      "artist",
      "predicted_score",
      "confidence",
      "suggested_action",
      "status",
      "final_rating",
      "why_suggested",
      "notes_after_listening"
    ];
    const rows = candidates.map((candidate, index) =>
      [
        index + 1,
        candidate.title,
        candidate.artist,
        candidate.predictedScore,
        candidate.confidence,
        candidate.suggestedAction,
        candidate.status,
        candidate.finalRating,
        candidate.whySuggested,
        candidate.notesAfterListening
      ]
        .map(csvCell)
        .join(",")
    );
    // RFC 4180: CRLF row separators, every field quoted (header included).
    const body = [headers.map(csvCell).join(","), ...rows].join("\r\n");
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="candidate-rankings.csv"'
      }
    });
  }

  if (kind === "taste-profile") {
    const tracks = await db.track.findMany({
      include: { reasons: { include: { reason: true } } }
    });
    return NextResponse.json(buildTasteProfile(tracks.map((track) => ({
      artist: track.artist,
      rating: track.rating,
      reasons: reasonSignals(track.reasons)
    }))), {
      headers: {
        "Content-Disposition": 'attachment; filename="taste-profile.json"'
      }
    });
  }

  return NextResponse.json({ error: "Unknown export type" }, { status: 404 });
}
