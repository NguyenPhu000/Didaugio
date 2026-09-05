const isInlineImage = (value) =>
  typeof value === "string" && value.startsWith("data:image/");

export const stageTripCover = async (value, uploadImage) => {
  if (value == null || value === "") {
    return {
      coverImage: value || null,
      coverImagePublicId: null,
      uploadedPublicId: null,
    };
  }

  if (!isInlineImage(value)) {
    return {
      coverImage: value,
      coverImagePublicId: null,
      uploadedPublicId: null,
    };
  }

  const uploaded = await uploadImage(value);
  return {
    coverImage: uploaded.secureUrl,
    coverImagePublicId: uploaded.publicId,
    uploadedPublicId: uploaded.publicId,
  };
};
