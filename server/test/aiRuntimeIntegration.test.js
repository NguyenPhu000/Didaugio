import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DEFAULT_AI_CONFIG } from "../src/config/defaultAiConfig.js";
import {
  createAiRuntimeExecutionService,
} from "../src/services/ai/runtime/aiRuntimeExecution.js";
import {
  createAiNavigationService,
} from "../src/services/ai/aiNavigation.service.js";
import {
  buildChatSystemPrompt,
  renderConfiguredPrompt,
} from "../src/lib/promptBuilder.js";
import { createGroqClient } from "../src/services/ai/groq.service.js";

const files = [
  "groq.service.js",
  "aiStreaming.service.js",
  "itinerary.service.js",
  "hybridPlanner.service.js",
  "groqSpeech.service.js",
];

test("provider services no longer own hard-coded Groq runtime configuration", () => {
  for (const file of files) {
    const source = readFileSync(
      new URL(`../src/services/ai/${file}`, import.meta.url),
      "utf8",
    );
    assert.doesNotMatch(source, /process\.env\.GROQ_API_KEY/);
    assert.match(source, /runtime|providerOptions|modelParameters/);
  }
});

test("trip AI stops writing AiPromptHistory", () => {
  const source = readFileSync(
    new URL("../src/services/trip/tripAiPlanner.service.js", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /aiPromptHistory[\s\S]*?\.create/);
});

test("successful runtime execution returns the numeric metadata log id", async () => {
  const service = createAiRuntimeExecutionService({
    getRuntime: async () => ({
      status: "active",
      version: 4,
      configData: DEFAULT_AI_CONFIG,
      killSwitch: { enabled: false, message: null, updatedAt: null },
    }),
    logs: {
      reserveAiRequest: async () => ({ id: 731 }),
      completeAiRequest: async () => ({ id: 731 }),
    },
    requestId: () => "runtime-uuid",
    now: () => 10,
  });

  const execution = await service.executeAiRequest({
    feature: "chat",
    user: { userId: 8 },
    inputText: "Xin chao",
    context: {},
    operation: async () => ({ outputText: "Chao ban" }),
  });

  assert.equal(execution.requestId, "runtime-uuid");
  assert.equal(execution.requestLogId, 731);
});

test("only successful production text features receive a rateable log id", async () => {
  const completions = [];
  let nextId = 730;
  const service = createAiRuntimeExecutionService({
    getRuntime: async () => ({
      status: "active",
      version: 4,
      configData: DEFAULT_AI_CONFIG,
      killSwitch: { enabled: false, message: null, updatedAt: null },
    }),
    logs: {
      reserveAiRequest: async () => ({ id: ++nextId }),
      completeAiRequest: async (...input) => completions.push(input),
    },
    requestId: (() => {
      let sequence = 0;
      return () => `runtime-${++sequence}`;
    })(),
    now: () => 10,
  });

  const cases = [
    {
      feature: "chat",
      result: { reply: "" },
      expectedErrorCode: "AI_EMPTY_OUTPUT",
    },
    {
      feature: "chat",
      result: { reply: "", suggestedPlaceIds: [3] },
      expectedErrorCode: "AI_EMPTY_OUTPUT",
    },
    {
      feature: "voice-introduction",
      result: { outputText: "   " },
      expectedErrorCode: "AI_EMPTY_OUTPUT",
    },
    {
      feature: "voice-transcription",
      result: { text: "transport transcript" },
      expectedErrorCode: null,
    },
    {
      feature: "voice-speech",
      result: { outputText: "binary transport" },
      expectedErrorCode: null,
    },
  ];

  for (const item of cases) {
    const execution = await service.executeAiRequest({
      feature: item.feature,
      user: { userId: 8 },
      inputText: "safe input",
      context: {},
      operation: async () => item.result,
    });
    assert.equal(execution.requestLogId, undefined);
    assert.deepEqual(execution.result, item.result);
  }

  assert.deepEqual(
    completions.map(([, metadata]) => ({
      status: metadata.status,
      errorCode: metadata.errorCode,
    })),
    cases.map((item) => ({
      status: item.expectedErrorCode ? "error" : "success",
      errorCode: item.expectedErrorCode,
    })),
  );

  for (const feature of ["planner", "voice-introduction"]) {
    const execution = await service.executeAiRequest({
      feature,
      user: { userId: 8 },
      inputText: "safe input",
      context: {},
      operation: async () => ({ outputText: "completed assistant text" }),
    });
    assert.equal(Number.isSafeInteger(execution.requestLogId), true);
  }
});

test("navigation sanitizes all provider-bound labels and safety checks them", async () => {
  const providerPrompts = [];
  const runtime = createAiRuntimeExecutionService({
    getRuntime: async () => ({
      status: "active",
      version: 4,
      configData: {
        ...DEFAULT_AI_CONFIG,
        safety: {
          ...DEFAULT_AI_CONFIG.safety,
          blockedKeywords: ["blocked-navigation-token"],
        },
      },
      killSwitch: { enabled: false, message: null, updatedAt: null },
    }),
    logs: {
      reserveAiRequest: async () => ({ id: 801 }),
      completeAiRequest: async () => ({ id: 801 }),
    },
    requestId: () => "navigation-runtime",
    now: () => 10,
  });
  const navigation = createAiNavigationService({
    executeRequest: runtime.executeAiRequest,
    resolveProviderOptions: async () => ({
      model: "model",
      temperature: 0,
      topP: 1,
      maxTokens: 256,
      timeoutMs: 3_000,
    }),
    createClient: () => ({
      chat: {
        completions: {
          create: async ({ messages }) => {
            providerPrompts.push(messages[0].content);
            return {
              choices: [{
                message: {
                  content: JSON.stringify({
                    recommendation: { routeId: "route-1" },
                  }),
                },
              }],
            };
          },
        },
      },
    }),
  });
  const secret = "must-never-reach-provider";
  const oversized = `bounded-${"x".repeat(2_000)}-tail-secret`;

  await navigation.getNavigationAdvice({
    origin: {
      name: "Safe origin",
      email: secret,
      coordinates: { latitude: 10, longitude: 105 },
      disallowed: secret,
    },
    destination: { name: "Safe destination", phone: secret },
    routes: [{
      id: "route-1",
      distance: 100,
      duration: 90,
      summary: oversized,
      email: secret,
      geometry: { coordinates: [10, 105] },
    }],
    context: { question: "safe question" },
  });

  assert.equal(providerPrompts.length, 1);
  assert.equal(providerPrompts[0].includes(secret), false);
  assert.equal(providerPrompts[0].includes("tail-secret"), false);
  assert.equal(providerPrompts[0].includes("latitude"), false);
  assert.equal(providerPrompts[0].includes("longitude"), false);
  assert.equal(providerPrompts[0].length < 4_000, true);

  for (const blocked of [
    { origin: { name: "blocked-navigation-token" } },
    { destination: { name: "blocked-navigation-token" } },
    { context: { question: "blocked-navigation-token" } },
    { context: { time: "blocked-navigation-token" } },
    { context: { vehicleType: "blocked-navigation-token" } },
    { routes: [{ id: "blocked-navigation-token", distance: 1, duration: 1, summary: "safe" }] },
    { routes: [{ id: "route-1", distance: 1, duration: 1, summary: "blocked-navigation-token" }] },
  ]) {
    await navigation.getNavigationAdvice({
      origin: { name: "origin" },
      destination: { name: "destination" },
      routes: [{ id: "route-1", distance: 1, duration: 1, summary: "safe" }],
      ...blocked,
    });
  }

  for (const blocked of [
    { origin: { name: "blocked-navigation-token" } },
    { destination: { name: "blocked-navigation-token" } },
    { waypoints: [{ name: "blocked-navigation-token" }] },
  ]) {
    await navigation.getWaypointOrderAdvice({
      origin: { name: "origin" },
      destination: { name: "destination" },
      waypoints: [{ name: "safe" }],
      ...blocked,
    });
  }
  assert.equal(providerPrompts.length, 1);
});

test("configured prompts are appended ahead of server-owned output rules", () => {
  const prompt = buildChatSystemPrompt(
    {
      currentCity: "Can Tho",
      systemPlaces: [{ id: 3, name: "Ben Ninh Kieu" }],
    },
    "Custom persona for {{currentCity}}",
  );

  assert.match(prompt, /^Custom persona for Can Tho/);
  assert.match(prompt, /CHỈ ĐƯỢC PHÉP/);
  assert.match(prompt, /\[PLACES: id1, id2, \.\.\.\]/);
});

test("unknown configured prompt variables fail with a stable client error", () => {
  assert.throws(
    () => renderConfiguredPrompt("Hello {{unknownField}}", {}),
    (error) =>
      error.code === "AI_INVALID_REQUEST" &&
      error.statusCode === 400,
  );
});

test("Groq client creation fails safely when the published credential is absent", () => {
  assert.throws(
    () => createGroqClient({ baseUrl: "https://api.groq.com" }),
    (error) =>
      error.code === "AI_SECRET_UNAVAILABLE" &&
      error.statusCode === 503 &&
      !error.message.includes("GROQ_API_KEY"),
  );
});
