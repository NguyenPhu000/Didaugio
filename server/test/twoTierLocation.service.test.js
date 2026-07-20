import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyCoordinateMatches,
  normalizeAdministrativeSearch,
  normalizeSourceDataset,
  parseUpstreamGisInsert,
} from "../src/services/location/administrativeDataset.domain.js";
import { makeLocationService } from "../src/services/location/location.service.js";

const source = [
  {
    Type: "province",
    Code: "01",
    Name: "Hà Nội",
    FullName: "Thành phố Hà Nội",
    AdministrativeUnitShortName: "Thành phố",
    Wards: [
      {
        Type: "ward",
        Code: "00004",
        Name: "Ba Đình",
        FullName: "Phường Ba Đình",
        ProvinceCode: "01",
        AdministrativeUnitShortName: "Phường",
      },
      {
        Type: "ward",
        Code: "00031",
        Name: "Sóc Sơn",
        FullName: "Xã Sóc Sơn",
        ProvinceCode: "01",
        AdministrativeUnitShortName: "Xã",
      },
    ],
  },
  {
    Type: "province",
    Code: "92",
    Name: "Cần Thơ",
    FullName: "Thành phố Cần Thơ",
    AdministrativeUnitShortName: "Thành phố",
    Wards: [
      {
        Type: "ward",
        Code: "31117",
        Name: "Ninh Kiều",
        FullName: "Phường Ninh Kiều",
        ProvinceCode: "92",
        AdministrativeUnitShortName: "Phường",
      },
      {
        Type: "ward",
        Code: "31120",
        Name: "Côn Đảo",
        FullName: "Đặc khu Côn Đảo",
        ProvinceCode: "92",
        AdministrativeUnitShortName: "Đặc khu",
      },
    ],
  },
];

test("preserves official codes as strings, including leading zeroes", () => {
  const dataset = normalizeSourceDataset(source);

  assert.equal(dataset.provinces[0].code, "01");
  assert.equal(dataset.wards[0].code, "00004");
  assert.equal(typeof dataset.wards[0].code, "string");
  assert.throws(
    () => normalizeSourceDataset([{ ...source[0], Code: 1 }]),
    /string code/i,
  );
});

test("keeps wards isolated to their declared province", () => {
  const dataset = normalizeSourceDataset(source);
  const canThoCodes = dataset.wards
    .filter((ward) => ward.provinceCode === "92")
    .map((ward) => ward.code);

  assert.deepEqual(canThoCodes, ["31117", "31120"]);
  assert.throws(
    () =>
      normalizeSourceDataset([
        {
          ...source[0],
          Wards: [{ ...source[0].Wards[0], ProvinceCode: "92" }],
        },
      ]),
    /parent province/i,
  );
});

test("derives the three supported second-tier display types", () => {
  const dataset = normalizeSourceDataset(source);

  assert.deepEqual(
    dataset.wards.map((ward) => ward.administrativeType),
    ["ward", "commune", "ward", "special_region"],
  );
});

test("normalizes Vietnamese diacritics and harmless unit prefixes", () => {
  assert.equal(normalizeAdministrativeSearch("P. Ninh Kiều"), "ninh kieu");
  assert.equal(normalizeAdministrativeSearch("Phường Ninh Kiều"), "ninh kieu");
  assert.equal(normalizeAdministrativeSearch("Xã Sóc Sơn"), "soc son");
  assert.equal(normalizeAdministrativeSearch("TP. Cần Thơ"), "can tho");
});

test("never guesses a ward when coordinate containment is ambiguous", () => {
  assert.deepEqual(classifyCoordinateMatches([]), {
    confidence: "none",
    ward: null,
  });
  assert.deepEqual(classifyCoordinateMatches([{ code: "31117" }]), {
    confidence: "exact",
    ward: { code: "31117" },
  });
  assert.deepEqual(
    classifyCoordinateMatches([{ code: "31117" }, { code: "31120" }]),
    { confidence: "ambiguous", ward: null },
  );
});

test("parses upstream GIS INSERT data without executing upstream SQL", () => {
  const parsed = parseUpstreamGisInsert(
    "INSERT INTO gis_wards(ward_code, gis_server_id, area_km2, bbox, geom) VALUES ('00004','xa.1',1.25,ST_GeomFromText('POLYGON((1 1,1 2,2 2,1 1))', 4326),ST_GeomFromText('MULTIPOLYGON(((1 1,1 2,2 2,1 1)))', 4326));",
  );

  assert.deepEqual(parsed, {
    kind: "ward",
    code: "00004",
    gisServerId: "xa.1",
    areaKm2: 1.25,
    bboxWkt: "POLYGON((1 1,1 2,2 2,1 1))",
    geomWkt: "MULTIPOLYGON(((1 1,1 2,2 2,1 1)))",
  });
  assert.equal(parseUpstreamGisInsert("DROP TABLE gis_wards;"), null);
});

test("location service scopes ward reads and normalized search to one province", async () => {
  const calls = [];
  const service = makeLocationService({
    getActiveRelease: async () => ({ id: 7, releaseName: "v3.1.0" }),
    listProvinces: async () => [],
    listWards: async (releaseId, provinceCode) => {
      calls.push(["wards", releaseId, provinceCode]);
      return [{ code: "31117", provinceCode }];
    },
    search: async (releaseId, provinceCode, query) => {
      calls.push(["search", releaseId, provinceCode, query]);
      return [];
    },
    lookupCoordinate: async () => ({ wards: [], provinces: [] }),
  });

  const wards = await service.listWards("92");
  await service.search({ provinceCode: "92", query: "Phường Ninh Kiều" });

  assert.equal(wards.datasetReleaseId, 7);
  assert.deepEqual(calls, [
    ["wards", 7, "92"],
    ["search", 7, "92", "ninh kieu"],
  ]);
});

test("location service returns ambiguity instead of selecting a coordinate match", async () => {
  const service = makeLocationService({
    getActiveRelease: async () => ({ id: 7, releaseName: "v3.1.0" }),
    listProvinces: async () => [],
    listWards: async () => [],
    search: async () => [],
    lookupCoordinate: async () => ({
      wards: [
        { code: "A", provinceCode: "92" },
        { code: "B", provinceCode: "92" },
      ],
      provinces: [{ code: "92" }],
    }),
  });

  const result = await service.lookup({ latitude: 10.03, longitude: 105.78 });
  assert.equal(result.confidence, "ambiguous");
  assert.equal(result.ward, null);
  assert.deepEqual(result.province, { code: "92" });
});

test("rollout defaults to Cần Thơ and rejects unopened provinces", async () => {
  const service = makeLocationService({
    getActiveRelease: async () => ({ id: 7, releaseName: "v3.1.0" }),
    listProvinces: async () => [{ code: "92" }, { code: "01" }],
    listWards: async () => [],
    search: async () => [],
    lookupCoordinate: async () => ({ wards: [], provinces: [] }),
  });
  assert.deepEqual((await service.listProvinces()).data, [{ code: "92" }]);
  await assert.rejects(() => service.listWards("01"), (error) => error.errorCode === "PROVINCE_NOT_ENABLED");
});
