export const replaceReviewMediaRecords = async (tx, reviewId, media) => {
  const existingMedia = await tx.reviewMedia.findMany({
    where: { reviewId },
    select: { publicId: true },
  });

  await tx.reviewMedia.deleteMany({ where: { reviewId } });
  if (media.length > 0) {
    await tx.reviewMedia.createMany({
      data: media.map((item) => ({
        reviewId,
        mediaData: item.mediaData,
        publicId: item.publicId || null,
        mediaType: item.mediaType,
        caption: item.caption,
        order: item.order,
      })),
    });
  }

  return existingMedia.map((item) => item.publicId).filter(Boolean);
};
