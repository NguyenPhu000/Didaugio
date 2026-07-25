import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { authenticate } from "../src/middlewares/authMiddleware.js";
import adminAiRouter from "../src/routes/adminAi/adminAi.route.js";

const expected = new Set([
  "get /overview",
  "get /config",
  "put /config/draft",
  "post /config/test",
  "post /config/publish",
  "post /config/rollback",
  "put /kill-switch",
  "get /logs",
]);

test("Admin AI exposes exactly the approved route surface", () => {
  assert.equal(adminAiRouter.stack[0].handle, authenticate);
  const actual = new Set(
    adminAiRouter.stack
      .filter((layer) => layer.route)
      .flatMap((layer) =>
        Object.keys(layer.route.methods).map((method) => `${method} ${layer.route.path}`),
      ),
  );
  assert.deepEqual(actual, expected);
});

test("every route has permission middleware before its controller", () => {
  for (const layer of adminAiRouter.stack.filter((entry) => entry.route)) {
    assert.equal(layer.route.stack.length >= 2, true);
    assert.notEqual(layer.route.stack[0].handle, layer.route.stack.at(-1).handle);
  }
  const source = readFileSync(
    new URL("../src/routes/adminAi/adminAi.route.js", import.meta.url),
    "utf8",
  );
  for (const permission of [
    "ai.view",
    "ai.config.manage",
    "ai.test.run",
    "ai.config.publish",
    "ai.kill_switch.manage",
    "ai.logs.view",
  ]) {
    assert.equal(source.includes(`hasPermission("${permission}")`), true);
  }
});
