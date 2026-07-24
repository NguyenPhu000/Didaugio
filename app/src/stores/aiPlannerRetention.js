export const MAX_MESSAGES = 20;
export const MESSAGE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export function normalizeMessageCreatedAt(createdAt, now = new Date()) {
  const parsed = new Date(createdAt);
  return Number.isFinite(parsed.getTime())
    ? parsed.toISOString()
    : now.toISOString();
}

export function trimPersistedMessages(messages, now = new Date()) {
  const cutoff = now.getTime() - MESSAGE_RETENTION_MS;
  return (Array.isArray(messages) ? messages : [])
    .filter((message) => {
      const timestamp = new Date(message?.createdAt || 0).getTime();
      return Number.isFinite(timestamp) && timestamp >= cutoff;
    })
    .slice(-MAX_MESSAGES);
}
