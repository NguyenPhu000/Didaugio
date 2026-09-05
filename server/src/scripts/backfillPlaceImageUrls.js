import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import prisma from "../config/prismaClient.js";
import {
  buildPlaceImageThumbnailUrl,
  deletePlaceImage,
  uploadPlaceImage,
} from "../services/media/media.service.js";
import {
  buildPlaceImageMigrationUpdate,
  getPlaceImageMigrationAction,
  getPlaceImageMigrationTargetPublicId,
} from "../services/place/placeImageMigration.service.js";
import { getPlaceImageFolder } from "../services/place/placeImageUpload.service.js";

const apply = process.argv.includes("--apply");
const continueOnError = process.argv.includes("--continue-on-error");

const ensureCloudinaryConfiguration = () => {
  const missing = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ].filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing Cloudinary configuration: ${missing.join(", ")}`);
  }
};

const updateImageRecord = async (image, data) => {
  await prisma.$transaction(async (tx) => {
    await tx.placeImage.update({ where: { id: image.id }, data });
    if (image.isCover) {
      await tx.place.update({
        where: { id: image.placeId },
        data: { thumbnail: data.thumbnailUrl },
      });
    }
  });
};

const uploadInlineImage = async (image) => {
  const targetPublicId = getPlaceImageMigrationTargetPublicId(image);
  const uploaded = await uploadPlaceImage(
    image.imageData,
    getPlaceImageFolder(image.placeId),
    { publicId: `image-${image.id}` },
  );

  if (uploaded.publicId !== targetPublicId) {
    await deletePlaceImage(uploaded.publicId).catch(() => {});
    throw new Error(
      `Unexpected Cloudinary public ID for PlaceImage ${image.id}: ${uploaded.publicId}`,
    );
  }

  try {
    await updateImageRecord(
      image,
      buildPlaceImageMigrationUpdate({ ...uploaded, clearInlineData: true }),
    );
  } catch (error) {
    await deletePlaceImage(uploaded.publicId).catch(() => {});
    throw error;
  }
};

const moveCloudinaryImage = async (image) => {
  const targetPublicId = getPlaceImageMigrationTargetPublicId(image);
  const renamed = await cloudinary.uploader.rename(image.publicId, targetPublicId, {
    resource_type: "image",
    overwrite: false,
    invalidate: true,
  });

  try {
    await updateImageRecord(
      image,
      buildPlaceImageMigrationUpdate({
        publicId: renamed.public_id,
        secureUrl: renamed.secure_url,
        thumbnailUrl: buildPlaceImageThumbnailUrl(renamed.public_id),
      }),
    );
  } catch (error) {
    await cloudinary.uploader.rename(renamed.public_id, image.publicId, {
      resource_type: "image",
      overwrite: false,
      invalidate: true,
    }).catch(() => {});
    throw error;
  }
};

async function main() {
  const images = await prisma.placeImage.findMany({
    select: {
      id: true,
      placeId: true,
      imageData: true,
      publicId: true,
      secureUrl: true,
      thumbnailUrl: true,
      isCover: true,
    },
    orderBy: { id: "asc" },
  });

  const migrationItems = images
    .map((image) => ({ image, action: getPlaceImageMigrationAction(image) }))
    .filter(({ action }) => action);
  const counts = migrationItems.reduce(
    (summary, { action }) => ({
      ...summary,
      [action]: (summary[action] || 0) + 1,
    }),
    {},
  );

  console.log(`[place-image-backfill] ${migrationItems.length} assets require migration.`, counts);
  if (!apply || migrationItems.length === 0) return;

  ensureCloudinaryConfiguration();
  const failures = [];
  for (const { image, action } of migrationItems) {
    try {
      if (action === "upload_inline") {
        await uploadInlineImage(image);
      } else {
        await moveCloudinaryImage(image);
      }
      console.log(`[place-image-backfill] migrated image ${image.id} (${action}).`);
    } catch (error) {
      if (!continueOnError) throw error;
      failures.push({ imageId: image.id, action, error: error.message });
      console.error(`[place-image-backfill] skipped image ${image.id} (${action}): ${error.message}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Migration completed with ${failures.length} failed assets: ${JSON.stringify(failures)}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("[place-image-backfill] failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
