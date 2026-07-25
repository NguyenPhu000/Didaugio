import { describe, expect, it, vi } from "vitest";
import {
  buildAiFeedbackPayload,
  createAiFeedbackSubmitter,
  isRateableAiMessage,
} from "./aiFeedback";

describe("AI feedback", () => {
  it("builds the existing feedback route payload without AI text", () => {
    expect(
      buildAiFeedbackPayload({
        requestLogId: 42,
        value: "down",
        reason: "Not relevant",
      }),
    ).toEqual({
      reportType: "ai_quality",
      title: "AI not helpful",
      content: "Not relevant",
      targetType: "ai_request",
      targetId: 42,
    });
  });

  it("rates only completed assistant text with a numeric request log id", () => {
    expect(
      isRateableAiMessage({
        role: "assistant",
        text: "A completed answer",
        requestLogId: 9,
      }),
    ).toBe(true);
    expect(
      isRateableAiMessage({
        role: "assistant",
        text: "Transport transcript",
      }),
    ).toBe(false);
    expect(
      isRateableAiMessage({
        role: "assistant",
        text: "Fallback error",
        requestLogId: 9,
        isError: true,
      }),
    ).toBe(false);
  });

  it("ignores duplicate rapid submissions", async () => {
    let release;
    const request = vi.fn(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const submitter = createAiFeedbackSubmitter(request);

    const first = submitter.submit({ requestLogId: 7, value: "up" });
    const duplicate = await submitter.submit({
      requestLogId: 7,
      value: "up",
    });
    release({ success: true });

    expect(await first).toEqual({ status: "submitted", value: "up" });
    expect(duplicate).toEqual({ status: "ignored" });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("allows a safe retry after a submission error", async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ success: true });
    const submitter = createAiFeedbackSubmitter(request);

    await expect(
      submitter.submit({ requestLogId: 7, value: "down" }),
    ).resolves.toEqual({ status: "error" });
    await expect(
      submitter.submit({ requestLogId: 7, value: "down" }),
    ).resolves.toEqual({ status: "submitted", value: "down" });
    expect(request).toHaveBeenCalledTimes(2);
  });
});
