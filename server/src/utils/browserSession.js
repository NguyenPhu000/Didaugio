export const BROWSER_REFRESH_COOKIE = "ipoint_refresh";

const getRefreshCookieMaxAge = () => {
  const days = Number(process.env.REMEMBER_ME_EXPIRES_DAYS || 30);
  const safeDays = Number.isFinite(days) && days > 0 ? days : 30;
  return Math.round(safeDays * 24 * 60 * 60 * 1000);
};

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/api/auth",
  maxAge: getRefreshCookieMaxAge(),
});

const clearCookieOptions = () => {
  const { maxAge: _maxAge, ...options } = cookieOptions();
  return options;
};

export const readCookie = (cookieHeader, name) => {
  for (const item of String(cookieHeader || "").split(";")) {
    const separatorIndex = item.indexOf("=");
    if (separatorIndex < 0) continue;

    const key = item.slice(0, separatorIndex).trim();
    if (key !== name) continue;

    try {
      return decodeURIComponent(item.slice(separatorIndex + 1).trim());
    } catch {
      return null;
    }
  }

  return null;
};

export const isBrowserSessionRequest = (req) =>
  String(req?.headers?.["x-client-platform"] || "").toLowerCase() === "web";

export const getRequestRefreshToken = (req) => {
  if (isBrowserSessionRequest(req)) {
    return readCookie(req?.headers?.cookie, BROWSER_REFRESH_COOKIE);
  }

  return req?.body?.refreshToken || null;
};

export const setBrowserRefreshCookie = (res, refreshToken) => {
  res.cookie(BROWSER_REFRESH_COOKIE, refreshToken, cookieOptions());
};

export const clearBrowserRefreshCookie = (res) => {
  res.clearCookie(BROWSER_REFRESH_COOKIE, clearCookieOptions());
};

export const toBrowserSessionPayload = (req, session) => {
  if (!isBrowserSessionRequest(req)) return session;

  const { refreshToken: _refreshToken, ...payload } = session;
  return payload;
};
