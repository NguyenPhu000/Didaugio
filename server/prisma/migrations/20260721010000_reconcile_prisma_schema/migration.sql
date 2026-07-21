BEGIN;

-- This forward-only reconciliation is intentionally defensive. It converges the
-- migration-built schema and a matching `prisma db push` schema without deleting
-- application rows or the raw PostGIS boundary/source tables.

-- Create and validate enum types before any table or column uses them.
DO $$
DECLARE
  actual_labels TEXT[];
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'BookingStatus'
  ) THEN
    CREATE TYPE "BookingStatus" AS ENUM (
      'pending', 'paid_pending_confirm', 'confirmed', 'completed',
      'cancelled', 'rejected', 'expired', 'no_show'
    );
  ELSIF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'BookingStatus' AND t.typtype <> 'e'
  ) THEN
    RAISE EXCEPTION 'BookingStatus exists but is not a PostgreSQL enum';
  ELSE
    SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
      INTO actual_labels
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE n.nspname = 'public' AND t.typname = 'BookingStatus';
    IF actual_labels <> ARRAY[
      'pending', 'paid_pending_confirm', 'confirmed', 'completed',
      'cancelled', 'rejected', 'expired', 'no_show'
    ]::TEXT[] THEN
      RAISE EXCEPTION 'BookingStatus labels are incompatible: %', actual_labels;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'BookingAction'
  ) THEN
    CREATE TYPE "BookingAction" AS ENUM (
      'approve', 'reject', 'cancel', 'complete', 'no_show', 'reschedule',
      'quick_approve', 'quick_reject', 'auto_approve', 'auto_approve_failed',
      'auto_expire', 'auto_cancel_termination', 'auto_cancel_suspension', 'checkin'
    );
  ELSIF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'BookingAction' AND t.typtype <> 'e'
  ) THEN
    RAISE EXCEPTION 'BookingAction exists but is not a PostgreSQL enum';
  ELSE
    SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
      INTO actual_labels
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE n.nspname = 'public' AND t.typname = 'BookingAction';
    IF actual_labels <> ARRAY[
      'approve', 'reject', 'cancel', 'complete', 'no_show', 'reschedule',
      'quick_approve', 'quick_reject', 'auto_approve', 'auto_approve_failed',
      'auto_expire', 'auto_cancel_termination', 'auto_cancel_suspension', 'checkin'
    ]::TEXT[] THEN
      RAISE EXCEPTION 'BookingAction labels are incompatible: %', actual_labels;
    END IF;
  END IF;
END $$;

-- Replace only managed foreign keys whose names/actions predate the Prisma model.
ALTER TABLE "administrative_ward_dataset_records"
  DROP CONSTRAINT IF EXISTS "administrative_ward_dataset_r_dataset_release_id_province__fkey",
  DROP CONSTRAINT IF EXISTS "administrative_ward_dataset_records_dataset_release_id_fkey",
  DROP CONSTRAINT IF EXISTS "administrative_ward_dataset_records_province_code_fkey",
  DROP CONSTRAINT IF EXISTS "administrative_ward_dataset_records_ward_code_fkey";
ALTER TABLE "place_administrative_location_exceptions"
  DROP CONSTRAINT IF EXISTS "place_administrative_location_exception_dataset_release_id_fkey",
  DROP CONSTRAINT IF EXISTS "place_administrative_location_exceptions_place_id_fkey";
ALTER TABLE "places"
  DROP CONSTRAINT IF EXISTS "places_administrative_ward_code_fkey",
  DROP CONSTRAINT IF EXISTS "places_district_id_fkey",
  DROP CONSTRAINT IF EXISTS "places_province_code_fkey";
ALTER TABLE "province_dataset_records"
  DROP CONSTRAINT IF EXISTS "province_dataset_records_dataset_release_id_fkey",
  DROP CONSTRAINT IF EXISTS "province_dataset_records_province_code_fkey";

-- Raw boundary tables are outside Prisma's managed schema. Their foreign keys,
-- pg_trgm search indexes, geometry data, geometry GIST indexes, and PostGIS functions
-- are deliberately preserved; the migration verifier allow-lists their exact drift.

-- Normalize raw-SQL timestamp/varchar definitions to Prisma's managed types. UTC is
-- explicit so timestamptz conversion never depends on the deploy session timezone.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'administrative_dataset_releases'
      AND column_name = 'imported_at' AND data_type = 'timestamp with time zone'
  ) THEN
    ALTER TABLE "administrative_dataset_releases"
      ALTER COLUMN "imported_at" TYPE TIMESTAMP(3)
      USING "imported_at" AT TIME ZONE 'UTC';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'administrative_dataset_releases'
      AND column_name = 'activated_at' AND data_type = 'timestamp with time zone'
  ) THEN
    ALTER TABLE "administrative_dataset_releases"
      ALTER COLUMN "activated_at" TYPE TIMESTAMP(3)
      USING "activated_at" AT TIME ZONE 'UTC';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'administrative_wards'
      AND column_name = 'created_at' AND data_type = 'timestamp with time zone'
  ) THEN
    ALTER TABLE "administrative_wards"
      ALTER COLUMN "created_at" TYPE TIMESTAMP(3)
      USING "created_at" AT TIME ZONE 'UTC';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'provinces'
      AND column_name = 'created_at' AND data_type = 'timestamp with time zone'
  ) THEN
    ALTER TABLE "provinces"
      ALTER COLUMN "created_at" TYPE TIMESTAMP(3)
      USING "created_at" AT TIME ZONE 'UTC';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'place_administrative_location_exceptions'
      AND column_name = 'created_at' AND data_type = 'timestamp with time zone'
  ) THEN
    ALTER TABLE "place_administrative_location_exceptions"
      ALTER COLUMN "created_at" TYPE TIMESTAMP(3)
      USING "created_at" AT TIME ZONE 'UTC';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'place_administrative_location_exceptions'
      AND column_name = 'updated_at' AND data_type = 'timestamp with time zone'
  ) THEN
    ALTER TABLE "place_administrative_location_exceptions"
      ALTER COLUMN "updated_at" TYPE TIMESTAMP(3)
      USING "updated_at" AT TIME ZONE 'UTC';
  END IF;
END $$;

ALTER TABLE "administrative_ward_dataset_records"
  ALTER COLUMN "name" TYPE TEXT,
  ALTER COLUMN "name_en" TYPE TEXT,
  ALTER COLUMN "full_name" TYPE TEXT,
  ALTER COLUMN "full_name_en" TYPE TEXT,
  ALTER COLUMN "code_name" TYPE TEXT;
ALTER TABLE "province_dataset_records"
  ALTER COLUMN "name" TYPE TEXT,
  ALTER COLUMN "name_en" TYPE TEXT,
  ALTER COLUMN "full_name" TYPE TEXT,
  ALTER COLUMN "full_name_en" TYPE TEXT,
  ALTER COLUMN "code_name" TYPE TEXT;
ALTER TABLE "place_administrative_location_exceptions"
  ALTER COLUMN "updated_at" DROP DEFAULT;

-- Add nullable columns and default-backed columns idempotently. Required values that
-- carry identity or ownership are validated/backfilled below before SET NOT NULL.
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "banners_marketing"
  ADD COLUMN IF NOT EXISTS "image_public_id" TEXT,
  ADD COLUMN IF NOT EXISTS "image_url" TEXT;
ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "admin_earned" INTEGER,
  ADD COLUMN IF NOT EXISTS "booking_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "business_earned" INTEGER,
  ADD COLUMN IF NOT EXISTS "business_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "commission_rate" INTEGER,
  ADD COLUMN IF NOT EXISTS "end_time" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "end_time_str" TEXT,
  ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT,
  ADD COLUMN IF NOT EXISTS "resource_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "start_time" TIMESTAMPTZ;
ALTER TABLE "business_services"
  ADD COLUMN IF NOT EXISTS "allow_overbooking" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "booking_model" TEXT NOT NULL DEFAULT 'capacity',
  ADD COLUMN IF NOT EXISTS "buffer_minutes" INTEGER,
  ADD COLUMN IF NOT EXISTS "max_advance_days" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "min_lead_minutes" INTEGER,
  ADD COLUMN IF NOT EXISTS "slot_duration_minutes" INTEGER;
ALTER TABLE "businesses"
  ADD COLUMN IF NOT EXISTS "contract_pdf_auth_tag" TEXT,
  ADD COLUMN IF NOT EXISTS "contract_pdf_checksum" TEXT,
  ADD COLUMN IF NOT EXISTS "contract_pdf_iv" TEXT,
  ADD COLUMN IF NOT EXISTS "contract_pdf_path" TEXT,
  ADD COLUMN IF NOT EXISTS "contract_signed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "contract_version" TEXT,
  ADD COLUMN IF NOT EXISTS "document_upload_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "last_upload_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "settings" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "signer_metadata" JSONB,
  ADD COLUMN IF NOT EXISTS "suspension_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "terminated_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "termination_reason" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "level" INTEGER;
ALTER TABLE "favorites" ADD COLUMN IF NOT EXISTS "collection_name" TEXT;
ALTER TABLE "notifications_global" ADD COLUMN IF NOT EXISTS "read_at" TIMESTAMP(3);
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;
ALTER TABLE "place_images"
  ADD COLUMN IF NOT EXISTS "public_id" TEXT,
  ADD COLUMN IF NOT EXISTS "secure_url" TEXT,
  ADD COLUMN IF NOT EXISTS "thumbnail_url" TEXT,
  ALTER COLUMN "image_data" DROP NOT NULL;
