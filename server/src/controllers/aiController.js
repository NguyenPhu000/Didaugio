import { geminiModel } from "../config/geminiClient.js";
import { getPlaceById } from "../services/placeService.js";
import { streamPlaceSummary, streamChat } from "../services/aiStreamingService.js";
import { buildVoiceIntroPrompt, buildChatSystemPrompt } from "../lib/promptBuilder.js";
import { geminiErrorHandler } from "../lib/geminiErrorHandler.js";

export const handlePlaceSummaryStream = geminiErrorHandler(async (req, res) => {
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

  const prompt = buildVoiceIntroPrompt(place, context ?? {});
  await streamPlaceSummary(prompt, res);
});

export const handleChat = geminiErrorHandler(async (req, res) => {
  const { messages, context, stream = false } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "messages là bắt buộc và phải là mảng không rỗng",
      errorCode: "MISSING_MESSAGES",
    });
  }

  const system = buildChatSystemPrompt(context ?? {});

  if (stream) {
    await streamChat(messages, system, res);
    return;
  }

  const result = await geminiModel.generateContent({
    systemInstruction: system,
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  });

  res.json({
    success: true,
    data: { message: result.response.text() },
    message: "Thành công",
  });
});
