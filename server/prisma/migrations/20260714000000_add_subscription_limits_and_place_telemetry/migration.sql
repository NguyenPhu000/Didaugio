ALTER TABLE "subscription_plans"
ADD COLUMN IF NOT EXISTS "max_services" INTEGER NOT NULL DEFAULT 5;

CREATE TABLE IF NOT EXISTS "place_telemetry" (
  "id" SERIAL NOT NULL,
  "place_id" INTEGER NOT NULL,
  "user_id" INTEGER,
  "action" TEXT NOT NULL,
  "ip_address" TEXT,
  "device_type" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "place_telemetry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "place_telemetry_place_id_fkey"
    FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "place_telemetry_place_id_action_idx"
  ON "place_telemetry"("place_id", "action");
CREATE INDEX IF NOT EXISTS "place_telemetry_created_at_idx"
  ON "place_telemetry"("created_at");
