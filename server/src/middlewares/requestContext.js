import { AsyncLocalStorage } from "node:async_hooks";
import crypto from "node:crypto";

export const requestContext = new AsyncLocalStorage();
const VALID_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

/**
 * Middleware that extracts or generates a unique Correlation ID (x-request-id)
 * for every incoming HTTP request and binds it to AsyncLocalStorage.
 */
export const requestIdMiddleware = (req, res, next) => {
  const candidate =
    typeof req.headers["x-request-id"] === "string"
      ? req.headers["x-request-id"].trim()
      : "";
  const reqId = VALID_REQUEST_ID.test(candidate) ? candidate : crypto.randomUUID();

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
