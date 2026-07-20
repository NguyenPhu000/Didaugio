import { Prisma } from "@prisma/client";
import prisma from "../../config/prismaClient.js";

export const createPrismaLocationRepository = (client = prisma) => ({
  getActiveRelease: () =>
    client.administrativeDatasetRelease.findFirst({
      where: { isActive: true },
      select: { id: true, releaseName: true, sourceCommit: true },
    }),

  listProvinces: async (datasetReleaseId) =>
    client.$queryRaw`
      SELECT record.province_code AS code, record.name, record.name_en AS "nameEn",
             record.full_name AS "fullName", record.full_name_en AS "fullNameEn",
             record.code_name AS "codeName", record.administrative_type AS "administrativeType",
             CASE WHEN boundary.geom IS NULL THEN NULL ELSE
               jsonb_build_object(
                 'center', jsonb_build_array(
                   ST_X(ST_PointOnSurface(boundary.geom)),
                   ST_Y(ST_PointOnSurface(boundary.geom))
                 ),
                 'bounds', jsonb_build_array(
                   ST_XMin(Box2D(boundary.geom)), ST_YMin(Box2D(boundary.geom)),
                   ST_XMax(Box2D(boundary.geom)), ST_YMax(Box2D(boundary.geom))
                 )
               )
             END AS spatial
      FROM province_dataset_records record
      LEFT JOIN province_boundaries boundary
        ON boundary.dataset_release_id = record.dataset_release_id
       AND boundary.province_code = record.province_code
      WHERE record.dataset_release_id = ${datasetReleaseId} AND record.is_active = true
      ORDER BY record.search_name, record.province_code`,

  listWards: (datasetReleaseId, provinceCode) =>
    client.administrativeWardDatasetRecord.findMany({
      where: { datasetReleaseId, provinceCode, isActive: true },
      select: {
        wardCode: true,
        provinceCode: true,
        name: true,
        nameEn: true,
        fullName: true,
        fullNameEn: true,
        codeName: true,
        administrativeType: true,
      },
      orderBy: [{ searchName: "asc" }, { wardCode: "asc" }],
    }),

  search: (datasetReleaseId, provinceCode, query) =>
    client.$queryRaw`
      SELECT 'ward' AS level, record.ward_code AS code,
             record.province_code AS "provinceCode", record.name,
             record.full_name AS "fullName",
             record.administrative_type AS "administrativeType"
      FROM administrative_ward_dataset_records record
      WHERE record.dataset_release_id = ${datasetReleaseId}
        AND record.province_code = ${provinceCode}
        AND record.is_active = true
        AND (record.search_name LIKE ${`%${query}%`} OR record.search_name % ${query})
      ORDER BY similarity(record.search_name, ${query}) DESC,
               record.search_name, record.ward_code
      LIMIT 30`,

  lookupCoordinate: async (datasetReleaseId, latitude, longitude) => {
    const point = Prisma.sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
    const wards = await client.$queryRaw`
      SELECT ward.ward_code AS code, ward.province_code AS "provinceCode",
             ward.name, ward.full_name AS "fullName",
             ward.administrative_type AS "administrativeType"
      FROM administrative_ward_boundaries boundary
      INNER JOIN administrative_ward_dataset_records ward
        ON ward.dataset_release_id = boundary.dataset_release_id
       AND ward.ward_code = boundary.ward_code
      WHERE boundary.dataset_release_id = ${datasetReleaseId}
        AND ward.is_active = true
        AND ST_Covers(boundary.geom, ${point})
      ORDER BY ward.ward_code`;
    const provinces = await client.$queryRaw`
      SELECT province.province_code AS code, province.name,
             province.full_name AS "fullName",
             province.administrative_type AS "administrativeType"
      FROM province_boundaries boundary
      INNER JOIN province_dataset_records province
        ON province.dataset_release_id = boundary.dataset_release_id
       AND province.province_code = boundary.province_code
      WHERE boundary.dataset_release_id = ${datasetReleaseId}
        AND province.is_active = true
        AND ST_Covers(boundary.geom, ${point})
      ORDER BY province.province_code`;
    return { wards, provinces };
  },
});
