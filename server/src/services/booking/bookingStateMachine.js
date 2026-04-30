import { BOOKING_STATUS } from "../../config/constants.js";
import { ERROR_CODES } from "../../config/messages.js";
import ServiceError from "../../utils/serviceError.js";

export const BOOKING_TRANSITION = {
  REQUEST_CONFIRM: "request_confirm",
  REQUEST_REJECT: "request_reject",
  USER_CANCEL: "user_cancel",
  BUSINESS_CANCEL: "business_cancel",
  RESCHEDULE: "reschedule",
  COMPLETE: "complete",
  MARK_NO_SHOW: "mark_no_show",
  AUTO_EXPIRE: "auto_expire",
};

const TERMINAL_STATUSES = new Set([
  BOOKING_STATUS.COMPLETED,
  BOOKING_STATUS.CANCELLED,
  BOOKING_STATUS.REJECTED,
  BOOKING_STATUS.EXPIRED,
  BOOKING_STATUS.NO_SHOW,
]);

const ALLOWED_TRANSITIONS = {
  [BOOKING_TRANSITION.REQUEST_CONFIRM]: {
    from: [BOOKING_STATUS.PENDING],
    to: BOOKING_STATUS.CONFIRMED,
  },
  [BOOKING_TRANSITION.REQUEST_REJECT]: {
    from: [BOOKING_STATUS.PENDING],
    to: BOOKING_STATUS.REJECTED,
  },
  [BOOKING_TRANSITION.USER_CANCEL]: {
    from: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED],
    to: BOOKING_STATUS.CANCELLED,
  },
  [BOOKING_TRANSITION.BUSINESS_CANCEL]: {
    from: [BOOKING_STATUS.CONFIRMED],
    to: BOOKING_STATUS.CANCELLED,
  },
  [BOOKING_TRANSITION.RESCHEDULE]: {
    from: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED],
    to: null,
  },
  [BOOKING_TRANSITION.COMPLETE]: {
    from: [BOOKING_STATUS.CONFIRMED],
    to: BOOKING_STATUS.COMPLETED,
  },
  [BOOKING_TRANSITION.MARK_NO_SHOW]: {
    from: [BOOKING_STATUS.CONFIRMED],
    to: BOOKING_STATUS.NO_SHOW,
  },
  [BOOKING_TRANSITION.AUTO_EXPIRE]: {
    from: [BOOKING_STATUS.PENDING],
    to: BOOKING_STATUS.EXPIRED,
  },
};

export function getAllowedBookingTransitions(status) {
  return Object.entries(ALLOWED_TRANSITIONS)
    .filter(([, rule]) => rule.from.includes(status))
    .map(([action, rule]) => ({ action, to: rule.to }));
}

export function isBookingTerminalStatus(status) {
  return TERMINAL_STATUSES.has(status);
}

export function canTransitionBooking(status, action) {
  const rule = ALLOWED_TRANSITIONS[action];
  if (!rule) return false;
  return rule.from.includes(status);
}

export function assertBookingTransition(status, action, message) {
  if (canTransitionBooking(status, action)) return;

  throw new ServiceError(
    message ||
      `Không thể thực hiện hành động ${action} với booking trạng thái ${status}`,
    422,
    ERROR_CODES.BOOKING_INVALID_STATUS || ERROR_CODES.VALIDATION_ERROR,
  );
}

export function getBookingTransitionTarget(action) {
  return ALLOWED_TRANSITIONS[action]?.to ?? null;
}
