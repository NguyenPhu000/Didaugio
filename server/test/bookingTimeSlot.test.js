import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  combineUseDateAndTime,
  resolveBookingAtFromPayload,
  toUseDateOnly,
  toUseTimeString,
} from "../src/utils/bookingTimeSlot.js";

test("Vietnam wall-clock date and time map to the correct UTC instant and round-trip", () => {
  const bookingAt = combineUseDateAndTime(new Date("2026-07-22T12:00:00.000Z"), "09:00");

  assert.equal(bookingAt.toISOString(), "2026-07-22T02:00:00.000Z");
  assert.equal(toUseDateOnly(bookingAt).toISOString(), "2026-07-22T12:00:00.000Z");
  assert.equal(toUseTimeString(bookingAt), "09:00");
});

test("date/time helpers reject impossible Vietnam calendar input", () => {
  assert.throws(
    () => combineUseDateAndTime(new Date("invalid"), "09:00"),
    /valid date/i,
  );
  assert.throws(
    () => combineUseDateAndTime(new Date("2026-07-22T12:00:00.000Z"), "24:00"),
    /HH:mm/,
  );
  assert.throws(
    () => combineUseDateAndTime(new Date("2026-07-22T12:00:00.000Z"), "9:00"),
    /HH:mm/,
  );
  assert.throws(
    () => combineUseDateAndTime("2026-02-30", "09:00"),
    /valid date/i,
  );
});

test("create input resolver rejects raw invalid useDate/useTime before a booking mutation", () => {
  assert.throws(
    () => resolveBookingAtFromPayload({ useDate: "2026-02-30", useTime: "09:00" }),
    /valid date/i,
  );
  assert.throws(
    () => resolveBookingAtFromPayload({ useDate: "2026-07-22", useTime: "9:00" }),
    /HH:mm/,
  );
  assert.equal(
    resolveBookingAtFromPayload({ useDate: "2026-07-22", useTime: "09:00" }).toISOString(),
    "2026-07-22T02:00:00.000Z",
  );
  assert.equal(
    resolveBookingAtFromPayload({ bookingAt: "2026-07-22T02:00:00.000Z" }).toISOString(),
    "2026-07-22T02:00:00.000Z",
  );
});

test("direct bookingAt requires an explicit zone and preserves the exact instant", () => {
  assert.throws(
    () => resolveBookingAtFromPayload({ bookingAt: "2026-07-22T09:00:00" }),
    /zone|offset|bookingAt/i,
  );
  assert.equal(
    resolveBookingAtFromPayload({ bookingAt: "2026-07-22T09:00:00+07:00" }).toISOString(),
    "2026-07-22T02:00:00.000Z",
  );
});

test("explicit-offset bookingAt is independent of the process timezone", () => {
  const source = `import { resolveBookingAtFromPayload } from './src/utils/bookingTimeSlot.js';\n`
    + `process.stdout.write(resolveBookingAtFromPayload({ bookingAt: '2026-07-22T09:00:00+07:00' }).toISOString());`;
  const outputs = ["UTC", "America/New_York"].map((TZ) => {
    const result = spawnSync(process.execPath, ["--input-type=module", "--eval", source], {
      cwd: process.cwd(),
      env: { ...process.env, TZ },
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout;
  });
  assert.deepEqual(outputs, ["2026-07-22T02:00:00.000Z", "2026-07-22T02:00:00.000Z"]);
});
