/**
 * In-memory registry of SSE connections keyed by userId.
 * Each connection is { res, lastEventId }.
 */
const clients = new Map();

/**
 * SSE headers — same pattern as aiStreaming.service.js
 */
const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

/**
 * Register a new SSE client connection.
 */
export const registerClient = (userId, res, lastEventId = 0) => {
  const client = { res, lastEventId };
  if (!clients.has(userId)) {
    clients.set(userId, []);
  }
  clients.get(userId).push(client);

  // Cleanup on close
  res.on("close", () => {
    const userClients = clients.get(userId);
    if (userClients) {
      const idx = userClients.indexOf(client);
      if (idx !== -1) userClients.splice(idx, 1);
      if (userClients.length === 0) clients.delete(userId);
    }
  });

  return client;
};

/**
 * Push a notification event to all SSE clients for a given userId.
 */
export const pushToUser = (userId, event, data) => {
  const userClients = clients.get(Number(userId));
  if (!userClients || userClients.length === 0) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\nid: ${Date.now()}\n\n`;
  for (const { res } of userClients) {
    try {
      res.write(payload);
    } catch {
      // connection may have closed
    }
  }
};

/**
 * Express handler: GET /api/notifications/stream
 * Opens SSE connection for the authenticated user.
 */
export const sseHandler = (req, res) => {
  const userId = req.user.userId;

  // Set SSE headers using Express API (avoid writeHead conflict)
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();

  res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`);

  const lastEventId = Number(req.headers["last-event-id"] || 0);
  registerClient(userId, res, lastEventId);
};

/**
 * Get count of connected clients (for debugging).
 */
export const getConnectedCount = () => {
  let total = 0;
  for (const arr of clients.values()) total += arr.length;
  return total;
};
