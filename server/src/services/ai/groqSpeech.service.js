import { toFile } from "groq-sdk";
import { createGroqClient } from "./groq.service.js";
import {
  logAiProviderEvent,
  toAiServiceError,
} from "./aiProviderPolicy.js";

export const GROQ_TRANSCRIPTION_MODEL =
  process.env.GROQ_TRANSCRIPTION_MODEL || "whisper-large-v3-turbo";
export const GROQ_TTS_MODEL =
  process.env.GROQ_TTS_MODEL || "canopylabs/orpheus-v1-english";
export const GROQ_TTS_VOICE = process.env.GROQ_TTS_VOICE || "hannah";

export const MAX_SPEECH_AUDIO_BYTES = 25 * 1024 * 1024;
export const MAX_TTS_INPUT_CHARS = 1600;

const ALLOWED_AUDIO_TYPES = new Set([
  "audio/flac",
  "audio/mp3",
  "audio/mpeg",
  "audio/mp4",
  "audio/mpga",
  "audio/m4a",
  "audio/x-m4a",
  "audio/aac",
  "audio/3gpp",
  "audio/3gp",
  "audio/caf",
  "audio/mp4a-latm",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "video/mp4",
  "video/webm",
  "application/octet-stream",
]);

export function validateTranscriptionFile(file) {
  if (!file) {
    const error = new Error("Audio file is required");
    error.status = 400;
    error.errorCode = "MISSING_AUDIO";
    throw error;
  }

  if (!ALLOWED_AUDIO_TYPES.has(file.mimetype)) {
    const error = new Error("Unsupported audio type");
    error.status = 400;
    error.errorCode = "UNSUPPORTED_AUDIO_TYPE";
    throw error;
  }

  if (!file.buffer || file.size <= 0) {
    const error = new Error("Audio file is empty");
    error.status = 400;
    error.errorCode = "EMPTY_AUDIO";
    throw error;
  }

  if (file.size > MAX_SPEECH_AUDIO_BYTES) {
    const error = new Error("Audio file is too large");
    error.status = 413;
    error.errorCode = "AUDIO_TOO_LARGE";
    throw error;
  }
}

export function validateSpeechInput(input) {
  const text = String(input || "").trim();
  if (!text) {
    const error = new Error("Speech input is required");
    error.status = 400;
    error.errorCode = "MISSING_SPEECH_INPUT";
    throw error;
  }
  return text.slice(0, MAX_TTS_INPUT_CHARS);
}

export function buildGroqTranscriptionRequest({
  file,
  language = "vi",
  prompt,
} = {}) {
  return {
    file,
    model: GROQ_TRANSCRIPTION_MODEL,
    language,
    prompt:
      prompt ||
      "Cuộc trò chuyện tiếng Việt với Genie, trợ lý du lịch của ứng dụng iPoint Genie.",
    response_format: "json",
    temperature: 0,
  };
}

export function buildGroqSpeechRequest({ input, voice = GROQ_TTS_VOICE } = {}) {
  return {
    model: GROQ_TTS_MODEL,
    input,
    voice,
    response_format: "wav",
  };
}

export async function transcribeWithGroq(
  { file, language, prompt },
  providerOptions = {},
) {
  validateTranscriptionFile(file);
  const normalizedMime =
    file.mimetype === "application/octet-stream" || file.mimetype === "audio/x-m4a"
      ? "audio/m4a"
      : (file.mimetype || "audio/m4a");
  const filename = file.originalname || "voice.m4a";

  const upload = await toFile(file.buffer, filename, {
    type: normalizedMime,
  });
  const request = buildGroqTranscriptionRequest({
    file: upload,
    language,
    prompt,
  });
  const startedAt = Date.now();
  let transcription;

  try {
    const client = createGroqClient(providerOptions);
    transcription = await client.audio.transcriptions.create(request, {
      timeout: providerOptions.timeoutMs,
    });
  } catch (error) {
    const aiError = toAiServiceError(error);
    logAiProviderEvent({
      feature: "transcription",
      model: request.model,
      startedAt,
      code: aiError.code,
    });
    throw aiError;
  }
  logAiProviderEvent({
    feature: "transcription",
    model: request.model,
    startedAt,
  });
  return {
    text: transcription?.text || "",
    model: request.model,
    language: request.language,
  };
}

export async function synthesizeSpeechWithGroq(
  { input, voice },
  providerOptions = {},
) {
  const cleanInput = validateSpeechInput(input);
  const request = buildGroqSpeechRequest({ input: cleanInput, voice });
  const startedAt = Date.now();
  let response;
  try {
    const client = createGroqClient(providerOptions);
    response = await client.audio.speech.create(request, {
      timeout: providerOptions.timeoutMs,
    });
  } catch (error) {
    const aiError = toAiServiceError(error);
    logAiProviderEvent({
      feature: "speech",
      model: request.model,
      startedAt,
      code: aiError.code,
    });
    throw aiError;
  }
  logAiProviderEvent({
    feature: "speech",
    model: request.model,
    startedAt,
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    buffer,
    contentType: "audio/wav",
    model: request.model,
    voice: request.voice,
  };
}
