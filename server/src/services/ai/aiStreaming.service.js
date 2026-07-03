import { createGroqClient, GROQ_MODEL } from "./groq.service.js";

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
  Object.entries(SSE_HEADERS).forEach(([key, value]) =>
    res.setHeader(key, value),
  );

  try {
    const client = createGroqClient();
    const stream = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 1500,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) writeSSE(res, text);
    }
    writeSSE(res, "[DONE]");
  } catch (err) {
    const message = err?.message || "Lỗi khi streaming AI";
    writeSSE(res, `[ERROR] ${message.split("\n")[0]}`);
  } finally {
    res.end();
  }
}

/**
 * Stream a chat response via SSE.
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} system  - System instruction for em Nhi persona
 * @param {import('express').Response} res
 */
export async function streamChat(messages, system, res) {
  Object.entries(SSE_HEADERS).forEach(([key, value]) =>
    res.setHeader(key, value),
  );

  try {
    const client = createGroqClient();
    const stream = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      ],
      temperature: 0.6,
      max_tokens: 1500,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) writeSSE(res, text);
    }
    writeSSE(res, "[DONE]");
  } catch (err) {
    const message = err?.message || "Lỗi khi streaming AI";
    writeSSE(res, `[ERROR] ${message.split("\n")[0]}`);
  } finally {
    res.end();
  }
}
