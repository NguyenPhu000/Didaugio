import { createGroqClient, GROQ_MODEL } from "./groq.service.js";
import {
  AI_PROVIDER_TIMEOUT_MS,
  logAiProviderEvent,
  normalizeProviderMessages,
  toAiServiceError,
} from "./aiProviderPolicy.js";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

export function encodeSseData(data) {
  const lines = String(data ?? "").split(/\r\n|\r|\n/);
  return `${lines.map((line) => `data: ${line}`).join("\n")}\n\n`;
}

export function buildSseErrorPayload(error) {
  return `[ERROR] ${toAiServiceError(error).code}`;
}

function writeSSE(res, data) {
  res.write(encodeSseData(data));
}

/**
 * Stream a place voice introduction via SSE.
 * @param {string} prompt
 * @param {import('express').Response} res
 */
export async function streamPlaceSummary(prompt, res) {
  Object.entries(SSE_HEADERS).forEach(([key, value]) =>
    res.setHeader(key, value),
  );

  const startedAt = Date.now();
  try {
    const client = createGroqClient();
    const stream = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: normalizeProviderMessages([{ role: "user", content: prompt }]),
      temperature: 0.6,
      max_tokens: 1500,
      stream: true,
    }, { timeout: AI_PROVIDER_TIMEOUT_MS });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) writeSSE(res, text);
    }
    writeSSE(res, "[DONE]");
    logAiProviderEvent({ feature: "place-summary-stream", model: GROQ_MODEL, startedAt });
  } catch (err) {
    const aiError = toAiServiceError(err);
    logAiProviderEvent({
      feature: "place-summary-stream",
      model: GROQ_MODEL,
      startedAt,
      code: aiError.code,
    });
    writeSSE(res, buildSseErrorPayload(aiError));
  } finally {
    res.end();
  }
}

/**
 * Stream a chat response via SSE.
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} system  - System instruction for Genie persona
 * @param {import('express').Response} res
 */
export async function streamChat(messages, system, res) {
  Object.entries(SSE_HEADERS).forEach(([key, value]) =>
    res.setHeader(key, value),
  );

  const startedAt = Date.now();
  try {
    const client = createGroqClient();
    const stream = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: system },
        ...normalizeProviderMessages(messages),
      ],
      temperature: 0.6,
      max_tokens: 1500,
      stream: true,
    }, { timeout: AI_PROVIDER_TIMEOUT_MS });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) writeSSE(res, text);
    }
    writeSSE(res, "[DONE]");
    logAiProviderEvent({ feature: "chat-stream", model: GROQ_MODEL, startedAt });
  } catch (err) {
    const aiError = toAiServiceError(err);
    logAiProviderEvent({
      feature: "chat-stream",
      model: GROQ_MODEL,
      startedAt,
      code: aiError.code,
    });
    writeSSE(res, buildSseErrorPayload(aiError));
  } finally {
    res.end();
  }
}
