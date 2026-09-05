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

const requireProductionValue = (condition, message) => {
  if (condition) throw new Error(message);
};

const warnOrThrow = (isProd, message) => {
  if (isProd) throw new Error(message);
  console.warn(`\nWarning: ${message}\n`);
};

const validateProductionHttpsUrl = (isProd, key, { required = false } = {}) => {
  if (!isProd) return;
  const value = String(process.env[key] || "").trim();
  if (!value) {
    requireProductionValue(required, `[ENV] ${key} bat buoc trong production`);
    return;
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`[ENV] ${key} phai la URL hop le`);
  }

  requireProductionValue(
    parsed.protocol !== "https:",
    `[ENV] ${key} trong production phai su dung HTTPS`,
  );
  requireProductionValue(
    Boolean(parsed.username || parsed.password),
    `[ENV] ${key} khong duoc chua credential trong URL`,
  );
  requireProductionValue(
    ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname.toLowerCase()),
    `[ENV] ${key} trong production khong duoc tro den localhost`,
  );
};

function validateCoreEnvironment() {
  const missingCore = REQUIRED_CORE.filter((key) => !process.env[key]);
  if (missingCore.length > 0) {
    throw new Error(`[ENV] Thieu bien moi truong bat buoc: ${missingCore.join(", ")}`);
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `[ENV] JWT_SECRET phai co do dai toi thieu ${MIN_JWT_SECRET_LENGTH} ky tu (de xuat: 64+ ky tu ngau nhien)`,
    );
  }
}

function validateFieldEncryptionKey(isProd) {
  const key = process.env.FIELD_ENCRYPTION_KEY;
  if (!key) {
    requireProductionValue(
      isProd,
      "[ENV] FIELD_ENCRYPTION_KEY bat buoc trong production de ma hoa du lieu nhay cam",
    );
    return;
  }
  if (key.length !== FIELD_ENCRYPTION_KEY_LENGTH) {
    throw new Error(
      `[ENV] FIELD_ENCRYPTION_KEY phai la chuoi hex ${FIELD_ENCRYPTION_KEY_LENGTH} ky tu (32 bytes). Tao bang: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
    );
  }
  if (!/^[a-f0-9]+$/i.test(key)) {
    throw new Error("[ENV] FIELD_ENCRYPTION_KEY chi duoc chua ky tu hex (a-f, 0-9)");
  }
}

function validateProductionRedis(isProd) {
  const redisUrl = String(process.env.REDIS_URL || "").trim();
  requireProductionValue(
    isProd && !redisUrl,
    "[ENV] REDIS_URL bat buoc trong production de cache, rate limit, va scheduler nhat quan giua cac replica",
  );
  if (!isProd || !redisUrl) return;

  let redisPassword = "";
  try {
    redisPassword = new URL(redisUrl).password;
  } catch {
    redisPassword = "";
  }
  requireProductionValue(
    !redisPassword,
    "[ENV] REDIS_URL trong production phai co password/ACL credential de bao ve Redis",
  );
}

function validateProductionObservability(isProd) {
  requireProductionValue(
    isProd && String(process.env.METRICS_ENABLED || "").toLowerCase() !== "true",
    "[ENV] METRICS_ENABLED=true bat buoc trong production de theo doi API va ha tang",
  );
  requireProductionValue(
    isProd && !String(process.env.METRICS_TOKEN || "").trim(),
    "[ENV] METRICS_TOKEN bat buoc trong production de bao ve endpoint /metrics",
  );
}

function validateProductionOriginsAndEmail(isProd) {
  requireProductionValue(
    isProd && String(process.env.CORS_ALLOW_ALL || "false").toLowerCase() === "true",
    "[ENV] CORS_ALLOW_ALL=true khong duoc phep trong production; hay khai bao CORS_ORIGINS",
  );
  requireProductionValue(
    isProd && !String(process.env.CORS_ORIGINS || "").trim(),
    "[ENV] CORS_ORIGINS bat buoc trong production de gioi han browser origins",
  );
  requireProductionValue(
    isProd && String(process.env.EMAIL_DELIVERY_ENABLED || "true").toLowerCase() === "false",
    "[ENV] EMAIL_DELIVERY_ENABLED=false khong duoc phep trong production",
  );

  const missingEmailConfig = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM"].filter(
    (key) => !String(process.env[key] || "").trim(),
  );
  if (isProd && missingEmailConfig.length > 0) {
    throw new Error(`[ENV] Thieu cau hinh SMTP trong production: ${missingEmailConfig.join(", ")}`);
  }
}

function validateProductionPublicUrls(isProd) {
  validateProductionHttpsUrl(isProd, "FRONTEND_URL", { required: true });
  validateProductionHttpsUrl(isProd, "API_BASE_URL", { required: true });

  const hasVnpayConfig = ["VNPAY_TMN_CODE", "VNPAY_HASH_SECRET"].some((key) =>
    String(process.env[key] || "").trim(),
  );
  if (hasVnpayConfig) {
    for (const key of ["VNPAY_URL", "VNPAY_RETURN_URL"]) {
      validateProductionHttpsUrl(isProd, key, { required: true });
    }
  }

  const hasMomoConfig = ["MOMO_PARTNER_CODE", "MOMO_ACCESS_KEY", "MOMO_SECRET_KEY"].some(
    (key) => String(process.env[key] || "").trim(),
  );
  if (hasMomoConfig) {
    for (const key of ["MOMO_API_URL", "MOMO_REDIRECT_URL", "MOMO_IPN_URL"]) {
      validateProductionHttpsUrl(isProd, key, { required: true });
    }
  }
}

function validateOptionalStackConfiguration(isProd) {
  const googleAudienceKeys = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_ANDROID_CLIENT_ID",
    "GOOGLE_IOS_CLIENT_ID",
  ];
  const hasAnyGoogleAudience = googleAudienceKeys.some((key) =>
    String(process.env[key] || "").trim(),
  );
  if (!hasAnyGoogleAudience) {
    warnOrThrow(
      isProd,
      `[ENV] Thieu cau hinh Auth/OAuth: can it nhat 1 trong cac bien ${googleAudienceKeys.join(", ")}`,
    );
  }

  const missingFeatures = REQUIRED_FOR_FULL_STACK.filter((key) => !process.env[key]);
  if (missingFeatures.length > 0) {
    warnOrThrow(
      isProd,
      `[ENV] Thieu (AI + Cloudinary): ${missingFeatures.join(", ")} - API itinerary/upload anh se loi cho den khi bo sung.`,
    );
  }
}

function validateRoutingConfiguration(isProd) {
  const routingEngine = String(process.env.ROUTING_ENGINE || "osrm").trim();
  const osrmUrl = String(process.env.OSRM_URL || "").trim();
  if (routingEngine === "osrm" && !osrmUrl) {
    warnOrThrow(
      isProd,
      "[ENV] Thieu OSRM_URL khi ROUTING_ENGINE=osrm. Mac dinh local se la http://localhost:5000.",
    );
  }
}

export function validateEnv() {
  const isProd = process.env.NODE_ENV === "production";
  validateCoreEnvironment();
  validateFieldEncryptionKey(isProd);
  requireProductionValue(
    isProd && !process.env.SEPAY_WEBHOOK_SECRET,
    "[ENV] SEPAY_WEBHOOK_SECRET bat buoc trong production de xac thuc webhook SePay",
  );
  validateProductionRedis(isProd);
  validateProductionObservability(isProd);
  validateProductionOriginsAndEmail(isProd);
  validateProductionPublicUrls(isProd);
  validateOptionalStackConfiguration(isProd);
  validateRoutingConfiguration(isProd);
}
