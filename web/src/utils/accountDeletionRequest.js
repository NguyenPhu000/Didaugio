const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function buildAccountDeletionRequest(rawEmail) {
  const email = String(rawEmail || "").trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) throw new Error("A valid email address is required.");

  return {
    reportType: "account_deletion",
    title: "Account deletion request",
    content: `Email: ${email}`,
  };
}
