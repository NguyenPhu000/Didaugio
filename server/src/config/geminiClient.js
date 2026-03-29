import { GoogleGenerativeAI } from "@google/generative-ai";

function getGenAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("[ENV] Thiếu GEMINI_API_KEY");
  return new GoogleGenerativeAI(key);
}

export const geminiModel = {
  generateContent: (...args) => getGenAI().getGenerativeModel({ model: "gemini-2.0-flash" }).generateContent(...args),
  generateContentStream: (...args) => getGenAI().getGenerativeModel({ model: "gemini-2.0-flash" }).generateContentStream(...args),
};

export const geminiStructuredModel = (schema) => ({
  generateContent: (...args) =>
    getGenAI()
      .getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      })
      .generateContent(...args),
});
