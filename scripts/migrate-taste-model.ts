import { PrismaClient } from "@prisma/client";
import { craving, deriveRating } from "@/lib/scoring/behavior";
import {
  migrateLegacyTrackTags,
  seedTasteReasons
} from "@/lib/reason-data";

const prisma = new PrismaClient();

async function main() {
  await seedTasteReasons(prisma);
  const linked = await migrateLegacyTrackTags(prisma);
  const tracksWithoutEvents = await prisma.track.findMany({
    where: { ratingEvents: { none: {} } },
    include: { reasons: true }
  });
  for (const track of tracksWithoutEvents) {
    await prisma.ratingEvent.create({
      data: {
        trackId: track.id,
        rating: track.rating,
        context: "migration",
        note: track.notes,
        reasons: track.reasons.length
          ? {
              create: track.reasons.map(({ reasonId }) => ({
                reason: { connect: { id: reasonId } }
              }))
            }
          : undefined
      }
    });
  }

  const stats = await prisma.streamStat.findMany();
  let changedRatings = 0;
  let changedCraving = 0;
  const before = { tens: 0, eights: 0, fives: 0, ones: 0, unlabeled: 0 };
  const after = { tens: 0, eights: 0, fives: 0, ones: 0, unlabeled: 0 };
  const bucket = (target: typeof before, rating: number | null) => {
    if (rating === 10) target.tens += 1;
    else if (rating === 8) target.eights += 1;
    else if (rating === 5) target.fives += 1;
    else if (rating === 1) target.ones += 1;
    else target.unlabeled += 1;
  };

  for (const stat of stats) {
    bucket(before, stat.derivedRating);
    const input = {
      plays: stat.plays,
      completions: stat.completions,
      skips: stat.skips,
      backbtns: stat.backbtns,
      distinctDays: stat.distinctDays,
      saved: stat.saved,
      banned: stat.banned
    };
    const derivedRating = deriveRating(input);
    const nextCraving = craving(input);
    bucket(after, derivedRating);
    if (derivedRating !== stat.derivedRating) changedRatings += 1;
    if (nextCraving !== stat.craving) changedCraving += 1;
    await prisma.streamStat.update({
      where: { id: stat.id },
      data: { derivedRating, craving: nextCraving }
    });
  }

  console.log(
    JSON.stringify(
      {
        seededReasons: (await prisma.tasteReason.count()),
        migratedTrackReasonLinks: linked,
        initialRatingEvents: tracksWithoutEvents.length,
        streamStats: stats.length,
        changedRatings,
        changedCraving,
        before,
        after
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
