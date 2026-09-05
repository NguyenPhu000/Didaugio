// MAP: ai.controller
// ├── ROUTE: src/routes/ai/ai.route.js
// └── SERVICE: src/services/ai/{aiStreaming.service.js, groq.service.js, groqSpeech.service.js}

import { getPlaceById } from "../../services/place/place.service.js";
import {
  buildSseErrorPayload,
  encodeSseData,
  encodeSseEvent,
  streamPlaceSummary,
  streamChat,
} from "../../services/ai/aiStreaming.service.js";
import {
  chatWithGroq,
  resolveGroqProviderOptions,
} from "../../services/ai/groq.service.js";
import { toAiServiceError } from "../../services/ai/aiProviderPolicy.js";
import { executeAiRequest } from "../../services/ai/runtime/aiRuntimeExecution.js";
import {
  synthesizeSpeechWithGroq,
  transcribeWithGroq,
} from "../../services/ai/groqSpeech.service.js";
import {
  buildVoiceIntroPrompt,
  buildChatSystemPrompt,
} from "../../lib/promptBuilder.js";
import { findRelatedPlacesByKeywords } from "../../utils/spatialQuery.js";

const writeChatStream = (execution, res) => {
  res.write(encodeSseData(execution.result.outputText));
  if (execution.requestLogId) {
    res.write(encodeSseEvent("metadata", { requestLogId: execution.requestLogId }));
  }
  res.write(encodeSseData("[DONE]"));
  res.end();
};

const selectResponsePlaces = (relatedPlaces, reply, suggestedPlaceIds) =>
  suggestedPlaceIds.length > 0
    ? relatedPlaces.filter((place) => suggestedPlaceIds.includes(place.id))
    : relatedPlaces.filter((place) => reply.toLowerCase().includes(place.name.toLowerCase()));

const sendChatError = (err, res) => {
  const aiError = toAiServiceError(err);
  console.info("[AI]", { feature: "chat", status: err?.status ?? err?.statusCode ?? 500 });
  if (res.headersSent) {
    res.write(encodeSseData(buildSseErrorPayload(aiError)));
    res.end();
    return;
  }
  const responses = {
    QUOTA_EXCEEDED: [429, "AI đã chạm giới hạn tần suất. Vui lòng thử lại sau."],
    AI_UNAVAILABLE: [503, "Dịch vụ AI tạm thời không khả dụng, vui lòng thử lại sau."],
    AI_TIMEOUT: [504, "Trợ lý AI phản hồi quá lâu, vui lòng thử lại sau."],
  };
  const [status, message] = responses[aiError.code] || [aiError.statusCode || 502, "Trợ lý AI đang gặp sự cố, vui lòng thử lại sau."];
  return res.status(status).json({
    success: false,
    data: null,
    message,
    errorCode: aiError.code,
  });
};

/**
 * POST /api/ai/place-summary
 * SSE streaming place voice intro
 */
export const handlePlaceSummaryStream = async (req, res) => {
  try {
    const { placeId, context } = req.body;

    if (!placeId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "placeId là bắt buộc",
        errorCode: "MISSING_PLACE_ID",
      });
    }

    const place = await getPlaceById(Number(placeId));
    if (!place) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Địa điểm không tồn tại",
        errorCode: "PLACE_NOT_FOUND",
      });
    }

    const execution = await executeAiRequest({
      feature: "voice-introduction",
      user: {
        userId: req.user?.userId || req.user?.id || null,
      },
      inputText: `place:${placeId}`,
      context: {
        timeOfDay: context?.timeOfDay,
        places: [place],
      },
      operation: async ({ configData, context: allowedContext }) => {
        const providerOptions = await resolveGroqProviderOptions(
          configData,
          "voice",
        );
        const allowedPlace = allowedContext.places?.[0];
        if (!allowedPlace) {
          throw Object.assign(
            new Error("Voice place context is unavailable."),
            {
              code: "AI_INVALID_REQUEST",
              errorCode: "AI_INVALID_REQUEST",
              statusCode: 400,
            },
          );
        }
        const prompt = buildVoiceIntroPrompt(
          allowedPlace,
          allowedContext,
          providerOptions.configuredPrompt,
        );
        return streamPlaceSummary(prompt, res, providerOptions);
      },
    });
    res.write(encodeSseData(execution.result.outputText));
    if (execution.requestLogId) {
      res.write(
        encodeSseEvent("metadata", {
          requestLogId: execution.requestLogId,
        }),
      );
    }
    res.write(encodeSseData("[DONE]"));
    res.end();
  } catch (err) {
    const status = err?.status || err?.statusCode || 500;
    console.info("[AI]", { feature: "place-summary", status });
    if (res.headersSent) {
      res.write(encodeSseData(buildSseErrorPayload(err)));
      res.end();
    } else {
      res.status(status).json({
        success: false,
        data: null,
        message: "Lỗi khi tạo tóm tắt địa điểm",
        errorCode: "AI_ERROR",
      });
    }
  }
};

