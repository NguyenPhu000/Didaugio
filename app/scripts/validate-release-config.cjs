const fs = require("node:fs");
const path = require("node:path");

const PLACEHOLDER_HOSTS = new Set(["yourapp.com", "example.com", "localhost"]);

function hasPublicLegalBaseUrl(baseUrl) {
  try {
    const url = new URL(String(baseUrl || "").trim());
    return url.protocol === "https:" && !PLACEHOLDER_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function hasSentryDsn(dsn) {
  try {
    const url = new URL(String(dsn || "").trim());
    return url.protocol === "https:" && Boolean(url.username) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function hasProductionApiUrl(apiUrl) {
  try {
    const url = new URL(String(apiUrl || "").trim());
    return url.protocol === "https:" && !PLACEHOLDER_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function assertStaticAppConfig() {
  const appConfig = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "..", "app.json"), "utf8"),
  ).expo;

  if (!appConfig?.updates?.url?.startsWith("https://u.expo.dev/")) {
    throw new Error("app.json must contain a valid EAS Updates URL.");
  }

  if (
    typeof appConfig.runtimeVersion !== "string" ||
    appConfig.runtimeVersion !== appConfig.version
  ) {
    throw new Error("app.json must use an explicit runtimeVersion matching expo.version for bare workflow.");
  }

  if (!appConfig.assetBundlePatterns?.includes("assets/splash.mp4")) {
    throw new Error("app.json must bundle assets/splash.mp4 for the first frame.");
  }

  const easConfig = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "..", "eas.json"), "utf8"),
  );
  const production = easConfig.build?.production;
  if (
    production?.channel !== "production" ||
    production?.credentialsSource !== "remote" ||
    production?.android?.buildType !== "app-bundle"
  ) {
    throw new Error("eas.json production must use the production channel, remote credentials, and an Android app bundle.");
  }

  for (const key of ["EXPO_PUBLIC_API_URL_PROD", "EXPO_PUBLIC_LEGAL_BASE_URL"]) {
    const profileValue = production.env?.[key];
    const runtimeValue = process.env[key];
    if (profileValue && runtimeValue && profileValue !== runtimeValue) {
      throw new Error(`${key} must match the production value in eas.json.`);
    }
  }
}

if (process.env.EAS_BUILD_PROFILE === "production") {
  assertStaticAppConfig();

  if (!hasPublicLegalBaseUrl(process.env.EXPO_PUBLIC_LEGAL_BASE_URL)) {
    throw new Error("EXPO_PUBLIC_LEGAL_BASE_URL must point to a public HTTPS legal site before a production build can start.");
  }
  if (!hasProductionApiUrl(process.env.EXPO_PUBLIC_API_URL_PROD)) {
    throw new Error("EXPO_PUBLIC_API_URL_PROD must be a production HTTPS API URL.");
  }
  if (!hasSentryDsn(process.env.EXPO_PUBLIC_SENTRY_DSN)) {
    throw new Error("EXPO_PUBLIC_SENTRY_DSN must be configured for production crash reporting.");
  }
  if (!process.env.SENTRY_AUTH_TOKEN || !process.env.SENTRY_ORG || !process.env.SENTRY_PROJECT) {
    throw new Error("SENTRY_AUTH_TOKEN, SENTRY_ORG, and SENTRY_PROJECT must be configured for production symbolication.");
  }
}

console.log("Release configuration is valid.");
