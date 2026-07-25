import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAdminAiError } from "../src/controllers/adminAi/adminAi.controller.js";
import errorHandler from "../src/middlewares/errorHandler.js";
import adminAiRouter from "../src/routes/adminAi/adminAi.route.js";

function findRoute(path) {
  const layer = adminAiRouter.stack.find(
    (candidate) => candidate.route?.path === path && candidate.route.methods.get,
  );
  assert.ok(layer, `GET ${path} must exist`);
  return layer.route.stack;
}

async function invokeValidation(handle, query) {
  const req = { query };
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

function invokeError(error) {
  let response = null;
  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      response = { statusCode: this.statusCode, payload };
      return this;
    },
  };
  errorHandler(error, { method: "PUT", originalUrl: "/api/v1/admin/ai/config/draft" }, res);
  return response;
}

test("overview rejects malformed, inverted, and unknown query filters before its controller", async () => {
  const stack = findRoute("/overview");
  assert.equal(stack.length, 3, "overview must validate query after permission");

  for (const query of [
    { from: "not-a-date" },
    { from: "2026-07-25T00:00:00.000Z", to: "2026-07-24T00:00:00.000Z" },
    { unexpected: "value" },
  ]) {
    const result = await invokeValidation(stack[1].handle, query);
    assert.equal(result.nextCalled, false);
    assert.equal(result.response.statusCode, 400);
    assert.equal(result.response.payload.errorCode, "VALIDATION_ERROR");
  }
});

test("shared handler preserves safe Admin AI conflict recovery metadata", () => {
  const error = Object.assign(new Error("AI configuration changed."), {
    code: "AI_CONFIG_CONFLICT",
    statusCode: 409,
    currentRevision: 17,
    internalDetail: "do-not-leak",
  });
  const response = invokeError(normalizeAdminAiError(error));

  assert.deepEqual(response, {
    statusCode: 409,
    payload: {
      success: false,
      data: null,
      message: "AI configuration changed.",
      errorCode: "AI_CONFIG_CONFLICT",
      currentRevision: 17,
    },
  });
});

test("shared handler preserves stable Admin AI service codes without arbitrary error metadata", () => {
  for (const [code, statusCode] of [
    ["AI_VERSION_NOT_FOUND", 404],
    ["AI_CONFIG_UNAVAILABLE", 503],
  ]) {
    const error = Object.assign(new Error("domain failure"), {
      code,
      statusCode,
      internalDetail: "do-not-leak",
    });
    const response = invokeError(normalizeAdminAiError(error));

    assert.equal(response.statusCode, statusCode);
    assert.equal(response.payload.errorCode, code);
    assert.equal("internalDetail" in response.payload, false);
    assert.equal("currentRevision" in response.payload, false);
  }
});

test("Admin AI error normalization trusts only bounded AI domain codes", () => {
  const domainError = Object.assign(new Error("AI configuration changed."), {
    code: "AI_CONFIG_CONFLICT",
    statusCode: 409,
    currentRevision: 17,
    internalDetail: "do-not-leak",
  });
  const normalized = normalizeAdminAiError(domainError);

  assert.notEqual(normalized, domainError);
  assert.equal(normalized.errorCode, "AI_CONFIG_CONFLICT");
  assert.equal(normalized.currentRevision, 17);
  assert.equal("internalDetail" in normalized, false);

  for (const code of ["P2003", "ECONNREFUSED", "ETIMEDOUT"]) {
    const infrastructureError = Object.assign(new Error("infrastructure failure"), {
      code,
      statusCode: 500,
    });
    assert.equal(normalizeAdminAiError(infrastructureError), infrastructureError);
    const response = invokeError(infrastructureError);
    assert.equal(response.payload.errorCode, "INTERNAL_ERROR");
  }
});
