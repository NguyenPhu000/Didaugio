const REQUIRED_CORE = ["JWT_SECRET", "DATABASE_URL"];

const REQUIRED_AUTH_OAUTH = ["GOOGLE_CLIENT_ID"];

/** Bắt buộc khi deploy production / staging đầy đủ tính năng */
const REQUIRED_FOR_FULL_STACK = [
  "GEMINI_API_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

export function validateEnv() {
  const isProd = process.env.NODE_ENV === "production";
  const missingCore = REQUIRED_CORE.filter((key) => !process.env[key]);
  if (missingCore.length > 0) {
    throw new Error(
      `[ENV] Thiếu biến môi trường bắt buộc: ${missingCore.join(", ")}`,
    );
  }

  const missingAuthOAuth = REQUIRED_AUTH_OAUTH.filter(
    (key) => !process.env[key],
  );
  if (missingAuthOAuth.length > 0) {
    const msg = `[ENV] Thiếu cấu hình Auth/OAuth: ${missingAuthOAuth.join(", ")}`;
    if (isProd) {
      throw new Error(msg);
    }
    console.warn(`\n⚠️  ${msg}\n`);
  }

  const missingFeatures = REQUIRED_FOR_FULL_STACK.filter(
    (key) => !process.env[key],
  );

  if (missingFeatures.length > 0) {
    const msg = `[ENV] Thiếu (AI + Cloudinary): ${missingFeatures.join(", ")} — API itinerary/upload ảnh sẽ lỗi cho đến khi bổ sung.`;
    if (isProd) {
      throw new Error(msg);
    }
    console.warn(`\n⚠️  ${msg}\n`);
  }

  const routingEngine = String(process.env.ROUTING_ENGINE || "osrm").trim();
  const osrmUrl = String(process.env.OSRM_URL || "").trim();

  if (routingEngine === "osrm" && !osrmUrl) {
    const msg =
      "[ENV] Thiếu OSRM_URL khi ROUTING_ENGINE=osrm. Mặc định local sẽ là http://localhost:5000.";
    if (isProd) {
      throw new Error(msg);
    }
    console.warn(`\n⚠️  ${msg}\n`);
  }
}
