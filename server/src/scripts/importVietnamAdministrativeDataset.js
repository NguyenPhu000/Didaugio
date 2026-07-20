import { createReadStream } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import pg from "pg";

import {
  loadAdministrativeManifest,
  loadAndValidateAdministrativeSource,
  verifyAdministrativeArtifacts,
} from "../services/location/administrativeSource.js";
import { parseUpstreamGisInsert } from "../services/location/administrativeDataset.domain.js";

const { Client } = pg;
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const defaultManifestPath = path.join(
  serverRoot,
  "test/fixtures/administrative/upstream-manifest.json",
);

const insertJsonRecordset = (client, sql, records, ...parameters) =>
  client.query(sql, [JSON.stringify(records), ...parameters]);

const activateRelease = async (client, datasetReleaseId) => {
  if (process.env.ADMIN_DATA_ACTIVATION_APPROVED !== "true") {
    throw new Error("Activation requires ADMIN_DATA_ACTIVATION_APPROVED=true after R0 approval");
  }
  await client.query("UPDATE administrative_dataset_releases SET is_active = false WHERE is_active");
  await client.query(
    "UPDATE administrative_dataset_releases SET is_active = true, activated_at = now() WHERE id = $1",
    [datasetReleaseId],
  );
};

const importGis = async ({ client, datasetReleaseId, gisPath, wardProvince }) => {
  const input = createReadStream(gisPath, { encoding: "utf8" });
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  const counts = { province: 0, ward: 0 };

  for await (const line of lines) {
    const row = parseUpstreamGisInsert(line);
    if (!row) continue;
    counts[row.kind] += 1;

    if (row.kind === "province") {
      await client.query(
        `INSERT INTO vn_admin_source.province_boundaries
          (dataset_release_id, province_code, gis_server_id, area_km2, bbox, geom)
         VALUES ($1, $2, $3, $4, ST_GeomFromText($5, 4326), ST_GeomFromText($6, 4326))`,
        [datasetReleaseId, row.code, row.gisServerId, row.areaKm2, row.bboxWkt, row.geomWkt],
      );
    } else {
      const provinceCode = wardProvince.get(row.code);
      if (!provinceCode) throw new Error(`GIS ward ${row.code} is absent from administrative JSON`);
      await client.query(
        `INSERT INTO vn_admin_source.ward_boundaries
          (dataset_release_id, ward_code, province_code, gis_server_id, area_km2, bbox, geom)
         VALUES ($1, $2, $3, $4, $5, ST_GeomFromText($6, 4326), ST_GeomFromText($7, 4326))`,
        [datasetReleaseId, row.code, provinceCode, row.gisServerId, row.areaKm2, row.bboxWkt, row.geomWkt],
      );
    }
  }
  return counts;
};

