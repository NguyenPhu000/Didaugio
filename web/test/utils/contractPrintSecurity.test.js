import { describe, expect, it } from "vitest";

import { escapeContractPrintValue } from "@/utils/contractPrintSecurity";

describe("contract print HTML escaping", () => {
  it("renders user-controlled contract fields as text instead of executable markup", () => {
    expect(
      escapeContractPrintValue(`</b><script>window.opener.location="https://evil.test"</script>`),
    ).toBe(
      "&lt;/b&gt;&lt;script&gt;window.opener.location=&quot;https://evil.test&quot;&lt;/script&gt;",
    );
  });

  it("escapes apostrophes and ampersands and handles empty values", () => {
    expect(escapeContractPrintValue("O'Reilly & Partners")).toBe(
      "O&#39;Reilly &amp; Partners",
    );
    expect(escapeContractPrintValue(null)).toBe("");
  });
});
