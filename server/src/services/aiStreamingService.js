import { geminiModel } from "../config/geminiClient.js";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

function writeSSE(res, data) {
  res.write(`data: ${data}\n\n`);
}

/**
 * Stream a place voice introduction via SSE.
 * @param {string} prompt
 * @param {import('express').Response} res
 */
export async function streamPlaceSummary(prompt, res) {
  Object.entries(SSE_HEADERS).forEach(([key, value]) => res.setHeader(key, value));

  try {
    const result = await geminiModel.generateContentStream(prompt);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) writeSSE(res, text);
    }
    writeSSE(res, "[DONE]");
  } catch (err) {
    writeSSE(res, `[ERROR] ${err.message}`);
  } finally {
    res.end();
  }
}

/**
 * Stream a chat response via SSE.
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} system  - System instruction for Chị Mai persona
 * @param {import('express').Response} res
 */
export async function streamChat(messages, system, res) {
  Object.entries(SSE_HEADERS).forEach(([key, value]) => res.setHeader(key, value));

  try {
    const result = await geminiModel.generateContentStream({
      systemInstruction: system,
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) writeSSE(res, text);
    }
    writeSSE(res, "[DONE]");
  } catch (err) {
    writeSSE(res, `[ERROR] ${err.message}`);
  } finally {
    res.end();
  }
}
