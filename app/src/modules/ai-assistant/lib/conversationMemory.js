/**
 * conversationMemory.js — pure helper functions for managing conversation state.
 * Does NOT manage state directly — state lives in aiContextStore.
 */

const MAX_MESSAGES = 20;

/**
 * Trim messages array to keep only the last MAX_MESSAGES entries.
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Array}
 */
export function trimMessages(messages) {
  return messages.slice(-MAX_MESSAGES);
}

/**
 * Build the API payload for the chat endpoint.
 * @param {Array<{role: string, content: string}>} history - Full conversation history
 * @param {string} newMessage - New user message
 * @returns {{ messages: Array, newMessage: string }}
 */
export function buildApiPayload(history, newMessage) {
  const recent = trimMessages(history);
  return {
    messages: [...recent, { role: "user", content: newMessage }],
    newMessage,
  };
}

/**
 * Build a memory summary string for when history exceeds MAX_MESSAGES.
 * @param {Array<{role: string, content: string}>} history
 * @returns {string}
 */
export function buildMemorySummary(history) {
  const older = history.slice(0, -MAX_MESSAGES);
  if (older.length === 0) return "";
  return `[Tóm tắt ${older.length} tin nhắn trước: cuộc trò chuyện đang tiếp diễn]`;
}
