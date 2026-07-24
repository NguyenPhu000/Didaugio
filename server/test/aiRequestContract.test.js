import assert from "node:assert/strict";
import test from "node:test";
import {
  aiChatSchema,
  aiHybridPlanSchema,
  aiPlaceSummarySchema,
  aiSpeechSchema,
} from "../src/models/schemas/ai/ai.schema.js";

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