/**
 * POST /api/ai/chat
 * Chat with RAG + optional SSE
 */
export const handleChat = async (req, res) => {
  try {
    const { messages, context, stream = false } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "messages là bắt buộc và phải là mảng không rỗng",
        errorCode: "MISSING_MESSAGES",
      });
    }

    // RAG: tìm kiếm địa điểm liên quan qua từ khóa hoặc featured places từ spatialQuery
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const relatedPlaces = await findRelatedPlacesByKeywords(lastUserMessage);

    const execution = await executeAiRequest({
      feature: "chat",
      user: {
        userId: req.user?.userId || req.user?.id || null,
      },
      inputText: lastUserMessage,
      context: {
        currentCity: context?.currentCity,
        timeOfDay: context?.timeOfDay,
        places: relatedPlaces,
        messages,
      },
      operation: async ({ configData, context: allowedContext }) => {
        const providerOptions = await resolveGroqProviderOptions(
          configData,
          "chat",
        );
        const providerContext = {
          ...allowedContext,
          systemPlaces: allowedContext.places,
        };
        if (stream) {
          const system = buildChatSystemPrompt(
            providerContext,
            providerOptions.configuredPrompt,
          );
          return streamChat(
            allowedContext.messages || [
              { role: "user", content: lastUserMessage },
            ],
            system,
            res,
            providerOptions,
          );
        }
        return chatWithGroq(
          allowedContext.messages || [
            { role: "user", content: lastUserMessage },
          ],
          providerContext,
          providerOptions,
        );
      },
    });

    if (stream) {
      writeChatStream(execution, res);
      return;
    }

    const { reply, suggestedPlaceIds } = execution.result;

    const responsePlaces = selectResponsePlaces(relatedPlaces, reply, suggestedPlaceIds);

    return res.json({
      success: true,
      data: {
        reply,
        relatedPlaces: responsePlaces,
        ...(execution.requestLogId
          ? { requestLogId: execution.requestLogId }
          : {}),
      },
      message: "Thành công",
    });
  } catch (err) {
    return sendChatError(err, res);
  }
};

/**
 * POST /api/ai/voice/transcribe
 * Transcribe user voice input with Groq Whisper.
 */
export const handleVoiceTranscribe = async (req, res) => {
  try {
    const language = req.body?.language || "vi";
    const prompt = req.body?.prompt;
    const execution = await executeAiRequest({
      feature: "voice-transcription",
      user: {
        userId: req.user?.userId || req.user?.id || null,
      },
      inputText: prompt || `voice transcription:${language}`,
      context: {},
      operation: async ({ configData }) => {
        const providerOptions = await resolveGroqProviderOptions(
          configData,
          "voice",
        );
        return transcribeWithGroq(
          {
            file: req.file,
            language,
            prompt,
          },
          providerOptions,
        );
      },
    });
    const result = execution.result;

    return res.json({
      success: true,
      data: result,
      message: "Transcribed",
    });
  } catch (err) {
    const status = err?.status || err?.statusCode || 500;
    console.info("[AI]", { feature: "transcription", status, code: err?.code || err?.errorCode || null });
    return res.status(status).json({
      success: false,
      data: null,
      message:
        status >= 500
          ? "Không thể xử lý giọng nói lúc này."
          : err?.message || "Dữ liệu âm thanh không hợp lệ.",
      errorCode: err?.errorCode || "VOICE_TRANSCRIBE_ERROR",
    });
  }
};

/**
 * POST /api/ai/voice/speech
 * Generate assistant audio with Groq Orpheus TTS.
 */
export const handleVoiceSpeech = async (req, res) => {
  try {
    const input = req.body?.input;
    const execution = await executeAiRequest({
      feature: "voice-speech",
      user: {
        userId: req.user?.userId || req.user?.id || null,
      },
      inputText: input,
      context: {},
      operation: async ({ configData }) => {
        const providerOptions = await resolveGroqProviderOptions(
          configData,
          "voice",
        );
        return synthesizeSpeechWithGroq(
          { input },
          providerOptions,
        );
      },
    });
    const result = execution.result;

    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Groq-TTS-Model", result.model);
    res.setHeader("X-Groq-TTS-Voice", result.voice);
    return res.send(result.buffer);
  } catch (err) {
    const status = err?.status || err?.statusCode || 500;
    console.info("[AI]", { feature: "speech", status, code: err?.code || err?.errorCode || null });
    return res.status(status).json({
      success: false,
      data: null,
      message:
        status >= 500
          ? "Không thể tạo giọng nói lúc này."
          : err?.message || "Nội dung giọng nói không hợp lệ.",
      errorCode: err?.errorCode || "VOICE_SPEECH_ERROR",
    });
  }
};