ALTER TABLE "places"
  ADD COLUMN IF NOT EXISTS "is_seeded" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "marker_url" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "is_seeded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "is_protected" BOOLEAN;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "nickname" TEXT;
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "business_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "business_role_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "wards_cantho" ADD COLUMN IF NOT EXISTS "boundary" JSONB;

-- Category depth is authoritative from parent_id. Reject malformed hierarchies
-- before canonicalizing every stored level, including manually pushed defaults.
DO $$
DECLARE
  orphan_category_ids TEXT;
  cyclic_category_ids TEXT;
  too_deep_category_ids TEXT;
  unresolved_category_ids TEXT;
BEGIN
  SELECT string_agg(category."id"::TEXT, ', ' ORDER BY category."id")
    INTO orphan_category_ids
  FROM "categories" category
  LEFT JOIN "categories" parent ON parent."id" = category."parent_id"
  WHERE category."parent_id" IS NOT NULL
    AND parent."id" IS NULL;
  IF orphan_category_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Category hierarchy reconciliation refused: orphan parent_id values for category ids: %',
      orphan_category_ids;
  END IF;

  WITH RECURSIVE category_hierarchy AS (
    SELECT category."id", category."parent_id", 1 AS depth, ARRAY[category."id"] AS path
    FROM "categories" category
    WHERE category."parent_id" IS NULL
    UNION ALL
    SELECT child."id", child."parent_id", parent.depth + 1, parent.path || child."id"
    FROM "categories" child
    JOIN category_hierarchy parent ON child."parent_id" = parent."id"
    WHERE NOT child."id" = ANY(parent.path)
  )
  SELECT string_agg(category."id"::TEXT, ', ' ORDER BY category."id")
    INTO cyclic_category_ids
  FROM "categories" category
  LEFT JOIN category_hierarchy hierarchy ON hierarchy."id" = category."id"
  WHERE hierarchy."id" IS NULL;
  IF cyclic_category_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Category hierarchy reconciliation refused: cycle detected for category ids: %',
      cyclic_category_ids;
  END IF;

  WITH RECURSIVE category_hierarchy AS (
    SELECT category."id", category."parent_id", 1 AS depth, ARRAY[category."id"] AS path
    FROM "categories" category
    WHERE category."parent_id" IS NULL
    UNION ALL
    SELECT child."id", child."parent_id", parent.depth + 1, parent.path || child."id"
    FROM "categories" child
    JOIN category_hierarchy parent ON child."parent_id" = parent."id"
    WHERE NOT child."id" = ANY(parent.path)
  )
  SELECT string_agg("id"::TEXT, ', ' ORDER BY "id")
    INTO too_deep_category_ids
  FROM category_hierarchy
  WHERE depth > 3;
  IF too_deep_category_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Category hierarchy reconciliation refused: depth exceeds 3 for category ids: %',
      too_deep_category_ids;
  END IF;

  WITH RECURSIVE category_hierarchy AS (
    SELECT category."id", category."parent_id", 1 AS depth, ARRAY[category."id"] AS path
    FROM "categories" category
    WHERE category."parent_id" IS NULL
    UNION ALL
    SELECT child."id", child."parent_id", parent.depth + 1, parent.path || child."id"
    FROM "categories" child
    JOIN category_hierarchy parent ON child."parent_id" = parent."id"
    WHERE NOT child."id" = ANY(parent.path)
  )
  UPDATE "categories" category
  SET "level" = hierarchy.depth
  FROM category_hierarchy hierarchy
  WHERE category."id" = hierarchy."id";

  SELECT string_agg("id"::TEXT, ', ' ORDER BY "id")
    INTO unresolved_category_ids
  FROM "categories"
  WHERE "level" IS NULL OR "level" < 1 OR "level" > 3;
  IF unresolved_category_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Category hierarchy reconciliation left unresolved levels for category ids: %',
      unresolved_category_ids;
  END IF;

  ALTER TABLE "categories"
    ALTER COLUMN "level" SET DEFAULT 1,
    ALTER COLUMN "level" SET NOT NULL;
END $$;

-- A role is protected exactly when it is a built-in system role. Recompute every
-- existing row so stale manually pushed false values cannot weaken that invariant.
DO $$
DECLARE
  unresolved_role_ids TEXT;
BEGIN
  UPDATE "roles"
  SET "is_protected" = "is_system";

  SELECT string_agg("id"::TEXT, ', ' ORDER BY "id")
    INTO unresolved_role_ids
  FROM "roles"
  WHERE "is_protected" IS NULL;
  IF unresolved_role_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Role protection reconciliation failed for role ids: %',
      unresolved_role_ids;
  END IF;

  ALTER TABLE "roles"
    ALTER COLUMN "is_protected" SET DEFAULT false,
    ALTER COLUMN "is_protected" SET NOT NULL;
END $$;

-- Convert booking status in place. Never replace/drop the source column: every value
-- is checked against the target enum first, including explicit NULL rejection.
DO $$
DECLARE
  invalid_statuses TEXT;
  missing_business_ids TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM "bookings" WHERE "status" IS NULL) THEN
    RAISE EXCEPTION 'BookingStatus conversion refused: bookings.status contains NULL values';
  END IF;

  SELECT string_agg(value, ', ' ORDER BY value)
    INTO invalid_statuses
  FROM (
    SELECT DISTINCT "status"::TEXT AS value
    FROM "bookings"
    WHERE "status"::TEXT NOT IN (
      'pending', 'paid_pending_confirm', 'confirmed', 'completed',
      'cancelled', 'rejected', 'expired', 'no_show'
    )
  ) invalid;
  IF invalid_statuses IS NOT NULL THEN
    RAISE EXCEPTION 'BookingStatus conversion refused; unsupported bookings.status values: %',
      invalid_statuses;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings'
      AND column_name = 'status' AND udt_schema = 'public' AND udt_name = 'BookingStatus'
  ) THEN
    ALTER TABLE "bookings" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "bookings"
      ALTER COLUMN "status" TYPE "BookingStatus"
      USING ("status"::TEXT::"BookingStatus");
  END IF;
  ALTER TABLE "bookings"
    ALTER COLUMN "status" SET DEFAULT 'pending',
    ALTER COLUMN "status" SET NOT NULL;

  UPDATE "bookings" b
  SET "business_id" = service."business_id"
  FROM "business_services" service
  WHERE b."service_id" = service."id" AND b."business_id" IS NULL;

  SELECT string_agg("id"::TEXT, ', ' ORDER BY "id")
    INTO missing_business_ids
  FROM "bookings"
  WHERE "business_id" IS NULL;
  IF missing_business_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot derive bookings.business_id from business_services for booking ids: %',
      missing_business_ids;
  END IF;
  ALTER TABLE "bookings" ALTER COLUMN "business_id" SET NOT NULL;
END $$;

-- Backfill historical booking financial snapshots only from authoritative booking
-- amounts. Reject invalid source ranges before deriving any values.
DO $$
DECLARE
  invalid_financial_ids TEXT;
  unenforceable_financial_ids TEXT;
BEGIN
  SELECT string_agg("id"::TEXT, ', ' ORDER BY "id")
    INTO invalid_financial_ids
  FROM "bookings"
  WHERE "final_price" IS NULL
     OR "commission_amount" IS NULL
     OR "final_price" < 0
     OR "commission_amount" < 0
     OR "commission_amount" > "final_price";
  IF invalid_financial_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Booking financial backfill refused; expected 0 <= commission_amount <= final_price for booking ids: %',
      invalid_financial_ids;
  END IF;

  UPDATE "bookings" b
  SET "admin_earned" = b."commission_amount",
      "business_earned" = b."final_price" - b."commission_amount",
      "commission_rate" = CASE
        WHEN b."final_price" = 0 THEN 0
        ELSE ROUND((b."commission_amount" * 100.0) / b."final_price")::INTEGER
      END;

  SELECT string_agg("id"::TEXT, ', ' ORDER BY "id")
    INTO unenforceable_financial_ids
  FROM "bookings"
  WHERE "admin_earned" IS NULL
     OR "business_earned" IS NULL
     OR "commission_rate" IS NULL
     OR "admin_earned" < 0
     OR "business_earned" < 0
     OR "commission_rate" < 0
     OR "commission_rate" > 100;
  IF unenforceable_financial_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot enforce booking financial fields; expected non-negative earnings and commission_rate from 0 to 100 for booking ids: %',
      unenforceable_financial_ids;
  END IF;

  ALTER TABLE "bookings"
    ALTER COLUMN "admin_earned" SET DEFAULT 0,
    ALTER COLUMN "admin_earned" SET NOT NULL,
    ALTER COLUMN "business_earned" SET DEFAULT 0,
    ALTER COLUMN "business_earned" SET NOT NULL,
    ALTER COLUMN "commission_rate" SET DEFAULT 10,
    ALTER COLUMN "commission_rate" SET NOT NULL;
END $$;

-- Payment idempotency can be derived only from a present transaction reference.
-- Stop rather than fabricate keys when that invariant does not hold.
DO $$
DECLARE
  unsafe_payment_ids TEXT;
BEGIN
  UPDATE "payments"
  SET "idempotency_key" = "transaction_ref"
  WHERE "idempotency_key" IS NULL AND "transaction_ref" IS NOT NULL;

  SELECT string_agg("id"::TEXT, ', ' ORDER BY "id")
    INTO unsafe_payment_ids
  FROM "payments"
  WHERE "transaction_ref" IS NULL OR "idempotency_key" IS NULL;
  IF unsafe_payment_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot enforce payment references/idempotency for payment ids: %',
      unsafe_payment_ids;
  END IF;
  ALTER TABLE "payments"
    ALTER COLUMN "transaction_ref" SET NOT NULL,
    ALTER COLUMN "idempotency_key" SET NOT NULL,
    ALTER COLUMN "status" SET DEFAULT 'unpaid';
