export function resolveGenieActiveError({
  plannerError,
  chatError,
  voiceError,
}) {
  if (plannerError) return { source: "planner", message: plannerError };
  if (chatError) return { source: "chat", message: chatError };
  if (voiceError) return { source: "voice", message: voiceError };
  return null;
}

export function clearGenieRequestErrors({
  clearPlannerError,
  setChatError,
  setVoiceError,
}) {
  clearPlannerError?.();
  setChatError?.(null);
  setVoiceError?.(null);
}

export async function sendItineraryWithVoiceFeedback({
  message,
  inputMode,
  sendMessage,
  speakText,
  successText,
}) {
  const result = await sendMessage(message);
  if (result?.success === true && inputMode === "voice") {
    speakText(successText);
  }
  return result;
}
