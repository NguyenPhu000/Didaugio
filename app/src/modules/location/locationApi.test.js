import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPublicWithFallback } from "../../api/publicClient";
import { getProvinces, getWards, searchLocations } from "./locationApi";
import { normalizeActiveLocation } from "./locationStore";

vi.mock("../../api/publicClient", () => ({
  getPublicWithFallback: vi.fn(),
}));

describe("internal administrative location API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses only application V2 endpoints", async () => {
    getPublicWithFallback.mockResolvedValue({ data: [], meta: { datasetReleaseId: 7 } });
    await getProvinces();
    await getWards("01");
    await searchLocations({ provinceCode: "01", query: "Ba Đình" });

    expect(getPublicWithFallback.mock.calls.map(([url]) => url)).toEqual([
      "/v2/locations/provinces",
      "/v2/locations/provinces/01/wards",
      "/v2/locations/search",
    ]);
  });

  it("preserves province codes and release IDs", () => {
    expect(normalizeActiveLocation({ provinceCode: "01", datasetReleaseId: "7" })).toEqual({
      provinceCode: "01",
      datasetReleaseId: 7,
    });
  });
});
