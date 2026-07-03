import crypto from "crypto";

const CSRF_SECRET =
  process.env.CSRF_SECRET || process.env.JWT_SECRET + "_csrf";

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

  if (!crypto.timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expectedSig, "utf8"))) {
    return res.status(403).json({
      success: false,
      data: null,
      message: "CSRF token không hợp lệ",
      errorCode: "CSRF_TOKEN_INVALID",
    });
  }

  next();
};

export const getCsrfToken = (req, res) => {
  const csrfToken = generateCsrfToken();
  res.json({ success: true, data: { csrfToken } });
};
