import { getPlaceImageFolder } from "./placeImageUpload.service.js";

export const getPlaceImageMigrationTargetPublicId = ({ id, placeId }) =>
  `${getPlaceImageFolder(placeId)}/image-${id}`;

export const getPlaceImageMigrationAction = (image) => {
  if (typeof image?.imageData === "string" && image.imageData.startsWith("data:image/")) {
    return "upload_inline";
  }

  if (
    image?.publicId
    && image.publicId !== getPlaceImageMigrationTargetPublicId(image)
  ) {
    return "move_cloudinary";
  }

  return null;
};

export const buildPlaceImageMigrationUpdate = ({
  publicId,
  secureUrl,
  thumbnailUrl,
  clearInlineData = false,
}) => ({
  ...(clearInlineData ? { imageData: null } : {}),
  publicId,
  secureUrl,
  thumbnailUrl,
});
