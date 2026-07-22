import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = new URL("../src/scripts/assertPaymentAuditDatabase.js", import.meta.url);
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

test("payment quality gate fails clearly when disposable audit database credentials are unreachable", () => {
  const result = spawnSync(process.execPath, [fileURLToPath(script)], {
    env: { ...process.env, DATABASE_URL: "postgresql://localhost:9/unreachable_payment_audit" },
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /quality:payments cannot connect to DATABASE_URL/u);
});

test("payment quality gate includes normalized VNPay and mobile payment API contracts after the DB preflight", () => {
  const gate = packageJson.scripts["quality:payments"];
  assert.match(gate, /test\/vnpayCallbackNormalization\.test\.js/u);
  assert.match(gate, /npm --prefix \.\.\/app test -- src\/modules\/booking\/api\/paymentApi\.test\.js/u);
  assert.ok(gate.indexOf("assertPaymentAuditDatabase.js") < gate.indexOf("vnpayCallbackNormalization.test.js"));
});
