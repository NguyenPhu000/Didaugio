import EventEmitter from "events";

/**
 * Global Event Emitter
 * Used for decoupling modules and handling async events
 * (e.g. sending notifications after place approval)
 */
class AppEventEmitter extends EventEmitter {}

const eventEmitter = new AppEventEmitter();

// Define Event Names
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
};

export default eventEmitter;