const main = async () => {
  const manifestPath = path.resolve(process.env.VN_ADMIN_MANIFEST || defaultManifestPath);
  const sourceDir = path.resolve(process.env.VN_ADMIN_SOURCE_DIR || "");
  if (!process.env.VN_ADMIN_SOURCE_DIR) throw new Error("VN_ADMIN_SOURCE_DIR is required");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

  const { manifest, manifestChecksum } = await loadAdministrativeManifest(manifestPath);
  const artifacts = await verifyAdministrativeArtifacts({ manifest, sourceDir });
  const { rawProvinces, dataset, typeCounts } = await loadAndValidateAdministrativeSource({
    manifest,
    sourceDir,
  });
  const gisArtifact = artifacts.find((artifact) => artifact.purpose.includes("spatial backfill"));
  if (!gisArtifact) throw new Error("Manifest has no GIS artifact");

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  const activateRequested = process.argv.includes("--activate");
  await client.connect();
  try {
    await client.query("BEGIN");
    const releaseResult = await client.query(
      `INSERT INTO administrative_dataset_releases
        (source_repo, source_ref, source_commit, release_name, manifest_checksum)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (source_repo, source_commit) DO NOTHING
       RETURNING id, manifest_checksum`,
      [manifest.sourceRepo, manifest.sourceRef, manifest.sourceCommit, manifest.releaseName, manifestChecksum],
    );
    const persistedRelease = releaseResult.rowCount === 1
      ? releaseResult.rows[0]
      : (
          await client.query(
            `SELECT id, manifest_checksum FROM administrative_dataset_releases
             WHERE source_repo = $1 AND source_commit = $2`,
            [manifest.sourceRepo, manifest.sourceCommit],
          )
        ).rows[0];
    if (!persistedRelease || persistedRelease.manifest_checksum !== manifestChecksum) {
      throw new Error(`Release ${manifest.releaseName} exists with a different manifest checksum`);
    }
    const datasetReleaseId = persistedRelease.id;
    const existing = await client.query(
      `SELECT
         (SELECT count(*)::int FROM province_dataset_records WHERE dataset_release_id = $1) AS province_count,
         (SELECT count(*)::int FROM administrative_ward_dataset_records WHERE dataset_release_id = $1) AS ward_count,
         (SELECT count(*)::int FROM province_boundaries WHERE dataset_release_id = $1) AS province_geometry_count,
         (SELECT count(*)::int FROM administrative_ward_boundaries WHERE dataset_release_id = $1) AS ward_geometry_count`,
      [datasetReleaseId],
    );
    if (existing.rows[0].province_count > 0) {
      if (!activateRequested) {
        throw new Error(`Release ${manifest.releaseName} is immutable and has already been imported`);
      }
      const counts = existing.rows[0];
      if (
        counts.province_count !== manifest.expected.provinceCount ||
        counts.ward_count !== manifest.expected.wardCount ||
        counts.province_geometry_count !== manifest.expected.provinceCount ||
        counts.ward_geometry_count !== manifest.expected.wardCount
      ) {
        throw new Error(`Existing release ${manifest.releaseName} is incomplete and cannot be activated`);
      }
      await activateRelease(client, datasetReleaseId);
      await client.query("COMMIT");
      console.log(JSON.stringify({
        datasetReleaseId,
        release: manifest.releaseName,
        activatedExistingRelease: true,
        counts,
      }, null, 2));
      return;
    }

    await insertJsonRecordset(
      client,
      `INSERT INTO provinces(code)
       SELECT code FROM jsonb_to_recordset($1::jsonb) AS x(code text)
       ON CONFLICT (code) DO NOTHING`,
      dataset.provinces,
    );
    await insertJsonRecordset(
      client,
      `INSERT INTO administrative_wards(code)
       SELECT code FROM jsonb_to_recordset($1::jsonb) AS x(code text)
       ON CONFLICT (code) DO NOTHING`,
      dataset.wards,
    );

    const rawWards = rawProvinces.flatMap((province) => province.Wards);
    await insertJsonRecordset(
      client,
      `INSERT INTO vn_admin_source.provinces(dataset_release_id, code, payload)
       SELECT $2, code, payload
       FROM jsonb_to_recordset($1::jsonb) AS x(code text, payload jsonb)`,
      rawProvinces.map((province) => ({ code: province.Code, payload: province })),
      datasetReleaseId,
    );
    await insertJsonRecordset(
      client,
      `INSERT INTO vn_admin_source.wards(dataset_release_id, code, province_code, payload)
       SELECT $2, code, province_code, payload
       FROM jsonb_to_recordset($1::jsonb) AS x(code text, province_code text, payload jsonb)`,
      rawWards.map((ward) => ({ code: ward.Code, province_code: ward.ProvinceCode, payload: ward })),
      datasetReleaseId,
    );

    await client.query(
      `INSERT INTO province_dataset_records
        (dataset_release_id, province_code, name, name_en, full_name, full_name_en,
         code_name, search_name, administrative_type, is_active)
       SELECT $2, code, name, "nameEn", "fullName", "fullNameEn", "codeName",
              "searchName", "administrativeType", true
       FROM jsonb_to_recordset($1::jsonb) AS x(
         code text, name text, "nameEn" text, "fullName" text, "fullNameEn" text,
         "codeName" text, "searchName" text, "administrativeType" text
       )`,
      [JSON.stringify(dataset.provinces), datasetReleaseId],
    );
    await client.query(
      `INSERT INTO administrative_ward_dataset_records
        (dataset_release_id, ward_code, province_code, name, name_en, full_name,
         full_name_en, code_name, search_name, administrative_type, is_active)
       SELECT $2, code, "provinceCode", name, "nameEn", "fullName", "fullNameEn",
              "codeName", "searchName", "administrativeType", true
       FROM jsonb_to_recordset($1::jsonb) AS x(
         code text, "provinceCode" text, name text, "nameEn" text, "fullName" text,
         "fullNameEn" text, "codeName" text, "searchName" text, "administrativeType" text
       )`,
      [JSON.stringify(dataset.wards), datasetReleaseId],
    );

    const wardProvince = new Map(dataset.wards.map((ward) => [ward.code, ward.provinceCode]));
    const gisCounts = await importGis({ client, datasetReleaseId, gisPath: gisArtifact.absolutePath, wardProvince });
    if (gisCounts.province !== manifest.expected.provinceCount || gisCounts.ward !== manifest.expected.wardCount) {
      throw new Error(`GIS count mismatch: ${JSON.stringify(gisCounts)}`);
    }

    await client.query(
      `INSERT INTO province_boundaries(dataset_release_id, province_code, area_km2, bbox, geom)
       SELECT dataset_release_id, province_code, area_km2, bbox, geom
       FROM vn_admin_source.province_boundaries WHERE dataset_release_id = $1`,
      [datasetReleaseId],
    );
    await client.query(
      `INSERT INTO administrative_ward_boundaries(dataset_release_id, ward_code, area_km2, bbox, geom)
       SELECT dataset_release_id, ward_code, area_km2, bbox, geom
       FROM vn_admin_source.ward_boundaries WHERE dataset_release_id = $1`,
      [datasetReleaseId],
    );

    if (activateRequested) await activateRelease(client, datasetReleaseId);
    await client.query("COMMIT");
    console.log(JSON.stringify({ datasetReleaseId, release: manifest.releaseName, typeCounts, gisCounts }, null, 2));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
