// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import SpokenGuideEditor from "./SpokenGuideEditor";

afterEach(cleanup);

describe("SpokenGuideEditor", () => {
  it("edits the introduction and keeps at most five FAQs", async () => {
    const user = userEvent.setup();
    let value = { locale: "vi-VN", text: "Mo dau", faqs: [] };
    const onChange = vi.fn((next) => {
      value = next;
      rerender(<SpokenGuideEditor value={value} onChange={onChange} />);
    });
    const { rerender } = render(
      <SpokenGuideEditor value={value} onChange={onChange} />,
    );

    expect(screen.getByDisplayValue("Mo dau")).toBeInTheDocument();
    for (let index = 0; index < 5; index += 1) {
      await user.click(screen.getByRole("button", { name: /thêm câu hỏi/i }));
    }

    expect(screen.getAllByLabelText(/câu hỏi thường gặp/i)).toHaveLength(5);
    expect(screen.getByRole("button", { name: /thêm câu hỏi/i })).toBeDisabled();
  });

  it("removes only the selected FAQ", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SpokenGuideEditor
        value={{
          locale: "vi-VN",
          text: "",
          faqs: [
            { question: "Cau mot", answer: "Tra loi mot" },
            { question: "Cau hai", answer: "Tra loi hai" },
          ],
        }}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /xóa câu hỏi 1/i }));
    expect(onChange).toHaveBeenLastCalledWith({
      locale: "vi-VN",
      text: "",
      faqs: [{ question: "Cau hai", answer: "Tra loi hai" }],
    });
  });
});
