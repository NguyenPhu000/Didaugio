import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  AI_PROVIDER_TIMEOUT_MS,
  canUseHybridFallback,
  normalizeProviderMessages,
  toAiServiceError,
} from "../src/services/ai/aiProviderPolicy.js";
import { requestNavigationCompletion } from "../src/services/ai/aiNavigation.service.js";

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

test("navigation provider calls emit metadata-only success and stable failure events", async () => {
  const events = [];
  const originalInfo = console.info;
  console.info = (...args) => events.push(args);

  try {
    const providerOptions = {
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.3,
      topP: 0.9,
      maxTokens: 800,
      timeoutMs: 12_345,
    };
    const completion = { usage: { total_tokens: 21 }, choices: [{ finish_reason: "stop" }] };
    const client = {
      chat: { completions: { create: async (_request, options) => {
        assert.deepEqual(options, { timeout: providerOptions.timeoutMs });
        return completion;
      } } },
    };

    assert.equal(
      await requestNavigationCompletion({
        client,
        prompt: "private navigation prompt",
        feature: "navigation-route-advice",
        providerOptions,
      }),
      completion,
    );

    await assert.rejects(
      requestNavigationCompletion({
        client: { chat: { completions: { create: async () => { throw { status: 503 }; } } } },
        prompt: "private failure prompt",
        feature: "navigation-waypoint-order",
        providerOptions,
      }),
      (error) => error.code === "AI_UNAVAILABLE",
    );
  } finally {
    console.info = originalInfo;
  }

  assert.deepEqual(events[0][0], "[AI]");
  assert.deepEqual(events[0][1], {
    feature: "navigation-route-advice",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    latencyMs: events[0][1].latencyMs,
    totalTokens: 21,
    finishReason: "stop",
  });
  assert.deepEqual(events[1][1], {
    feature: "navigation-waypoint-order",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    latencyMs: events[1][1].latencyMs,
    totalTokens: null,
    finishReason: null,
    code: "AI_UNAVAILABLE",
  });
  assert.equal(JSON.stringify(events).includes("private"), false);
});

test("every Groq provider integration uses the published timeout and avoids raw-error logs", () => {
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
    const timeoutOptions =
      source.match(/timeout:\s*(?:providerOptions\.)?timeoutMs/g) || [];
    assert.equal(
      timeoutOptions.length,
      providerCalls.length,
      `${file} must apply the published timeout to every provider call`,
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
