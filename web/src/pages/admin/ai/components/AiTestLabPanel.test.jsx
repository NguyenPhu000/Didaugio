import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AiTestLabPanel from "./AiTestLabPanel";

describe("AiTestLabPanel", () => {
  it("submits only bounded context fields and displays a masked, ephemeral result", async () => {
    const user = userEvent.setup();
    const runTest = vi.fn();
    const { rerender } = render(
      <AiTestLabPanel
        onRun={runTest}
        result={undefined}
        sourceVersions={{ draft: 9, published: 8 }}
      />,
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Nguồn cấu hình" }),
      "published",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Tính năng" }),
      "planner",
    );
    await user.type(screen.getByLabelText("Tin nhắn thử"), "Lập lịch 2 ngày");
    await user.type(screen.getByLabelText("Thành phố"), "Đà Nẵng");
    await user.type(screen.getByLabelText("Số người"), "3");
    await user.click(screen.getByRole("button", { name: "Chạy test" }));

    expect(runTest).toHaveBeenCalledWith({
      source: "published",
      feature: "planner",
      message: "Lập lịch 2 ngày",
      context: {
        currentCity: "Đà Nẵng",
        partySize: 3,
      },
    });

    rerender(
      <AiTestLabPanel
        onRun={runTest}
        sourceVersions={{ draft: 9, published: 8 }}
        result={{
          requestId: "test-1",
          context: { currentCity: "Đà Nẵng", partySize: 3 },
          renderedPrompt: {
            system: "Planner context: Đà Nẵng, party 3",
            user: "[REDACTED_TEST_MESSAGE]",
          },
          provider: {
            provider: "groq",
            model: "llama",
            inputTokens: 42,
            outputTokens: 18,
            latencyMs: 640,
            status: "success",
            finishReason: "stop",
          },
        }}
      />,
    );

    expect(screen.getByText("groq / llama / v8")).toBeInTheDocument();
    expect(screen.getByText("42 in / 18 out")).toBeInTheDocument();
    expect(screen.getByText("640 ms")).toBeInTheDocument();
    expect(screen.getByText("success · stop")).toBeInTheDocument();
    expect(screen.getByText("Passed")).toBeInTheDocument();
    expect(screen.getByText(/MASKED/)).toBeInTheDocument();
    expect(screen.getByText(/REDACTED_TEST_MESSAGE/)).toBeInTheDocument();
    expect(screen.queryByText(/Đà Nẵng/)).not.toBeInTheDocument();
    expect(screen.queryByText("Lịch trình đã tạo")).not.toBeInTheDocument();

    rerender(
      <AiTestLabPanel
        onRun={runTest}
        result={undefined}
        sourceVersions={{ draft: 9, published: 8 }}
      />,
    );
    expect(screen.queryByText("Kết quả provider")).not.toBeInTheDocument();
  });

  it("blocks invalid optional context bounds before a test mutation", async () => {
    const user = userEvent.setup();
    const runTest = vi.fn();

    render(
      <AiTestLabPanel
        onRun={runTest}
        sourceVersions={{ draft: 9, published: 8 }}
      />,
    );

    await user.type(screen.getByLabelText("Tin nhắn thử"), "Xin chào");
    await user.type(screen.getByLabelText("Số người"), "21");

    expect(screen.getByRole("button", { name: "Chạy test" })).toBeDisabled();
    expect(runTest).not.toHaveBeenCalled();
  });

  it("renders provider validation failures without inventing a successful result", () => {
    render(
      <AiTestLabPanel
        onRun={vi.fn()}
        sourceVersions={{ draft: 9, published: 8 }}
        error={{
          message: "Context không hợp lệ",
          data: {
            errors: [
              { field: "context.tripDuration", message: "Tối đa 14 ngày" },
            ],
          },
        }}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "context.tripDuration: Tối đa 14 ngày",
    );
    expect(screen.queryByText("Kết quả provider")).not.toBeInTheDocument();
  });

  it("uses the loaded source version when the existing test response omits one", () => {
    render(
      <AiTestLabPanel
        onRun={vi.fn()}
        sourceVersions={{ draft: 9, published: 8 }}
        result={{
          requestId: "test-2",
          context: {},
          renderedPrompt: {
            system: "System prompt",
            user: "[REDACTED_TEST_MESSAGE]",
          },
          provider: {
            provider: "groq",
            model: "llama",
            inputTokens: 1,
            outputTokens: 2,
            latencyMs: 10,
            status: "success",
            finishReason: "length",
          },
        }}
      />,
    );

    expect(screen.getByText("groq / llama / v9")).toBeInTheDocument();
    expect(screen.getByText("success · length")).toBeInTheDocument();
  });

  it("labels a safety-blocked server rejection in the explicit error area", () => {
    render(
      <AiTestLabPanel
        onRun={vi.fn()}
        sourceVersions={{ draft: 9, published: 8 }}
        error={{
          message: "Yêu cầu này không thể được xử lý.",
          data: {
            errorCode: "AI_SAFETY_BLOCKED",
          },
        }}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Safety: Blocked",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Yêu cầu này không thể được xử lý.",
    );
    expect(screen.queryByText("Kết quả provider")).not.toBeInTheDocument();
  });

  it("disables execution when the selected configuration version is unavailable", async () => {
    const user = userEvent.setup();
    const runTest = vi.fn();

    render(
      <AiTestLabPanel
        onRun={runTest}
        sourceVersions={{ published: 8 }}
      />,
    );

    await user.type(screen.getByLabelText("Tin nhắn thử"), "Xin chào");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Draft snapshot chưa sẵn sàng",
    );
    expect(screen.getByRole("button", { name: "Chạy test" })).toBeDisabled();
    expect(runTest).not.toHaveBeenCalled();
  });
});
