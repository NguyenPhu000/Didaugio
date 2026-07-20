import path from "node:path";
import { createReadStream } from "node:fs";
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

const auditGisArtifact = async ({ artifact, dataset }) => {
  const expectedProvinceCodes = new Set(dataset.provinces.map((item) => item.code));
  const expectedWardCodes = new Set(dataset.wards.map((item) => item.code));
  const provinceCodes = new Set();
  const wardCodes = new Set();
  const lines = readline.createInterface({
    input: createReadStream(artifact.absolutePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  for await (const line of lines) {
    const record = parseUpstreamGisInsert(line);
    if (!record) continue;
    const target = record.kind === "province" ? provinceCodes : wardCodes;
    if (target.has(record.code)) throw new Error(`Duplicate GIS ${record.kind} code ${record.code}`);
    target.add(record.code);
  }
  const missingProvince = [...expectedProvinceCodes].filter((code) => !provinceCodes.has(code));
  const missingWard = [...expectedWardCodes].filter((code) => !wardCodes.has(code));
  const unknownProvince = [...provinceCodes].filter((code) => !expectedProvinceCodes.has(code));
  const unknownWard = [...wardCodes].filter((code) => !expectedWardCodes.has(code));
  if (missingProvince.length || missingWard.length || unknownProvince.length || unknownWard.length) {
    throw new Error(
      `GIS code coverage mismatch: missing provinces=${missingProvince.length}, missing wards=${missingWard.length}, unknown provinces=${unknownProvince.length}, unknown wards=${unknownWard.length}`,
    );
  }
  return { provinceCount: provinceCodes.size, wardCount: wardCodes.size, codeCoveragePassed: true };
};

const main = async () => {
  const manifestPath = path.resolve(
    process.env.VN_ADMIN_MANIFEST ||
      path.join(serverRoot, "test/fixtures/administrative/upstream-manifest.json"),
  );
  const sourceDir = path.resolve(process.env.VN_ADMIN_SOURCE_DIR || "");
  if (!process.env.VN_ADMIN_SOURCE_DIR) throw new Error("VN_ADMIN_SOURCE_DIR is required");

  const { manifest, manifestChecksum } = await loadAdministrativeManifest(manifestPath);
  const artifacts = await verifyAdministrativeArtifacts({ manifest, sourceDir });
  const { dataset, typeCounts } = await loadAndValidateAdministrativeSource({ manifest, sourceDir });
  const canThoWardCount = dataset.wards.filter(
    (ward) => ward.provinceCode === manifest.expected.canTho.provinceCode,
  ).length;
  if (canThoWardCount !== manifest.expected.canTho.wardCount) {
    throw new Error(`Cần Thơ ward count mismatch: ${canThoWardCount}`);
  }
  const gisArtifact = artifacts.find((artifact) => artifact.purpose.includes("spatial backfill"));
  if (!gisArtifact) throw new Error("Manifest has no GIS artifact");
  const gis = await auditGisArtifact({ artifact: gisArtifact, dataset });
  const report = {
    generatedAt: new Date().toISOString(),
    source: {
      releaseName: manifest.releaseName,
      sourceCommit: manifest.sourceCommit,
      manifestChecksum,
      artifactChecksumsVerified: artifacts.length,
      provinceCount: dataset.provinces.length,
      wardCount: dataset.wards.length,
      typeCounts,
      canThoWardCount,
      gis,
      passed: true,
    },
  };

  if (process.argv.includes("--source-only")) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required unless --source-only is used");

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query(
      `SELECT r.id, r.is_active, r.manifest_checksum,
        (SELECT count(*)::int FROM province_dataset_records p WHERE p.dataset_release_id = r.id) province_count,
        (SELECT count(*)::int FROM administrative_ward_dataset_records w WHERE w.dataset_release_id = r.id) ward_count,
        (SELECT count(*)::int FROM vn_admin_source.provinces p WHERE p.dataset_release_id = r.id) staging_province_count,
        (SELECT count(*)::int FROM vn_admin_source.wards w WHERE w.dataset_release_id = r.id) staging_ward_count,
        (SELECT count(*)::int FROM province_boundaries b WHERE b.dataset_release_id = r.id) province_geometry_count,
        (SELECT count(*)::int FROM administrative_ward_boundaries b WHERE b.dataset_release_id = r.id) ward_geometry_count,
        (SELECT count(*)::int FROM province_boundaries b WHERE b.dataset_release_id = r.id AND NOT ST_IsValid(b.geom)) invalid_province_geometry_count,
        (SELECT count(*)::int FROM administrative_ward_boundaries b WHERE b.dataset_release_id = r.id AND NOT ST_IsValid(b.geom)) invalid_ward_geometry_count,
        (SELECT count(*)::int
           FROM administrative_ward_dataset_records w
           LEFT JOIN province_dataset_records p
             ON p.dataset_release_id = w.dataset_release_id
            AND p.province_code = w.province_code
          WHERE w.dataset_release_id = r.id AND p.province_code IS NULL) orphan_ward_count
       FROM administrative_dataset_releases r
       WHERE r.source_repo = $1 AND r.source_commit = $2`,
      [manifest.sourceRepo, manifest.sourceCommit],
    );
    if (result.rowCount !== 1) throw new Error("Pinned release is not imported exactly once");
    report.database = result.rows[0];
    const database = report.database;
    const expectedProvinceCount = manifest.expected.provinceCount;
    const expectedWardCount = manifest.expected.wardCount;
    const failures = [];
    if (database.manifest_checksum !== manifestChecksum) failures.push("manifest checksum mismatch");
    for (const field of ["province_count", "staging_province_count", "province_geometry_count"]) {
      if (database[field] !== expectedProvinceCount) failures.push(`${field}=${database[field]}`);
    }
    for (const field of ["ward_count", "staging_ward_count", "ward_geometry_count"]) {
      if (database[field] !== expectedWardCount) failures.push(`${field}=${database[field]}`);
    }
    if (database.invalid_province_geometry_count !== 0) failures.push("invalid province geometry");
    if (database.invalid_ward_geometry_count !== 0) failures.push("invalid ward geometry");
    if (database.orphan_ward_count !== 0) failures.push("orphan ward records");
    if (failures.length > 0) {
      throw new Error(`Administrative database audit failed: ${failures.join(", ")}`);
    }
    report.database.auditPassed = true;
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
