import assert from "node:assert/strict";
import test from "node:test";

import {
  combineUseDateAndTime,
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
