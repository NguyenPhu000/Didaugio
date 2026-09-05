DO $$
DECLARE
  legacy_trip_count BIGINT;
  mapping_count BIGINT;
  legacy_stop_count BIGINT;
  migrated_stop_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO legacy_trip_count FROM "trips";
  SELECT COUNT(*) INTO mapping_count FROM "trip_legacy_maps";
  IF legacy_trip_count <> mapping_count THEN
    RAISE EXCEPTION 'Trip contract blocked: mappings %/%', mapping_count, legacy_trip_count;
  END IF;

  SELECT COUNT(*) INTO legacy_stop_count FROM "trip_destinations";
  SELECT COUNT(*) INTO migrated_stop_count
  FROM "trip_stops"
  WHERE "metadata"->>'migrationLegacyDestinationId' IS NOT NULL
     OR "metadata"->>'legacyDestinationId' IS NOT NULL;
  IF migrated_stop_count < legacy_stop_count THEN
    RAISE EXCEPTION 'Trip contract blocked: stops %/%', migrated_stop_count, legacy_stop_count;
  END IF;
END $$;

DROP TABLE "trip_destinations";
DROP TABLE "trips";
