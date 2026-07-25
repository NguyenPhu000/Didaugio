export const RATEABLE_AI_FEATURES = Object.freeze([
  "chat",
  "planner",
  "voice-introduction",
]);

const RATEABLE_AI_FEATURE_SET = new Set(RATEABLE_AI_FEATURES);

export function isRateableAiFeature(feature) {
  return RATEABLE_AI_FEATURE_SET.has(feature);
}
