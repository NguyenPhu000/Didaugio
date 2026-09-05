import { DOMAIN_JOB_TYPES } from "../../config/constants.js";

export const enqueueCloudinaryAssetCleanup = async (
  tx,
  { aggregate, aggregateId, publicIds },
) => {
  const uniquePublicIds = [...new Set((publicIds || []).filter(Boolean))];
  for (const publicId of uniquePublicIds) {
    await tx.domainJob.create({
      data: {
        type: DOMAIN_JOB_TYPES.DELETE_CLOUDINARY_ASSET,
        aggregate,
        aggregateId,
        payload: { publicId },
      },
    });
  }
};

export const enqueueCloudinaryAssetRollback = async (
  db,
  { aggregate, aggregateId, publicIds },
) => {
  try {
    await enqueueCloudinaryAssetCleanup(db, {
      aggregate,
      aggregateId,
      publicIds,
    });
  } catch (error) {
    // A rollback happens after the primary DB transaction failed. Preserve the
    // original error while making the cleanup failure observable.
    console.error("Unable to queue Cloudinary rollback cleanup:", error);
  }
};
