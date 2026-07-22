import pg from "pg";

const { Client } = pg;
const CAN_THO_PROVINCE_CODE = "92";

const resolveReleaseId = async (client) => {
  if (process.env.ADMIN_DATASET_RELEASE_ID) {
    const id = Number(process.env.ADMIN_DATASET_RELEASE_ID);
    if (!Number.isInteger(id) || id <= 0) throw new Error("ADMIN_DATASET_RELEASE_ID must be a positive integer");
    return id;
  }
  const result = await client.query(
    "SELECT id FROM administrative_dataset_releases WHERE is_active = true",
  );
  if (result.rowCount !== 1) throw new Error("Exactly one active administrative dataset release is required");
  return result.rows[0].id;
};

const rollback = async (client, datasetReleaseId) => {
  if (process.env.ADMIN_LOCATION_ROLLBACK_APPROVED !== "true") {
    throw new Error("Rollback requires ADMIN_LOCATION_ROLLBACK_APPROVED=true");
  }
  const releases = await client.query(
    "SELECT count(*)::int AS count FROM administrative_dataset_releases",
  );
  if (releases.rows[0].count !== 1) {
    throw new Error(
      "Destructive null rollback is allowed only for the initial rollout; reactivate the previous release and rerun backfill instead",
    );
  }
  await client.query("BEGIN");
  try {
    const cleared = await client.query(
      `UPDATE places p
       SET province_code = NULL, administrative_ward_code = NULL
       FROM districts_cantho d
       WHERE p.district_id = d.id AND p.province_code = $1`,
      [CAN_THO_PROVINCE_CODE],
    );
    await client.query(
      "DELETE FROM place_administrative_location_exceptions WHERE dataset_release_id = $1",
      [datasetReleaseId],
    );
    await client.query("COMMIT");
    return { rolledBackPlaces: cleared.rowCount };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
};

const backfill = async (client, datasetReleaseId) => {
  await client.query("BEGIN");
  try {
    const canThoRecord = await client.query(
      `SELECT 1 FROM province_dataset_records
       WHERE dataset_release_id = $1 AND province_code = $2 AND is_active = true`,
      [datasetReleaseId, CAN_THO_PROVINCE_CODE],
    );
    if (canThoRecord.rowCount !== 1) throw new Error("Pinned release has no active Cần Thơ province record");

    await client.query(
      `CREATE TEMP TABLE place_admin_mapping_work ON COMMIT DROP AS
       WITH target_places AS (
         SELECT p.id,
           p.latitude::double precision AS latitude,
           p.longitude::double precision AS longitude,
           (p.latitude BETWEEN 8 AND 24 AND p.longitude BETWEEN 102 AND 110) AS coordinates_valid,
           CASE WHEN p.latitude BETWEEN 8 AND 24 AND p.longitude BETWEEN 102 AND 110
             THEN ST_SetSRID(ST_MakePoint(p.longitude::double precision, p.latitude::double precision), 4326)
             ELSE NULL
           END AS point
         FROM places p
         LEFT JOIN districts_cantho d ON d.id = p.district_id
         WHERE p.deleted_at IS NULL
           AND (d.id IS NOT NULL OR p.province_code = $2)
       )
       SELECT target.id AS place_id,
         target.coordinates_valid,
         COALESCE(ST_Covers(province.geom, target.point), false) AS province_covers,
         COALESCE(matches.candidate_ward_codes, ARRAY[]::varchar(20)[]) AS candidate_ward_codes,
         COALESCE(suggestions.items, '[]'::jsonb) AS suggested_wards
       FROM target_places target
       LEFT JOIN province_boundaries province
         ON province.dataset_release_id = $1 AND province.province_code = $2
       LEFT JOIN LATERAL (
         SELECT array_agg(boundary.ward_code ORDER BY boundary.ward_code)::varchar(20)[] AS candidate_ward_codes
         FROM administrative_ward_boundaries boundary
         INNER JOIN administrative_ward_dataset_records record
           ON record.dataset_release_id = boundary.dataset_release_id
          AND record.ward_code = boundary.ward_code
          AND record.is_active = true
          AND record.province_code = $2
         WHERE boundary.dataset_release_id = $1
           AND target.point IS NOT NULL
           AND ST_Covers(boundary.geom, target.point)
       ) matches ON true
       LEFT JOIN LATERAL (
         SELECT jsonb_agg(jsonb_build_object(
           'wardCode', nearest.ward_code,
           'distanceMeters', round(nearest.distance_meters::numeric, 2)
         ) ORDER BY nearest.distance_meters, nearest.ward_code) AS items
         FROM (
           SELECT boundary.ward_code,
             ST_Distance(boundary.geom::geography, target.point::geography) AS distance_meters
           FROM administrative_ward_boundaries boundary
           INNER JOIN administrative_ward_dataset_records record
             ON record.dataset_release_id = boundary.dataset_release_id
            AND record.ward_code = boundary.ward_code
            AND record.is_active = true
            AND record.province_code = $2
           WHERE boundary.dataset_release_id = $1
             AND target.point IS NOT NULL
             AND ST_DWithin(boundary.geom::geography, target.point::geography, 1000)
           ORDER BY distance_meters, boundary.ward_code
           LIMIT 3
         ) nearest
       ) suggestions ON true`,
      [datasetReleaseId, CAN_THO_PROVINCE_CODE],
    );

    const assigned = await client.query(
      `UPDATE places place
       SET province_code = $1,
           administrative_ward_code = work.candidate_ward_codes[1]
       FROM place_admin_mapping_work work
       WHERE place.id = work.place_id
         AND work.coordinates_valid
         AND work.province_covers
         AND cardinality(work.candidate_ward_codes) = 1`,
      [CAN_THO_PROVINCE_CODE],
    );

    const withheld = await client.query(
      `UPDATE places place
       SET province_code = $1,
           administrative_ward_code = NULL
       FROM place_admin_mapping_work work
       WHERE place.id = work.place_id
         AND (
           NOT work.coordinates_valid
           OR NOT work.province_covers
           OR cardinality(work.candidate_ward_codes) <> 1
         )`,
      [CAN_THO_PROVINCE_CODE],
    );

    await client.query(
      `DELETE FROM place_administrative_location_exceptions exception
       USING place_admin_mapping_work work
       WHERE exception.place_id = work.place_id
         AND exception.dataset_release_id = $1
         AND work.coordinates_valid
         AND work.province_covers
         AND cardinality(work.candidate_ward_codes) = 1`,
      [datasetReleaseId],
    );

    const exceptions = await client.query(
      `INSERT INTO place_administrative_location_exceptions
        (place_id, dataset_release_id, reason, candidate_ward_codes, suggested_wards)
       SELECT work.place_id, $1,
         CASE
           WHEN NOT work.coordinates_valid THEN 'invalid_coordinate'
           WHEN NOT work.province_covers THEN 'outside_province'
           WHEN cardinality(work.candidate_ward_codes) = 0 THEN 'zero_match'
           ELSE 'multiple_matches'
         END,
         work.candidate_ward_codes,
         work.suggested_wards
       FROM place_admin_mapping_work work
       WHERE NOT work.coordinates_valid
          OR NOT work.province_covers
          OR cardinality(work.candidate_ward_codes) <> 1
       ON CONFLICT (place_id, dataset_release_id) DO UPDATE SET
         reason = EXCLUDED.reason,
         candidate_ward_codes = EXCLUDED.candidate_ward_codes,
         suggested_wards = EXCLUDED.suggested_wards,
         status = 'open',
         resolution_note = NULL,
         updated_at = now()
       `,
      [datasetReleaseId],
    );

    await client.query("COMMIT");
    return {
      datasetReleaseId,
      assignedPlaces: assigned.rowCount,
      withheldPlaces: withheld.rowCount,
      exceptionRowsTouched: exceptions.rowCount,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
};

const main = async () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const datasetReleaseId = await resolveReleaseId(client);
    const result = process.argv.includes("--rollback")
      ? await rollback(client, datasetReleaseId)
      : await backfill(client, datasetReleaseId);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
