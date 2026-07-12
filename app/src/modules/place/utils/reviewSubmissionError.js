export function getReviewSubmissionError(error) {
  const response = error?.response;
  const payload = response?.data || {};
  const code = payload?.errorCode || payload?.code || payload?.error?.code;
  const message = payload?.message || payload?.error?.message || null;

  return {
    kind: response?.status === 429 && code === "REVIEW_COOLDOWN"
      ? "cooldown"
      : "generic",
    message,
  };
}
