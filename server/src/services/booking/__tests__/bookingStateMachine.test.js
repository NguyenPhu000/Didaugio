import test from "node:test";
import assert from "node:assert/strict";
import { BOOKING_STATUS } from "../../../config/constants.js";
import {
  BOOKING_TRANSITION,
  assertBookingTransition,
  canTransitionBooking,
  getAllowedBookingTransitions,
  getBookingTransitionTarget,
  isBookingTerminalStatus,
} from "../bookingStateMachine.js";

test("pending booking supports Phase 1 request decisions", () => {
  assert.equal(
    canTransitionBooking(
      BOOKING_STATUS.PENDING,
      BOOKING_TRANSITION.REQUEST_CONFIRM,
    ),
    true,
  );
  assert.equal(
    getBookingTransitionTarget(BOOKING_TRANSITION.REQUEST_CONFIRM),
    BOOKING_STATUS.CONFIRMED,
  );
  assert.equal(
    canTransitionBooking(
      BOOKING_STATUS.PENDING,
      BOOKING_TRANSITION.REQUEST_REJECT,
    ),
    true,
  );
  assert.equal(
    getBookingTransitionTarget(BOOKING_TRANSITION.REQUEST_REJECT),
    BOOKING_STATUS.REJECTED,
  );
});

test("confirmed booking can close as completed, cancelled, or no-show", () => {
  const allowed = getAllowedBookingTransitions(BOOKING_STATUS.CONFIRMED).map(
    (item) => item.action,
  );

  assert.deepEqual(
    allowed.sort(),
    [
      BOOKING_TRANSITION.BUSINESS_CANCEL,
      BOOKING_TRANSITION.COMPLETE,
      BOOKING_TRANSITION.MARK_NO_SHOW,
      BOOKING_TRANSITION.RESCHEDULE,
      BOOKING_TRANSITION.USER_CANCEL,
    ].sort(),
  );
});

test("terminal statuses do not accept operational transitions", () => {
  for (const status of [
    BOOKING_STATUS.COMPLETED,
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.REJECTED,
    BOOKING_STATUS.EXPIRED,
    BOOKING_STATUS.NO_SHOW,
  ]) {
    assert.equal(isBookingTerminalStatus(status), true);
    assert.equal(
      canTransitionBooking(status, BOOKING_TRANSITION.REQUEST_CONFIRM),
      false,
    );
    assert.throws(
      () => assertBookingTransition(status, BOOKING_TRANSITION.RESCHEDULE),
      /Không thể thực hiện hành động/,
    );
  }
});

test("auto-expire only applies to pending bookings", () => {
  assert.equal(
    canTransitionBooking(BOOKING_STATUS.PENDING, BOOKING_TRANSITION.AUTO_EXPIRE),
    true,
  );
  assert.equal(
    canTransitionBooking(
      BOOKING_STATUS.CONFIRMED,
      BOOKING_TRANSITION.AUTO_EXPIRE,
    ),
    false,
  );
});
