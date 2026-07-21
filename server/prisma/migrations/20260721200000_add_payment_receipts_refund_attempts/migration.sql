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

-- CREATE TABLE IF NOT EXISTS is not a structure validator. Validate every
-- required column before adding or trusting any same-name constraints/indexes.
DO $$
DECLARE
  expected RECORD;
  actual_type TEXT;
  actual_not_null BOOLEAN;
  actual_default TEXT;
BEGIN
  FOR expected IN
    SELECT * FROM (VALUES
      ('payment_receipts', 'id', 'integer', true, '^nextval\(''payment_receipts_id_seq''::regclass\)$'),
      ('payment_receipts', 'payment_id', 'integer', true, '^$'),
      ('payment_receipts', 'source', 'text', true, '^$'),
      ('payment_receipts', 'gateway', 'text', false, '^$'),
      ('payment_receipts', 'amount', 'integer', true, '^$'),
      ('payment_receipts', 'currency', 'text', true, '^''VND''::text$'),
      ('payment_receipts', 'external_transaction_id', 'text', false, '^$'),
      ('payment_receipts', 'idempotency_key', 'text', true, '^$'),
      ('payment_receipts', 'actor_user_id', 'integer', false, '^$'),
      ('payment_receipts', 'status', 'text', true, '^$'),
      ('payment_receipts', 'received_at', 'timestamp(3) without time zone', true, '^CURRENT_TIMESTAMP$'),
      ('payment_receipts', 'metadata', 'jsonb', false, '^$'),
      ('refund_attempts', 'id', 'integer', true, '^nextval\(''refund_attempts_id_seq''::regclass\)$'),
      ('refund_attempts', 'payment_id', 'integer', true, '^$'),
      ('refund_attempts', 'source', 'text', true, '^$'),
      ('refund_attempts', 'gateway', 'text', false, '^$'),
      ('refund_attempts', 'amount', 'integer', true, '^$'),
      ('refund_attempts', 'currency', 'text', true, '^''VND''::text$'),
      ('refund_attempts', 'external_refund_id', 'text', false, '^$'),
      ('refund_attempts', 'idempotency_key', 'text', true, '^$'),
      ('refund_attempts', 'actor_user_id', 'integer', false, '^$'),
      ('refund_attempts', 'status', 'text', true, '^$'),
      ('refund_attempts', 'reason', 'text', false, '^$'),
      ('refund_attempts', 'requested_at', 'timestamp(3) without time zone', true, '^CURRENT_TIMESTAMP$'),
      ('refund_attempts', 'completed_at', 'timestamp(3) without time zone', false, '^$'),
      ('refund_attempts', 'metadata', 'jsonb', false, '^$')
    ) AS values_table(table_name, column_name, data_type, is_not_null, default_pattern)
  LOOP
    SELECT format_type(a.atttypid, a.atttypmod), a.attnotnull,
           COALESCE(pg_get_expr(d.adbin, d.adrelid), '')
      INTO actual_type, actual_not_null, actual_default
    FROM pg_attribute a
    LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
    WHERE a.attrelid = format('public.%I', expected.table_name)::regclass
      AND a.attname = expected.column_name
      AND a.attnum > 0 AND NOT a.attisdropped;

    IF actual_type IS NULL
       OR actual_type <> expected.data_type
       OR actual_not_null IS DISTINCT FROM expected.is_not_null
       OR actual_default !~ expected.default_pattern THEN
      RAISE EXCEPTION 'incompatible % table structure at column % (type %, not-null %, default %)',
        expected.table_name, expected.column_name, actual_type, actual_not_null, actual_default;
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE
  expected RECORD;
  actual RECORD;
  expected_type "char";
