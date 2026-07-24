import { describe, expect, it, vi } from "vitest";
import * as genieRequestFlow from "./genieRequestFlow";
import {
  clearGenieRequestErrors,
  resolveGenieActiveError,
  sendItineraryWithVoiceFeedback,
} from "./genieRequestFlow";

describe("Genie request flow", () => {
  it("speaks itinerary success only after a successful voice request", async () => {
    const speakText = vi.fn();

    await expect(
      sendItineraryWithVoiceFeedback({
        message: "lap lich",
        inputMode: "voice",
        sendMessage: vi.fn().mockResolvedValue({ success: false }),
        speakText,
        successText: "queued",
      }),
    ).resolves.toEqual({ success: false });
    expect(speakText).not.toHaveBeenCalled();

    await expect(
      sendItineraryWithVoiceFeedback({
        message: "lap lich",
        inputMode: "voice",
        sendMessage: vi
          .fn()
          .mockResolvedValue({ success: true, data: { previewOnly: true } }),
        speakText,
        successText: "queued",
      }),
    ).resolves.toMatchObject({ success: true });
    expect(speakText).toHaveBeenCalledOnce();
    expect(speakText).toHaveBeenCalledWith("queued");
  });

  it("clears a chat error before planner success so no stale retry banner survives", () => {
    let plannerError = null;
    let chatError = "chat failed";
    let voiceError = null;

    clearGenieRequestErrors({
      clearPlannerError: () => {
        plannerError = null;
      },
      setChatError: (value) => {
        chatError = value;
      },
      setVoiceError: (value) => {
        voiceError = value;
      },
    });

    expect(
      resolveGenieActiveError({ plannerError, chatError, voiceError }),
    ).toBeNull();
  });

  it("clears a planner error before chat success and keeps only a new chat failure as retry source", () => {
    let plannerError = "planner failed";
    let chatError = null;
    let voiceError = null;

    clearGenieRequestErrors({
      clearPlannerError: () => {
        plannerError = null;
      },
      setChatError: (value) => {
        chatError = value;
      },
      setVoiceError: (value) => {
        voiceError = value;
      },
    });

    expect(
      resolveGenieActiveError({ plannerError, chatError, voiceError }),
    ).toBeNull();

    chatError = "new chat failure";
    expect(
      resolveGenieActiveError({ plannerError, chatError, voiceError }),
    ).toEqual({ source: "chat", message: "new chat failure" });
  });

  it("clears a stale chat error before a successful confirmation", async () => {
    expect(
      typeof genieRequestFlow.confirmSelectionWithFreshErrors,
    ).toBe("function");

    let plannerError = null;
    let chatError = "old chat failure";
    let voiceError = null;

    await genieRequestFlow.confirmSelectionWithFreshErrors({
      clearPlannerError: () => {
        plannerError = null;
      },
      setChatError: (value) => {
        chatError = value;
      },
      setVoiceError: (value) => {
        voiceError = value;
      },
      confirmSelectedPlaces: async () => ({ id: 10 }),
    });

    expect(
      resolveGenieActiveError({ plannerError, chatError, voiceError }),
    ).toBeNull();
  });

  it("shows a new planner error after confirmation failure instead of a stale chat error", async () => {
    expect(
      typeof genieRequestFlow.confirmSelectionWithFreshErrors,
    ).toBe("function");

    let plannerError = null;
    let chatError = "old chat failure";
    let voiceError = null;

    await genieRequestFlow.confirmSelectionWithFreshErrors({
      clearPlannerError: () => {
        plannerError = null;
      },
      setChatError: (value) => {
        chatError = value;
      },
      setVoiceError: (value) => {
        voiceError = value;
      },
      confirmSelectedPlaces: async () => {
        plannerError = "new confirmation failure";
        return null;
      },
    });

    expect(
      resolveGenieActiveError({ plannerError, chatError, voiceError }),
    ).toEqual({
      source: "planner",
      message: "new confirmation failure",
    });
  });
});
