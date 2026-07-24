import assert from "node:assert/strict";
import test from "node:test";
import { authenticate } from "../src/middlewares/authMiddleware.js";
import { aiUserLimiter } from "../src/middlewares/rateLimitMiddleware.js";
import aiRouter from "../src/routes/ai/ai.route.js";
import tripRouter from "../src/routes/trip/trip.route.js";
import navigationRouter from "../src/modules/navigation/navigation.routes.js";

function findPostRoute(router, path) {
  const layer = router.stack.find(
    (candidate) =>
      candidate.route?.path === path && candidate.route.methods.post,
  );
  assert.ok(layer, `POST ${path} must exist`);
  return layer.route.stack;
}

async function invokeValidation(handle, body) {
  const req = { body };
  let nextCalled = false;
  let response = null;
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      response = { statusCode: this.statusCode, payload };
      return this;
    },
  };

  await handle(req, res, () => {
    nextCalled = true;
  });

  return { req, nextCalled, response };
}

test("trip generation authenticates, rate-limits once, then validates before costly work", () => {
  const stack = findPostRoute(tripRouter, "/trips/generate");

  assert.equal(stack[0].handle, authenticate);
  assert.equal(stack[1].handle, aiUserLimiter);
  assert.equal(stack.filter((layer) => layer.handle === aiUserLimiter).length, 1);
  assert.equal(stack.at(-1).name, "generateTrip");
});

test("AI navigation applies the per-user limiter once after router authentication", () => {
  assert.equal(navigationRouter.stack[0].handle, authenticate);
  const stack = findPostRoute(navigationRouter, "/navigate");

  assert.equal(stack[0].handle, aiUserLimiter);
  assert.equal(stack.filter((layer) => layer.handle === aiUserLimiter).length, 1);
  assert.equal(stack.at(-1).name, "handleNavigationRecommendation");
});

test("transcription route limits before Multer and validates parsed multipart fields before controller", async () => {
  assert.equal(aiRouter.stack[0].handle, authenticate);
  assert.equal(aiRouter.stack[1].handle, aiUserLimiter);

  const stack = findPostRoute(aiRouter, "/voice/transcribe");
  assert.equal(stack[0].name, "multerMiddleware");
  assert.equal(stack.at(-1).name, "handleVoiceTranscribe");
  assert.equal(stack.length, 3, "post-Multer field validation must be present");

  const invalid = await invokeValidation(stack[1].handle, {
    language: "not_a_language",
    prompt: "x".repeat(1601),
  });
  assert.equal(invalid.nextCalled, false);
  assert.equal(invalid.response.statusCode, 400);
  assert.equal(invalid.response.payload.errorCode, "AI_INVALID_REQUEST");

  const valid = await invokeValidation(stack[1].handle, {
    language: " EN-us ",
    prompt: "  proper nouns  ",
    ignored: "drop",
  });
  assert.equal(valid.nextCalled, true);
  assert.deepEqual(valid.req.body, {
    language: "en-us",
    prompt: "proper nouns",
  });
});

test("AI JSON, trip generation, and AI navigation validation use AI_INVALID_REQUEST", async () => {
  const aiChat = findPostRoute(aiRouter, "/chat");
  const tripGenerate = findPostRoute(tripRouter, "/trips/generate");
  const navigate = findPostRoute(navigationRouter, "/navigate");

  for (const [handle, body] of [
    [aiChat[0].handle, {}],
    [tripGenerate[2].handle, { budget: -1 }],
    [navigate[1].handle, {}],
  ]) {
    const result = await invokeValidation(handle, body);
    assert.equal(result.nextCalled, false);
    assert.equal(result.response.statusCode, 400);
    assert.equal(result.response.payload.errorCode, "AI_INVALID_REQUEST");
  }
});
