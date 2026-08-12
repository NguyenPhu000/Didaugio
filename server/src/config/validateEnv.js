const REQUIRED_CORE = ["JWT_SECRET", "DATABASE_URL"];

const MIN_JWT_SECRET_LENGTH = 32; // 256 bits minimum for HS256 security
const FIELD_ENCRYPTION_KEY_LENGTH = 64; // 32 bytes = 64 hex characters

/** Bat buoc khi deploy production / staging day du tinh nang */
const REQUIRED_FOR_FULL_STACK = [
  "GROQ_API_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

export function validateEnv() {
  const isProd = process.env.NODE_ENV === "production";
  const missingCore = REQUIRED_CORE.filter((key) => !process.env[key]);
  if (missingCore.length > 0) {
    throw new Error(
      `[ENV] Thieu bien moi truong bat buoc: ${missingCore.join(", ")}`,
    );
  }

  // Validate JWT_SECRET length for security
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `[ENV] JWT_SECRET phai co do dai toi thieu ${MIN_JWT_SECRET_LENGTH} ky tu (de xuat: 64+ ky tu ngau nhien)`,
    );
  }

  // Validate FIELD_ENCRYPTION_KEY format
  const fieldEncryptionKey = process.env.FIELD_ENCRYPTION_KEY;
  if (fieldEncryptionKey) {
    if (fieldEncryptionKey.length !== FIELD_ENCRYPTION_KEY_LENGTH) {
      throw new Error(
        `[ENV] FIELD_ENCRYPTION_KEY phai la chuoi hex ${FIELD_ENCRYPTION_KEY_LENGTH} ky tu (32 bytes). Tao bang: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
      );
    }
    if (!/^[a-f0-9]+$/i.test(fieldEncryptionKey)) {
      throw new Error(
        "[ENV] FIELD_ENCRYPTION_KEY chi duoc chua ky tu hex (a-f, 0-9)",
      );
    }
  } else if (isProd) {
    throw new Error(
      "[ENV] FIELD_ENCRYPTION_KEY bat buoc trong production de ma hoa du lieu nhay cam",
    );
  }

  if (isProd && !process.env.SEPAY_WEBHOOK_SECRET) {
    throw new Error(
      "[ENV] SEPAY_WEBHOOK_SECRET bat buoc trong production de xac thuc webhook SePay",
    );
  }

  const redisUrl = String(process.env.REDIS_URL || "").trim();
  if (isProd && !redisUrl) {
    throw new Error(
      "[ENV] REDIS_URL bat buoc trong production de cache, rate limit, va scheduler nhat quan giua cac replica",
    );
  }

  if (isProd && redisUrl) {
    let redisPassword = "";
    try {
      redisPassword = new URL(redisUrl).password;
    } catch {
      redisPassword = "";
    }

    if (!redisPassword) {
      throw new Error(
        "[ENV] REDIS_URL trong production phai co password/ACL credential de bao ve Redis",
      );
    }
  }

  if (isProd && String(process.env.METRICS_ENABLED || "").toLowerCase() !== "true") {
    throw new Error(
      "[ENV] METRICS_ENABLED=true bat buoc trong production de theo doi API va ha tang",
    );
  }

  if (isProd && !String(process.env.METRICS_TOKEN || "").trim()) {
    throw new Error(
      "[ENV] METRICS_TOKEN bat buoc trong production de bao ve endpoint /metrics",
    );
  }

  if (isProd && String(process.env.CORS_ALLOW_ALL || "false").toLowerCase() === "true") {
    throw new Error(
      "[ENV] CORS_ALLOW_ALL=true khong duoc phep trong production; hay khai bao CORS_ORIGINS",
    );
  }

  if (isProd && !String(process.env.CORS_ORIGINS || "").trim()) {
    throw new Error(
      "[ENV] CORS_ORIGINS bat buoc trong production de gioi han browser origins",
    );
  }

  if (isProd && String(process.env.EMAIL_DELIVERY_ENABLED || "true").toLowerCase() === "false") {
    throw new Error(
      "[ENV] EMAIL_DELIVERY_ENABLED=false khong duoc phep trong production",
    );
  }

  const missingEmailConfig = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM"].filter(
    (key) => !String(process.env[key] || "").trim(),
  );
  if (isProd && missingEmailConfig.length > 0) {
    throw new Error(
      `[ENV] Thieu cau hinh SMTP trong production: ${missingEmailConfig.join(", ")}`,
    );
  }

  const googleAudienceKeys = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_ANDROID_CLIENT_ID",
    "GOOGLE_IOS_CLIENT_ID",
  ];
  const hasAnyGoogleAudience = googleAudienceKeys.some((key) =>
    String(process.env[key] || "").trim(),
  );

  if (!hasAnyGoogleAudience) {
    const msg = `[ENV] Thieu cau hinh Auth/OAuth: can it nhat 1 trong cac bien ${googleAudienceKeys.join(", ")}`;
    if (isProd) {
      throw new Error(msg);
    }
    console.warn(`\nWarning: ${msg}\n`);
  }

  const missingFeatures = REQUIRED_FOR_FULL_STACK.filter(
    (key) => !process.env[key],
  );

  if (missingFeatures.length > 0) {
    const msg = `[ENV] Thieu (AI + Cloudinary): ${missingFeatures.join(", ")} - API itinerary/upload anh se loi cho den khi bo sung.`;
    if (isProd) {
      throw new Error(msg);
    }
    console.warn(`\nWarning: ${msg}\n`);
  }

  const routingEngine = String(process.env.ROUTING_ENGINE || "osrm").trim();
  const osrmUrl = String(process.env.OSRM_URL || "").trim();

  if (routingEngine === "osrm" && !osrmUrl) {
    const msg =
      "[ENV] Thieu OSRM_URL khi ROUTING_ENGINE=osrm. Mac dinh local se la http://localhost:5000.";
    if (isProd) {
      throw new Error(msg);
    }
    console.warn(`\nWarning: ${msg}\n`);
  }
}
