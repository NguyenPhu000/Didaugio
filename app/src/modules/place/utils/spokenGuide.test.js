import { describe, expect, it } from "vitest";

import {
  getSpeechText,
  hasSpokenGuide,
  shouldShowBookingCta,
} from "./spokenGuide";

describe("spoken guide", () => {
  it("requires booking eligibility and hides FREE places", () => {
    expect(shouldShowBookingCta({ priceRange: "FREE", bookingEnabled: true })).toBe(false);
    expect(shouldShowBookingCta({ priceRange: "BUDGET", bookingEnabled: false })).toBe(false);
    expect(shouldShowBookingCta({ priceRange: "BUDGET", bookingEnabled: true })).toBe(true);
    expect(shouldShowBookingCta({ priceRange: "BUDGET" })).toBe(false);
  });

  it("detects introduction or complete FAQ content", () => {
    expect(hasSpokenGuide({ text: "Intro", faqs: [] })).toBe(true);
    expect(
      hasSpokenGuide({ text: "", faqs: [{ question: "Q", answer: "A" }] }),
    ).toBe(true);
    expect(hasSpokenGuide({ text: "", faqs: [] })).toBe(false);
  });

  it("selects introduction or FAQ answer", () => {
    const guide = {
      text: "Intro",
      faqs: [{ question: "Q", answer: "Answer" }],
    };
    expect(getSpeechText(guide)).toBe("Intro");
    expect(getSpeechText(guide, 0)).toBe("Answer");
    expect(getSpeechText(guide, 2)).toBeNull();
  });
});
