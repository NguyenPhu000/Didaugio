BEGIN;

-- These ledger tables are append-only financial evidence. Refuse a same-name
-- non-table instead of silently targeting an unrelated object.
DO $$
BEGIN
  IF to_regclass('public.payment_receipts') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_class WHERE oid = to_regclass('public.payment_receipts') AND relkind = 'r'
  ) THEN
    RAISE EXCEPTION 'payment_receipts exists but is not a table';
  END IF;
  IF to_regclass('public.refund_attempts') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_class WHERE oid = to_regclass('public.refund_attempts') AND relkind = 'r'
  ) THEN
    RAISE EXCEPTION 'refund_attempts exists but is not a table';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "payment_receipts" (
  "id" SERIAL NOT NULL,
  "payment_id" INTEGER NOT NULL,
  "source" TEXT NOT NULL,
  "gateway" TEXT,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'VND',
  "external_transaction_id" TEXT,
  "idempotency_key" TEXT NOT NULL,
  "actor_user_id" INTEGER,
  "status" TEXT NOT NULL,
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "payment_receipts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_receipts_amount_positive_check" CHECK ("amount" > 0),
  CONSTRAINT "payment_receipts_currency_uppercase_check" CHECK (btrim("currency") <> '' AND "currency" = upper("currency")),
  CONSTRAINT "payment_receipts_source_nonblank_check" CHECK (btrim("source") <> ''),
  CONSTRAINT "payment_receipts_status_check" CHECK ("status" IN ('pending', 'succeeded', 'failed')),
  CONSTRAINT "payment_receipts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "payment_receipts_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "refund_attempts" (
  "id" SERIAL NOT NULL,
  "payment_id" INTEGER NOT NULL,
  "source" TEXT NOT NULL,
  "gateway" TEXT,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'VND',
  "external_refund_id" TEXT,
  "idempotency_key" TEXT NOT NULL,
  "actor_user_id" INTEGER,
  "status" TEXT NOT NULL,
  "reason" TEXT,
  "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "metadata" JSONB,
  CONSTRAINT "refund_attempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "refund_attempts_amount_positive_check" CHECK ("amount" > 0),
  CONSTRAINT "refund_attempts_currency_uppercase_check" CHECK (btrim("currency") <> '' AND "currency" = upper("currency")),
  CONSTRAINT "refund_attempts_source_nonblank_check" CHECK (btrim("source") <> ''),
  CONSTRAINT "refund_attempts_status_check" CHECK ("status" IN ('pending', 'succeeded', 'failed')),
  CONSTRAINT "refund_attempts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "refund_attempts_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Catalog guards make an interrupted/manual fixture rerun safe, but never accept
-- an index or FK whose name has been re-used for a different invariant.
DO $$
DECLARE
  expected RECORD;
  actual TEXT;
BEGIN
  FOR expected IN
    SELECT * FROM (VALUES
      ('payment_receipts', 'payment_receipts_payment_id_fkey', 'FOREIGN KEY \(payment_id\) REFERENCES payments\(id\)', 'ON DELETE CASCADE', 'ON UPDATE CASCADE', 'ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('payment_receipts', 'payment_receipts_actor_user_id_fkey', 'FOREIGN KEY \(actor_user_id\) REFERENCES users\(id\)', 'ON DELETE SET NULL', 'ON UPDATE CASCADE', 'ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('refund_attempts', 'refund_attempts_payment_id_fkey', 'FOREIGN KEY \(payment_id\) REFERENCES payments\(id\)', 'ON DELETE CASCADE', 'ON UPDATE CASCADE', 'ALTER TABLE "refund_attempts" ADD CONSTRAINT "refund_attempts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('refund_attempts', 'refund_attempts_actor_user_id_fkey', 'FOREIGN KEY \(actor_user_id\) REFERENCES users\(id\)', 'ON DELETE SET NULL', 'ON UPDATE CASCADE', 'ALTER TABLE "refund_attempts" ADD CONSTRAINT "refund_attempts_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE')
    ) AS values_table(table_name, constraint_name, required_pattern, required_delete_action, required_update_action, add_sql)
  LOOP
    SELECT pg_get_constraintdef(c.oid) INTO actual
    FROM pg_constraint c
    WHERE c.conrelid = format('public.%I', expected.table_name)::regclass
      AND c.conname = expected.constraint_name;
    IF actual IS NULL THEN
      EXECUTE expected.add_sql;
    ELSIF actual !~ expected.required_pattern
       OR actual !~ expected.required_delete_action
       OR actual !~ expected.required_update_action THEN
      RAISE EXCEPTION 'same-name foreign key % has incompatible definition: %', expected.constraint_name, actual;
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE
  expected RECORD;
  actual TEXT;
BEGIN
  FOR expected IN
    SELECT * FROM (VALUES
      ('payment_receipts_idempotency_key_key', 'CREATE UNIQUE INDEX "payment_receipts_idempotency_key_key" ON "payment_receipts" ("idempotency_key")', 'UNIQUE INDEX .*payment_receipts.*\(idempotency_key\)'),
      ('payment_receipts_gateway_external_transaction_id_key', 'CREATE UNIQUE INDEX "payment_receipts_gateway_external_transaction_id_key" ON "payment_receipts" ("gateway", "external_transaction_id")', 'UNIQUE INDEX .*payment_receipts.*\(gateway, external_transaction_id\)'),
      ('payment_receipts_payment_id_status_idx', 'CREATE INDEX "payment_receipts_payment_id_status_idx" ON "payment_receipts" ("payment_id", "status")', 'INDEX .*payment_receipts.*\(payment_id, status\)'),
      ('refund_attempts_idempotency_key_key', 'CREATE UNIQUE INDEX "refund_attempts_idempotency_key_key" ON "refund_attempts" ("idempotency_key")', 'UNIQUE INDEX .*refund_attempts.*\(idempotency_key\)'),
      ('refund_attempts_gateway_external_refund_id_key', 'CREATE UNIQUE INDEX "refund_attempts_gateway_external_refund_id_key" ON "refund_attempts" ("gateway", "external_refund_id")', 'UNIQUE INDEX .*refund_attempts.*\(gateway, external_refund_id\)'),
      ('refund_attempts_payment_id_status_idx', 'CREATE INDEX "refund_attempts_payment_id_status_idx" ON "refund_attempts" ("payment_id", "status")', 'INDEX .*refund_attempts.*\(payment_id, status\)')
    ) AS values_table(index_name, create_sql, required_pattern)
  LOOP
    SELECT pg_get_indexdef(i.indexrelid) INTO actual
    FROM pg_index i
    JOIN pg_class index_relation ON index_relation.oid = i.indexrelid
    WHERE index_relation.relnamespace = 'public'::regnamespace
      AND index_relation.relname = expected.index_name;
    IF actual IS NULL THEN
      EXECUTE expected.create_sql;
    ELSIF actual !~ expected.required_pattern THEN
      RAISE EXCEPTION 'same-name index % has incompatible definition: %', expected.index_name, actual;
    END IF;
  END LOOP;
END $$;

-- Stop before writing ledger evidence if legacy rows cannot be represented
-- faithfully. Payment.amount is the historical collected amount until after this
-- preflight and receipt backfill complete.
DO $$
DECLARE
  unsafe_ids TEXT;
BEGIN
  SELECT string_agg(p."id"::TEXT, ', ' ORDER BY p."id") INTO unsafe_ids
  FROM "payments" p
  LEFT JOIN "bookings" b ON b."id" = p."booking_id"
  WHERE b."id" IS NULL
     OR p."amount" IS NULL OR p."amount" <= 0
     OR b."final_price" IS NULL OR b."final_price" <= 0
     OR p."amount" > b."final_price"
     OR (p."refund_amount" IS NOT NULL AND (p."refund_amount" < 0 OR p."refund_amount" > p."amount"))
     OR btrim(COALESCE(p."currency", '')) = '';
  IF unsafe_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Unsafe payment receipt/refund backfill for payment ids: %', unsafe_ids;
  END IF;

  SELECT string_agg(duplicate_ids, '; ' ORDER BY duplicate_ids) INTO unsafe_ids
  FROM (
    SELECT string_agg(p."id"::TEXT, ', ' ORDER BY p."id") AS duplicate_ids
    FROM "payments" p
    WHERE p."transaction_id" IS NOT NULL
      AND (p."status" IN ('paid', 'partially_refunded', 'fully_refunded'))
    GROUP BY CASE lower(p."payment_method")
      WHEN 'vnpay' THEN 'VNPAY' WHEN 'momo' THEN 'MOMO'
      WHEN 'sepay' THEN 'SEPAY' WHEN 'sepay_qr' THEN 'SEPAY' ELSE NULL END,
      p."transaction_id"
    HAVING COUNT(*) > 1
  ) duplicates;
  IF unsafe_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Duplicate legacy gateway transaction identifiers for payment ids: %', unsafe_ids;
  END IF;
END $$;

INSERT INTO "payment_receipts" (
  "payment_id", "source", "gateway", "amount", "currency",
  "external_transaction_id", "idempotency_key", "status", "received_at", "metadata"
)
SELECT
  p."id",
  'legacy',
  CASE lower(p."payment_method")
    WHEN 'vnpay' THEN 'VNPAY' WHEN 'momo' THEN 'MOMO'
    WHEN 'sepay' THEN 'SEPAY' WHEN 'sepay_qr' THEN 'SEPAY' ELSE NULL END,
  p."amount",
  upper(btrim(p."currency")),
  p."transaction_id",
  'legacy_payment_' || p."id",
  'succeeded',
  COALESCE(p."paid_at", p."updated_at", p."created_at"),
  jsonb_build_object('backfill', true, 'legacy_payment_status', p."status")
FROM "payments" p
JOIN "bookings" b ON b."id" = p."booking_id"
WHERE p."status" IN ('paid', 'partially_refunded', 'fully_refunded')
   OR b."payment_status" IN ('paid', 'partially_refunded', 'fully_refunded')
ON CONFLICT ("idempotency_key") DO NOTHING;

-- From this point forward amount is the booking obligation. Historical collection
-- remains in the immutable receipt inserted above, never overwritten.
UPDATE "payments" p
SET "amount" = b."final_price",
    "currency" = upper(btrim(p."currency"))
FROM "bookings" b
WHERE b."id" = p."booking_id";

DO $$
DECLARE
  unsafe_ids TEXT;
BEGIN
  SELECT string_agg(p."id"::TEXT, ', ' ORDER BY p."id") INTO unsafe_ids
  FROM "payments" p
  JOIN "payment_receipts" r ON r."payment_id" = p."id" AND r."status" = 'succeeded'
  WHERE p."refund_amount" IS NOT NULL AND p."refund_amount" > 0
  GROUP BY p."id", p."refund_amount"
  HAVING p."refund_amount" > SUM(r."amount");
  IF unsafe_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Historical refund exceeds preserved succeeded receipts for payment ids: %', unsafe_ids;
  END IF;
END $$;

INSERT INTO "refund_attempts" (
  "payment_id", "source", "gateway", "amount", "currency",
  "idempotency_key", "status", "requested_at", "completed_at", "metadata"
)
SELECT
  p."id",
  'legacy',
  CASE lower(p."payment_method")
    WHEN 'vnpay' THEN 'VNPAY' WHEN 'momo' THEN 'MOMO'
    WHEN 'sepay' THEN 'SEPAY' WHEN 'sepay_qr' THEN 'SEPAY' ELSE NULL END,
  p."refund_amount",
  p."currency",
  'legacy_refund_' || p."id",
  'succeeded',
  COALESCE(p."refunded_at", p."updated_at"),
  COALESCE(p."refunded_at", p."updated_at"),
  jsonb_build_object('backfill', true, 'legacy_refund_amount', p."refund_amount")
FROM "payments" p
WHERE p."refund_amount" IS NOT NULL AND p."refund_amount" > 0
ON CONFLICT ("idempotency_key") DO NOTHING;

-- Legacy payment/refund status is a compatibility projection only; receipt and
-- refund-attempt sums are the canonical evidence used by later transitions.
UPDATE "payments" p
SET "status" = CASE
  WHEN COALESCE((SELECT SUM(r."amount") FROM "refund_attempts" r WHERE r."payment_id" = p."id" AND r."status" = 'succeeded'), 0)
       >= COALESCE((SELECT SUM(r."amount") FROM "payment_receipts" r WHERE r."payment_id" = p."id" AND r."status" = 'succeeded'), 0)
       AND COALESCE((SELECT SUM(r."amount") FROM "refund_attempts" r WHERE r."payment_id" = p."id" AND r."status" = 'succeeded'), 0) > 0 THEN 'fully_refunded'
  WHEN COALESCE((SELECT SUM(r."amount") FROM "refund_attempts" r WHERE r."payment_id" = p."id" AND r."status" = 'succeeded'), 0) > 0 THEN 'partially_refunded'
  WHEN COALESCE((SELECT SUM(r."amount") FROM "payment_receipts" r WHERE r."payment_id" = p."id" AND r."status" = 'succeeded'), 0) = p."amount" THEN 'paid'
  WHEN COALESCE((SELECT SUM(r."amount") FROM "payment_receipts" r WHERE r."payment_id" = p."id" AND r."status" = 'succeeded'), 0) > 0 THEN 'partially_paid'
  ELSE 'unpaid'
END;

COMMIT;
