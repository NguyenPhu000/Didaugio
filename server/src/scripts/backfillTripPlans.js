import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [{ orphanMappings, duplicateMappings }] = await prisma.$queryRaw`
    SELECT
      COUNT(*) FILTER (WHERE p.id IS NULL)::int AS "orphanMappings",
      (COUNT(*) - COUNT(DISTINCT m.legacy_trip_id))::int AS "duplicateMappings"
    FROM trip_legacy_maps m
    LEFT JOIN trip_plans p ON p.id = m.trip_plan_id
  `;
  if (orphanMappings !== 0 || duplicateMappings !== 0) {
    throw new Error(`Trip mapping audit failed: orphan=${orphanMappings}, duplicate=${duplicateMappings}`);
  }
  const count = await prisma.tripLegacyMap.count();
  console.log(`[trip-backfill] canonical mapping audit passed (${count})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("[trip-backfill] failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