END $$;

-- Username is identity data and has no trustworthy migration-time derivation.
DO $$
DECLARE
  missing_username_ids TEXT;
BEGIN
  SELECT string_agg("id"::TEXT, ', ' ORDER BY "id")
    INTO missing_username_ids
  FROM "users"
  WHERE "username" IS NULL OR btrim("username") = '';
  IF missing_username_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot enforce users.username; explicit usernames required for user ids: %',
      missing_username_ids;
  END IF;
  ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "notification_recipients" (
    "id" SERIAL NOT NULL,
    "notification_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "business_id" INTEGER,
    "role_id" INTEGER,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "category_tags" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "review_moderation_logs" (
    "id" SERIAL NOT NULL,
    "review_id" INTEGER NOT NULL,
    "reply_id" INTEGER,
    "actor_user_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT,
    "reason" TEXT,
    "note_snapshot" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_moderation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "saved_trips" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "sensitive_documents" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "encrypted_path" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "auth_tag" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "original_name" TEXT,
    "file_size" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensitive_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "business_roles" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "staff_invitations" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "role_id" INTEGER,
    "email" TEXT,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "accepted_by" INTEGER,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "business_blocked_dates" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "service_id" INTEGER,
    "date" DATE NOT NULL,
    "reason" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_blocked_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "place_resources" (
    "id" SERIAL NOT NULL,
    "place_id" INTEGER NOT NULL,
    "service_id" INTEGER,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "resource_type" TEXT NOT NULL,
    "capacity" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "auto_approve_rules" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_approve_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "booking_action_logs" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "action" "BookingAction" NOT NULL,
    "actor_user_id" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "booking_transactions" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "business_id" INTEGER NOT NULL,
    "original_price" INTEGER NOT NULL,
    "final_price" INTEGER NOT NULL,
    "discount_amount" INTEGER NOT NULL DEFAULT 0,
    "commission_rate" INTEGER NOT NULL,
    "commission_amount" INTEGER NOT NULL,
    "net_amount" INTEGER NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'qr_checkin',

    CONSTRAINT "booking_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "payment_webhook_logs" (
    "id" SERIAL NOT NULL,
    "payment_id" INTEGER,
    "gateway" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signature" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "payouts" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "bank_name" TEXT,
    "bank_account" TEXT,
    "bank_owner" TEXT,
    "note" TEXT,
    "reject_reason" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" INTEGER,
    "transferred_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "partner_wallets" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "frozen_balance" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "platform_wallets" (
    "id" SERIAL NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "total_earned" INTEGER NOT NULL DEFAULT 0,
    "total_paid_out" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "financial_ledgers" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER,
    "payout_id" INTEGER,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "cached_itineraries" (
    "id" SERIAL NOT NULL,
    "filter_hash" TEXT NOT NULL,
    "itinerary_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cached_itineraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "events" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "thumbnail_public_id" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "location" TEXT DEFAULT 'Cần Thơ',
    "max_participants" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "is_featured_banner" BOOLEAN NOT NULL DEFAULT false,
    "total_check_ins" INTEGER NOT NULL DEFAULT 0,
    "broadcast_notice" VARCHAR(255),
    "trip_id" INTEGER,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "event_participants" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "event_moments" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "place_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "image_public_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_moments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "active_sessions" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "place_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "active_sessions_pkey" PRIMARY KEY ("id")
);

-- Every unique index is preceded by a descriptive duplicate preflight. This turns
-- ambiguous data into a safe deployment stop instead of a generic index error.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "notification_recipients"
    GROUP BY "notification_id", "user_id" HAVING COUNT(*) > 1
  ) THEN RAISE EXCEPTION 'Duplicate notification_recipients(notification_id, user_id) values block reconciliation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "push_subscriptions"
    GROUP BY "user_id" HAVING COUNT(*) > 1
  ) THEN RAISE EXCEPTION 'Duplicate push_subscriptions.user_id values block reconciliation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "category_tags"
    GROUP BY "category_id", "tag_id" HAVING COUNT(*) > 1
  ) THEN RAISE EXCEPTION 'Duplicate category_tags(category_id, tag_id) values block reconciliation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "saved_trips"
    GROUP BY "user_id", "trip_id" HAVING COUNT(*) > 1
  ) THEN RAISE EXCEPTION 'Duplicate saved_trips(user_id, trip_id) values block reconciliation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "business_roles" WHERE "business_id" IS NOT NULL
    GROUP BY "business_id", "name" HAVING COUNT(*) > 1
  ) THEN RAISE EXCEPTION 'Duplicate business_roles(business_id, name) values block reconciliation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "staff_invitations"
    GROUP BY "token" HAVING COUNT(*) > 1
  ) THEN RAISE EXCEPTION 'Duplicate staff_invitations.token values block reconciliation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "business_blocked_dates" WHERE "service_id" IS NOT NULL
    GROUP BY "business_id", "service_id", "date" HAVING COUNT(*) > 1
  ) THEN RAISE EXCEPTION 'Duplicate business_blocked_dates(business_id, service_id, date) values block reconciliation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "booking_transactions"
    GROUP BY "booking_id" HAVING COUNT(*) > 1
  ) THEN RAISE EXCEPTION 'Duplicate booking_transactions.booking_id values block reconciliation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "partner_wallets"
    GROUP BY "business_id" HAVING COUNT(*) > 1
  ) THEN RAISE EXCEPTION 'Duplicate partner_wallets.business_id values block reconciliation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "cached_itineraries"
    GROUP BY "filter_hash" HAVING COUNT(*) > 1
  ) THEN RAISE EXCEPTION 'Duplicate cached_itineraries.filter_hash values block reconciliation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "event_participants"
    GROUP BY "event_id", "user_id" HAVING COUNT(*) > 1
  ) THEN RAISE EXCEPTION 'Duplicate event_participants(event_id, user_id) values block reconciliation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "event_moments"
    GROUP BY "event_id", "place_id", "user_id" HAVING COUNT(*) > 1
  ) THEN RAISE EXCEPTION 'Duplicate event_moments(event_id, place_id, user_id) values block reconciliation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "active_sessions"
    GROUP BY "event_id", "user_id" HAVING COUNT(*) > 1
  ) THEN RAISE EXCEPTION 'Duplicate active_sessions(event_id, user_id) values block reconciliation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "bookings" WHERE "idempotency_key" IS NOT NULL
    GROUP BY "idempotency_key" HAVING COUNT(*) > 1
  ) THEN RAISE EXCEPTION 'Duplicate bookings.idempotency_key values block reconciliation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "payments"
    GROUP BY "transaction_ref" HAVING COUNT(*) > 1
  ) THEN RAISE EXCEPTION 'Duplicate payments.transaction_ref values block reconciliation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "payments"
    GROUP BY "idempotency_key" HAVING COUNT(*) > 1
  ) THEN RAISE EXCEPTION 'Duplicate payments.idempotency_key values block reconciliation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "users"
    GROUP BY "username" HAVING COUNT(*) > 1
  ) THEN RAISE EXCEPTION 'Duplicate users.username values block reconciliation';
  END IF;
END $$;

-- CREATE INDEX IF NOT EXISTS silently accepts a same-name index with the wrong
-- table, uniqueness, columns, or ordering. Validate every managed definition
-- before the idempotent create statements below.
DO $$
DECLARE
  expected RECORD;
  existing_index_oid OID;
  existing_index_kind TEXT;
  actual_table_name TEXT;
  actual_access_method TEXT;
  actual_column_names TEXT[];
  actual_column_options SMALLINT[];
  actual_opclasses TEXT[];
  actual_opclass_defaults BOOLEAN[];
  actual_collations OID[];
  expected_collations OID[];
  expected_table_name TEXT;
  expected_column_names TEXT[];
  expected_column_options SMALLINT[];
  expected_columns_sql TEXT;
  expected_canonical_definition TEXT;
  actual_canonical_definition TEXT;
  actual_is_unique BOOLEAN;
  actual_is_valid BOOLEAN;
  actual_is_ready BOOLEAN;
  actual_is_live BOOLEAN;
  actual_is_immediate BOOLEAN;
  actual_is_primary BOOLEAN;
  actual_is_exclusion BOOLEAN;
  actual_nulls_not_distinct BOOLEAN;
  actual_constraint_backing_count INTEGER;
  actual_key_count INTEGER;
  actual_attribute_count INTEGER;
  actual_predicate TEXT;
  actual_expressions TEXT;
