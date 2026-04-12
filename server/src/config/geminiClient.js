import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
];

function parseModelList(rawModels) {
  return String(rawModels || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
}

const preferredModel = String(process.env.GEMINI_MODEL || "").trim();
const configuredFallbackModels = parseModelList(
  process.env.GEMINI_FALLBACK_MODELS,
);

export const GEMINI_MODEL_CHAIN = Array.from(
  new Set([
    ...(preferredModel ? [preferredModel] : []),
    ...configuredFallbackModels,
    ...DEFAULT_GEMINI_MODELS,
  ]),
);

export const PRIMARY_GEMINI_MODEL = GEMINI_MODEL_CHAIN[0];

function getGenAI() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
  if (!key) throw new Error("[ENV] Thiếu GEMINI_API_KEY hoặc GOOGLE_AI_KEY");
  return new GoogleGenerativeAI(key);
}

function getErrorStatus(error) {
  const directStatus = Number(
    error?.status ?? error?.response?.status ?? error?.statusCode,
  );
  if (Number.isFinite(directStatus)) return directStatus;

  const message = String(error?.message || "");
  const bracketStatus = message.match(/\[(\d{3})\s[^\]]+\]/);
  if (bracketStatus) {
    const parsed = Number(bracketStatus[1]);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function canFallbackToNextModel(error) {
  const status = getErrorStatus(error);
  if ([404, 429, 500, 503].includes(status)) {
    return true;
  }

  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    (message.includes("model") && message.includes("not found"))
  );
}

function createModelRunner(executeWithModel) {
  return async (...args) => {
    let lastError;

    for (let index = 0; index < GEMINI_MODEL_CHAIN.length; index += 1) {
      const modelName = GEMINI_MODEL_CHAIN[index];

      try {
        return await executeWithModel(modelName, ...args);
      } catch (error) {
        lastError = error;

        const hasNextModel = index < GEMINI_MODEL_CHAIN.length - 1;
        if (!hasNextModel || !canFallbackToNextModel(error)) {
          throw error;
        }

        const nextModel = GEMINI_MODEL_CHAIN[index + 1];
        const status = getErrorStatus(error) ?? "-";
        console.warn(
          `[GeminiClient] model=${modelName} status=${status} failed, trying model=${nextModel}`,
        );
      }
    }

    throw lastError;
  };
}

export const geminiModel = {
  generateContent: createModelRunner((modelName, ...args) =>
    getGenAI()
      .getGenerativeModel({ model: modelName })
      .generateContent(...args),
  ),
  generateContentStream: createModelRunner((modelName, ...args) =>
    getGenAI()
      .getGenerativeModel({ model: modelName })
      .generateContentStream(...args),
  ),
};

export const geminiStructuredModel = (schema) => ({
  generateContent: createModelRunner((modelName, ...args) =>
    getGenAI()
      .getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      })
      .generateContent(...args),
  ),
});
