const REQUIRED_CORE = ["JWT_SECRET", "DATABASE_URL"];

/** Bắt buộc khi deploy production / staging đầy đủ tính năng */
const REQUIRED_FOR_FULL_STACK = [
  "GEMINI_API_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

export function validateEnv() {
  const missingCore = REQUIRED_CORE.filter((key) => !process.env[key]);
  if (missingCore.length > 0) {
    throw new Error(
      `[ENV] Thiếu biến môi trường bắt buộc: ${missingCore.join(", ")}`,
    );
  }

  const missingFeatures = REQUIRED_FOR_FULL_STACK.filter(
    (key) => !process.env[key],
  );
  const isProd = process.env.NODE_ENV === "production";

  if (missingFeatures.length > 0) {
    const msg = `[ENV] Thiếu (AI + Cloudinary): ${missingFeatures.join(", ")} — API itinerary/upload ảnh sẽ lỗi cho đến khi bổ sung.`;
    if (isProd) {
      throw new Error(msg);
    }
    console.warn(`\n⚠️  ${msg}\n`);
  }
}