BEGIN
  FOR expected IN
    SELECT * FROM (VALUES
      ('notification_recipients_user_id_read_at_created_at_idx', 'CREATE INDEX "notification_recipients_user_id_read_at_created_at_idx" ON "notification_recipients"("user_id", "read_at" DESC, "created_at" DESC)'),
      ('notification_recipients_business_id_read_at_idx', 'CREATE INDEX "notification_recipients_business_id_read_at_idx" ON "notification_recipients"("business_id", "read_at")'),
      ('notification_recipients_role_id_read_at_idx', 'CREATE INDEX "notification_recipients_role_id_read_at_idx" ON "notification_recipients"("role_id", "read_at")'),
      ('notification_recipients_notification_id_user_id_key', 'CREATE UNIQUE INDEX "notification_recipients_notification_id_user_id_key" ON "notification_recipients"("notification_id", "user_id")'),
      ('push_subscriptions_user_id_key', 'CREATE UNIQUE INDEX "push_subscriptions_user_id_key" ON "push_subscriptions"("user_id")'),
      ('idx_category_tags_category_id', 'CREATE INDEX "idx_category_tags_category_id" ON "category_tags"("category_id")'),
      ('idx_category_tags_tag_id', 'CREATE INDEX "idx_category_tags_tag_id" ON "category_tags"("tag_id")'),
      ('category_tags_category_id_tag_id_key', 'CREATE UNIQUE INDEX "category_tags_category_id_tag_id_key" ON "category_tags"("category_id", "tag_id")'),
      ('review_moderation_logs_review_id_idx', 'CREATE INDEX "review_moderation_logs_review_id_idx" ON "review_moderation_logs"("review_id")'),
      ('review_moderation_logs_created_at_idx', 'CREATE INDEX "review_moderation_logs_created_at_idx" ON "review_moderation_logs"("created_at")'),
      ('saved_trips_user_id_trip_id_key', 'CREATE UNIQUE INDEX "saved_trips_user_id_trip_id_key" ON "saved_trips"("user_id", "trip_id")'),
      ('sensitive_documents_business_id_idx', 'CREATE INDEX "sensitive_documents_business_id_idx" ON "sensitive_documents"("business_id")'),
      ('sensitive_documents_business_id_type_idx', 'CREATE INDEX "sensitive_documents_business_id_type_idx" ON "sensitive_documents"("business_id", "type")'),
      ('business_roles_business_id_name_key', 'CREATE UNIQUE INDEX "business_roles_business_id_name_key" ON "business_roles"("business_id", "name")'),
      ('staff_invitations_token_key', 'CREATE UNIQUE INDEX "staff_invitations_token_key" ON "staff_invitations"("token")'),
      ('staff_invitations_token_idx', 'CREATE INDEX "staff_invitations_token_idx" ON "staff_invitations"("token")'),
      ('staff_invitations_business_id_status_idx', 'CREATE INDEX "staff_invitations_business_id_status_idx" ON "staff_invitations"("business_id", "status")'),
      ('business_blocked_dates_business_id_date_idx', 'CREATE INDEX "business_blocked_dates_business_id_date_idx" ON "business_blocked_dates"("business_id", "date")'),
      ('business_blocked_dates_business_id_service_id_date_key', 'CREATE UNIQUE INDEX "business_blocked_dates_business_id_service_id_date_key" ON "business_blocked_dates"("business_id", "service_id", "date")'),
      ('place_resources_place_id_idx', 'CREATE INDEX "place_resources_place_id_idx" ON "place_resources"("place_id")'),
      ('place_resources_service_id_idx', 'CREATE INDEX "place_resources_service_id_idx" ON "place_resources"("service_id")'),
      ('auto_approve_rules_business_id_is_deleted_is_active_idx', 'CREATE INDEX "auto_approve_rules_business_id_is_deleted_is_active_idx" ON "auto_approve_rules"("business_id", "is_deleted", "is_active")'),
      ('booking_action_logs_booking_id_idx', 'CREATE INDEX "booking_action_logs_booking_id_idx" ON "booking_action_logs"("booking_id")'),
      ('booking_action_logs_created_at_idx', 'CREATE INDEX "booking_action_logs_created_at_idx" ON "booking_action_logs"("created_at")'),
      ('booking_transactions_booking_id_key', 'CREATE UNIQUE INDEX "booking_transactions_booking_id_key" ON "booking_transactions"("booking_id")'),
      ('booking_transactions_business_id_completed_at_idx', 'CREATE INDEX "booking_transactions_business_id_completed_at_idx" ON "booking_transactions"("business_id", "completed_at")'),
      ('payment_webhook_logs_gateway_created_at_idx', 'CREATE INDEX "payment_webhook_logs_gateway_created_at_idx" ON "payment_webhook_logs"("gateway", "created_at")'),
      ('payouts_business_id_idx', 'CREATE INDEX "payouts_business_id_idx" ON "payouts"("business_id")'),
      ('payouts_status_idx', 'CREATE INDEX "payouts_status_idx" ON "payouts"("status")'),
      ('partner_wallets_business_id_key', 'CREATE UNIQUE INDEX "partner_wallets_business_id_key" ON "partner_wallets"("business_id")'),
      ('financial_ledgers_booking_id_idx', 'CREATE INDEX "financial_ledgers_booking_id_idx" ON "financial_ledgers"("booking_id")'),
      ('financial_ledgers_payout_id_idx', 'CREATE INDEX "financial_ledgers_payout_id_idx" ON "financial_ledgers"("payout_id")'),
      ('cached_itineraries_filter_hash_key', 'CREATE UNIQUE INDEX "cached_itineraries_filter_hash_key" ON "cached_itineraries"("filter_hash")'),
      ('events_trip_id_idx', 'CREATE INDEX "events_trip_id_idx" ON "events"("trip_id")'),
      ('events_created_by_idx', 'CREATE INDEX "events_created_by_idx" ON "events"("created_by")'),
      ('event_participants_event_id_user_id_key', 'CREATE UNIQUE INDEX "event_participants_event_id_user_id_key" ON "event_participants"("event_id", "user_id")'),
      ('event_moments_event_id_place_id_user_id_key', 'CREATE UNIQUE INDEX "event_moments_event_id_place_id_user_id_key" ON "event_moments"("event_id", "place_id", "user_id")'),
      ('active_sessions_updated_at_idx', 'CREATE INDEX "active_sessions_updated_at_idx" ON "active_sessions"("updated_at")'),
      ('active_sessions_event_id_user_id_key', 'CREATE UNIQUE INDEX "active_sessions_event_id_user_id_key" ON "active_sessions"("event_id", "user_id")'),
      ('banners_marketing_is_active_start_date_end_date_priority_idx', 'CREATE INDEX "banners_marketing_is_active_start_date_end_date_priority_idx" ON "banners_marketing"("is_active", "start_date", "end_date", "priority")'),
      ('bookings_idempotency_key_key', 'CREATE UNIQUE INDEX "bookings_idempotency_key_key" ON "bookings"("idempotency_key")'),
      ('bookings_status_idx', 'CREATE INDEX "bookings_status_idx" ON "bookings"("status")'),
      ('bookings_resource_id_idx', 'CREATE INDEX "bookings_resource_id_idx" ON "bookings"("resource_id")'),
      ('bookings_business_id_booking_at_idx', 'CREATE INDEX "bookings_business_id_booking_at_idx" ON "bookings"("business_id", "booking_at")'),
      ('bookings_resource_id_use_date_status_idx', 'CREATE INDEX "bookings_resource_id_use_date_status_idx" ON "bookings"("resource_id", "use_date", "status")'),
      ('bookings_service_id_use_date_status_idx', 'CREATE INDEX "bookings_service_id_use_date_status_idx" ON "bookings"("service_id", "use_date", "status")'),
      ('bookings_resource_id_start_time_end_time_idx', 'CREATE INDEX "bookings_resource_id_start_time_end_time_idx" ON "bookings"("resource_id", "start_time", "end_time")'),
      ('bookings_service_id_start_time_end_time_idx', 'CREATE INDEX "bookings_service_id_start_time_end_time_idx" ON "bookings"("service_id", "start_time", "end_time")'),
      ('bookings_deleted_at_idx', 'CREATE INDEX "bookings_deleted_at_idx" ON "bookings"("deleted_at")'),
      ('business_services_business_id_idx', 'CREATE INDEX "business_services_business_id_idx" ON "business_services"("business_id")'),
      ('business_services_place_id_idx', 'CREATE INDEX "business_services_place_id_idx" ON "business_services"("place_id")'),
      ('businesses_status_idx', 'CREATE INDEX "businesses_status_idx" ON "businesses"("status")'),
      ('idx_categories_level', 'CREATE INDEX "idx_categories_level" ON "categories"("level")'),
      ('favorites_user_id_collection_name_idx', 'CREATE INDEX "favorites_user_id_collection_name_idx" ON "favorites"("user_id", "collection_name")'),
      ('notifications_global_status_target_type_sent_at_idx', 'CREATE INDEX "notifications_global_status_target_type_sent_at_idx" ON "notifications_global"("status", "target_type", "sent_at" DESC)'),
      ('payments_transaction_ref_key', 'CREATE UNIQUE INDEX "payments_transaction_ref_key" ON "payments"("transaction_ref")'),
      ('payments_idempotency_key_key', 'CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key")'),
      ('place_images_place_id_idx', 'CREATE INDEX "place_images_place_id_idx" ON "place_images"("place_id")'),
      ('places_status_category_id_district_id_idx', 'CREATE INDEX "places_status_category_id_district_id_idx" ON "places"("status", "category_id", "district_id")'),
      ('places_is_seeded_idx', 'CREATE INDEX "places_is_seeded_idx" ON "places"("is_seeded")'),
      ('places_deleted_at_idx', 'CREATE INDEX "places_deleted_at_idx" ON "places"("deleted_at")'),
      ('places_is_featured_status_rating_avg_idx', 'CREATE INDEX "places_is_featured_status_rating_avg_idx" ON "places"("is_featured", "status", "rating_avg" DESC)'),
      ('review_media_review_id_idx', 'CREATE INDEX "review_media_review_id_idx" ON "review_media"("review_id")'),
      ('review_replies_review_id_idx', 'CREATE INDEX "review_replies_review_id_idx" ON "review_replies"("review_id")'),
      ('review_replies_user_id_idx', 'CREATE INDEX "review_replies_user_id_idx" ON "review_replies"("user_id")'),
      ('reviews_is_seeded_idx', 'CREATE INDEX "reviews_is_seeded_idx" ON "reviews"("is_seeded")'),
      ('reviews_status_idx', 'CREATE INDEX "reviews_status_idx" ON "reviews"("status")'),
      ('trip_destinations_trip_id_idx', 'CREATE INDEX "trip_destinations_trip_id_idx" ON "trip_destinations"("trip_id")'),
      ('trip_destinations_place_id_idx', 'CREATE INDEX "trip_destinations_place_id_idx" ON "trip_destinations"("place_id")'),
      ('trips_is_public_clone_count_idx', 'CREATE INDEX "trips_is_public_clone_count_idx" ON "trips"("is_public", "clone_count" DESC)'),
      ('user_checkins_user_id_idx', 'CREATE INDEX "user_checkins_user_id_idx" ON "user_checkins"("user_id")'),
      ('user_checkins_place_id_idx', 'CREATE INDEX "user_checkins_place_id_idx" ON "user_checkins"("place_id")'),
      ('user_sessions_user_id_idx', 'CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id")'),
      ('users_username_key', 'CREATE UNIQUE INDEX "users_username_key" ON "users"("username")'),
      ('users_deleted_at_idx', 'CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at")'),
      ('users_status_idx', 'CREATE INDEX "users_status_idx" ON "users"("status")')
    ) AS definitions(index_name, definition)
  LOOP
    existing_index_oid := NULL;
    existing_index_kind := NULL;
    SELECT index_relation.oid, index_relation.relkind::TEXT
      INTO existing_index_oid, existing_index_kind
    FROM pg_class index_relation
    JOIN pg_namespace namespace ON namespace.oid = index_relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND index_relation.relname = expected.index_name;

    IF existing_index_oid IS NOT NULL THEN
      IF existing_index_kind <> 'i' THEN
        RAISE EXCEPTION 'Existing index % is incompatible: name belongs to relation kind %',
          expected.index_name, existing_index_kind;
      END IF;

      SELECT
        table_relation.relname,
        access_method.amname,
        catalog_index.indisunique,
        catalog_index.indisvalid,
        catalog_index.indisready,
        catalog_index.indislive,
        catalog_index.indimmediate,
        catalog_index.indisprimary,
        catalog_index.indisexclusion,
        COALESCE((to_jsonb(catalog_index)->>'indnullsnotdistinct')::BOOLEAN, false),
        catalog_index.indnkeyatts,
        catalog_index.indnatts,
        pg_get_expr(catalog_index.indpred, catalog_index.indrelid),
        pg_get_expr(catalog_index.indexprs, catalog_index.indrelid),
        ARRAY(
          SELECT attribute.attname
          FROM unnest(catalog_index.indkey) WITH ORDINALITY AS key_column(attnum, position)
          LEFT JOIN pg_attribute attribute
            ON attribute.attrelid = catalog_index.indrelid
           AND attribute.attnum = key_column.attnum
          ORDER BY key_column.position
        ),
        ARRAY(
          SELECT option_value::SMALLINT
          FROM unnest(catalog_index.indoption) WITH ORDINALITY AS index_option(option_value, position)
          ORDER BY index_option.position
        ),
        ARRAY(
          SELECT operator_class.opcname
          FROM unnest(catalog_index.indclass) WITH ORDINALITY AS index_class(operator_class_oid, position)
          JOIN pg_opclass operator_class ON operator_class.oid = index_class.operator_class_oid
          ORDER BY index_class.position
        ),
        ARRAY(
          SELECT operator_class.opcdefault
          FROM unnest(catalog_index.indclass) WITH ORDINALITY AS index_class(operator_class_oid, position)
          JOIN pg_opclass operator_class ON operator_class.oid = index_class.operator_class_oid
          ORDER BY index_class.position
        ),
        ARRAY(
          SELECT collation_oid::OID
          FROM unnest(catalog_index.indcollation) WITH ORDINALITY AS index_collation(collation_oid, position)
          ORDER BY index_collation.position
        ),
        pg_get_indexdef(catalog_index.indexrelid),
        (SELECT COUNT(*)::INTEGER FROM pg_constraint constraint_backing
         WHERE constraint_backing.conindid = catalog_index.indexrelid)
      INTO
        actual_table_name,
        actual_access_method,
        actual_is_unique,
        actual_is_valid,
        actual_is_ready,
        actual_is_live,
        actual_is_immediate,
        actual_is_primary,
        actual_is_exclusion,
        actual_nulls_not_distinct,
        actual_key_count,
        actual_attribute_count,
        actual_predicate,
        actual_expressions,
        actual_column_names,
        actual_column_options,
        actual_opclasses,
        actual_opclass_defaults,
        actual_collations,
        actual_canonical_definition,
        actual_constraint_backing_count
      FROM pg_index catalog_index
      JOIN pg_class catalog_index_relation
        ON catalog_index_relation.oid = catalog_index.indexrelid
      JOIN pg_class table_relation ON table_relation.oid = catalog_index.indrelid
      JOIN pg_am access_method ON access_method.oid = catalog_index_relation.relam
      WHERE catalog_index.indexrelid = existing_index_oid;

      IF NOT actual_is_valid OR NOT actual_is_ready OR NOT actual_is_live THEN
        RAISE EXCEPTION 'Existing index % is unhealthy: valid %, ready %, live %',
          expected.index_name, actual_is_valid, actual_is_ready, actual_is_live;
      END IF;

      expected_table_name := substring(expected.definition FROM ' ON "([^"]+)"');
      SELECT
        array_agg(captures[1] ORDER BY matched.position),
        array_agg(
          CASE WHEN captures[2] = ' DESC' THEN 3 ELSE 0 END::SMALLINT
          ORDER BY matched.position
        )
      INTO expected_column_names, expected_column_options
      FROM regexp_matches(
        substring(expected.definition FROM '\((.*)\)$'),
        '"([^"]+)"( DESC)?',
        'g'
      ) WITH ORDINALITY AS matched(captures, position);

      SELECT
        string_agg(
          format('%I%s', column_name, CASE WHEN column_option = 3 THEN ' DESC' ELSE '' END),
          ', ' ORDER BY position
        )
      INTO expected_columns_sql
      FROM unnest(expected_column_names, expected_column_options)
        WITH ORDINALITY AS expected_column(column_name, column_option, position);
      expected_canonical_definition := format(
        'CREATE %sINDEX %I ON public.%I USING btree (%s)',
        CASE WHEN starts_with(expected.definition, 'CREATE UNIQUE INDEX ') THEN 'UNIQUE ' ELSE '' END,
        expected.index_name,
        expected_table_name,
        expected_columns_sql
      );

      SELECT array_agg(attribute.attcollation ORDER BY expected_column.position)
      INTO expected_collations
      FROM unnest(expected_column_names) WITH ORDINALITY AS expected_column(column_name, position)
      JOIN pg_attribute attribute
        ON attribute.attrelid = to_regclass(format('public.%I', expected_table_name))
       AND attribute.attname = expected_column.column_name
       AND NOT attribute.attisdropped;

      IF actual_table_name <> expected_table_name
         OR actual_access_method <> 'btree'
         OR actual_canonical_definition IS DISTINCT FROM expected_canonical_definition
         OR actual_is_unique <> starts_with(expected.definition, 'CREATE UNIQUE INDEX ')
         OR NOT actual_is_immediate
         OR actual_is_primary
         OR actual_is_exclusion
         OR actual_nulls_not_distinct
         OR actual_constraint_backing_count <> 0
         OR actual_key_count <> cardinality(expected_column_names)
         OR actual_attribute_count <> actual_key_count
         OR actual_predicate IS NOT NULL
         OR actual_expressions IS NOT NULL
         OR actual_column_names IS DISTINCT FROM expected_column_names
         OR actual_column_options IS DISTINCT FROM expected_column_options
         OR false = ANY(actual_opclass_defaults)
         OR cardinality(actual_opclasses) <> cardinality(expected_column_names)
         OR actual_collations IS DISTINCT FROM expected_collations THEN
        RAISE EXCEPTION 'Existing index % is incompatible: expected %, found %',
          expected.index_name, expected.definition, pg_get_indexdef(existing_index_oid);
      END IF;
    END IF;
  END LOOP;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notification_recipients_user_id_read_at_created_at_idx" ON "notification_recipients"("user_id", "read_at" DESC, "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notification_recipients_business_id_read_at_idx" ON "notification_recipients"("business_id", "read_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notification_recipients_role_id_read_at_idx" ON "notification_recipients"("role_id", "read_at");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "notification_recipients_notification_id_user_id_key" ON "notification_recipients"("notification_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_user_id_key" ON "push_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_category_tags_category_id" ON "category_tags"("category_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_category_tags_tag_id" ON "category_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "category_tags_category_id_tag_id_key" ON "category_tags"("category_id", "tag_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "review_moderation_logs_review_id_idx" ON "review_moderation_logs"("review_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "review_moderation_logs_created_at_idx" ON "review_moderation_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "saved_trips_user_id_trip_id_key" ON "saved_trips"("user_id", "trip_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sensitive_documents_business_id_idx" ON "sensitive_documents"("business_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sensitive_documents_business_id_type_idx" ON "sensitive_documents"("business_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "business_roles_business_id_name_key" ON "business_roles"("business_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "staff_invitations_token_key" ON "staff_invitations"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "staff_invitations_token_idx" ON "staff_invitations"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "staff_invitations_business_id_status_idx" ON "staff_invitations"("business_id", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "business_blocked_dates_business_id_date_idx" ON "business_blocked_dates"("business_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "business_blocked_dates_business_id_service_id_date_key" ON "business_blocked_dates"("business_id", "service_id", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "place_resources_place_id_idx" ON "place_resources"("place_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "place_resources_service_id_idx" ON "place_resources"("service_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "auto_approve_rules_business_id_is_deleted_is_active_idx" ON "auto_approve_rules"("business_id", "is_deleted", "is_active");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "booking_action_logs_booking_id_idx" ON "booking_action_logs"("booking_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "booking_action_logs_created_at_idx" ON "booking_action_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "booking_transactions_booking_id_key" ON "booking_transactions"("booking_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "booking_transactions_business_id_completed_at_idx" ON "booking_transactions"("business_id", "completed_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payment_webhook_logs_gateway_created_at_idx" ON "payment_webhook_logs"("gateway", "created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payouts_business_id_idx" ON "payouts"("business_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payouts_status_idx" ON "payouts"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "partner_wallets_business_id_key" ON "partner_wallets"("business_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "financial_ledgers_booking_id_idx" ON "financial_ledgers"("booking_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "financial_ledgers_payout_id_idx" ON "financial_ledgers"("payout_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "cached_itineraries_filter_hash_key" ON "cached_itineraries"("filter_hash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "events_trip_id_idx" ON "events"("trip_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "events_created_by_idx" ON "events"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "event_participants_event_id_user_id_key" ON "event_participants"("event_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "event_moments_event_id_place_id_user_id_key" ON "event_moments"("event_id", "place_id", "user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "active_sessions_updated_at_idx" ON "active_sessions"("updated_at");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "active_sessions_event_id_user_id_key" ON "active_sessions"("event_id", "user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "banners_marketing_is_active_start_date_end_date_priority_idx" ON "banners_marketing"("is_active", "start_date", "end_date", "priority");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "bookings_idempotency_key_key" ON "bookings"("idempotency_key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bookings_resource_id_idx" ON "bookings"("resource_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bookings_business_id_booking_at_idx" ON "bookings"("business_id", "booking_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bookings_resource_id_use_date_status_idx" ON "bookings"("resource_id", "use_date", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bookings_service_id_use_date_status_idx" ON "bookings"("service_id", "use_date", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bookings_resource_id_start_time_end_time_idx" ON "bookings"("resource_id", "start_time", "end_time");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bookings_service_id_start_time_end_time_idx" ON "bookings"("service_id", "start_time", "end_time");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bookings_deleted_at_idx" ON "bookings"("deleted_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "business_services_business_id_idx" ON "business_services"("business_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "business_services_place_id_idx" ON "business_services"("place_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "businesses_status_idx" ON "businesses"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_categories_level" ON "categories"("level");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "favorites_user_id_collection_name_idx" ON "favorites"("user_id", "collection_name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notifications_global_status_target_type_sent_at_idx" ON "notifications_global"("status", "target_type", "sent_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "payments_transaction_ref_key" ON "payments"("transaction_ref");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "payments_idempotency_key_key" ON "payments"("idempotency_key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "place_images_place_id_idx" ON "place_images"("place_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "places_status_category_id_district_id_idx" ON "places"("status", "category_id", "district_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "places_is_seeded_idx" ON "places"("is_seeded");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "places_deleted_at_idx" ON "places"("deleted_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "places_is_featured_status_rating_avg_idx" ON "places"("is_featured", "status", "rating_avg" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "review_media_review_id_idx" ON "review_media"("review_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "review_replies_review_id_idx" ON "review_replies"("review_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "review_replies_user_id_idx" ON "review_replies"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reviews_is_seeded_idx" ON "reviews"("is_seeded");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reviews_status_idx" ON "reviews"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "trip_destinations_trip_id_idx" ON "trip_destinations"("trip_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "trip_destinations_place_id_idx" ON "trip_destinations"("place_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "trips_is_public_clone_count_idx" ON "trips"("is_public", "clone_count" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_checkins_user_id_idx" ON "user_checkins"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_checkins_place_id_idx" ON "user_checkins"("place_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users"("status");

-- PostgreSQL has no ADD CONSTRAINT IF NOT EXISTS. Iterate over the exact Prisma
-- definitions and scope every guard to both the relation and constraint name.
DO $$
DECLARE
  fk RECORD;
  existing_constraint_oid OID;
  actual_definition TEXT;
  source_relation_oid OID;
  referenced_relation_oid OID;
  expected_source_column TEXT;
  expected_referenced_table TEXT;
  expected_referenced_column TEXT;
  expected_source_attnum SMALLINT;
  expected_referenced_attnum SMALLINT;
  expected_delete_action "char";
  expected_update_action "char";
  actual_constraint_type "char";
  actual_source_relation_oid OID;
  actual_referenced_relation_oid OID;
  actual_source_keys SMALLINT[];
  actual_referenced_keys SMALLINT[];
  actual_delete_action "char";
  actual_update_action "char";
  actual_match_type "char";
  actual_deferrable BOOLEAN;
  actual_deferred BOOLEAN;
  actual_validated BOOLEAN;
  actual_enforced BOOLEAN;
  actual_pfeqop OID[];
  actual_ppeqop OID[];
  actual_ffeqop OID[];
  actual_supporting_index_oid OID;
  supporting_index_is_valid BOOLEAN;
  supporting_index_is_ready BOOLEAN;
  supporting_index_is_live BOOLEAN;
  supporting_index_is_unique BOOLEAN;
  supporting_index_is_immediate BOOLEAN;
  supporting_index_relation_oid OID;
  supporting_index_keys SMALLINT[];
  supporting_index_predicate TEXT;
  equality_operator_is_supported BOOLEAN;
  enforcement_trigger_count INTEGER;
  enforcement_triggers_enabled BOOLEAN;
BEGIN
  FOR fk IN
    SELECT * FROM (VALUES
      ('users', 'users_business_id_fkey', 'FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('users', 'users_business_role_id_fkey', 'FOREIGN KEY ("business_role_id") REFERENCES "business_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('notification_recipients', 'notification_recipients_notification_id_fkey', 'FOREIGN KEY ("notification_id") REFERENCES "notifications_global"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('notification_recipients', 'notification_recipients_user_id_fkey', 'FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('notification_recipients', 'notification_recipients_business_id_fkey', 'FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('push_subscriptions', 'push_subscriptions_user_id_fkey', 'FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('province_dataset_records', 'province_dataset_records_dataset_release_id_fkey', 'FOREIGN KEY ("dataset_release_id") REFERENCES "administrative_dataset_releases"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('province_dataset_records', 'province_dataset_records_province_code_fkey', 'FOREIGN KEY ("province_code") REFERENCES "provinces"("code") ON DELETE RESTRICT ON UPDATE CASCADE'),
      ('administrative_ward_dataset_records', 'administrative_ward_dataset_records_dataset_release_id_fkey', 'FOREIGN KEY ("dataset_release_id") REFERENCES "administrative_dataset_releases"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('administrative_ward_dataset_records', 'administrative_ward_dataset_records_ward_code_fkey', 'FOREIGN KEY ("ward_code") REFERENCES "administrative_wards"("code") ON DELETE RESTRICT ON UPDATE CASCADE'),
      ('place_administrative_location_exceptions', 'place_administrative_location_exceptions_place_id_fkey', 'FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('place_administrative_location_exceptions', 'place_administrative_location_exceptions_dataset_release_i_fkey', 'FOREIGN KEY ("dataset_release_id") REFERENCES "administrative_dataset_releases"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('category_tags', 'category_tags_category_id_fkey', 'FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('category_tags', 'category_tags_tag_id_fkey', 'FOREIGN KEY ("tag_id") REFERENCES "place_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('places', 'places_district_id_fkey', 'FOREIGN KEY ("district_id") REFERENCES "districts_cantho"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('places', 'places_province_code_fkey', 'FOREIGN KEY ("province_code") REFERENCES "provinces"("code") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('places', 'places_administrative_ward_code_fkey', 'FOREIGN KEY ("administrative_ward_code") REFERENCES "administrative_wards"("code") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('review_moderation_logs', 'review_moderation_logs_review_id_fkey', 'FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('review_moderation_logs', 'review_moderation_logs_reply_id_fkey', 'FOREIGN KEY ("reply_id") REFERENCES "review_replies"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('review_moderation_logs', 'review_moderation_logs_actor_user_id_fkey', 'FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE'),
      ('saved_trips', 'saved_trips_trip_id_fkey', 'FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('saved_trips', 'saved_trips_user_id_fkey', 'FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('sensitive_documents', 'sensitive_documents_business_id_fkey', 'FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('business_roles', 'business_roles_business_id_fkey', 'FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('staff_invitations', 'staff_invitations_business_id_fkey', 'FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('staff_invitations', 'staff_invitations_role_id_fkey', 'FOREIGN KEY ("role_id") REFERENCES "business_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('staff_invitations', 'staff_invitations_created_by_fkey', 'FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE'),
      ('staff_invitations', 'staff_invitations_accepted_by_fkey', 'FOREIGN KEY ("accepted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('business_blocked_dates', 'business_blocked_dates_business_id_fkey', 'FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('business_blocked_dates', 'business_blocked_dates_service_id_fkey', 'FOREIGN KEY ("service_id") REFERENCES "business_services"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('business_blocked_dates', 'business_blocked_dates_created_by_fkey', 'FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE'),
      ('place_resources', 'place_resources_place_id_fkey', 'FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('place_resources', 'place_resources_service_id_fkey', 'FOREIGN KEY ("service_id") REFERENCES "business_services"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('auto_approve_rules', 'auto_approve_rules_business_id_fkey', 'FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('booking_action_logs', 'booking_action_logs_actor_user_id_fkey', 'FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('booking_action_logs', 'booking_action_logs_booking_id_fkey', 'FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('bookings', 'bookings_business_id_fkey', 'FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE'),
      ('bookings', 'bookings_resource_id_fkey', 'FOREIGN KEY ("resource_id") REFERENCES "place_resources"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('booking_transactions', 'booking_transactions_booking_id_fkey', 'FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('payment_webhook_logs', 'payment_webhook_logs_payment_id_fkey', 'FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('payouts', 'payouts_business_id_fkey', 'FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE'),
      ('partner_wallets', 'partner_wallets_business_id_fkey', 'FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('financial_ledgers', 'financial_ledgers_booking_id_fkey', 'FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('financial_ledgers', 'financial_ledgers_payout_id_fkey', 'FOREIGN KEY ("payout_id") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('events', 'events_trip_id_fkey', 'FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('events', 'events_created_by_fkey', 'FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE'),
      ('event_participants', 'event_participants_event_id_fkey', 'FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('event_participants', 'event_participants_user_id_fkey', 'FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('event_moments', 'event_moments_event_id_fkey', 'FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('event_moments', 'event_moments_user_id_fkey', 'FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('active_sessions', 'active_sessions_event_id_fkey', 'FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('active_sessions', 'active_sessions_user_id_fkey', 'FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE')
    ) AS definitions(table_name, constraint_name, definition)
  LOOP
    existing_constraint_oid := NULL;
    SELECT c.oid
      INTO existing_constraint_oid
    FROM pg_constraint c
    JOIN pg_class relation ON relation.oid = c.conrelid
    JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relname = fk.table_name
      AND c.conname = fk.constraint_name;

    IF existing_constraint_oid IS NULL THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I %s',
        fk.table_name,
        fk.constraint_name,
        fk.definition
      );
    ELSE
      actual_definition := pg_get_constraintdef(existing_constraint_oid, true);
      expected_source_column := substring(fk.definition FROM 'FOREIGN KEY \("([^"]+)"\)');
      expected_referenced_table := substring(fk.definition FROM 'REFERENCES "([^"]+)"');
      expected_referenced_column := substring(fk.definition FROM 'REFERENCES "[^"]+"\("([^"]+)"\)');
      source_relation_oid := to_regclass(format('public.%I', fk.table_name));
      referenced_relation_oid := to_regclass(format('public.%I', expected_referenced_table));

      SELECT attnum INTO expected_source_attnum
      FROM pg_attribute
      WHERE attrelid = source_relation_oid
        AND attname = expected_source_column
        AND NOT attisdropped;
      SELECT attnum INTO expected_referenced_attnum
      FROM pg_attribute
      WHERE attrelid = referenced_relation_oid
        AND attname = expected_referenced_column
        AND NOT attisdropped;

      expected_delete_action := CASE substring(
        fk.definition FROM 'ON DELETE (CASCADE|SET NULL|RESTRICT|NO ACTION|SET DEFAULT)'
      )
        WHEN 'CASCADE' THEN 'c'
        WHEN 'SET NULL' THEN 'n'
        WHEN 'RESTRICT' THEN 'r'
        WHEN 'SET DEFAULT' THEN 'd'
        ELSE 'a'
      END;
      expected_update_action := CASE substring(
        fk.definition FROM 'ON UPDATE (CASCADE|SET NULL|RESTRICT|NO ACTION|SET DEFAULT)'
      )
        WHEN 'CASCADE' THEN 'c'
        WHEN 'SET NULL' THEN 'n'
        WHEN 'RESTRICT' THEN 'r'
        WHEN 'SET DEFAULT' THEN 'd'
        ELSE 'a'
      END;

      SELECT
        constraint_catalog.contype,
        constraint_catalog.conrelid,
        constraint_catalog.confrelid,
        constraint_catalog.conkey,
        constraint_catalog.confkey,
        constraint_catalog.confdeltype,
        constraint_catalog.confupdtype,
        constraint_catalog.confmatchtype,
        constraint_catalog.condeferrable,
        constraint_catalog.condeferred,
        constraint_catalog.convalidated,
        COALESCE((to_jsonb(constraint_catalog)->>'conenforced')::BOOLEAN, true),
        constraint_catalog.conpfeqop,
        constraint_catalog.conppeqop,
        constraint_catalog.conffeqop,
        constraint_catalog.conindid
      INTO
        actual_constraint_type,
        actual_source_relation_oid,
        actual_referenced_relation_oid,
        actual_source_keys,
        actual_referenced_keys,
        actual_delete_action,
        actual_update_action,
        actual_match_type,
        actual_deferrable,
        actual_deferred,
        actual_validated,
        actual_enforced,
        actual_pfeqop,
        actual_ppeqop,
        actual_ffeqop,
        actual_supporting_index_oid
      FROM pg_constraint constraint_catalog
      WHERE constraint_catalog.oid = existing_constraint_oid;

      SELECT
        supporting_index.indisvalid,
        supporting_index.indisready,
        supporting_index.indislive,
        supporting_index.indisunique,
        supporting_index.indimmediate,
        supporting_index.indrelid,
        ARRAY(
          SELECT supporting_key::SMALLINT
          FROM unnest(supporting_index.indkey) WITH ORDINALITY AS key_position(supporting_key, position)
          ORDER BY key_position.position
        ),
        pg_get_expr(supporting_index.indpred, supporting_index.indrelid)
      INTO
        supporting_index_is_valid,
        supporting_index_is_ready,
        supporting_index_is_live,
        supporting_index_is_unique,
        supporting_index_is_immediate,
        supporting_index_relation_oid,
        supporting_index_keys,
        supporting_index_predicate
      FROM pg_index supporting_index
      WHERE supporting_index.indexrelid = actual_supporting_index_oid;

      SELECT EXISTS (
        SELECT 1
        FROM pg_index supporting_index
        JOIN LATERAL unnest(supporting_index.indclass)
          WITH ORDINALITY AS supporting_class(operator_class_oid, position)
          ON supporting_class.position = 1
        JOIN pg_opclass operator_class ON operator_class.oid = supporting_class.operator_class_oid
        JOIN pg_amop equality_operator
          ON equality_operator.amopfamily = operator_class.opcfamily
         AND equality_operator.amopstrategy = 3
         AND equality_operator.amopopr = actual_pfeqop[1]
        WHERE supporting_index.indexrelid = actual_supporting_index_oid
      ) INTO equality_operator_is_supported;

      SELECT
        COUNT(*)::INTEGER,
        COALESCE(bool_and(enforcement_trigger.tgenabled = 'O'), false)
      INTO enforcement_trigger_count, enforcement_triggers_enabled
      FROM pg_trigger enforcement_trigger
      WHERE enforcement_trigger.tgconstraint = existing_constraint_oid
        AND enforcement_trigger.tgisinternal;

      IF expected_source_attnum IS NULL
         OR expected_referenced_attnum IS NULL
         OR actual_constraint_type <> 'f'
         OR actual_source_relation_oid <> source_relation_oid
         OR actual_referenced_relation_oid <> referenced_relation_oid
         OR actual_source_keys IS DISTINCT FROM ARRAY[expected_source_attnum]::SMALLINT[]
         OR actual_referenced_keys IS DISTINCT FROM ARRAY[expected_referenced_attnum]::SMALLINT[]
         OR actual_delete_action <> expected_delete_action
         OR actual_update_action <> expected_update_action
         OR actual_match_type <> 's'
         OR actual_deferrable
         OR actual_deferred
         OR NOT actual_validated
         OR NOT actual_enforced
         OR cardinality(actual_pfeqop) <> 1
         OR actual_pfeqop IS DISTINCT FROM actual_ppeqop
         OR actual_pfeqop IS DISTINCT FROM actual_ffeqop
         OR actual_supporting_index_oid = 0
         OR NOT COALESCE(supporting_index_is_valid, false)
         OR NOT COALESCE(supporting_index_is_ready, false)
         OR NOT COALESCE(supporting_index_is_live, false)
         OR NOT COALESCE(supporting_index_is_unique, false)
         OR NOT COALESCE(supporting_index_is_immediate, false)
         OR supporting_index_relation_oid IS DISTINCT FROM referenced_relation_oid
         OR supporting_index_keys[1:cardinality(actual_referenced_keys)]
              IS DISTINCT FROM actual_referenced_keys
         OR supporting_index_predicate IS NOT NULL
         OR NOT equality_operator_is_supported THEN
        RAISE EXCEPTION 'Existing constraint %.% is incompatible: expected %, found %',
          fk.table_name, fk.constraint_name, fk.definition, actual_definition;
      END IF;

      IF enforcement_trigger_count < 4 OR NOT enforcement_triggers_enabled THEN
        RAISE EXCEPTION 'Existing constraint %.% is not enforced: expected enabled internal triggers, found % enabled of %',
          fk.table_name,
          fk.constraint_name,
          (SELECT COUNT(*) FROM pg_trigger enforcement_trigger
           WHERE enforcement_trigger.tgconstraint = existing_constraint_oid
             AND enforcement_trigger.tgisinternal
             AND enforcement_trigger.tgenabled = 'O'),
          enforcement_trigger_count;
      END IF;
    END IF;
  END LOOP;
END $$;

-- Rename raw-migration indexes to Prisma's stable names, but refuse ambiguous
-- duplicate-name states instead of silently discarding either index.
DO $$
DECLARE
  rename RECORD;
  historical_index_oid OID;
  target_index_oid OID;
  historical_table_name TEXT;
  target_table_name TEXT;
  historical_definition TEXT;
  target_definition TEXT;
  historical_is_valid BOOLEAN;
  historical_is_ready BOOLEAN;
  historical_is_live BOOLEAN;
  target_is_valid BOOLEAN;
  target_is_ready BOOLEAN;
  target_is_live BOOLEAN;
  historical_material_is_compatible BOOLEAN;
  target_material_is_compatible BOOLEAN;
BEGIN
  FOR rename IN
    SELECT * FROM (VALUES
      ('place_admin_location_exceptions_release_status_idx', 'place_administrative_location_exceptions_dataset_release_id_idx', 'place_administrative_location_exceptions', 'CREATE INDEX place_admin_location_exceptions_release_status_idx ON public.place_administrative_location_exceptions USING btree (dataset_release_id, status)', 'CREATE INDEX place_administrative_location_exceptions_dataset_release_id_idx ON public.place_administrative_location_exceptions USING btree (dataset_release_id, status)', false, false),
      ('place_administrative_location_e_place_id_dataset_release_id_key', 'place_administrative_location_exceptions_place_id_dataset_r_key', 'place_administrative_location_exceptions', 'CREATE UNIQUE INDEX place_administrative_location_e_place_id_dataset_release_id_key ON public.place_administrative_location_exceptions USING btree (place_id, dataset_release_id)', 'CREATE UNIQUE INDEX place_administrative_location_exceptions_place_id_dataset_r_key ON public.place_administrative_location_exceptions USING btree (place_id, dataset_release_id)', true, true),
      ('province_records_release_active_idx', 'province_dataset_records_dataset_release_id_is_active_idx', 'province_dataset_records', 'CREATE INDEX province_records_release_active_idx ON public.province_dataset_records USING btree (dataset_release_id, is_active)', 'CREATE INDEX province_dataset_records_dataset_release_id_is_active_idx ON public.province_dataset_records USING btree (dataset_release_id, is_active)', false, false)
    ) AS renames(old_name, new_name, table_name, old_definition, target_definition, old_constraint_backed, target_constraint_backing_allowed)
  LOOP
    historical_index_oid := NULL;
    target_index_oid := NULL;
    SELECT
      index_relation.oid,
      table_relation.relname,
      pg_get_indexdef(index_relation.oid),
      catalog_index.indisvalid,
      catalog_index.indisready,
      catalog_index.indislive,
      COALESCE(
        index_relation.relkind = 'i'
        AND catalog_index.indimmediate
        AND NOT catalog_index.indisprimary
        AND NOT catalog_index.indisexclusion
        AND NOT COALESCE((to_jsonb(catalog_index)->>'indnullsnotdistinct')::BOOLEAN, false)
        AND catalog_index.indnkeyatts = catalog_index.indnatts
        AND catalog_index.indpred IS NULL
        AND catalog_index.indexprs IS NULL
        AND (SELECT COUNT(*) FROM pg_constraint constraint_backing
             WHERE constraint_backing.conindid = index_relation.oid)
            = CASE WHEN rename.old_constraint_backed THEN 1 ELSE 0 END
        AND NOT EXISTS (
          SELECT 1 FROM pg_constraint constraint_backing
          WHERE constraint_backing.conindid = index_relation.oid
            AND (constraint_backing.contype <> 'u'
                 OR constraint_backing.condeferrable
                 OR constraint_backing.condeferred
                 OR NOT constraint_backing.convalidated)
        )
        AND NOT EXISTS (
          SELECT 1
          FROM unnest(catalog_index.indclass) AS index_class(operator_class_oid)
          JOIN pg_opclass operator_class ON operator_class.oid = index_class.operator_class_oid
          WHERE NOT operator_class.opcdefault
        )
        AND NOT EXISTS (
          SELECT 1 FROM unnest(catalog_index.indoption) AS index_option(option_value)
          WHERE index_option.option_value <> 0
        )
        AND NOT EXISTS (
          SELECT 1
          FROM unnest(catalog_index.indkey::SMALLINT[], catalog_index.indcollation::OID[])
            AS key_semantics(attnum, collation_oid)
          JOIN pg_attribute attribute
            ON attribute.attrelid = catalog_index.indrelid
           AND attribute.attnum = key_semantics.attnum
          WHERE key_semantics.collation_oid <> attribute.attcollation
        ),
        false
      )
    INTO
      historical_index_oid,
      historical_table_name,
      historical_definition,
      historical_is_valid,
      historical_is_ready,
      historical_is_live,
      historical_material_is_compatible
    FROM pg_class index_relation
    JOIN pg_namespace namespace ON namespace.oid = index_relation.relnamespace
    LEFT JOIN pg_index catalog_index ON catalog_index.indexrelid = index_relation.oid
    LEFT JOIN pg_class table_relation ON table_relation.oid = catalog_index.indrelid
    WHERE namespace.nspname = 'public'
      AND index_relation.relname = rename.old_name;

    SELECT
      index_relation.oid,
      table_relation.relname,
      pg_get_indexdef(index_relation.oid),
      catalog_index.indisvalid,
      catalog_index.indisready,
      catalog_index.indislive,
      COALESCE(
        index_relation.relkind = 'i'
        AND catalog_index.indimmediate
        AND NOT catalog_index.indisprimary
        AND NOT catalog_index.indisexclusion
        AND NOT COALESCE((to_jsonb(catalog_index)->>'indnullsnotdistinct')::BOOLEAN, false)
        AND catalog_index.indnkeyatts = catalog_index.indnatts
        AND catalog_index.indpred IS NULL
        AND catalog_index.indexprs IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM pg_constraint constraint_backing
          WHERE constraint_backing.conindid = index_relation.oid
            AND (NOT rename.target_constraint_backing_allowed
                 OR constraint_backing.contype <> 'u'
                 OR constraint_backing.condeferrable
                 OR constraint_backing.condeferred
                 OR NOT constraint_backing.convalidated)
        )
        AND (SELECT COUNT(*) FROM pg_constraint constraint_backing
             WHERE constraint_backing.conindid = index_relation.oid) <= 1
        AND NOT EXISTS (
          SELECT 1
          FROM unnest(catalog_index.indclass) AS index_class(operator_class_oid)
          JOIN pg_opclass operator_class ON operator_class.oid = index_class.operator_class_oid
          WHERE NOT operator_class.opcdefault
        )
        AND NOT EXISTS (
          SELECT 1 FROM unnest(catalog_index.indoption) AS index_option(option_value)
          WHERE index_option.option_value <> 0
        )
        AND NOT EXISTS (
          SELECT 1
          FROM unnest(catalog_index.indkey::SMALLINT[], catalog_index.indcollation::OID[])
            AS key_semantics(attnum, collation_oid)
          JOIN pg_attribute attribute
            ON attribute.attrelid = catalog_index.indrelid
           AND attribute.attnum = key_semantics.attnum
          WHERE key_semantics.collation_oid <> attribute.attcollation
        ),
        false
      )
    INTO
      target_index_oid,
      target_table_name,
      target_definition,
      target_is_valid,
      target_is_ready,
      target_is_live,
      target_material_is_compatible
    FROM pg_class index_relation
    JOIN pg_namespace namespace ON namespace.oid = index_relation.relnamespace
    LEFT JOIN pg_index catalog_index ON catalog_index.indexrelid = index_relation.oid
    LEFT JOIN pg_class table_relation ON table_relation.oid = catalog_index.indrelid
    WHERE namespace.nspname = 'public'
      AND index_relation.relname = rename.new_name;

    IF historical_index_oid IS NOT NULL AND target_index_oid IS NOT NULL THEN
      RAISE EXCEPTION 'Both historical index % and target % exist', rename.old_name, rename.new_name;
    ELSIF historical_index_oid IS NOT NULL THEN
      IF NOT COALESCE(historical_is_valid, false)
         OR NOT COALESCE(historical_is_ready, false)
         OR NOT COALESCE(historical_is_live, false) THEN
        RAISE EXCEPTION 'Historical index % is unhealthy', rename.old_name;
      END IF;
      IF historical_table_name IS DISTINCT FROM rename.table_name
         OR historical_definition IS DISTINCT FROM rename.old_definition
         OR NOT historical_material_is_compatible THEN
        RAISE EXCEPTION 'Historical index % is incompatible: expected %, found %',
          rename.old_name, rename.old_definition, historical_definition;
      END IF;
      EXECUTE format('ALTER INDEX public.%I RENAME TO %I', rename.old_name, rename.new_name);
    ELSIF target_index_oid IS NOT NULL THEN
      IF NOT COALESCE(target_is_valid, false)
         OR NOT COALESCE(target_is_ready, false)
         OR NOT COALESCE(target_is_live, false) THEN
        RAISE EXCEPTION 'Historical target index % is unhealthy', rename.new_name;
      END IF;
      IF target_table_name IS DISTINCT FROM rename.table_name
         OR target_definition IS DISTINCT FROM rename.target_definition
         OR NOT target_material_is_compatible THEN
        RAISE EXCEPTION 'Historical target index % is incompatible: expected %, found %',
          rename.new_name, rename.target_definition, target_definition;
      END IF;
    ELSE
      RAISE EXCEPTION 'Historical index % and target % are both missing', rename.old_name, rename.new_name;
    END IF;
  END LOOP;
END $$;

COMMIT;
