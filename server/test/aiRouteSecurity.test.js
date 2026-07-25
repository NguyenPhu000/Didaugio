import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import express from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = "task10-admin-ai-security-secret-with-at-least-32-bytes";
process.env.JWT_SECRET = JWT_SECRET;

const [
  { authenticate },
  { aiUserLimiter },
  { default: aiRouter },
  { default: tripRouter },
  { default: navigationRouter },
  { ROLES },
  { clearPermissionCache, setCachedPermissions },
  { default: prisma },
  { registerApiRoutes },
  { DEFAULT_AI_CONFIG },
  { default: errorHandler },
  { default: logger },
] = await Promise.all([
  import("../src/middlewares/authMiddleware.js"),
  import("../src/middlewares/rateLimitMiddleware.js"),
  import("../src/routes/ai/ai.route.js"),
  import("../src/routes/trip/trip.route.js"),
  import("../src/modules/navigation/navigation.routes.js"),
  import("../src/config/constants.js"),
  import("../src/utils/permissionCache.js"),
  import("../src/config/prismaClient.js"),
  import("../src/routes/index.js"),
  import("../src/config/defaultAiConfig.js"),
  import("../src/middlewares/errorHandler.js"),
  import("../src/config/logger.js"),
]);

const ADMIN_AI_PERMISSIONS = [
  "ai.config.manage",
  "ai.config.publish",
  "ai.kill_switch.manage",
  "ai.logs.view",
  "ai.secrets.manage",
  "ai.test.run",
  "ai.view",
];

const ADMIN_AI_ROUTE_CASES = [
  {
    method: "GET",
    path: "/api/v1/admin/ai/overview",
    permission: "ai.view",
    allowedStatus: 200,
  },
  {
    method: "GET",
    path: "/api/v1/admin/ai/config",
    permission: "ai.view",
    allowedStatus: 200,
  },
  {
    method: "PUT",
    path: "/api/v1/admin/ai/config/draft",
    permission: "ai.config.manage",
    body: {},
    allowedStatus: 400,
  },
  {
    method: "POST",
    path: "/api/v1/admin/ai/config/test",
    permission: "ai.test.run",
    body: {},
    allowedStatus: 400,
  },
  {
    method: "POST",
    path: "/api/v1/admin/ai/config/publish",
    permission: "ai.config.publish",
    body: {},
    allowedStatus: 400,
  },
  {
    method: "POST",
    path: "/api/v1/admin/ai/config/rollback",
    permission: "ai.config.publish",
    body: {},
    allowedStatus: 400,
  },
  {
    method: "PUT",
    path: "/api/v1/admin/ai/kill-switch",
    permission: "ai.kill_switch.manage",
    body: {},
    allowedStatus: 400,
  },
  {
    method: "GET",
    path: "/api/v1/admin/ai/logs",
    permission: "ai.logs.view",
    allowedStatus: 200,
  },
];

function findRoute(router, method, path) {
  const normalizedMethod = method.toLowerCase();
  const layer = router.stack.find(
    (candidate) =>
      candidate.route?.path === path &&
      candidate.route.methods[normalizedMethod],
  );
  assert.ok(layer, `${method.toUpperCase()} ${path} must exist`);
  return layer.route.stack;
}

function findNamedHandler(stack, name) {
  const layer = stack.find((candidate) => candidate.handle.name === name);
  assert.ok(layer, `${name} middleware must exist`);
  return layer.handle;
}

