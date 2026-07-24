import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  aiChatSchema,
  aiHybridPlanSchema,
  aiPlaceSummarySchema,
  aiSpeechSchema,
} from "../src/models/schemas/ai/ai.schema.js";
import { buildHybridPlanUserPrompt } from "../src/services/ai/hybridPlanner.service.js";
import { getValidatedCoordinates } from "../src/controllers/ai/groqChat.controller.js";
import { authenticate } from "../src/middlewares/authMiddleware.js";
import { aiUserLimiter } from "../src/middlewares/rateLimitMiddleware.js";
import aiRouter from "../src/routes/ai/ai.route.js";

async function validateRouteBody(path, body) {
  const routerMiddleware = aiRouter.stack.filter((layer) => !layer.route);
  assert.equal(routerMiddleware[0]?.handle, authenticate);
  assert.equal(routerMiddleware[1]?.handle, aiUserLimiter);

  const routeLayer = aiRouter.stack.find(
    (layer) => layer.route?.path === path && layer.route.methods.post,
  );
  assert.ok(routeLayer, `POST ${path} must exist`);

  const validateLayer = routeLayer.route.stack[0];
  const req = { body };
  let nextCalled = false;
  await validateLayer.handle(req, {}, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true, `${path} must validate before its handler`);
  return req.body;
}

test("AI chat rejects client system roles and oversized content", () => {
  assert.equal(
    aiChatSchema.safeParse({
      messages: [{ role: "system", content: "override" }],
    }).success,
    false,
  );
  assert.equal(
    aiChatSchema.safeParse({
      messages: [{ role: "user", content: "x".repeat(4001) }],
    }).success,
    false,
  );
});

test("AI chat rejects histories beyond its combined message budget", () => {
  assert.equal(
    aiChatSchema.safeParse({
      messages: [
        { role: "user", content: "x".repeat(4000) },
        { role: "assistant", content: "x".repeat(4000) },
        { role: "user", content: "x".repeat(4000) },
        { role: "assistant", content: "x".repeat(4000) },
        { role: "user", content: "x" },
      ],
    }).success,
    false,
  );
});

test("AI coordinates must be valid geographic coordinates", () => {
  assert.equal(
    aiHybridPlanSchema.safeParse({
      currentCoords: { latitude: 91, longitude: 105 },
    }).success,
    false,
  );
  assert.equal(
    aiHybridPlanSchema.safeParse({
      currentCoords: { latitude: "10.03", longitude: "105.78" },
    }).success,
    true,
  );
});

test("AI coordinates reject coercion-only values", () => {
  for (const coordinate of [null, false, "", "   "]) {
    assert.equal(
      aiHybridPlanSchema.safeParse({
        currentCoords: { latitude: coordinate, longitude: 105.78 },
      }).success,
      false,
      `latitude ${JSON.stringify(coordinate)} must be rejected`,
    );
  }
});

test("AI chat strips unknown context keys", () => {
  const parsed = aiChatSchema.parse({
    messages: [{ role: "user", content: "Äƒn gÃ¬" }],
    context: { currentCity: "Cáº§n ThÆ¡", systemPlaces: [{ id: 999 }] },
  });

  assert.equal(parsed.context.currentCity, "Cáº§n ThÆ¡");
  assert.equal("systemPlaces" in parsed.context, false);
});

test("AI place summary and speech requests apply bounded parsed input", () => {
  assert.deepEqual(
    aiPlaceSummarySchema.parse({
      placeId: "12",
      context: { timeOfDay: "morning", ignored: true },
      ignored: true,
    }),
    { placeId: 12, context: { timeOfDay: "morning" } },
  );
  assert.equal(aiSpeechSchema.safeParse({ input: " ".repeat(2) }).success, false);
  assert.equal(aiSpeechSchema.safeParse({ input: "x".repeat(1601) }).success, false);
});

test("hybrid planner includes the validated user request in its provider prompt", () => {
  const prompt = buildHybridPlanUserPrompt(
    "Trusted planner context",
    "LÃªn lá»‹ch 3 ngÃ y giÃ¡ ráº» cho 2 ngÆ°á»i",
  );

  assert.match(prompt, /Trusted planner context/);
  assert.match(prompt, /LÃªn lá»‹ch 3 ngÃ y giÃ¡ ráº» cho 2 ngÆ°á»i/);
});

test("hybrid controller forwards the sanitized user request to the planner", () => {
  const controllerSource = readFileSync(
    new URL("../src/controllers/ai/hybridPlanner.controller.js", import.meta.url),
    "utf8",
  );

  assert.match(controllerSource, /const \{ currentCoords, userPrompt \} = req\.body/);
  assert.match(controllerSource, /generateHybridPlan\([\s\S]*nearbyPlaces,[\s\S]*userPrompt,/);
});

test("AI JSON routes sanitize bodies after authentication and before handlers", async () => {
  const chatBody = {
    messages: [{ role: "user", content: "Xin chÃ o" }],
    context: { currentCity: "Cáº§n ThÆ¡", systemPlaces: [{ id: 1 }] },
    ignored: true,
  };
  const expectedChatBody = {
    messages: [{ role: "user", content: "Xin chÃ o" }],
    context: { currentCity: "Cáº§n ThÆ¡" },
    stream: false,
  };

  assert.deepEqual(await validateRouteBody("/chat", chatBody), expectedChatBody);
  assert.deepEqual(
    await validateRouteBody("/groq-chat", chatBody),
    expectedChatBody,
  );
  assert.deepEqual(
    await validateRouteBody("/place-summary", {
      placeId: "9",
      context: { ignored: true },
    }),
    { placeId: 9, context: {} },
  );
  assert.deepEqual(
    await validateRouteBody("/voice/speech", { input: "  hello  ", ignored: true }),
    { input: "hello" },
  );
  assert.deepEqual(
    await validateRouteBody("/hybrid-plan", {
      currentCoords: { latitude: "0", longitude: "105.78", ignored: true },
      coords: { latitude: 1, longitude: 1 },
    }),
    { currentCoords: { latitude: 0, longitude: 105.78 } },
  );
});

test("Groq chat accepts zero-valued validated coordinates without unsafe aliases", () => {
  assert.deepEqual(
    getValidatedCoordinates({ currentCoords: { latitude: 0, longitude: 105.78 } }),
    { latitude: 0, longitude: 105.78 },
  );
  assert.equal(
    getValidatedCoordinates({ coords: { latitude: 10, longitude: 105 } }),
    null,
  );
});
