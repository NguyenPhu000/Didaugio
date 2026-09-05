const DEVELOPMENT_API_URL = "http://localhost:8081/api";

export const resolveApiBaseUrl = (value, { production = false } = {}) => {
  const configuredUrl = String(value || "").trim();
  if (!configuredUrl) {
    if (production) {
      throw new Error("VITE_API_URL is required for a production build");
    }
    return DEVELOPMENT_API_URL;
  }

  let parsed;
  try {
    parsed = new URL(configuredUrl);
  } catch {
    throw new Error("VITE_API_URL must be a valid absolute URL");
  }

  if (production && parsed.protocol !== "https:") {
    throw new Error("VITE_API_URL must use HTTPS in production");
  }
  if (
    production &&
    ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname.toLowerCase())
  ) {
    throw new Error("VITE_API_URL cannot point to localhost in production");
  }
  if (parsed.username || parsed.password) {
    throw new Error("VITE_API_URL cannot contain credentials");
  }

  return configuredUrl.replace(/\/+$/u, "");
};
