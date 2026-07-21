import { describe, expect, it } from "vitest";

import {
  buildBookingPayload,
  getActiveResources,
  getResourceSlotAvailability,
  reconcileSelectedResource,
  requiresResourceSelection,
} from "../resourceAvailability";

const availability = {
  bookingModel: "resource",
  slotDurationMinutes: 60,
  bufferMinutes: 15,
  resources: [
    {
      id: 7,
      name: "Room A",
      code: "A",
      capacity: 2,
      bookedSlots: [{
        startTime: "2026-07-22T02:00:00.000Z",
        endTime: "2026-07-22T03:15:00.000Z",
      }],
    },
    { id: 8, name: "Room B", code: "B", capacity: 4, bookedSlots: [] },
  ],
};

describe("resource booking availability", () => {
  it("requires a visible resource choice and clears a stale selection", () => {
    expect(requiresResourceSelection(availability)).toBe(true);
    expect(reconcileSelectedResource(7, availability)).toBe(7);
    expect(reconcileSelectedResource(99, availability)).toBeNull();
    expect(reconcileSelectedResource(7, { bookingModel: "capacity", resources: [] })).toBeNull();
  });

  it("checks only the selected resource and allows touching intervals", () => {
    expect(getResourceSlotAvailability({
      availability,
      resourceId: 7,
      date: "2026-07-22",
      time: "09:00",
      quantity: 1,
    })).toBe(false);
    expect(getResourceSlotAvailability({
      availability,
      resourceId: 8,
      date: "2026-07-22",
      time: "09:00",
      quantity: 1,
    })).toBe(true);
    expect(getResourceSlotAvailability({
      availability,
      resourceId: 7,
      date: "2026-07-22",
      time: "10:15",
      quantity: 1,
    })).toBe(true);
  });

  it("honors the canonical duration returned by public availability", () => {
    const canonicalAvailability = {
      ...availability,
      slotDurationMinutes: 45,
      bufferMinutes: 0,
      resources: [{
        ...availability.resources[0],
        bookedSlots: [{
          startTime: "2026-07-22T02:00:00.000Z",
          endTime: "2026-07-22T02:45:00.000Z",
        }],
      }],
    };
    expect(getResourceSlotAvailability({
      availability: canonicalAvailability,
      resourceId: 7,
      date: "2026-07-22",
      time: "09:45",
      quantity: 1,
    })).toBe(true);
  });

  it("enforces selected resource capacity and keeps only active response resources", () => {
    expect(getResourceSlotAvailability({
      availability,
      resourceId: 7,
      date: "2026-07-22",
      time: "10:15",
      quantity: 3,
    })).toBe(false);
    expect(getActiveResources({ ...availability, resources: [...availability.resources, null] }))
      .toHaveLength(2);
  });

  it("uses resourceId only for resource-model create payloads", () => {
    expect(buildBookingPayload({ bookingModel: "resource", resourceId: 8, quantity: 1 }))
      .toEqual({ resourceId: 8, quantity: 1 });
    expect(buildBookingPayload({ bookingModel: "capacity", resourceId: 8, quantity: 1 }))
      .toEqual({ resourceId: null, quantity: 1 });
  });
});
