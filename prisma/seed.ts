import { PrismaClient } from "@prisma/client";
import { seedTracks } from "../lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  for (const track of seedTracks) {
    await prisma.track.upsert({
      where: {
        title_artist: { title: track.title, artist: track.artist }
      },
      create: {
        ...track,
        tags: JSON.stringify(track.tags ?? []),
        source: "manual"
      },
      update: {
        rating: track.rating,
        notes: track.notes ?? "",
        tags: JSON.stringify(track.tags ?? [])
      }
    });
  }
  console.log(`Seeded ${seedTracks.length} taste examples.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
