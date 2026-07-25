import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DEFAULT_AI_CONFIG } from "../src/config/defaultAiConfig.js";
import {
  createAiRuntimeExecutionService,
} from "../src/services/ai/runtime/aiRuntimeExecution.js";
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
