const isRemoteUrl = (value) => /^https:\/\//i.test(String(value || "").trim());

function toMobileImage(image) {
  if (!image || typeof image !== "object") return image;
  const { imageData, ...rest } = image;
  const fallbackUrl = [rest.secureUrl, rest.thumbnailUrl, imageData].find(isRemoteUrl) || null;
  const legacyImageData = !fallbackUrl && String(imageData || "").startsWith("data:")
    ? imageData
    : null;

  return {
    ...rest,
    secureUrl: isRemoteUrl(rest.secureUrl) ? rest.secureUrl : fallbackUrl,
    thumbnailUrl: isRemoteUrl(rest.thumbnailUrl) ? rest.thumbnailUrl : fallbackUrl,
    ...(legacyImageData ? { imageData: legacyImageData } : {}),
  };
}

export function toMobilePlaceMedia(place) {
  if (!place || typeof place !== "object") return place;
  const { thumbnail, images, ...rest } = place;
  const mobileImages = Array.isArray(images) ? images.map(toMobileImage) : [];
  const fallbackThumbnail = mobileImages.find((image) => image?.thumbnailUrl || image?.secureUrl);
  const legacyThumbnail = String(thumbnail || "").startsWith("data:") ? thumbnail : null;

  return {
    ...rest,
    thumbnail: isRemoteUrl(thumbnail)
      ? thumbnail
      : fallbackThumbnail?.thumbnailUrl || fallbackThumbnail?.secureUrl || legacyThumbnail,
    images: mobileImages,
  };
}

export function toMobileBannerMedia(banner) {
  if (!banner || typeof banner !== "object") return banner;
  const { imageData, ...rest } = banner;
  const remoteImageUrl = isRemoteUrl(rest.imageUrl) || isRemoteUrl(imageData)
    ? (isRemoteUrl(rest.imageUrl) ? rest.imageUrl : imageData)
    : null;
  const legacyImageData = !remoteImageUrl && String(imageData || "").startsWith("data:")
    ? imageData
    : null;
  return {
    ...rest,
    imageUrl: remoteImageUrl || legacyImageData,
    ...(legacyImageData ? { imageData: legacyImageData } : {}),
  };
}