BEGIN
  FOR expected IN
    SELECT * FROM (VALUES
      ('payment_receipts', 'payment_receipts_pkey', '^PRIMARY KEY \(id\)$', 'ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_pkey" PRIMARY KEY ("id")'),
      ('payment_receipts', 'payment_receipts_amount_positive_check', '^CHECK \(\(amount > 0\)\)$', 'ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_amount_positive_check" CHECK ("amount" > 0)'),
      ('payment_receipts', 'payment_receipts_currency_uppercase_check', '^CHECK \(\(\(btrim\(currency\) <> ''''::text\) AND \(currency = upper\(currency\)\)\)\)$', 'ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_currency_uppercase_check" CHECK (btrim("currency") <> '''' AND "currency" = upper("currency"))'),
      ('payment_receipts', 'payment_receipts_source_nonblank_check', '^CHECK \(\(btrim\(source\) <> ''''::text\)\)$', 'ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_source_nonblank_check" CHECK (btrim("source") <> '''')'),
      ('payment_receipts', 'payment_receipts_status_check', '^CHECK \(\(status = ANY \(ARRAY\[''pending''::text, ''succeeded''::text, ''failed''::text\]\)\)\)$', 'ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_status_check" CHECK ("status" IN (''pending'', ''succeeded'', ''failed''))'),
      ('refund_attempts', 'refund_attempts_pkey', '^PRIMARY KEY \(id\)$', 'ALTER TABLE "refund_attempts" ADD CONSTRAINT "refund_attempts_pkey" PRIMARY KEY ("id")'),
      ('refund_attempts', 'refund_attempts_amount_positive_check', '^CHECK \(\(amount > 0\)\)$', 'ALTER TABLE "refund_attempts" ADD CONSTRAINT "refund_attempts_amount_positive_check" CHECK ("amount" > 0)'),
      ('refund_attempts', 'refund_attempts_currency_uppercase_check', '^CHECK \(\(\(btrim\(currency\) <> ''''::text\) AND \(currency = upper\(currency\)\)\)\)$', 'ALTER TABLE "refund_attempts" ADD CONSTRAINT "refund_attempts_currency_uppercase_check" CHECK (btrim("currency") <> '''' AND "currency" = upper("currency"))'),
      ('refund_attempts', 'refund_attempts_source_nonblank_check', '^CHECK \(\(btrim\(source\) <> ''''::text\)\)$', 'ALTER TABLE "refund_attempts" ADD CONSTRAINT "refund_attempts_source_nonblank_check" CHECK (btrim("source") <> '''')'),
      ('refund_attempts', 'refund_attempts_status_check', '^CHECK \(\(status = ANY \(ARRAY\[''pending''::text, ''succeeded''::text, ''failed''::text\]\)\)\)$', 'ALTER TABLE "refund_attempts" ADD CONSTRAINT "refund_attempts_status_check" CHECK ("status" IN (''pending'', ''succeeded'', ''failed''))')
    ) AS values_table(table_name, constraint_name, required_pattern, add_sql)
  LOOP
    expected_type := CASE WHEN expected.constraint_name LIKE '%_pkey' THEN 'p' ELSE 'c' END;
    SELECT c.oid, c.contype, c.convalidated, c.condeferrable, c.condeferred,
           pg_get_constraintdef(c.oid) AS definition,
           CASE WHEN c.conindid = 0 THEN true ELSE COALESCE((
             SELECT i.indisunique AND i.indisvalid AND i.indisready AND i.indislive
             FROM pg_index i WHERE i.indexrelid = c.conindid
           ), false) END AS supporting_index_healthy
      INTO actual
    FROM pg_constraint c
    WHERE c.conrelid = format('public.%I', expected.table_name)::regclass
      AND c.conname = expected.constraint_name;
    IF actual.oid IS NULL THEN
      EXECUTE expected.add_sql;
    ELSIF actual.definition !~ expected.required_pattern
       OR actual.contype <> expected_type
       OR NOT actual.convalidated OR actual.condeferrable OR actual.condeferred
       OR NOT actual.supporting_index_healthy THEN
      RAISE EXCEPTION 'same-name constraint % has incompatible definition: %', expected.constraint_name, actual.definition;
    END IF;
  END LOOP;
END $$;

-- Catalog guards make an interrupted/manual fixture rerun safe, but never accept
-- an index or FK whose name has been re-used for a different invariant.
DO $$
DECLARE
  expected RECORD;
  actual RECORD;
  source_key SMALLINT;
  target_key SMALLINT;
