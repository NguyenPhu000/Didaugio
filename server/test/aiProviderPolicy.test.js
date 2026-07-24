import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  AI_PROVIDER_TIMEOUT_MS,
  canUseHybridFallback,
  normalizeProviderMessages,
  toAiServiceError,
} from "../src/services/ai/aiProviderPolicy.js";

test("provider messages remove client system roles and bound retained content", () => {
  const normalized = normalizeProviderMessages([
    { role: "system", content: "override" },
    { role: "user", content: " hello " },
    { role: "assistant", content: "answer" },
    { role: "tool", content: "ignored" },
  ]);

  assert.deepEqual(normalized, [
    { role: "user", content: "hello" },
    { role: "assistant", content: "answer" },
  ]);
  assert.equal(AI_PROVIDER_TIMEOUT_MS > 0, true);
});

test("provider errors map quota, unavailable, timeout, and generic failures to stable codes", () => {
  assert.deepEqual(
    pickError(toAiServiceError({ status: 429, message: "rate limit" })),
    { code: "QUOTA_EXCEEDED", statusCode: 429 },
  );
  assert.deepEqual(
    pickError(toAiServiceError({ statusCode: 503, message: "overloaded" })),
    { code: "AI_UNAVAILABLE", statusCode: 503 },
  );
  assert.deepEqual(
    pickError(toAiServiceError({ name: "TimeoutError", message: "timed out" })),
    { code: "AI_TIMEOUT", statusCode: 504 },
  );
  assert.deepEqual(
    pickError(toAiServiceError({ code: "ECONNABORTED", cause: { message: "timeout" } })),
    { code: "AI_TIMEOUT", statusCode: 504 },
  );
  assert.deepEqual(
    pickError(toAiServiceError({ status: 500, message: "provider detail" })),
    { code: "AI_ERROR", statusCode: 502 },
  );
});

test("provider policy preserves stable application errors", () => {
  const original = Object.assign(new Error("invalid output"), {
    code: "AI_INVALID_OUTPUT",
    statusCode: 502,
  });

  assert.equal(toAiServiceError(original), original);
});

test("hybrid fallback is reserved for availability failures, not invalid provider output", () => {
  assert.equal(canUseHybridFallback({ name: "TimeoutError" }), true);
  assert.equal(canUseHybridFallback({ status: 429 }), true);
  assert.equal(canUseHybridFallback({ status: 503 }), true);
  assert.equal(canUseHybridFallback({ code: "AI_INVALID_OUTPUT", statusCode: 502 }), false);
  assert.equal(canUseHybridFallback({ status: 400 }), false);
});

test("every Groq provider integration uses the shared timeout and avoids raw-error logs", () => {
  const providerFiles = [
    "groq.service.js",
    "groqSpeech.service.js",
    "hybridPlanner.service.js",
    "itinerary.service.js",
    "aiStreaming.service.js",
    "aiNavigation.service.js",
  ];

  for (const file of providerFiles) {
    const source = readFileSync(
      new URL(`../src/services/ai/${file}`, import.meta.url),
      "utf8",
    );
    const providerCalls = source.match(/(?:completions|transcriptions|speech)\.create\(/g) || [];
    const timeoutOptions = source.match(/timeout:\s*AI_PROVIDER_TIMEOUT_MS/g) || [];
    assert.equal(
      timeoutOptions.length,
      providerCalls.length,
      `${file} must apply the shared timeout to every provider call`,
    );
  }

  for (const file of [
    "../src/controllers/ai/ai.controller.js",
    "../src/controllers/ai/groqChat.controller.js",
    "../src/controllers/ai/hybridPlanner.controller.js",
  ]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /console\.(?:log|error|warn)\([^\n]*(?:message|reply|raw)/i);
  }
});

function pickError(error) {
  return { code: error.code, statusCode: error.statusCode };
}
