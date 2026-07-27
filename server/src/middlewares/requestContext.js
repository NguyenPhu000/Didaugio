import { AsyncLocalStorage } from "node:async_hooks";
import crypto from "node:crypto";

export const requestContext = new AsyncLocalStorage();

/**
 * Middleware that extracts or generates a unique Correlation ID (x-request-id)
 * for every incoming HTTP request and binds it to AsyncLocalStorage.
 */
export const requestIdMiddleware = (req, res, next) => {
  const reqId =
    (typeof req.headers["x-request-id"] === "string" && req.headers["x-request-id"].trim()) ||
    crypto.randomUUID();

  res.setHeader("x-request-id", reqId);

  const store = new Map([["requestId", reqId]]);
  requestContext.run(store, () => next());
};

/**
 * Get current request ID from AsyncLocalStorage store if present.
 * @returns {string|null}
 */
export function getRequestId() {
  return requestContext.getStore()?.get("requestId") || null;
}
