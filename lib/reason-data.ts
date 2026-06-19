import type { PrismaClient } from "@prisma/client";
import { defaultTasteReasons } from "@/lib/reasons";
import { negativeTasteRules, positiveTasteRules } from "@/taste-rules";
import { normalize, parseTags } from "@/lib/scoring/text";

export async function seedTasteReasons(prisma: PrismaClient) {
  for (const reason of defaultTasteReasons) {
    await prisma.tasteReason.upsert({
      where: { slug: reason.slug },
      create: reason,
      update: {
        label: reason.label,
        polarity: reason.polarity,
        category: reason.category,
        weight: reason.weight,
        sortOrder: reason.sortOrder
      }
    });
  }
}

export async function migrateLegacyTrackTags(prisma: PrismaClient) {
  const reasons = await prisma.tasteReason.findMany();
  const rules = [...positiveTasteRules, ...negativeTasteRules];
  const reasonByPhrase = new Map(reasons.map((reason) => [normalize(reason.label), reason]));
  const aliasToReason = new Map<string, (typeof reasons)[number]>();

  for (const rule of rules) {
    const reason = reasonByPhrase.get(normalize(rule.phrase));
    if (!reason) continue;
    for (const phrase of [rule.phrase, ...(rule.aliases ?? [])]) {
      aliasToReason.set(normalize(phrase), reason);
    }
  }

  const tracks = await prisma.track.findMany({
    select: { id: true, tags: true }
  });
  let linked = 0;
  for (const track of tracks) {
    const reasonIds = new Set<string>();
    for (const tag of parseTags(track.tags)) {
      const reason = aliasToReason.get(normalize(tag));
      if (reason) reasonIds.add(reason.id);
    }
    for (const reasonId of reasonIds) {
      await prisma.trackReason.upsert({
        where: { trackId_reasonId: { trackId: track.id, reasonId } },
        create: { trackId: track.id, reasonId },
        update: {}
      });
      linked += 1;
    }
  }
  return linked;
}
