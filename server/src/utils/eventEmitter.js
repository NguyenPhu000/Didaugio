import EventEmitter from "events";

class AppEventEmitter extends EventEmitter {}

const eventEmitter = new AppEventEmitter();

export const EVENTS = {
  PLACE: {
    CREATED: "place:created",
    UPDATED: "place:updated",
    APPROVED: "place:approved",
    REJECTED: "place:rejected",
    DELETED: "place:deleted",
  },
  USER: {
    REGISTERED: "user:registered",
    LOGGED_IN: "user:logged_in",
  },
  REVIEW: {
    CREATED: "review:created",
    REPLIED: "review:replied",
  },
  BOOKING: {
    CREATED: "booking:created",
    CONFIRMED: "booking:confirmed",
    CANCELLED: "booking:cancelled",
    REJECTED: "booking:rejected",
    EXPIRED: "booking:expired",
    COMPLETED: "booking:completed",
    NO_SHOW: "booking:no_show",
  },
  BUSINESS: {
    REGISTERED: "business:registered",
    APPROVED: "business:approved",
    REJECTED: "business:rejected",
    RESUBMITTED: "business:resubmitted",
    SUSPENDED: "business:suspended",
    REACTIVATED: "business:reactivated",
    TERMINATED: "business:terminated",
    DOCUMENT_UPDATED: "business:document_updated",
  },
};

export default eventEmitter;
