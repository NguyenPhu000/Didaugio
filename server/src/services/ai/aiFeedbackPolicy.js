export const RATEABLE_AI_FEATURES = Object.freeze([
  "chat",
  "planner",
  "voice-introduction",
]);

export const VOICE_AI_FEATURES = Object.freeze([
  "voice",
  "voice-introduction",
  "voice-transcription",
  "voice-speech",
]);

const RATEABLE_AI_FEATURE_SET = new Set(RATEABLE_AI_FEATURES);

export function isRateableAiFeature(feature) {
  return RATEABLE_AI_FEATURE_SET.has(feature);
}
