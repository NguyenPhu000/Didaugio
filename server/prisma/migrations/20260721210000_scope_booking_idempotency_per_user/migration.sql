BEGIN;

-- Booking create/replay is tenant-scoped by user. Validate every catalog
-- object before replacing the historical global idempotency-key index.
DO $$
DECLARE
  bookings_kind "char";
  user_column RECORD;
  key_column RECORD;
  duplicate_keys TEXT;
  legacy_relation REGCLASS := to_regclass('public.bookings_idempotency_key_key');
  composite_relation REGCLASS := to_regclass('public.bookings_user_id_idempotency_key_key');
  legacy_index RECORD;
  composite_index RECORD;
BEGIN
  SELECT relkind INTO bookings_kind
  FROM pg_class
  WHERE oid = to_regclass('public.bookings');
  IF bookings_kind IS DISTINCT FROM 'r'::"char" THEN
    RAISE EXCEPTION 'bookings is missing or is not a table';
  END IF;

  SELECT a.attnum, format_type(a.atttypid, a.atttypmod) AS data_type,
         a.attnotnull, a.attisdropped
    INTO user_column
  FROM pg_attribute a
  WHERE a.attrelid = 'public.bookings'::regclass
    AND a.attname = 'user_id' AND a.attnum > 0;
  SELECT a.attnum, format_type(a.atttypid, a.atttypmod) AS data_type,
         a.attnotnull, a.attisdropped
    INTO key_column
  FROM pg_attribute a
  WHERE a.attrelid = 'public.bookings'::regclass
    AND a.attname = 'idempotency_key' AND a.attnum > 0;
  IF user_column.attnum IS NULL OR user_column.data_type <> 'integer'
     OR NOT user_column.attnotnull OR user_column.attisdropped
     OR key_column.attnum IS NULL OR key_column.data_type <> 'text'
     OR key_column.attnotnull OR key_column.attisdropped THEN
    RAISE EXCEPTION 'incompatible booking idempotency columns';
  END IF;

  SELECT string_agg(format('user_id=%s key=%L', duplicates.user_id, duplicates.idempotency_key), ', ')
    INTO duplicate_keys
  FROM (
    SELECT user_id, idempotency_key
    FROM bookings
    WHERE idempotency_key IS NOT NULL
    GROUP BY user_id, idempotency_key
    HAVING COUNT(*) > 1
    ORDER BY user_id, idempotency_key
  ) duplicates;
  IF duplicate_keys IS NOT NULL THEN
    RAISE EXCEPTION 'duplicate tenant booking idempotency keys block migration: %', duplicate_keys;
  END IF;

  SELECT i.indexrelid, i.indrelid, i.indisunique, i.indisvalid, i.indisready,
         i.indislive, i.indnkeyatts, i.indnatts,
         ARRAY(SELECT unnest(i.indkey::SMALLINT[])) AS keys,
         i.indpred, i.indexprs, am.amname,
         pg_get_indexdef(i.indexrelid) AS definition
    INTO legacy_index
  FROM pg_index i
  JOIN pg_class index_relation ON index_relation.oid = i.indexrelid
  JOIN pg_am am ON am.oid = index_relation.relam
  WHERE i.indexrelid = legacy_relation;
  IF legacy_relation IS NOT NULL AND (
       legacy_index.indexrelid IS NULL
       OR legacy_index.indrelid <> 'public.bookings'::regclass
       OR NOT legacy_index.indisunique OR NOT legacy_index.indisvalid
       OR NOT legacy_index.indisready OR NOT legacy_index.indislive
       OR legacy_index.indnkeyatts <> 1 OR legacy_index.indnatts <> 1
       OR legacy_index.keys <> ARRAY[key_column.attnum]::SMALLINT[]
       OR legacy_index.indpred IS NOT NULL OR legacy_index.indexprs IS NOT NULL
       OR legacy_index.amname <> 'btree'
       OR legacy_index.definition <> 'CREATE UNIQUE INDEX bookings_idempotency_key_key ON public.bookings USING btree (idempotency_key)'
     ) THEN
    RAISE EXCEPTION 'incompatible booking idempotency index bookings_idempotency_key_key: %',
      legacy_index.definition;
  END IF;

  SELECT i.indexrelid, i.indrelid, i.indisunique, i.indisvalid, i.indisready,
         i.indislive, i.indnkeyatts, i.indnatts,
         ARRAY(SELECT unnest(i.indkey::SMALLINT[])) AS keys,
         i.indpred, i.indexprs, am.amname,
         pg_get_indexdef(i.indexrelid) AS definition
    INTO composite_index
  FROM pg_index i
  JOIN pg_class index_relation ON index_relation.oid = i.indexrelid
  JOIN pg_am am ON am.oid = index_relation.relam
  WHERE i.indexrelid = composite_relation;
  IF composite_relation IS NOT NULL AND (
       composite_index.indexrelid IS NULL
       OR composite_index.indrelid <> 'public.bookings'::regclass
       OR NOT composite_index.indisunique OR NOT composite_index.indisvalid
       OR NOT composite_index.indisready OR NOT composite_index.indislive
       OR composite_index.indnkeyatts <> 2 OR composite_index.indnatts <> 2
       OR composite_index.keys <> ARRAY[user_column.attnum, key_column.attnum]::SMALLINT[]
       OR composite_index.indpred IS NOT NULL OR composite_index.indexprs IS NOT NULL
       OR composite_index.amname <> 'btree'
       OR composite_index.definition <> 'CREATE UNIQUE INDEX bookings_user_id_idempotency_key_key ON public.bookings USING btree (user_id, idempotency_key)'
     ) THEN
    RAISE EXCEPTION 'incompatible booking idempotency index bookings_user_id_idempotency_key_key: %',
      composite_index.definition;
  END IF;

  IF composite_relation IS NULL THEN
    EXECUTE 'CREATE UNIQUE INDEX "bookings_user_id_idempotency_key_key" ON "bookings" ("user_id", "idempotency_key")';
  END IF;
  IF legacy_relation IS NOT NULL THEN
    EXECUTE 'DROP INDEX "bookings_idempotency_key_key"';
  END IF;
END $$;

COMMIT;
