import { writeFile } from "node:fs/promises";
import pg from "pg";

const { Client } = pg;

const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const main = async () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const release = await client.query(
      `SELECT id, release_name, source_commit
       FROM administrative_dataset_releases WHERE is_active = true`,
    );
    if (release.rowCount !== 1) throw new Error("Exactly one active administrative release is required");
    const datasetReleaseId = release.rows[0].id;

    const summary = await client.query(
      `SELECT
         count(*) FILTER (WHERE p.deleted_at IS NULL)::int AS active_places,
         count(*) FILTER (WHERE p.deleted_at IS NULL AND p.province_code = '92')::int AS province_mapped,
         count(*) FILTER (WHERE p.deleted_at IS NULL AND p.administrative_ward_code IS NOT NULL)::int AS ward_mapped,
         count(*) FILTER (WHERE p.deleted_at IS NULL AND p.administrative_ward_code IS NULL)::int AS ward_unresolved
       FROM places p
       INNER JOIN districts_cantho d ON d.id = p.district_id`,
    );
    const exceptions = await client.query(
      `SELECT exception.place_id, place.name AS place_name, place.latitude, place.longitude,
              exception.reason, exception.candidate_ward_codes, exception.suggested_wards,
              exception.status, exception.resolution_note
       FROM place_administrative_location_exceptions exception
       INNER JOIN places place ON place.id = exception.place_id
       WHERE exception.dataset_release_id = $1
       ORDER BY exception.status, exception.reason, exception.place_id`,
      [datasetReleaseId],
    );

    const report = {
      generatedAt: new Date().toISOString(),
      release: release.rows[0],
      summary: summary.rows[0],
      exceptionCounts: exceptions.rows.reduce((counts, row) => {
        counts[row.reason] = (counts[row.reason] ?? 0) + 1;
        return counts;
      }, {}),
      exceptions: exceptions.rows,
    };
    console.log(JSON.stringify(report, null, 2));

    const outputArg = process.argv.find((argument) => argument.startsWith("--csv="));
    if (outputArg) {
      const outputPath = outputArg.slice("--csv=".length);
      const header = [
        "place_id", "place_name", "latitude", "longitude", "reason",
        "candidate_ward_codes", "suggested_wards", "status", "resolution_note",
      ];
      const rows = exceptions.rows.map((row) =>
        header.map((key) => csvCell(typeof row[key] === "object" ? JSON.stringify(row[key]) : row[key])).join(","),
      );
      await writeFile(outputPath, `${header.join(",")}\n${rows.join("\n")}\n`, "utf8");
    }
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