function findOnlyAnonymousHandler(stack, excluded = []) {
  const excludedSet = new Set(excluded);
  const matches = stack
    .map((layer) => layer.handle)
    .filter((handle) => !handle.name && !excludedSet.has(handle));
  assert.equal(matches.length, 1, "exactly one validation middleware is expected");
  return matches[0];
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

function roleName(roleId) {
  return {
    [ROLES.SUPER_ADMIN]: "super_admin",
    [ROLES.ADMIN]: "admin",
    [ROLES.BUSINESS]: "business",
    [ROLES.STAFF]: "staff",
    [ROLES.USER]: "user",
  }[roleId];
}

async function createAdminAiHttpHarness() {
  const users = new Map();
  const state = {
    configReads: 0,
    transactions: 0,
    writes: 0,
    revision: 1,
  };
  const restorations = [];
  let nextUserId = 7000;

  const replace = (target, method, implementation) => {
    const original = target[method];
    target[method] = implementation;
    restorations.push(() => {
      target[method] = original;
    });
  };

  replace(prisma.user, "findUnique", async ({ where }) => {
    const user = users.get(where.id);
    if (!user) return null;
    return {
      roleId: user.roleId,
      status: "active",
      role: { name: roleName(user.roleId) },
    };
  });
  replace(prisma.systemConfig, "findUnique", async () => null);
  replace(prisma.aiConfig, "findUnique", async (query) => {
    if (query.include) {
      return {
        id: 1,
        key: "mobile_ai",
        status: "active",
        revision: state.revision,
        activeVersionId: 11,
        draftVersionId: 12,
        activeVersion: {
          id: 11,
          version: 1,
          status: "published",
          configData: DEFAULT_AI_CONFIG,
        },
        draftVersion: {
          id: 12,
          version: 2,
          status: "draft",
          configData: DEFAULT_AI_CONFIG,
        },
        versions: [],
      };
    }
    if (query.select?.id && query.select?.revision) {
      state.configReads += 1;
      return { id: 1, revision: state.revision };
    }
    if (query.select?.activeVersion) {
      return {
        activeVersion: {
          version: 1,
          configData: DEFAULT_AI_CONFIG,
        },
      };
    }
    throw new Error("Unexpected aiConfig.findUnique query in Admin AI harness");
  });
  replace(prisma.apiKeyManagement, "findUnique", async () => null);
  replace(prisma.aiRequestLog, "findMany", async () => []);
  replace(prisma.aiRequestLog, "count", async () => 0);
  replace(prisma, "$transaction", async (operation) => {
    state.transactions += 1;
    return Array.isArray(operation)
      ? Promise.all(operation)
      : operation(prisma);
  });

  for (const [delegate, method] of [
    [prisma.aiConfig, "updateMany"],
    [prisma.aiConfig, "update"],
    [prisma.aiConfig, "upsert"],
    [prisma.aiConfigVersion, "create"],
    [prisma.aiConfigVersion, "update"],
    [prisma.aiConfigVersion, "updateMany"],
    [prisma.aiConfigVersion, "deleteMany"],
    [prisma.apiKeyManagement, "upsert"],
  ]) {
    replace(delegate, method, async () => {
      state.writes += 1;
      throw new Error("Admin AI harness unexpectedly reached a write");
    });
  }

  replace(logger, "warn", () => {});
  replace(logger, "error", () => {});

  const app = express();
  app.use(express.json());
  registerApiRoutes(app);
  app.use(errorHandler);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();

  async function request({
    method = "GET",
    path,
    body,
    roleId = ROLES.ADMIN,
    permissions = [],
    authenticated = true,
  }) {
    const userId = nextUserId++;
    const headers = {};
    if (authenticated) {
      users.set(userId, { roleId });
      if (roleId === ROLES.ADMIN) {
        setCachedPermissions(`${userId}:${roleId}`, {
          permissions: new Set(permissions),
        });
      }
      headers.authorization = `Bearer ${jwt.sign({ userId }, JWT_SECRET)}`;
    }
    if (body !== undefined) headers["content-type"] = "application/json";

    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json();
    return { status: response.status, payload };
  }

  async function close() {
    clearPermissionCache();
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    for (const restore of restorations.reverse()) restore();
  }

  return { request, state, close };
}

test("trip generation authenticates, rate-limits once, then validates before costly work", () => {
  const stack = findRoute(tripRouter, "POST", "/trips/generate");
  const controller = findNamedHandler(stack, "generateTrip");
  const validation = findOnlyAnonymousHandler(stack, [aiUserLimiter]);
  const handles = stack.map((layer) => layer.handle);

  assert.equal(handles.filter((handle) => handle === authenticate).length, 1);
  assert.equal(handles.filter((handle) => handle === aiUserLimiter).length, 1);
  assert.ok(handles.indexOf(authenticate) < handles.indexOf(aiUserLimiter));
  assert.ok(handles.indexOf(aiUserLimiter) < handles.indexOf(validation));
  assert.ok(handles.indexOf(validation) < handles.indexOf(controller));
});

test("AI navigation applies the per-user limiter once after router authentication", () => {
  const routerAuthentication = navigationRouter.stack.find(
    (layer) => !layer.route && layer.handle === authenticate,
  );
  assert.ok(routerAuthentication, "navigation router must authenticate");

  const stack = findRoute(navigationRouter, "POST", "/navigate");
  const controller = findNamedHandler(
    stack,
    "handleNavigationRecommendation",
  );
  const validation = findOnlyAnonymousHandler(stack, [aiUserLimiter]);
  const handles = stack.map((layer) => layer.handle);

  assert.equal(handles.filter((handle) => handle === aiUserLimiter).length, 1);
  assert.ok(handles.indexOf(aiUserLimiter) < handles.indexOf(validation));
  assert.ok(handles.indexOf(validation) < handles.indexOf(controller));
});

test("transcription route limits before Multer and validates parsed multipart fields before controller", async () => {
  assert.ok(
    aiRouter.stack.find((layer) => !layer.route && layer.handle === authenticate),
    "AI router must authenticate",
  );
  assert.ok(
    aiRouter.stack.find((layer) => !layer.route && layer.handle === aiUserLimiter),
    "AI router must apply its limiter",
  );

  const stack = findRoute(aiRouter, "POST", "/voice/transcribe");
  const multer = findNamedHandler(stack, "multerMiddleware");
  const controller = findNamedHandler(stack, "handleVoiceTranscribe");
  const validation = findOnlyAnonymousHandler(stack);
  const handles = stack.map((layer) => layer.handle);
  assert.ok(handles.indexOf(multer) < handles.indexOf(validation));
  assert.ok(handles.indexOf(validation) < handles.indexOf(controller));

  const invalid = await invokeValidation(validation, {
    language: "not_a_language",
    prompt: "x".repeat(1601),
  });
  assert.equal(invalid.nextCalled, false);
  assert.equal(invalid.response.statusCode, 400);
  assert.equal(invalid.response.payload.errorCode, "AI_INVALID_REQUEST");

  const valid = await invokeValidation(validation, {
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
  const aiChat = findRoute(aiRouter, "POST", "/chat");
  const tripGenerate = findRoute(tripRouter, "POST", "/trips/generate");
  const navigate = findRoute(navigationRouter, "POST", "/navigate");
  const cases = [
    [
      findOnlyAnonymousHandler(aiChat),
      {},
    ],
    [
      findOnlyAnonymousHandler(tripGenerate, [aiUserLimiter]),
      { budget: -1 },
    ],
    [
      findOnlyAnonymousHandler(navigate, [aiUserLimiter]),
      {},
    ],
  ];

  for (const [handle, body] of cases) {
    const result = await invokeValidation(handle, body);
    assert.equal(result.nextCalled, false);
    assert.equal(result.response.statusCode, 400);
    assert.equal(result.response.payload.errorCode, "AI_INVALID_REQUEST");
  }
});

test("the mounted Admin AI HTTP chain enforces authentication and the role gate", async () => {
  const harness = await createAdminAiHttpHarness();
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const unauthenticated = await harness.request({
      path: "/api/v1/admin/ai/overview",
      authenticated: false,
    });
    assert.equal(unauthenticated.status, 401);
    assert.equal(unauthenticated.payload.errorCode, "NO_TOKEN");

    for (const roleId of [ROLES.BUSINESS, ROLES.STAFF, ROLES.USER]) {
      const denied = await harness.request({
        path: "/api/v1/admin/ai/overview",
        roleId,
        permissions: ADMIN_AI_PERMISSIONS,
      });
      assert.equal(denied.status, 403);
      assert.equal(denied.payload.errorCode, "FORBIDDEN");
    }

    const admin = await harness.request({
      path: "/api/v1/admin/ai/overview",
      permissions: ["ai.view"],
    });
    assert.equal(admin.status, 200);

    const superAdmin = await harness.request({
      path: "/api/v1/admin/ai/overview",
      roleId: ROLES.SUPER_ADMIN,
    });
    assert.equal(superAdmin.status, 200);
  } finally {
    console.warn = originalWarn;
    await harness.close();
  }
});

test("all eight mounted Admin AI routes require exactly their mapped permission", async () => {
  const harness = await createAdminAiHttpHarness();
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    for (const routeCase of ADMIN_AI_ROUTE_CASES) {
      const allowed = await harness.request({
        ...routeCase,
        permissions: [routeCase.permission],
      });
      assert.equal(
        allowed.status,
        routeCase.allowedStatus,
        `${routeCase.method} ${routeCase.path} must allow ${routeCase.permission}`,
      );

      const denied = await harness.request({
        ...routeCase,
        permissions: ADMIN_AI_PERMISSIONS.filter(
          (permission) => permission !== routeCase.permission,
        ),
      });
      assert.equal(
        denied.status,
        403,
        `${routeCase.method} ${routeCase.path} must deny omission of ${routeCase.permission}`,
      );
      assert.equal(denied.payload.errorCode, "FORBIDDEN");
    }
  } finally {
    console.warn = originalWarn;
    await harness.close();
  }
});

test("providerSecret requires secrets permission before config or credential writes", async () => {
  const harness = await createAdminAiHttpHarness();
  const originalWarn = console.warn;
  console.warn = () => {};
  const body = {
    revision: 0,
    configData: DEFAULT_AI_CONFIG,
    changeReason: "Rotate provider credential safely.",
    providerSecret: "private-provider-secret-value",
  };

  try {
    const denied = await harness.request({
      method: "PUT",
      path: "/api/v1/admin/ai/config/draft",
      body,
      permissions: ["ai.config.manage"],
    });
    assert.equal(denied.status, 403);
    assert.equal(denied.payload.errorCode, "FORBIDDEN");
    assert.equal(harness.state.configReads, 0);
    assert.equal(harness.state.transactions, 0);
    assert.equal(harness.state.writes, 0);

    const allowedAdmin = await harness.request({
      method: "PUT",
      path: "/api/v1/admin/ai/config/draft",
      body,
      permissions: ["ai.config.manage", "ai.secrets.manage"],
    });
    assert.equal(allowedAdmin.status, 409);
    assert.equal(allowedAdmin.payload.errorCode, "AI_CONFIG_CONFLICT");
    assert.equal(harness.state.configReads, 1);
    assert.equal(harness.state.transactions, 0);
    assert.equal(harness.state.writes, 0);

    const allowedSuperAdmin = await harness.request({
      method: "PUT",
      path: "/api/v1/admin/ai/config/draft",
      body,
      roleId: ROLES.SUPER_ADMIN,
    });
    assert.equal(allowedSuperAdmin.status, 409);
    assert.equal(allowedSuperAdmin.payload.errorCode, "AI_CONFIG_CONFLICT");
    assert.equal(harness.state.configReads, 2);
    assert.equal(harness.state.transactions, 0);
    assert.equal(harness.state.writes, 0);
  } finally {
    console.warn = originalWarn;
    await harness.close();
  }
});
