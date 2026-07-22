const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

function toPositiveInteger(value) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
}

function vietnamSlotStart(date, time) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || ""));
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(String(time || ""));
  if (!match || !timeMatch) return null;

  const [year, month, day] = match.slice(1).map(Number);
  const [hour, minute] = timeMatch.slice(1).map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  ) return null;
  return new Date(candidate.getTime() - VIETNAM_OFFSET_MS);
}

export function requiresResourceSelection(availability) {
  return availability?.bookingModel === "resource";
}

export function getActiveResources(availability) {
  if (!requiresResourceSelection(availability)) return [];
  return (availability.resources || []).filter((resource) => toPositiveInteger(resource?.id));
}

export function reconcileSelectedResource(selectedResourceId, availability) {
  const selectedId = toPositiveInteger(selectedResourceId);
  if (!selectedId) return null;
  return getActiveResources(availability).some((resource) => Number(resource.id) === selectedId)
    ? selectedId
    : null;
}

export function getSelectedResource(availability, resourceId) {
  const selectedId = toPositiveInteger(resourceId);
  return getActiveResources(availability)
    .find((resource) => Number(resource.id) === selectedId) || null;
}

export function getResourceSlotAvailability({ availability, resourceId, date, time, quantity = 1 }) {
  const resource = getSelectedResource(availability, resourceId);
  const start = vietnamSlotStart(date, time);
  const requestedQuantity = Number(quantity);
  if (!resource || !start || !Number.isFinite(requestedQuantity) || requestedQuantity <= 0) return false;
  if (Number.isInteger(resource.capacity) && resource.capacity > 0 && requestedQuantity > resource.capacity) return false;

  const duration = Number(availability?.slotDurationMinutes) > 0
    ? Number(availability.slotDurationMinutes)
    : 60;
  const buffer = Number(availability?.bufferMinutes) > 0 ? Number(availability.bufferMinutes) : 0;
  const end = new Date(start.getTime() + (duration + buffer) * 60_000);
  return !(resource.bookedSlots || []).some((slot) => {
    const bookedStart = new Date(slot?.startTime);
    const bookedEnd = new Date(slot?.endTime);
    return !Number.isNaN(bookedStart.getTime()) && !Number.isNaN(bookedEnd.getTime()) && bookedStart < end && bookedEnd > start;
  });
}

export function buildBookingPayload({ bookingModel, resourceId, ...payload }) {
  const normalizedResourceId = bookingModel === "resource" ? toPositiveInteger(resourceId) : null;
  return {
    ...payload,
    ...(normalizedResourceId ? { resourceId: normalizedResourceId } : {}),
  };
}
