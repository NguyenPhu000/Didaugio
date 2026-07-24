import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSseErrorPayload,
  encodeSseData,
} from "../src/services/ai/aiStreaming.service.js";

test("SSE encoding preserves multiline text as one valid event", () => {
  assert.equal(
    encodeSseData("dong 1\ndong 2\r\ndong 3"),
    "data: dong 1\ndata: dong 2\ndata: dong 3\n\n",
  );
});

test("SSE provider errors expose only a stable application code", () => {
  const payload = buildSseErrorPayload({
    name: "TimeoutError",
    message: "private upstream timeout detail",
  });

  assert.equal(payload, "[ERROR] AI_TIMEOUT");
  assert.equal(payload.includes("private"), false);
  assert.equal(encodeSseData(payload), "data: [ERROR] AI_TIMEOUT\n\n");
});
