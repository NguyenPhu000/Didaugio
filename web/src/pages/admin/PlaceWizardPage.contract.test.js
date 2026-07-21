import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const sourceUrl = new URL("./PlaceWizardPage.jsx", import.meta.url);

describe("PlaceWizardPage ivory workspace contract", () => {
  it("renders the wizard inside the shared ivory workspace with an accessible step navigation", async () => {
    const source = await readFile(sourceUrl, "utf8");

    expect(source).toContain('data-testid="place-wizard-canvas"');
    expect(source).toContain('aria-label="Place creation progress"');
    expect(source).toContain("useWizardEntrance");
  });
});
