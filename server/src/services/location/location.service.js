import ServiceError from "../../utils/serviceError.js";
import {
  classifyCoordinateMatches,
  normalizeAdministrativeSearch,
} from "./administrativeDataset.domain.js";
import { createPrismaLocationRepository } from "./location.repository.js";
import * as cacheService from "../cache/cache.service.js";
import { administrativeLocationCacheOperations } from "../../observability/administrativeMetrics.js";
import { getEnabledProvinceCodes, isProvinceEnabled } from "./provinceRollout.js";

export const makeLocationService = (
  repository = createPrismaLocationRepository(),
  {
    cache = cacheService,
    cacheMetrics = administrativeLocationCacheOperations,
    enabledProvinceCodes = getEnabledProvinceCodes(),
  } = {},
) => {
  const cached = async (key, loader) => {
    const value = await cache.get(key);
    if (value != null) {
      cacheMetrics.inc({ outcome: "hit" });
      return value;
    }
    cacheMetrics.inc({ outcome: "miss" });
    const loaded = await loader();
    await cache.set(key, loaded, cache.TTL.STATIC);
    return loaded;
  };
  const requireEnabledProvince = (provinceCode) => {
    if (!isProvinceEnabled(provinceCode, enabledProvinceCodes)) {
      throw new ServiceError("Tỉnh/thành chưa được mở trong đợt rollout này", 404, "PROVINCE_NOT_ENABLED");
    }
  };
  const activeRelease = async () => {
    const release = await repository.getActiveRelease();
    if (!release) {
      throw new ServiceError(
        "Administrative dataset is not active",
        503,
        "ADMINISTRATIVE_DATASET_UNAVAILABLE",
      );
    }
    return release;
  };

  return {
    async listProvinces() {
      const release = await activeRelease();
      return {
        datasetReleaseId: release.id,
        releaseName: release.releaseName,
        data: (await cached(
          cache.buildKey("admin:provinces", { release: release.id }),
          () => repository.listProvinces(release.id),
        )).filter((province) => isProvinceEnabled(province.code, enabledProvinceCodes)),
      };
    },

    async listWards(provinceCode) {
      requireEnabledProvince(provinceCode);
      const release = await activeRelease();
      return {
        datasetReleaseId: release.id,
        releaseName: release.releaseName,
        data: await cached(
          cache.buildKey("admin:wards", { release: release.id, provinceCode }),
          () => repository.listWards(release.id, provinceCode),
        ),
      };
    },

    async search({ provinceCode, query }) {
      requireEnabledProvince(provinceCode);
      const release = await activeRelease();
      const normalizedQuery = normalizeAdministrativeSearch(query);
      return {
        datasetReleaseId: release.id,
        releaseName: release.releaseName,
        data: normalizedQuery
          ? await cached(
              cache.buildKey("admin:search", {
                release: release.id,
                provinceCode,
                query: normalizedQuery,
              }),
              () => repository.search(release.id, provinceCode, normalizedQuery),
            )
          : [],
      };
    },

    async lookup({ latitude, longitude }) {
      const release = await activeRelease();
      const rawMatches = await repository.lookupCoordinate(release.id, latitude, longitude);
      const matches = {
        wards: rawMatches.wards.filter((ward) => isProvinceEnabled(ward.provinceCode, enabledProvinceCodes)),
        provinces: rawMatches.provinces.filter((province) => isProvinceEnabled(province.code, enabledProvinceCodes)),
      };
      const wardMatch = classifyCoordinateMatches(matches.wards);
      const provinceMatch = classifyCoordinateMatches(matches.provinces);

      let confidence = "none";
      if (wardMatch.confidence === "exact") confidence = "exact";
      else if (wardMatch.confidence === "ambiguous") confidence = "ambiguous";
      else if (provinceMatch.confidence === "exact") confidence = "province_only";
      else if (provinceMatch.confidence === "ambiguous") confidence = "ambiguous";

      return {
        datasetReleaseId: release.id,
        releaseName: release.releaseName,
        confidence,
        province:
          provinceMatch.ward ??
          (wardMatch.ward
            ? matches.provinces.find((province) => province.code === wardMatch.ward.provinceCode) ?? null
            : null),
        ward: wardMatch.ward,
      };
    },
  };
};

const locationService = makeLocationService();
export const listProvinces = () => locationService.listProvinces();
export const listWards = (provinceCode) => locationService.listWards(provinceCode);
export const searchLocations = (input) => locationService.search(input);
export const lookupLocation = (input) => locationService.lookup(input);
