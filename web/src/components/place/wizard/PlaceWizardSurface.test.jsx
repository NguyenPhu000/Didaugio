import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WizardPanel, WizardSectionHeading } from "./PlaceWizardSurface";

describe("PlaceWizardSurface", () => {
  it("renders a labelled ivory panel with monochrome icon styling", () => {
    render(
      <WizardPanel aria-label="Location panel">
        <WizardSectionHeading title="Địa chỉ" description="Xác định vị trí" />
      </WizardPanel>,
    );

    expect(screen.getByLabelText("Location panel").className).toContain("bg-[#FFFEFB]");
    expect(screen.getByText("Địa chỉ")).toBeTruthy();
  });
});
