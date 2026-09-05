const SEARCH_PREFIX_PATTERN = /^(?:(?:p|phuong|xa|tp|thanh pho|dac khu)\.?\s+)+/u;

const requireStringCode = (value, label) => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string code`);
  }
  return value;
};

export const normalizeAdministrativeSearch = (value) =>
  String(value ?? "")
    .trim()
    .toLocaleLowerCase("vi")
    .replace(/đ/gu, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(SEARCH_PREFIX_PATTERN, "")
    .replace(/[^a-z0-9]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");

const administrativeTypeFor = (sourceWard) => {
  const normalized = normalizeAdministrativeSearch(
    sourceWard.AdministrativeUnitShortName ?? sourceWard.FullName ?? "",
  );

  if (normalized === "phuong" || normalized.startsWith("phuong ")) return "ward";
  if (normalized === "xa" || normalized.startsWith("xa ")) return "commune";
  if (normalized === "dac khu" || normalized.startsWith("dac khu ")) {
    return "special_region";
  }

  throw new TypeError(
    `Unsupported administrative unit type for ward ${sourceWard.Code ?? "unknown"}`,
  );
};

const canonicalSearchName = (record) =>
  [...new Set([record.Name, record.FullName, record.CodeName].filter(Boolean))]
    .map(normalizeAdministrativeSearch)
    .filter(Boolean)
    .join(" ");

export const normalizeSourceDataset = (sourceProvinces) => {
  if (!Array.isArray(sourceProvinces)) {
    throw new TypeError("Administrative source dataset must be an array");
  }

  const provinces = [];
  const wards = [];
  const provinceCodes = new Set();
  const wardCodes = new Set();

  for (const sourceProvince of sourceProvinces) {
    const provinceCode = requireStringCode(sourceProvince?.Code, "Province code");
    if (provinceCodes.has(provinceCode)) {
      throw new TypeError(`Duplicate province code: ${provinceCode}`);
    }
    provinceCodes.add(provinceCode);

    provinces.push({
      code: provinceCode,
      name: sourceProvince.Name,
      nameEn: sourceProvince.NameEn ?? null,
      fullName: sourceProvince.FullName,
      fullNameEn: sourceProvince.FullNameEn ?? null,
      codeName: sourceProvince.CodeName ?? null,
      administrativeType: normalizeAdministrativeSearch(
        sourceProvince.AdministrativeUnitShortName ?? sourceProvince.FullName,
      ).replaceAll(" ", "_"),
      searchName: canonicalSearchName(sourceProvince),
    });

    if (!Array.isArray(sourceProvince.Wards)) {
      throw new TypeError(`Province ${provinceCode} must contain a wards array`);
    }

    for (const sourceWard of sourceProvince.Wards) {
      const wardCode = requireStringCode(sourceWard?.Code, "Ward code");
      const parentCode = requireStringCode(
        sourceWard?.ProvinceCode,
        `Ward ${wardCode} parent province code`,
      );
      if (parentCode !== provinceCode) {
        throw new TypeError(
          `Ward ${wardCode} parent province ${parentCode} does not match ${provinceCode}`,
        );
      }
      if (wardCodes.has(wardCode)) {
        throw new TypeError(`Duplicate ward code: ${wardCode}`);
      }
      wardCodes.add(wardCode);

      wards.push({
        code: wardCode,
        provinceCode,
        name: sourceWard.Name,
        nameEn: sourceWard.NameEn ?? null,
        fullName: sourceWard.FullName ?? null,
        fullNameEn: sourceWard.FullNameEn ?? null,
        codeName: sourceWard.CodeName ?? null,
        administrativeType: administrativeTypeFor(sourceWard),
        searchName: canonicalSearchName(sourceWard),
      });
    }
  }

  return { provinces, wards };
};

export const classifyCoordinateMatches = (matches) => {
  if (!Array.isArray(matches) || matches.length === 0) {
    return { confidence: "none", ward: null };
  }
  if (matches.length !== 1) {
    return { confidence: "ambiguous", ward: null };
  }
  return { confidence: "exact", ward: matches[0] };
};

const GIS_INSERT_PATTERN = /^INSERT INTO gis_(provinces|wards)\((?:province_code|ward_code), gis_server_id, area_km2, bbox, geom\) VALUES \('([^']+)','([^']*)',([0-9.]+),ST_GeomFromText\('([^']+)', 4326\),ST_GeomFromText\('([^']+)', 4326\)\);$/u;

export const parseUpstreamGisInsert = (line) => {
  const match = GIS_INSERT_PATTERN.exec(String(line).trim());
  if (!match) return null;

  return {
    kind: match[1] === "provinces" ? "province" : "ward",
    code: match[2],
    gisServerId: match[3],
    areaKm2: Number(match[4]),
    bboxWkt: match[5],
    geomWkt: match[6],
  };
};
