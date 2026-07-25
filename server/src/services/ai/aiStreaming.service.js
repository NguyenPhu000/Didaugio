import { createGroqClient } from "./groq.service.js";
import {
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

export function encodeSseEvent(event, data) {
  return `event: ${event}\n${encodeSseData(JSON.stringify(data))}`;
}

export function buildSseErrorPayload(error) {
  return `[ERROR] ${toAiServiceError(error).code}`;
}

/**
 * Stream a place voice introduction via SSE.
 * @param {string} prompt
 * @param {import('express').Response} res
 */
export async function streamPlaceSummary(
  prompt,
  res,
  providerOptions = {},
) {
  Object.entries(SSE_HEADERS).forEach(([key, value]) =>
    res.setHeader(key, value),
  );

  const startedAt = Date.now();
  let outputText = "";
  try {
    const client = createGroqClient(providerOptions);
    const stream = await client.chat.completions.create({
      model: providerOptions.model,
      messages: normalizeProviderMessages([{ role: "user", content: prompt }]),
      temperature: providerOptions.temperature,
      top_p: providerOptions.topP,
      max_tokens: providerOptions.maxTokens,
      stream: true,
    }, { timeout: providerOptions.timeoutMs });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        outputText += text;
      }
    }
    logAiProviderEvent({
      feature: "place-summary-stream",
      model: providerOptions.model,
      startedAt,
    });
    return { outputText };
  } catch (err) {
    const aiError = toAiServiceError(err);
    logAiProviderEvent({
      feature: "place-summary-stream",
      model: providerOptions.model,
      startedAt,
      code: aiError.code,
    });
    throw aiError;
  }
}

/**
 * Stream a chat response via SSE.
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} system  - System instruction for Genie persona
 * @param {import('express').Response} res
 */
export async function streamChat(
  messages,
  system,
  res,
  providerOptions = {},
) {
  Object.entries(SSE_HEADERS).forEach(([key, value]) =>
    res.setHeader(key, value),
  );

  const startedAt = Date.now();
  let outputText = "";
  try {
    const client = createGroqClient(providerOptions);
    const stream = await client.chat.completions.create({
      model: providerOptions.model,
      messages: [
        { role: "system", content: system },
        ...normalizeProviderMessages(messages),
      ],
      temperature: providerOptions.temperature,
      top_p: providerOptions.topP,
      max_tokens: providerOptions.maxTokens,
      stream: true,
    }, { timeout: providerOptions.timeoutMs });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        outputText += text;
      }
    }
    logAiProviderEvent({
      feature: "chat-stream",
      model: providerOptions.model,
      startedAt,
    });
    return { outputText };
  } catch (err) {
    const aiError = toAiServiceError(err);
    logAiProviderEvent({
      feature: "chat-stream",
      model: providerOptions.model,
      startedAt,
      code: aiError.code,
    });
    throw aiError;
  }
}
