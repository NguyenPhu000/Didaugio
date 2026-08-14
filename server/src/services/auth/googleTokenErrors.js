const GOOGLE_CERTIFICATE_NETWORK_CODES = new Set([
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENETUNREACH",
  "EHOSTUNREACH",
  "EACCES",
  "CERT_HAS_EXPIRED",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
]);

const getErrorText = (error) =>
  [error?.message, error?.cause?.message]
    .filter(Boolean)
    .map(String)
    .join(" ");

const isGoogleCertificateRequest = (error) =>
  [error?.config?.url, error?.response?.config?.url]
    .filter(Boolean)
    .some((url) => /googleapis\.com\/oauth2\/v[13]\/certs/i.test(String(url)));

export const isGoogleVerificationInfrastructureError = (error) => {
  const code = String(error?.code || error?.cause?.code || "").toUpperCase();
  if (GOOGLE_CERTIFICATE_NETWORK_CODES.has(code)) return true;

  if (isGoogleCertificateRequest(error)) return true;

  return /failed to retrieve verification certificates|oauth2\/v1\/certs|googleapis\.com/i.test(
    getErrorText(error),
  );
};
