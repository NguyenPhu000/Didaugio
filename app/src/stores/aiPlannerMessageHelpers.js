export function removeDraftPreviewMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.filter((message) => {
    const isLegacyDraftPreview =
      message?.role === "assistant" &&
      (message?.source || "planner") === "planner" &&
      Array.isArray(message?.suggestedPlaces) &&
      message.suggestedPlaces.length > 0 &&
      Array.isArray(message?.selectedPlaceIds);
    return !message?.isDraftPreview && !isLegacyDraftPreview;
  });
}
