import "dotenv/config";
import prisma from "../config/prismaClient.js";
import { uploadPlaceImage } from "../services/media/media.service.js";

const apply = process.argv.includes("--apply");

async function main() {
  const images = await prisma.placeImage.findMany({
    where: {
      imageData: { startsWith: "data:" },
      secureUrl: null,
    },
    select: { id: true, placeId: true, imageData: true, isCover: true },
  });

  console.log(`[place-image-backfill] ${images.length} legacy images require Cloudinary URLs.`);
  if (!apply || images.length === 0) return;

  for (const image of images) {
    const uploaded = await uploadPlaceImage(image.imageData, "didaugio/places");
    await prisma.$transaction(async (tx) => {
      await tx.placeImage.update({
        where: { id: image.id },
        data: {
          secureUrl: uploaded.secureUrl,
          thumbnailUrl: uploaded.thumbnailUrl,
          publicId: uploaded.publicId,
        },
      });

      if (image.isCover) {
        await tx.place.update({
          where: { id: image.placeId },
          data: { thumbnail: uploaded.thumbnailUrl },
        });
      }
    });
    console.log(`[place-image-backfill] migrated image ${image.id}.`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("[place-image-backfill] failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
