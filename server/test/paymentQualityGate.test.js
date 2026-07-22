import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = new URL("../src/scripts/assertPaymentAuditDatabase.js", import.meta.url);

test("payment quality gate fails clearly when disposable audit database credentials are unreachable", () => {
  const result = spawnSync(process.execPath, [fileURLToPath(script)], {
    env: { ...process.env, DATABASE_URL: "postgresql://localhost:9/unreachable_payment_audit" },
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /quality:payments cannot connect to DATABASE_URL/u);
});
