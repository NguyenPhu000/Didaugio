/**
 * conversationMemory.js — pure helper functions for managing conversation state.
 * Does NOT manage state directly — state lives in aiContextStore.
 */
import i18n from "@/i18n";

export const MAX_AI_MESSAGES = 20;
export const MAX_AI_MESSAGE_CHARS = 4000;
export const MAX_AI_TOTAL_CHARS = 16000;

/**
 * Trim messages array to keep only the last MAX_MESSAGES entries.
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Array}
 */
export function trimMessages(messages) {
  return (Array.isArray(messages) ? messages : []).slice(-MAX_AI_MESSAGES);
}

/**
 * Normalize messages for the chat API without sending untrusted roles or an
 * unbounded amount of conversation text.
 * @param {Array<{role: string, content?: string, text?: string}>} messages
 * @returns {Array<{role: "user" | "assistant", content: string}>}
 */
export function normalizeConversationMessages(messages) {
  const normalized = [];
  let totalChars = 0;
  const input = Array.isArray(messages) ? messages : [];

  for (let index = input.length - 1; index >= 0; index -= 1) {
    if (normalized.length >= MAX_AI_MESSAGES || totalChars >= MAX_AI_TOTAL_CHARS) {
      break;
    }

    const message = input[index];
    if (message?.role !== "user" && message?.role !== "assistant") continue;

    const rawContent = message.text ?? message.content ?? "";
    const content = String(rawContent).slice(0, MAX_AI_MESSAGE_CHARS);
    const remainingChars = MAX_AI_TOTAL_CHARS - totalChars;
    const boundedContent = content.slice(0, remainingChars);

    normalized.push({ role: message.role, content: boundedContent });
    totalChars += boundedContent.length;
  }

  return normalized.reverse();
}

/**
 * Build the API payload for the chat endpoint.
 * @param {Array<{role: string, content: string}>} history - Full conversation history
 * @param {string} newMessage - New user message
 * @returns {{ messages: Array, newMessage: string }}
 */
export function buildApiPayload(history, newMessage) {
  const messages = normalizeConversationMessages([
    ...(Array.isArray(history) ? history : []),
    { role: "user", content: newMessage },
  ]);
  return {
    messages,
    newMessage,
  };
}

/**
 * Build a memory summary string for when history exceeds MAX_MESSAGES.
 * @param {Array<{role: string, content: string}>} history
 * @returns {string}
 */
export function buildMemorySummary(history) {
  const older = history.slice(0, -MAX_AI_MESSAGES);
  if (older.length === 0) return "";
  return i18n.t("aiChat.memorySummary", { count: older.length });
}
