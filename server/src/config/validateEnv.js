const REQUIRED_CORE = ["JWT_SECRET", "DATABASE_URL"];

const REQUIRED_AUTH_OAUTH = ["GOOGLE_CLIENT_ID"];

const MIN_JWT_SECRET_LENGTH = 32; // 256 bits minimum for HS256 security
const FIELD_ENCRYPTION_KEY_LENGTH = 64; // 32 bytes = 64 hex characters

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

  // Validate JWT_SECRET length for security
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `[ENV] JWT_SECRET phải có độ dài tối thiểu ${MIN_JWT_SECRET_LENGTH} ký tự (đề xuất: 64+ ký tự ngẫu nhiên)`,
    );
  }

  // Validate FIELD_ENCRYPTION_KEY format
  const fieldEncryptionKey = process.env.FIELD_ENCRYPTION_KEY;
  if (fieldEncryptionKey) {
    if (fieldEncryptionKey.length !== FIELD_ENCRYPTION_KEY_LENGTH) {
      throw new Error(
        `[ENV] FIELD_ENCRYPTION_KEY phải là chuỗi hex ${FIELD_ENCRYPTION_KEY_LENGTH} ký tự (32 bytes). Tạo bằng: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
      );
    }
    if (!/^[a-f0-9]+$/i.test(fieldEncryptionKey)) {
      throw new Error(
        `[ENV] FIELD_ENCRYPTION_KEY chỉ được chứa ký tự hex (a-f, 0-9)`,
      );
    }
  } else if (isProd) {
    throw new Error(
      `[ENV] FIELD_ENCRYPTION_KEY bắt buộc trong production để mã hóa dữ liệu nhạy cảm`,
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
