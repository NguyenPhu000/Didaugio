import { v2 as cloudinary } from "cloudinary";

// Cấu hình Cloudinary từ biến môi trường
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Tải base64 lên Cloudinary để làm ảnh Marker Maps
 * Trả về chuỗi URL Marker (120x120, bo góc 24, định dạng png)
 * @param {string} base64Data
 * @param {string} folder Tên thư mục trên mây
 */
export const generateMapMarkerUrl = async (base64Data, folder = "didaugio/markers") => {
  try {
    if (!base64Data || !base64Data.startsWith("data:image")) return null;
    
    // Upload ảnh gốc lên cấu hình
    const result = await cloudinary.uploader.upload(base64Data, {
      folder,
    });

    // Tạo URL ảnh Transform thành Marker Map (bo tròn mượt 100%)
    return cloudinary.url(result.public_id, {
      width: 120,
      height: 120,
      crop: "fill",
      gravity: "center",
      radius: 24,
      fetch_format: "png",
      secure: true
    });
  } catch (error) {
    console.error("Lỗi khi upload Cloudinary tạo Marker Map:", error);
    return null;
  }
};

const extractPublicIdFromCloudinaryUrl = (imageUrl) => {
  if (!imageUrl) return null;

  try {
    const { pathname } = new URL(imageUrl);
    const pathParts = pathname.split("/").filter(Boolean);
    const uploadIndex = pathParts.findIndex((part) => part === "upload");

    if (uploadIndex === -1) return null;

    const assetParts = pathParts.slice(uploadIndex + 1);
    const versionIndex = assetParts.findIndex((part) => /^v\d+$/.test(part));
    const publicIdParts = versionIndex >= 0 ? assetParts.slice(versionIndex + 1) : assetParts;

    if (!publicIdParts.length) return null;

    const lastPart = publicIdParts[publicIdParts.length - 1];
    publicIdParts[publicIdParts.length - 1] = lastPart.replace(/\.[^.]+$/, "");

    return publicIdParts.join("/");
  } catch {
    return null;
  }
};

export const deleteMapMarkerImage = async (imageUrl) => {
  const publicId = extractPublicIdFromCloudinaryUrl(imageUrl);

  if (!publicId) {
    return { result: "skipped", reason: "invalid_marker_url" };
  }

  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Loi khi xoa Marker Map tren Cloudinary:", error);
    throw error;
  }
};
