const isInlineImage = (value) =>
  typeof value === "string" && value.startsWith("data:image/");

export const getPlaceImageFolder = (placeId) => `didaugio/places/${placeId}`;

export const resolvePlaceImageUrls = (image) => ({
  source: image?.secureUrl || image?.imageData || image?.thumbnailUrl || null,
  thumbnail: image?.thumbnailUrl || image?.secureUrl || image?.imageData || null,
});

export const cleanupPlaceImageAssets = (publicIds, deleteCloudAsset) => {
  const uniquePublicIds = [...new Set(publicIds.filter(Boolean))];
  return Promise.allSettled(
    uniquePublicIds.map((publicId) => deleteCloudAsset(publicId)),
  );
};

export const uploadInlinePlaceImages = async (
  placeId,
  images,
  uploadCloudImage,
  deleteCloudAsset,
) => {
  const publicIds = [];
  const uploadedImages = [];

  try {
    for (const image of images) {
      if (image.id || !isInlineImage(image.imageData)) {
        uploadedImages.push(image);
        continue;
      }

      const uploaded = await uploadCloudImage(
        image.imageData,
        getPlaceImageFolder(placeId),
      );
      publicIds.push(uploaded.publicId);
      uploadedImages.push({
        ...image,
        imageData: null,
        publicId: uploaded.publicId,
        secureUrl: uploaded.secureUrl,
        thumbnailUrl: uploaded.thumbnailUrl,
      });
    }

    return { images: uploadedImages, publicIds };
  } catch (error) {
    await cleanupPlaceImageAssets(publicIds, deleteCloudAsset);
    throw error;
  }
};
