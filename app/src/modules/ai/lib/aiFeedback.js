const FEEDBACK_VALUES = new Set(["up", "down"]);

export function isRateableAiMessage(message) {
  const text = String(message?.text ?? message?.content ?? "").trim();
  return (
    message?.role === "assistant" &&
    message?.isError !== true &&
    Number.isSafeInteger(message?.requestLogId) &&
    message.requestLogId > 0 &&
    text.length > 0
  );
}

export function buildAiFeedbackPayload({
  requestLogId,
  value,
  reason = "",
}) {
  if (
    !Number.isSafeInteger(requestLogId) ||
    requestLogId <= 0 ||
    !FEEDBACK_VALUES.has(value)
  ) {
    throw new Error("Invalid AI feedback");
  }

  const cleanReason = String(reason || "").trim();
  return {
    reportType: "ai_quality",
    title: value === "up" ? "AI helpful" : "AI not helpful",
    content: cleanReason || value,
    targetType: "ai_request",
    targetId: requestLogId,
  };
}

export function createAiFeedbackSubmitter(submitFeedback) {
  let pending = false;
  let submitted = false;

  return {
    async submit(input) {
      if (pending || submitted) return { status: "ignored" };
      pending = true;
      try {
        const payload = buildAiFeedbackPayload(input);
        await submitFeedback(payload);
        submitted = true;
        return { status: "submitted", value: input.value };
      } catch {
        return { status: "error" };
      } finally {
        pending = false;
      }
    },
  };
}
