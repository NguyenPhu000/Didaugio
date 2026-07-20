import assert from "node:assert/strict";
import test from "node:test";

import {
  createPlaceSchema,
  placeV2ListQuerySchema,
} from "../src/models/schemas/place/place.schema.js";
import { buildWhere } from "../src/services/place/placeV2.service.js";
import { makePlaceLocationValidator } from "../src/services/place/placeLocation.service.js";

test("public V2 place listing requires a string province code", () => {
  assert.equal(placeV2ListQuerySchema.safeParse({}).success, false);
  const parsed = placeV2ListQuerySchema.parse({
    provinceCode: "01",
    wardCode: "00004",
  });
  assert.equal(parsed.provinceCode, "01");
  assert.equal(parsed.wardCode, "00004");
});

test("canonical place filter prevents cross-province and unresolved leakage", () => {
  const where = buildWhere(
    { provinceCode: "92", wardCode: "31117", sortBy: "newest" },
    null,
    7,
  );

  assert.equal(where.provinceCode, "92");
  assert.equal(where.administrativeWardCode, "31117");
  assert.deepEqual(where.administrativeLocationExceptions, {
    none: { status: "open", datasetReleaseId: 7 },
  });
  assert.equal("districtId" in where, false);
  assert.equal("wardId" in where, false);
});

test("canonical writes reject cross-province wards and allow no-ward places", async () => {
  const repository = {
    getActiveRelease: async () => ({ id: 7 }),
    findProvince: async (_releaseId, code) => (code === "92" ? { code } : null),
    findWard: async (_releaseId, code) =>
      code === "00004" ? { code, provinceCode: "01" } : null,
    coordinateCoveredByWard: async () => true,
  };
  const validate = makePlaceLocationValidator(repository, {
    enabledProvinceCodes: new Set(["01", "92"]),
  });

  await assert.doesNotReject(() => validate({ provinceCode: "92" }));
  await assert.rejects(
    () => validate({ provinceCode: "92", administrativeWardCode: "00004" }),
    (error) => error.errorCode === "WARD_PROVINCE_MISMATCH",
  );
});

test("legacy Cần Thơ create payload remains schema-compatible until R4", () => {
  const result = createPlaceSchema.safeParse({
    name: "Điểm đến Cần Thơ",
    slug: "diem-den-can-tho",
    categoryId: 1,
    districtId: 1,
    address: "Đường Hai Bà Trưng, Cần Thơ",
    latitude: 10.034,
    longitude: 105.788,
    images: [{ imageData: `data:image/png;base64,${"A".repeat(120)}` }],
  });
  assert.equal(result.success, true);
});
