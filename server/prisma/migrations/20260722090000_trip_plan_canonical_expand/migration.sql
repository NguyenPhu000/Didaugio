-- Canonical TripPlan expand/backfill migration. Idempotency is enforced by the
-- mapping table and unique indexes; runtime code must never perform this work.
ALTER TABLE "trip_plans"
  ADD COLUMN IF NOT EXISTS "client_request_id" TEXT,
  ADD COLUMN IF NOT EXISTS "client_request_hash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "trip_plans_user_id_client_request_id_key"
  ON "trip_plans"("user_id", "client_request_id");

CREATE TABLE IF NOT EXISTS "trip_legacy_maps" (
  "id" SERIAL PRIMARY KEY,
  "legacy_trip_id" INTEGER NOT NULL UNIQUE,
  "trip_plan_id" INTEGER NOT NULL UNIQUE,
  "migrated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "trip_legacy_maps_trip_plan_id_fkey"
    FOREIGN KEY ("trip_plan_id") REFERENCES "trip_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Adopt any shadow plans created by older development code, choosing one
-- deterministically if bad data contains duplicates.
INSERT INTO "trip_legacy_maps" ("legacy_trip_id", "trip_plan_id")
SELECT DISTINCT ON ((p."metadata"->>'legacyTripId')::INTEGER)
  (p."metadata"->>'legacyTripId')::INTEGER,
  p."id"
FROM "trip_plans" p
JOIN "trips" legacy ON legacy."id"::text = p."metadata"->>'legacyTripId'
WHERE p."metadata"->>'legacyTripId' ~ '^[0-9]+$'
ORDER BY (p."metadata"->>'legacyTripId')::INTEGER, p."id"
ON CONFLICT DO NOTHING;

-- Older request-time shadow writes used a different metadata key. Normalize
-- it before copying so existing shadow stops are adopted rather than inserted
-- again into an occupied (trip, day, sequence) slot.
UPDATE "trip_stops"
SET "metadata" = (COALESCE("metadata", '{}'::jsonb) - 'legacyDestinationId')
  || jsonb_build_object(
    'migrationLegacyDestinationId',
    ("metadata"->>'legacyDestinationId')::INTEGER
  )
WHERE "metadata"->>'legacyDestinationId' ~ '^[0-9]+$';

INSERT INTO "trip_plans" (
  "user_id", "title", "description", "cover_image", "start_date", "end_date",
  "total_days", "status", "source", "estimated_cost", "total_distance_m",
  "metadata", "created_at", "updated_at"
)
SELECT
  t."user_id", t."title", t."description", t."thumbnail",
  COALESCE(t."start_date", t."created_at"::date),
  COALESCE(t."end_date", COALESCE(t."start_date", t."created_at"::date) + (GREATEST(t."total_days", 1) - 1)),
  GREATEST(t."total_days", 1),
  CASE t."status"
    WHEN 'in-progress' THEN 'active'::"TripPlanStatus"
    WHEN 'completed' THEN 'completed'::"TripPlanStatus"
    WHEN 'canceled' THEN 'cancelled'::"TripPlanStatus"
    WHEN 'cancelled' THEN 'cancelled'::"TripPlanStatus"
    WHEN 'draft' THEN 'draft'::"TripPlanStatus"
    ELSE 'planned'::"TripPlanStatus"
  END,
  CASE WHEN t."is_ai_generated" THEN 'ai_generated'::"TripPlanSource" ELSE 'manual'::"TripPlanSource" END,
  t."estimated_cost",
  CASE WHEN t."total_distance" IS NULL THEN NULL ELSE ROUND(t."total_distance" * 1000)::INTEGER END,
  jsonb_strip_nulls(jsonb_build_object(
    'migrationLegacyTripId', t."id",
    'travelStyle', t."travel_style",
    'groupSize', t."group_size",
    'isPublic', t."is_public",
    'viewCount', t."view_count",
    'cloneCount', t."clone_count",
    'aiPrompt', t."ai_prompt"
  )),
  t."created_at", t."updated_at"
FROM "trips" t
WHERE NOT EXISTS (
  SELECT 1 FROM "trip_legacy_maps" m WHERE m."legacy_trip_id" = t."id"
);

INSERT INTO "trip_legacy_maps" ("legacy_trip_id", "trip_plan_id")
SELECT (p."metadata"->>'migrationLegacyTripId')::INTEGER, p."id"
FROM "trip_plans" p
WHERE p."metadata"->>'migrationLegacyTripId' ~ '^[0-9]+$'
ON CONFLICT DO NOTHING;

INSERT INTO "trip_stops" (
  "trip_id", "place_id", "day_number", "sequence", "note", "arrival_time",
  "departure_time", "duration_minutes", "estimated_cost", "transport_to_next",
  "route_distance_m", "fulfillment_status", "fulfilled_at", "metadata",
  "created_at", "updated_at"
)
SELECT
  m."trip_plan_id", d."place_id", d."day_number",
  ROW_NUMBER() OVER (PARTITION BY d."trip_id", d."day_number" ORDER BY d."order", d."id")::INTEGER,
  d."note", d."start_time", d."end_time", d."duration_minutes", d."estimated_cost",
  d."transport_to_next",
  CASE WHEN d."distance_to_next" IS NULL THEN NULL ELSE ROUND(d."distance_to_next" * 1000)::INTEGER END,
  CASE WHEN d."status" = 'visited' THEN 'visited'::"TripStopFulfillmentStatus" ELSE 'pending'::"TripStopFulfillmentStatus" END,
  d."visited_at", jsonb_build_object('migrationLegacyDestinationId', d."id"),
  d."created_at", d."created_at"
FROM "trip_destinations" d
JOIN "trip_legacy_maps" m ON m."legacy_trip_id" = d."trip_id"
WHERE NOT EXISTS (
  SELECT 1 FROM "trip_stops" s
  WHERE s."metadata"->>'migrationLegacyDestinationId' = d."id"::text
);

-- Mapping now lives in a constrained relation; remove ambiguous JSON IDs.
UPDATE "trip_plans"
SET "metadata" = COALESCE("metadata", '{}'::jsonb)
  - 'legacyTripId'
  - 'migrationLegacyTripId'
  - 'createdFor'
WHERE "metadata" ?| ARRAY['legacyTripId', 'migrationLegacyTripId', 'createdFor'];

ALTER TABLE "saved_trips" DROP CONSTRAINT IF EXISTS "saved_trips_trip_id_fkey";
ALTER TABLE "trip_shares" DROP CONSTRAINT IF EXISTS "trip_shares_trip_id_fkey";
ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_trip_id_fkey";

UPDATE "saved_trips" s SET "trip_id" = m."trip_plan_id"
FROM "trip_legacy_maps" m WHERE s."trip_id" = m."legacy_trip_id";
UPDATE "trip_shares" s SET "trip_id" = m."trip_plan_id"
FROM "trip_legacy_maps" m WHERE s."trip_id" = m."legacy_trip_id";
UPDATE "events" e SET "trip_id" = m."trip_plan_id"
FROM "trip_legacy_maps" m WHERE e."trip_id" = m."legacy_trip_id";

ALTER TABLE "saved_trips" ADD CONSTRAINT "saved_trips_trip_id_fkey"
  FOREIGN KEY ("trip_id") REFERENCES "trip_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trip_shares" ADD CONSTRAINT "trip_shares_trip_id_fkey"
  FOREIGN KEY ("trip_id") REFERENCES "trip_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_trip_id_fkey"
  FOREIGN KEY ("trip_id") REFERENCES "trip_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "trip_execution_operations" (
  "id" SERIAL PRIMARY KEY,
  "session_id" INTEGER NOT NULL,
  "trip_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "operation_id" TEXT NOT NULL,
  "base_version" INTEGER NOT NULL,
  "next_version" INTEGER NOT NULL,
  "payload_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "trip_execution_operations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "trip_execution_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "trip_execution_operations_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trip_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "trip_execution_operations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "trip_execution_operations_session_id_operation_id_key"
  ON "trip_execution_operations"("session_id", "operation_id");
CREATE INDEX "trip_execution_operations_trip_id_user_id_created_at_idx"
  ON "trip_execution_operations"("trip_id", "user_id", "created_at");
