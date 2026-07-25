import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AiKillSwitchDialog from "./AiKillSwitchDialog";
import AiPublishDialog from "./AiPublishDialog";
import AiRollbackDialog from "./AiRollbackDialog";

describe("Admin AI guarded dialogs", () => {
  it("requires a reason and sends the visible revision when publishing", async () => {
    const user = userEvent.setup();
    const confirm = vi.fn();

    render(
      <AiPublishDialog
        open
        onOpenChange={vi.fn()}
        revision={7}
        currentVersion={3}
        draftVersion={4}
        onConfirm={confirm}
      />,
    );

    expect(screen.getByText("v3 → v4")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Xác nhận phát hành" }),
    ).toBeDisabled();

    await user.type(
      screen.getByLabelText("Lý do phát hành"),
      "Đã kiểm thử draft",
    );
    await user.click(
      screen.getByRole("button", { name: "Xác nhận phát hành" }),
    );

    expect(confirm).toHaveBeenCalledWith({
      revision: 7,
      changeReason: "Đã kiểm thử draft",
    });
  });

  it("requires a historical target and reason before rollback", async () => {
    const user = userEvent.setup();
    const confirm = vi.fn();

    render(
      <AiRollbackDialog
        open
        onOpenChange={vi.fn()}
        currentVersion={4}
        versions={[
          { version: 4, status: "published" },
          { version: 3, status: "archived" },
          { version: 2, status: "archived" },
        ]}
        onConfirm={confirm}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Xác nhận rollback" }),
    ).toBeDisabled();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Phiên bản đích" }),
      "2",
    );
    await user.type(
      screen.getByLabelText("Lý do rollback"),
      "Khôi phục bản ổn định",
    );
    expect(screen.getByText("v4 → v2")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Xác nhận rollback" }),
    );

    expect(confirm).toHaveBeenCalledWith({
      targetVersion: 2,
      changeReason: "Khôi phục bản ổn định",
    });
  });

  it("requires the exact typed phrase and a reason for the kill switch", async () => {
    const user = userEvent.setup();
    const confirm = vi.fn();

    render(
      <AiKillSwitchDialog
        open
        onOpenChange={vi.fn()}
        enabled
        onConfirm={confirm}
      />,
    );

    await user.type(
      screen.getByLabelText("Lý do thay đổi kill switch"),
      "Provider đang lỗi diện rộng",
    );
    await user.type(screen.getByLabelText("Nhập TAT AI để xác nhận"), "tat ai");
    expect(
      screen.getByRole("button", { name: "Xác nhận tắt AI" }),
    ).toBeDisabled();

    await user.clear(screen.getByLabelText("Nhập TAT AI để xác nhận"));
    await user.type(screen.getByLabelText("Nhập TAT AI để xác nhận"), "TAT AI");
    await user.click(
      screen.getByRole("button", { name: "Xác nhận tắt AI" }),
    );

    expect(confirm).toHaveBeenCalledWith({
      enabled: true,
      reason: "Provider đang lỗi diện rộng",
    });
  });
});