BEGIN
  FOR expected IN
    SELECT * FROM (VALUES
      ('payment_receipts', 'payment_receipts_payment_id_fkey', 'payment_id', 'payments', 'id', 'c', 'ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('payment_receipts', 'payment_receipts_actor_user_id_fkey', 'actor_user_id', 'users', 'id', 'n', 'ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('refund_attempts', 'refund_attempts_payment_id_fkey', 'payment_id', 'payments', 'id', 'c', 'ALTER TABLE "refund_attempts" ADD CONSTRAINT "refund_attempts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('refund_attempts', 'refund_attempts_actor_user_id_fkey', 'actor_user_id', 'users', 'id', 'n', 'ALTER TABLE "refund_attempts" ADD CONSTRAINT "refund_attempts_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE')
    ) AS values_table(table_name, constraint_name, source_column, target_table, target_column, delete_action, add_sql)
  LOOP
    SELECT attnum INTO source_key FROM pg_attribute
    WHERE attrelid = format('public.%I', expected.table_name)::regclass
      AND attname = expected.source_column;
    SELECT attnum INTO target_key FROM pg_attribute
    WHERE attrelid = format('public.%I', expected.target_table)::regclass
      AND attname = expected.target_column;

    SELECT c.oid, c.contype, c.confrelid, c.conkey::SMALLINT[] AS source_keys,
           c.confkey::SMALLINT[] AS target_keys, c.confupdtype, c.confdeltype,
           c.confmatchtype, c.condeferrable, c.condeferred, c.convalidated,
           pg_get_constraintdef(c.oid) AS definition
      INTO actual
    FROM pg_constraint c
    WHERE c.conrelid = format('public.%I', expected.table_name)::regclass
      AND c.conname = expected.constraint_name;
    IF actual.oid IS NULL THEN
      EXECUTE expected.add_sql;
    ELSIF actual.contype <> 'f'
       OR actual.confrelid <> format('public.%I', expected.target_table)::regclass
       OR actual.source_keys <> ARRAY[source_key]::SMALLINT[]
       OR actual.target_keys <> ARRAY[target_key]::SMALLINT[]
       OR actual.confupdtype <> 'c'
       OR actual.confdeltype <> expected.delete_action
       OR actual.confmatchtype <> 's'
       OR actual.condeferrable OR actual.condeferred OR NOT actual.convalidated THEN
      RAISE EXCEPTION 'same-name foreign key % has incompatible definition: %', expected.constraint_name, actual.definition;
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE
  expected RECORD;
  actual RECORD;
  expected_keys SMALLINT[];
  expected_key_count INTEGER;
BEGIN
  FOR expected IN
    SELECT * FROM (VALUES
      ('payment_receipts', 'payment_receipts_idempotency_key_key', true, 'idempotency_key', NULL, 'CREATE UNIQUE INDEX "payment_receipts_idempotency_key_key" ON "payment_receipts" ("idempotency_key")'),
      ('payment_receipts', 'payment_receipts_gateway_external_transaction_id_key', true, 'gateway', 'external_transaction_id', 'CREATE UNIQUE INDEX "payment_receipts_gateway_external_transaction_id_key" ON "payment_receipts" ("gateway", "external_transaction_id")'),
      ('payment_receipts', 'payment_receipts_payment_id_status_idx', false, 'payment_id', 'status', 'CREATE INDEX "payment_receipts_payment_id_status_idx" ON "payment_receipts" ("payment_id", "status")'),
      ('refund_attempts', 'refund_attempts_idempotency_key_key', true, 'idempotency_key', NULL, 'CREATE UNIQUE INDEX "refund_attempts_idempotency_key_key" ON "refund_attempts" ("idempotency_key")'),
      ('refund_attempts', 'refund_attempts_gateway_external_refund_id_key', true, 'gateway', 'external_refund_id', 'CREATE UNIQUE INDEX "refund_attempts_gateway_external_refund_id_key" ON "refund_attempts" ("gateway", "external_refund_id")'),
      ('refund_attempts', 'refund_attempts_payment_id_status_idx', false, 'payment_id', 'status', 'CREATE INDEX "refund_attempts_payment_id_status_idx" ON "refund_attempts" ("payment_id", "status")')
    ) AS values_table(table_name, index_name, is_unique, first_column, second_column, create_sql)
  LOOP
    expected_key_count := CASE WHEN expected.second_column IS NULL THEN 1 ELSE 2 END;
    SELECT array_agg(a.attnum ORDER BY names.ordinality)::SMALLINT[] INTO expected_keys
    FROM unnest(ARRAY[expected.first_column, expected.second_column]) WITH ORDINALITY AS names(column_name, ordinality)
    JOIN pg_attribute a
      ON a.attrelid = format('public.%I', expected.table_name)::regclass
     AND a.attname = names.column_name
    WHERE names.column_name IS NOT NULL;

    SELECT i.indexrelid, i.indrelid, i.indisunique, i.indisvalid, i.indisready,
           i.indislive, i.indnkeyatts, i.indnatts,
           ARRAY(SELECT unnest(i.indkey::SMALLINT[])) AS keys,
           i.indpred, i.indexprs, am.amname, pg_get_indexdef(i.indexrelid) AS definition
      INTO actual
    FROM pg_index i
    JOIN pg_class index_relation ON index_relation.oid = i.indexrelid
    JOIN pg_class indexed_relation ON indexed_relation.oid = i.indrelid
    JOIN pg_am am ON am.oid = index_relation.relam
    WHERE index_relation.relnamespace = 'public'::regnamespace
      AND index_relation.relname = expected.index_name;
    IF actual.indexrelid IS NULL THEN
      EXECUTE expected.create_sql;
    ELSIF actual.indrelid <> format('public.%I', expected.table_name)::regclass
       OR actual.indisunique IS DISTINCT FROM expected.is_unique
       OR NOT actual.indisvalid OR NOT actual.indisready OR NOT actual.indislive
       OR actual.indnkeyatts <> expected_key_count
       OR actual.indnatts <> expected_key_count
       OR actual.keys <> expected_keys
       OR actual.indpred IS NOT NULL OR actual.indexprs IS NOT NULL OR actual.amname <> 'btree' THEN
      RAISE EXCEPTION 'same-name index % has incompatible definition: %', expected.index_name, actual.definition;
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

-- A deterministic idempotency key is evidence, not permission to ignore a
-- conflicting row. Validate any preseeded/rerun receipt before ON CONFLICT.
DO $$
DECLARE
  conflict_ids TEXT;
BEGIN
  SELECT string_agg(p."id"::TEXT, ', ' ORDER BY p."id") INTO conflict_ids
  FROM "payments" p
  JOIN "bookings" b ON b."id" = p."booking_id"
  JOIN "payment_receipts" r ON r."idempotency_key" = 'legacy_payment_' || p."id"
  WHERE NOT (p."status" IN ('paid', 'partially_paid', 'partially_refunded', 'fully_refunded')
             OR b."payment_status" IN ('paid', 'partially_refunded', 'fully_refunded'))
     OR r."payment_id" <> p."id"
     OR r."source" <> 'legacy' OR r."status" <> 'succeeded'
     OR r."currency" <> upper(btrim(p."currency"))
     OR r."gateway" IS DISTINCT FROM CASE lower(p."payment_method")
       WHEN 'vnpay' THEN 'VNPAY' WHEN 'momo' THEN 'MOMO'
       WHEN 'sepay' THEN 'SEPAY' WHEN 'sepay_qr' THEN 'SEPAY' ELSE NULL END
     OR r."external_transaction_id" IS DISTINCT FROM p."transaction_id"
     OR r."actor_user_id" IS NOT NULL
     OR NOT COALESCE(r."metadata" @> '{"backfill":true}'::jsonb, false)
     OR CASE WHEN COALESCE(r."metadata"->>'legacy_payment_amount', '') ~ '^[1-9][0-9]*$'
             THEN (r."metadata"->>'legacy_payment_amount')::NUMERIC ELSE NULL END IS DISTINCT FROM r."amount"::NUMERIC
     OR CASE WHEN p."amount" <> b."final_price" THEN r."amount" <> p."amount"
             ELSE r."amount" > p."amount" END;
  IF conflict_ids IS NOT NULL THEN
    RAISE EXCEPTION 'conflicting deterministic legacy receipt for payment ids: %', conflict_ids;
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
  jsonb_build_object(
    'backfill', true,
    'legacy_payment_status', p."status",
    'legacy_payment_amount', p."amount",
    'obligation_amount', b."final_price"
  )
FROM "payments" p
JOIN "bookings" b ON b."id" = p."booking_id"
WHERE p."status" IN ('paid', 'partially_refunded', 'fully_refunded')
   OR b."payment_status" IN ('paid', 'partially_refunded', 'fully_refunded')
ON CONFLICT ("idempotency_key") DO NOTHING;

DO $$
DECLARE
  conflict_ids TEXT;
BEGIN
  SELECT string_agg(p."id"::TEXT, ', ' ORDER BY p."id") INTO conflict_ids
  FROM "payments" p
  JOIN "bookings" b ON b."id" = p."booking_id"
  JOIN "payment_receipts" r ON r."idempotency_key" = 'legacy_payment_' || p."id"
  WHERE (p."status" IN ('paid', 'partially_paid', 'partially_refunded', 'fully_refunded')
         OR b."payment_status" IN ('paid', 'partially_refunded', 'fully_refunded'))
    AND (r."payment_id" <> p."id"
      OR r."source" <> 'legacy' OR r."status" <> 'succeeded'
      OR r."currency" <> upper(btrim(p."currency"))
      OR r."gateway" IS DISTINCT FROM CASE lower(p."payment_method")
        WHEN 'vnpay' THEN 'VNPAY' WHEN 'momo' THEN 'MOMO'
        WHEN 'sepay' THEN 'SEPAY' WHEN 'sepay_qr' THEN 'SEPAY' ELSE NULL END
      OR r."external_transaction_id" IS DISTINCT FROM p."transaction_id"
      OR r."actor_user_id" IS NOT NULL
      OR NOT COALESCE(r."metadata" @> '{"backfill":true}'::jsonb, false)
      OR CASE WHEN COALESCE(r."metadata"->>'legacy_payment_amount', '') ~ '^[1-9][0-9]*$'
              THEN (r."metadata"->>'legacy_payment_amount')::NUMERIC ELSE NULL END IS DISTINCT FROM r."amount"::NUMERIC
      OR CASE WHEN p."amount" <> b."final_price" THEN r."amount" <> p."amount"
              ELSE r."amount" > p."amount" END);
  IF conflict_ids IS NOT NULL THEN
    RAISE EXCEPTION 'conflicting deterministic legacy receipt after insert for payment ids: %', conflict_ids;
  END IF;
END $$;

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
  SELECT string_agg(excess."payment_id"::TEXT, ', ' ORDER BY excess."payment_id") INTO unsafe_ids
  FROM (
    SELECT r."payment_id"
    FROM "payment_receipts" r
    JOIN "payments" p ON p."id" = r."payment_id"
    WHERE r."status" = 'succeeded'
    GROUP BY r."payment_id", p."amount"
    HAVING SUM(r."amount") > p."amount"
  ) excess;
  IF unsafe_ids IS NOT NULL THEN
    RAISE EXCEPTION 'succeeded receipts exceed payment obligation for payment ids: %', unsafe_ids;
  END IF;

  SELECT string_agg(excess."payment_id"::TEXT, ', ' ORDER BY excess."payment_id") INTO unsafe_ids
  FROM (
    SELECT refunds."payment_id"
    FROM (
      SELECT "payment_id", SUM("amount") AS total FROM "refund_attempts"
      WHERE "status" = 'succeeded' GROUP BY "payment_id"
    ) refunds
    LEFT JOIN (
      SELECT "payment_id", SUM("amount") AS total FROM "payment_receipts"
      WHERE "status" = 'succeeded' GROUP BY "payment_id"
    ) receipts ON receipts."payment_id" = refunds."payment_id"
    WHERE refunds.total > COALESCE(receipts.total, 0)
  ) excess;
  IF unsafe_ids IS NOT NULL THEN
    RAISE EXCEPTION 'succeeded refunds exceed succeeded receipts for payment ids: %', unsafe_ids;
  END IF;
END $$;

DO $$
DECLARE
  unsafe_ids TEXT;
BEGIN
  SELECT string_agg(refund_gap."id"::TEXT, ', ' ORDER BY refund_gap."id") INTO unsafe_ids
  FROM (
    SELECT p."id"
    FROM "payments" p
    LEFT JOIN "payment_receipts" r
      ON r."payment_id" = p."id" AND r."status" = 'succeeded'
    WHERE p."refund_amount" IS NOT NULL AND p."refund_amount" > 0
    GROUP BY p."id", p."refund_amount"
    HAVING COALESCE(SUM(r."amount"), 0) < p."refund_amount"
  ) refund_gap;
  IF unsafe_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Historical refund exceeds preserved succeeded receipts for payment ids: %', unsafe_ids;
  END IF;
END $$;

DO $$
DECLARE
  conflict_ids TEXT;
BEGIN
  SELECT string_agg(p."id"::TEXT, ', ' ORDER BY p."id") INTO conflict_ids
  FROM "payments" p
  JOIN "refund_attempts" r ON r."idempotency_key" = 'legacy_refund_' || p."id"
  WHERE p."refund_amount" IS NULL OR p."refund_amount" <= 0
     OR r."payment_id" <> p."id" OR r."amount" <> p."refund_amount"
     OR r."source" <> 'legacy' OR r."status" <> 'succeeded'
     OR r."currency" <> p."currency"
     OR r."gateway" IS DISTINCT FROM CASE lower(p."payment_method")
       WHEN 'vnpay' THEN 'VNPAY' WHEN 'momo' THEN 'MOMO'
       WHEN 'sepay' THEN 'SEPAY' WHEN 'sepay_qr' THEN 'SEPAY' ELSE NULL END
     OR r."external_refund_id" IS NOT NULL OR r."actor_user_id" IS NOT NULL
     OR NOT COALESCE(r."metadata" @> '{"backfill":true}'::jsonb, false)
     OR CASE WHEN COALESCE(r."metadata"->>'legacy_refund_amount', '') ~ '^[1-9][0-9]*$'
             THEN (r."metadata"->>'legacy_refund_amount')::NUMERIC ELSE NULL END IS DISTINCT FROM r."amount"::NUMERIC;
  IF conflict_ids IS NOT NULL THEN
    RAISE EXCEPTION 'conflicting deterministic legacy refund for payment ids: %', conflict_ids;
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

DO $$
DECLARE
  conflict_ids TEXT;
  unsafe_ids TEXT;
BEGIN
  SELECT string_agg(p."id"::TEXT, ', ' ORDER BY p."id") INTO conflict_ids
  FROM "payments" p
  JOIN "refund_attempts" r ON r."idempotency_key" = 'legacy_refund_' || p."id"
  WHERE p."refund_amount" IS NOT NULL AND p."refund_amount" > 0
    AND (r."payment_id" <> p."id" OR r."amount" <> p."refund_amount"
      OR r."source" <> 'legacy' OR r."status" <> 'succeeded'
      OR r."currency" <> p."currency"
      OR r."gateway" IS DISTINCT FROM CASE lower(p."payment_method")
        WHEN 'vnpay' THEN 'VNPAY' WHEN 'momo' THEN 'MOMO'
        WHEN 'sepay' THEN 'SEPAY' WHEN 'sepay_qr' THEN 'SEPAY' ELSE NULL END
      OR r."external_refund_id" IS NOT NULL OR r."actor_user_id" IS NOT NULL
      OR NOT COALESCE(r."metadata" @> '{"backfill":true}'::jsonb, false)
      OR CASE WHEN COALESCE(r."metadata"->>'legacy_refund_amount', '') ~ '^[1-9][0-9]*$'
              THEN (r."metadata"->>'legacy_refund_amount')::NUMERIC ELSE NULL END IS DISTINCT FROM r."amount"::NUMERIC);
  IF conflict_ids IS NOT NULL THEN
    RAISE EXCEPTION 'conflicting deterministic legacy refund after insert for payment ids: %', conflict_ids;
  END IF;

  SELECT string_agg(excess."payment_id"::TEXT, ', ' ORDER BY excess."payment_id") INTO unsafe_ids
  FROM (
    SELECT refunds."payment_id"
    FROM (
      SELECT "payment_id", SUM("amount") AS total FROM "refund_attempts"
      WHERE "status" = 'succeeded' GROUP BY "payment_id"
    ) refunds
    LEFT JOIN (
      SELECT "payment_id", SUM("amount") AS total FROM "payment_receipts"
      WHERE "status" = 'succeeded' GROUP BY "payment_id"
    ) receipts ON receipts."payment_id" = refunds."payment_id"
    WHERE refunds.total > COALESCE(receipts.total, 0)
  ) excess;
  IF unsafe_ids IS NOT NULL THEN
    RAISE EXCEPTION 'succeeded refunds exceed succeeded receipts for payment ids: %', unsafe_ids;
  END IF;
END $$;

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
