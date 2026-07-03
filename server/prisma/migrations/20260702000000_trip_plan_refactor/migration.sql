-- CreateEnum
CREATE TYPE "TripPlanStatus" AS ENUM ('draft', 'planned', 'active', 'paused', 'completed', 'cancelled', 'archived');

-- CreateEnum
CREATE TYPE "TripPlanSource" AS ENUM ('manual', 'ai_generated', 'imported', 'cloned', 'booking_seeded');

-- CreateEnum
CREATE TYPE "TripStopFulfillmentStatus" AS ENUM ('pending', 'scheduled', 'checked_in', 'visited', 'skipped', 'cancelled');

-- CreateEnum
CREATE TYPE "TripExecutionSessionStatus" AS ENUM ('active', 'paused', 'stopped', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "BookingTripLinkStatus" AS ENUM ('linked', 'detached', 'cancelled');

-- CreateEnum
CREATE TYPE "DomainJobStatus" AS ENUM ('pending', 'processing', 'done', 'failed');

-- CreateTable
CREATE TABLE "trip_plans" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cover_image" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "total_days" INTEGER NOT NULL,
    "status" "TripPlanStatus" NOT NULL DEFAULT 'draft',
    "source" "TripPlanSource" NOT NULL DEFAULT 'manual',
    "estimated_cost" INTEGER,
    "total_distance_m" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_stops" (
    "id" SERIAL NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "place_id" INTEGER NOT NULL,
    "day_number" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "title" TEXT,
    "note" TEXT,
    "planned_date" DATE,
    "arrival_time" TEXT,
    "departure_time" TEXT,
    "duration_minutes" INTEGER,
    "estimated_cost" INTEGER,
    "transport_to_next" TEXT,
    "route_distance_m" INTEGER,
    "route_duration_sec" INTEGER,
    "route_geometry" JSONB,
    "route_metrics_version" INTEGER NOT NULL DEFAULT 0,
    "fulfillment_status" "TripStopFulfillmentStatus" NOT NULL DEFAULT 'pending',
    "fulfilled_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_trip_links" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "stop_id" INTEGER,
    "status" "BookingTripLinkStatus" NOT NULL DEFAULT 'linked',
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlinked_at" TIMESTAMP(3),
    "linked_by_id" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "booking_trip_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_execution_sessions" (
    "id" SERIAL NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "device_id" TEXT,
    "status" "TripExecutionSessionStatus" NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paused_at" TIMESTAMP(3),
    "resumed_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "current_stop_id" INTEGER,
    "last_known_lat" DECIMAL(10,7),
    "last_known_lng" DECIMAL(10,7),
    "last_known_heading" DECIMAL(6,2),
    "last_sync_at" TIMESTAMP(3),
    "client_state_version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_execution_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_jobs" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "aggregate" TEXT NOT NULL,
    "aggregate_id" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "DomainJobStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "run_after" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trip_plans_user_id_status_idx" ON "trip_plans"("user_id", "status");

-- CreateIndex
CREATE INDEX "trip_plans_user_id_start_date_end_date_idx" ON "trip_plans"("user_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "trip_plans_source_idx" ON "trip_plans"("source");

-- CreateIndex
CREATE UNIQUE INDEX "trip_stops_trip_id_day_number_sequence_key" ON "trip_stops"("trip_id", "day_number", "sequence");

-- CreateIndex
CREATE INDEX "trip_stops_trip_id_day_number_idx" ON "trip_stops"("trip_id", "day_number");

-- CreateIndex
CREATE INDEX "trip_stops_place_id_idx" ON "trip_stops"("place_id");

-- CreateIndex
CREATE INDEX "trip_stops_trip_id_fulfillment_status_idx" ON "trip_stops"("trip_id", "fulfillment_status");

-- CreateIndex
CREATE UNIQUE INDEX "booking_trip_links_booking_id_key" ON "booking_trip_links"("booking_id");

-- CreateIndex
CREATE INDEX "booking_trip_links_trip_id_status_idx" ON "booking_trip_links"("trip_id", "status");

-- CreateIndex
CREATE INDEX "booking_trip_links_stop_id_idx" ON "booking_trip_links"("stop_id");

-- CreateIndex
CREATE INDEX "booking_trip_links_linked_by_id_idx" ON "booking_trip_links"("linked_by_id");

-- CreateIndex
CREATE INDEX "trip_execution_sessions_trip_id_status_idx" ON "trip_execution_sessions"("trip_id", "status");

-- CreateIndex
CREATE INDEX "trip_execution_sessions_user_id_status_idx" ON "trip_execution_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "trip_execution_sessions_device_id_idx" ON "trip_execution_sessions"("device_id");

-- CreateIndex
CREATE INDEX "trip_execution_sessions_last_sync_at_idx" ON "trip_execution_sessions"("last_sync_at");

-- CreateIndex
CREATE INDEX "domain_jobs_type_status_run_after_idx" ON "domain_jobs"("type", "status", "run_after");

-- CreateIndex
CREATE INDEX "domain_jobs_aggregate_aggregate_id_idx" ON "domain_jobs"("aggregate", "aggregate_id");

-- AddForeignKey
ALTER TABLE "trip_plans" ADD CONSTRAINT "trip_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trip_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_trip_links" ADD CONSTRAINT "booking_trip_links_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_trip_links" ADD CONSTRAINT "booking_trip_links_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trip_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_trip_links" ADD CONSTRAINT "booking_trip_links_stop_id_fkey" FOREIGN KEY ("stop_id") REFERENCES "trip_stops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_trip_links" ADD CONSTRAINT "booking_trip_links_linked_by_id_fkey" FOREIGN KEY ("linked_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_execution_sessions" ADD CONSTRAINT "trip_execution_sessions_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trip_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_execution_sessions" ADD CONSTRAINT "trip_execution_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_execution_sessions" ADD CONSTRAINT "trip_execution_sessions_current_stop_id_fkey" FOREIGN KEY ("current_stop_id") REFERENCES "trip_stops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
