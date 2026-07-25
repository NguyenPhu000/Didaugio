import assert from "node:assert/strict";
import test from "node:test";
import { authenticate } from "../src/middlewares/authMiddleware.js";
import { aiUserLimiter } from "../src/middlewares/rateLimitMiddleware.js";
import aiRouter from "../src/routes/ai/ai.route.js";
import adminAiRouter from "../src/routes/adminAi/adminAi.route.js";
import tripRouter from "../src/routes/trip/trip.route.js";
import navigationRouter from "../src/modules/navigation/navigation.routes.js";
import { ROLES } from "../src/config/constants.js";
import {
  clearPermissionCache,
  setCachedPermissions,
} from "../src/utils/permissionCache.js";

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

async function invokeMiddleware(handle, user) {
  const req = {
    user,
    originalUrl: "/api/v1/admin/ai/config/publish",
  };
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

test("Admin AI role gate permits only Super Admin and Admin, never Staff", async () => {
  const roleGate = adminAiRouter.stack[1].handle;

  for (const roleId of [ROLES.SUPER_ADMIN, ROLES.ADMIN]) {
    const result = await invokeMiddleware(roleGate, { userId: 7, roleId });
    assert.equal(result.nextCalled, true);
    assert.equal(result.response, null);
  }

  for (const roleId of [ROLES.BUSINESS, ROLES.STAFF, ROLES.USER]) {
    const result = await invokeMiddleware(roleGate, { userId: 7, roleId });
    assert.equal(result.nextCalled, false);
    assert.equal(result.response.statusCode, 403);
    assert.equal(result.response.payload.errorCode, "FORBIDDEN");
  }
});

test("direct publish calls return 403 for Admin without the explicit publish permission", async () => {
  const publishLayer = adminAiRouter.stack.find(
    (layer) =>
      layer.route?.path === "/config/publish" &&
      layer.route.methods.post,
  );
  assert.ok(publishLayer, "POST /config/publish must exist");
  const permissionGate = publishLayer.route.stack[0].handle;
  const originalWarn = console.warn;
  console.warn = () => {};

  try {
    clearPermissionCache();
    setCachedPermissions(`${71}:${ROLES.ADMIN}`, {
      permissions: new Set(["ai.view", "ai.config.manage"]),
    });
    const denied = await invokeMiddleware(permissionGate, {
      userId: 71,
      roleId: ROLES.ADMIN,
    });
    assert.equal(denied.nextCalled, false);
    assert.equal(denied.response.statusCode, 403);
    assert.equal(denied.response.payload.errorCode, "FORBIDDEN");

    clearPermissionCache();
    setCachedPermissions(`${72}:${ROLES.ADMIN}`, {
      permissions: new Set(["ai.config.publish"]),
    });
    const allowedAdmin = await invokeMiddleware(permissionGate, {
      userId: 72,
      roleId: ROLES.ADMIN,
    });
    assert.equal(allowedAdmin.nextCalled, true);

    const allowedSuperAdmin = await invokeMiddleware(permissionGate, {
      userId: 73,
      roleId: ROLES.SUPER_ADMIN,
    });
    assert.equal(allowedSuperAdmin.nextCalled, true);
  } finally {
    clearPermissionCache();
    console.warn = originalWarn;
  }
});
