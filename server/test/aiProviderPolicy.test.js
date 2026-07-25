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
import {
  aiConfigDataSchema,
} from "../src/models/schemas/adminAi/adminAi.schema.js";
import { DEFAULT_AI_CONFIG } from "../src/config/defaultAiConfig.js";

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
  assert.equal(canUseHybridFallback({
    code: "AI_DISABLED",
    statusCode: 503,
  }), true);
  assert.equal(canUseHybridFallback({
    code: "AI_MAINTENANCE",
    statusCode: 503,
  }), true);
  assert.equal(canUseHybridFallback({ code: "AI_INVALID_OUTPUT", statusCode: 502 }), false);
  assert.equal(canUseHybridFallback({ status: 400 }), false);
});

test("provider URL policy accepts the approved Groq origin and rejects alternate or private destinations", () => {
  const withBaseUrl = (baseUrl) => ({
    ...DEFAULT_AI_CONFIG,
    provider: {
      ...DEFAULT_AI_CONFIG.provider,
      baseUrl,
    },
  });

  for (const baseUrl of [
    "https://api.groq.com",
    "https://api.groq.com/openai/v1?region=vn",
  ]) {
    assert.equal(
      aiConfigDataSchema.safeParse(withBaseUrl(baseUrl)).success,
      true,
      baseUrl,
    );
  }

  for (const baseUrl of [
    "http://api.groq.com",
    "https://api.groq.com:444",
    "https://api.groq.com.evil.example",
    "https://sub.api.groq.com",
    "http://127.0.0.1:11434",
    "http://169.254.169.254/latest/meta-data",
    "http://10.0.0.1",
    "http://172.16.0.1",
    "http://192.168.1.1",
    "not-a-url",
  ]) {
    assert.equal(
      aiConfigDataSchema.safeParse(withBaseUrl(baseUrl)).success,
      false,
      baseUrl,
    );
  }
});
test("navigation provider calls emit metadata-only success events", async () => {
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
  assert.equal(JSON.stringify(events).includes("private"), false);
});

test("navigation provider failures expose only exact public errors and metadata for direct and nested causes", async () => {
  const cases = [
    {
      label: "timeout",
      upstreamError: (sentinel) => ({
        name: "TimeoutError",
        message: sentinel,
      }),
      expected: {
        code: "AI_TIMEOUT",
        errorCode: "AI_TIMEOUT",
        statusCode: 504,
        message: "AI provider request timed out.",
      },
    },
    {
      label: "nested timeout",
      upstreamError: (sentinel) => ({
        message: "outer provider failure",
        cause: { code: "ETIMEDOUT", message: sentinel },
      }),
      expected: {
        code: "AI_TIMEOUT",
        errorCode: "AI_TIMEOUT",
        statusCode: 504,
        message: "AI provider request timed out.",
      },
    },
    {
      label: "quota",
      upstreamError: (sentinel) => ({ status: 429, message: sentinel }),
      expected: {
        code: "QUOTA_EXCEEDED",
        errorCode: "QUOTA_EXCEEDED",
        statusCode: 429,
        message: "AI provider quota exceeded.",
      },
    },
    {
      label: "nested quota",
      upstreamError: (sentinel) => ({
        message: "outer provider failure",
        cause: { statusCode: 429, message: sentinel },
      }),
      expected: {
        code: "QUOTA_EXCEEDED",
        errorCode: "QUOTA_EXCEEDED",
        statusCode: 429,
        message: "AI provider quota exceeded.",
      },
    },
    {
      label: "unavailable",
      upstreamError: (sentinel) => ({ status: 503, message: sentinel }),
      expected: {
        code: "AI_UNAVAILABLE",
        errorCode: "AI_UNAVAILABLE",
        statusCode: 503,
        message: "AI provider is unavailable.",
      },
    },
    {
      label: "nested unavailable",
      upstreamError: (sentinel) => ({
        message: "outer provider failure",
        cause: { statusCode: 503, message: sentinel },
      }),
      expected: {
        code: "AI_UNAVAILABLE",
        errorCode: "AI_UNAVAILABLE",
        statusCode: 503,
        message: "AI provider is unavailable.",
      },
    },
    {
      label: "generic",
      upstreamError: (sentinel) => ({ status: 500, message: sentinel }),
      expected: {
        code: "AI_ERROR",
        errorCode: "AI_ERROR",
        statusCode: 502,
        message: "AI provider request failed.",
      },
    },
    {
      label: "nested generic",
      upstreamError: (sentinel) => ({
        message: "outer provider failure",
        cause: { statusCode: 500, message: sentinel },
      }),
      expected: {
        code: "AI_ERROR",
        errorCode: "AI_ERROR",
        statusCode: 502,
        message: "AI provider request failed.",
      },
    },
  ];
  const providerOptions = {
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    temperature: 0.3,
    topP: 0.9,
    maxTokens: 800,
    timeoutMs: 12_345,
  };
  const events = [];
  const originalInfo = console.info;
  console.info = (...args) => events.push(args);

  try {
    for (const [index, providerCase] of cases.entries()) {
      const sentinel = `PRIVATE_${index}_${providerCase.label.replaceAll(" ", "_")}`;
      const beforeEvents = events.length;
      let returnedError;
      try {
        await requestNavigationCompletion({
          client: {
            chat: {
              completions: {
                create: async () => {
                  throw providerCase.upstreamError(sentinel);
                },
              },
            },
          },
          prompt: `private prompt ${sentinel}`,
          feature: `navigation-${index}`,
          providerOptions,
        });
        assert.fail(`${providerCase.label} must reject`);
      } catch (error) {
        returnedError = error;
      }

      const publicError = {
        code: returnedError.code,
        errorCode: returnedError.errorCode,
        statusCode: returnedError.statusCode,
        message: returnedError.message,
      };
      assert.deepEqual(publicError, providerCase.expected, providerCase.label);
      assert.equal(
        JSON.stringify({
          ...publicError,
          stack: returnedError.stack,
          cause: returnedError.cause,
        }).includes(sentinel),
        false,
        `${providerCase.label} returned output must redact upstream details`,
      );

      assert.equal(events.length, beforeEvents + 1);
      assert.deepEqual(events.at(-1)[0], "[AI]");
      assert.deepEqual(events.at(-1)[1], {
        feature: `navigation-${index}`,
        model: providerOptions.model,
        latencyMs: events.at(-1)[1].latencyMs,
        totalTokens: null,
        finishReason: null,
        code: providerCase.expected.code,
      });
      assert.equal(
        JSON.stringify(events.at(-1)).includes(sentinel),
        false,
        `${providerCase.label} logged output must redact upstream details`,
      );
    }
  } finally {
    console.info = originalInfo;
  }
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
