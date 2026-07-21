import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const sourceUrl = new URL("./TagFormDialog.jsx", import.meta.url);

describe("TagFormDialog", () => {
  it("does not render an optional icon input", async () => {
    const source = await readFile(sourceUrl, "utf8");

    expect(source).not.toContain('id="icon"');
    expect(source).not.toContain("icon:");
  });
});
