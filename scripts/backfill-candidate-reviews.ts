import { PrismaClient } from "@prisma/client";
import { reasonSignals } from "@/lib/reasons";
import { buildModel, scoreWithModel } from "@/lib/scoring";
import { loadKnowledge } from "@/lib/scoring/knowledge";

const prisma = new PrismaClient();

async function main() {
  const candidates = await prisma.candidate.findMany({
    where: {
      status: { in: ["promoted", "rejected"] },
      finalRating: { not: null }
    },
    include: {
      reasons: {
        where: { phase: "outcome" }
      },
      ratingEvents: true
    }
  });

  let repaired = 0;
  for (const candidate of candidates) {
    if (candidate.ratingEvents.length) continue;
    const rating = candidate.finalRating as number;
    const reasonIds = candidate.reasons.map(({ reasonId }) => reasonId);

    await prisma.$transaction(async (tx) => {
      const previous = await tx.track.findUnique({
        where: {
          title_artist: { title: candidate.title, artist: candidate.artist }
        }
      });
      const track = await tx.track.upsert({
        where: {
          title_artist: { title: candidate.title, artist: candidate.artist }
        },
        create: {
          title: candidate.title,
          artist: candidate.artist,
          notes: candidate.notesAfterListening,
          source: "candidate",
          tags: "[]",
          rating
        },
        update: {
          notes: candidate.notesAfterListening,
          rating
        }
      });
      await tx.trackReason.deleteMany({ where: { trackId: track.id } });
      if (reasonIds.length) {
        await tx.trackReason.createMany({
          data: reasonIds.map((reasonId) => ({ trackId: track.id, reasonId }))
        });
      }
      await tx.ratingEvent.create({
        data: {
          trackId: track.id,
          candidateId: candidate.id,
          rating,
          previousRating: previous?.rating,
          context: "candidate-review-backfill",
          note: candidate.notesAfterListening,
          reasons: reasonIds.length
            ? {
                create: reasonIds.map((reasonId) => ({
                  reason: { connect: { id: reasonId } }
                }))
              }
            : undefined
        }
      });
    });
    repaired += 1;
  }

  const [knowledge, activeCandidates] = await Promise.all([
    loadKnowledge(),
    prisma.candidate.findMany({
      where: { status: { in: ["unreviewed", "sampled"] } },
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
  for (const candidate of activeCandidates) {
    const result = scoreWithModel(
      {
        title: candidate.title,
        artist: candidate.artist,
        reasons: reasonSignals(candidate.reasons)
      },
      model
    );
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        predictedScore: result.score,
        confidence: result.confidence,
        explanation: JSON.stringify(result.explanations),
        risks: JSON.stringify(result.risks),
        suggestedAction: result.suggestedAction
      }
    });
  }

  console.log(
    JSON.stringify(
      {
        completedCandidates: candidates.length,
        repaired,
        rescoredActiveCandidates: activeCandidates.length
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
