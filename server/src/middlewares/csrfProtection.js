import crypto from "crypto";
import { isBrowserSessionRequest, readCookie } from "../utils/browserSession.js";

const CSRF_SECRET =
  process.env.CSRF_SECRET || process.env.JWT_SECRET + "_csrf";
export const BROWSER_CSRF_COOKIE = "ipoint_csrf";

const csrfCookieOptions = () => ({
  httpOnly: false,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/api/auth",
  maxAge: 30 * 24 * 60 * 60 * 1000,
});

export const generateCsrfToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const signature = crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(rawToken)
    .digest("hex");
  return `${rawToken}.${signature}`;
};

export const verifyCsrfToken = (req, res, next) => {
  if (
    req.method === "GET" ||
    req.method === "HEAD" ||
    req.method === "OPTIONS"
  ) {
    return next();
  }

  const token = req.headers["x-csrf-token"] || req.body?._csrf;
  if (!token) {
    return res.status(403).json({
      success: false,
      data: null,
      message: "Thiếu CSRF token",
      errorCode: "CSRF_TOKEN_MISSING",
    });
  }

  const [rawToken, signature] = token.split(".");
  if (!rawToken || !signature) {
    return res.status(403).json({
      success: false,
      data: null,
      message: "CSRF token không hợp lệ",
      errorCode: "CSRF_TOKEN_INVALID",
    });
  }

  const expectedSig = crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(rawToken)
    .digest("hex");

  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedSignatureBuffer = Buffer.from(expectedSig, "utf8");
  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    return res.status(403).json({
      success: false,
      data: null,
      message: "CSRF token không hợp lệ",
      errorCode: "CSRF_TOKEN_INVALID",
    });
  }

  next();
};

export const setBrowserCsrfCookie = (res, csrfToken) => {
  res.cookie(BROWSER_CSRF_COOKIE, csrfToken, csrfCookieOptions());
};

export const clearBrowserCsrfCookie = (res) => {
  const { maxAge: _maxAge, httpOnly: _httpOnly, ...options } =
    csrfCookieOptions();
  res.clearCookie(BROWSER_CSRF_COOKIE, options);
};

export const verifyBrowserCsrfToken = (req, res, next) => {
  if (!isBrowserSessionRequest(req)) {
    return next();
  }

  const requestToken = req.headers["x-csrf-token"];
  const cookieToken = readCookie(req.headers.cookie, BROWSER_CSRF_COOKIE);
  if (!requestToken || !cookieToken || requestToken !== cookieToken) {
    return res.status(403).json({
      success: false,
      data: null,
      message: "CSRF token không hợp lệ",
      errorCode: requestToken ? "CSRF_TOKEN_INVALID" : "CSRF_TOKEN_MISSING",
    });
  }

  return verifyCsrfToken(req, res, next);
};

export const getCsrfToken = (_req, res) => {
  const csrfToken = generateCsrfToken();
  setBrowserCsrfCookie(res, csrfToken);
  res.json({ success: true, data: { csrfToken } });
};
