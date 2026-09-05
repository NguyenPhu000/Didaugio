export const HEADING_STATE_THROTTLE_MS = 1200;

export const shouldPublishHeadingState = (lastPublishedAt, now) =>
  lastPublishedAt === null || now - lastPublishedAt >= HEADING_STATE_THROTTLE_MS;
