import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadPlaceImage(base64Data, folder = "didaugio/places") {
  const result = await cloudinary.uploader.upload(base64Data, {
    folder,
    resource_type: "image",
    transformation: [
      { quality: "auto", fetch_format: "auto" },
      { width: 1200, crop: "limit" },
    ],
    responsive_breakpoints: {
      create_derived: true,
      bytes_step: 20000,
      min_width: 200,
      max_width: 1200,
      max_images: 3,
    },
  });

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    thumbnailUrl: cloudinary.url(result.public_id, {
      width: 400,
      height: 400,
      crop: "fill",
      fetch_format: "auto",
      quality: "auto",
    }),
    blurhash: null,
  };
}

export async function deletePlaceImage(publicId) {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
}
