import { Prisma } from "@prisma/client";
import prisma from "../../config/prismaClient.js";
import ServiceError from "../../utils/serviceError.js";
import { getEnabledProvinceCodes, isProvinceEnabled } from "../location/provinceRollout.js";

export const createPlaceLocationRepository = (client = prisma) => ({
  getActiveRelease: () => client.administrativeDatasetRelease.findFirst({
    where: { isActive: true },
    select: { id: true },
  }),
  findProvince: (datasetReleaseId, provinceCode) =>
    client.provinceDatasetRecord.findUnique({
      where: { datasetReleaseId_provinceCode: { datasetReleaseId, provinceCode } },
      select: { provinceCode: true, isActive: true },
    }),
  findWard: (datasetReleaseId, wardCode) =>
    client.administrativeWardDatasetRecord.findUnique({
      where: { datasetReleaseId_wardCode: { datasetReleaseId, wardCode } },
      select: { wardCode: true, provinceCode: true, isActive: true },
    }),
  coordinateCoveredByWard: async (datasetReleaseId, wardCode, latitude, longitude) => {
    const point = Prisma.sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
    const rows = await client.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM administrative_ward_boundaries
        WHERE dataset_release_id = ${datasetReleaseId}
          AND ward_code = ${wardCode}
          AND ST_Covers(geom, ${point})
      ) AS covered`;
    return rows[0]?.covered === true;
  },
});

export const makePlaceLocationValidator = (
  repository,
  { enabledProvinceCodes = getEnabledProvinceCodes() } = {},
) => async ({
  provinceCode,
  administrativeWardCode = null,
  latitude,
  longitude,
}) => {
  if (!isProvinceEnabled(provinceCode, enabledProvinceCodes)) {
    throw new ServiceError("Tỉnh/thành chưa được mở trong đợt rollout này", 422, "PROVINCE_NOT_ENABLED");
  }
  const release = await repository.getActiveRelease();
  if (!release) {
    throw new ServiceError("Chưa có bộ dữ liệu hành chính đang hoạt động", 503, "ADMIN_DATASET_UNAVAILABLE");
  }

  const province = await repository.findProvince(release.id, provinceCode);
  if (!province || province.isActive === false) {
    throw new ServiceError("Mã tỉnh/thành không hợp lệ", 422, "INVALID_PROVINCE");
  }
  if (!administrativeWardCode) return { datasetReleaseId: release.id };

  const ward = await repository.findWard(release.id, administrativeWardCode);
  if (!ward || ward.isActive === false) {
    throw new ServiceError("Mã phường/xã không hợp lệ", 422, "INVALID_WARD");
  }
  if (ward.provinceCode !== provinceCode) {
    throw new ServiceError("Phường/xã không thuộc tỉnh/thành đã chọn", 422, "WARD_PROVINCE_MISMATCH");
  }

  if (latitude != null && longitude != null) {
    const covered = await repository.coordinateCoveredByWard(
      release.id,
      administrativeWardCode,
      Number(latitude),
      Number(longitude),
    );
    if (!covered) {
      throw new ServiceError("Tọa độ không nằm trong phường/xã đã chọn", 422, "COORDINATE_WARD_MISMATCH");
    }
  }

  return { datasetReleaseId: release.id };
};

export const validatePlaceLocation = makePlaceLocationValidator(createPlaceLocationRepository());
