const PLACEHOLDER_HOSTS = new Set(["yourapp.com", "example.com", "localhost"]);

export function getLegalUrls(baseUrl = process.env.EXPO_PUBLIC_LEGAL_BASE_URL) {
  try {
    const url = new URL(String(baseUrl || "").trim());
    if (url.protocol !== "https:" || PLACEHOLDER_HOSTS.has(url.hostname)) return null;

    const base = url.toString().replace(/\/+$/, "");
    return {
      privacy: `${base}/privacy`,
      terms: `${base}/terms`,
      accountDeletion: `${base}/account-deletion`,
    };
  } catch {
    return null;
  }
}
