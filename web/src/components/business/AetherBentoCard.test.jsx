import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import AetherBentoCard from "./AetherBentoCard";

describe("AetherBentoCard", () => {
  it("does not render an action affordance for a static metric", () => {
    render(<AetherBentoCard title="Số dư khả dụng" value="1.200.000 ₫" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders an actionable button only when an action is supplied", () => {
    const onClick = vi.fn();

    render(
      <AetherBentoCard
        title="Tổng lượt đặt chỗ"
        value="11"
        onClick={onClick}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Mở Tổng lượt đặt chỗ" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("uses a link when the action is navigation", () => {
    render(
      <MemoryRouter>
        <AetherBentoCard
          title="Danh sách dịch vụ"
          value="8"
          href="/business/places"
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Mở Danh sách dịch vụ" })).toHaveAttribute(
      "href",
      "/business/places",
    );
  });
});
