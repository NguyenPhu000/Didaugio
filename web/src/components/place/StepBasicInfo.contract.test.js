import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const sourceUrl = new URL("./StepBasicInfo.jsx", import.meta.url);

describe("StepBasicInfo ivory workspace contract", () => {
  it("uses the shared wizard surfaces while preserving the province and ward selector", async () => {
    const source = await readFile(sourceUrl, "utf8");

    expect(source).toContain("WizardPanel");
    expect(source).toContain("WizardActions");
    expect(source).toContain("ProvinceWardSelect");
  });
});
