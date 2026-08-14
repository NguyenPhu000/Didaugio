import "dotenv/config";
import prisma from "../config/prismaClient.js";

const apply = process.argv.includes("--apply");
const imageIds = process.argv
  .filter((argument) => argument.startsWith("--image-id="))
  .map((argument) => Number(argument.split("=", 2)[1]))
  .filter((id) => Number.isInteger(id) && id > 0);

if (imageIds.length === 0) {
  throw new Error("At least one --image-id=<PlaceImage ID> is required");
}

async function main() {
  const images = await prisma.placeImage.findMany({
    where: { id: { in: imageIds } },
    include: {
      place: {
        select: {
          images: {
            orderBy: { order: "asc" },
            select: { id: true, publicId: true, secureUrl: true, thumbnailUrl: true },
          },
        },
      },
    },
  });

  if (images.length !== imageIds.length) {
    throw new Error("One or more PlaceImage records no longer exist");
  }

  for (const image of images) {
    const replacement = image.place.images.find((candidate) => candidate.id !== image.id);
    if (image.isCover && !replacement) {
      throw new Error(`Cannot remove sole cover image ${image.id} without a replacement`);
    }
    console.log(`[broken-place-image-reference] ${apply ? "removing" : "would remove"} image=${image.id} place=${image.placeId} replacement=${replacement?.id || "none"}`);
    if (!apply) continue;

    await prisma.$transaction(async (tx) => {
      await tx.placeImage.delete({ where: { id: image.id } });
      if (image.isCover && replacement) {
        await tx.placeImage.update({ where: { id: replacement.id }, data: { isCover: true } });
        await tx.place.update({
          where: { id: image.placeId },
          data: { thumbnail: replacement.thumbnailUrl || replacement.secureUrl || null },
        });
      }
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("[broken-place-image-reference] failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
