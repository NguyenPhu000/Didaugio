-- Run with psql AUTOCOMMIT enabled. Do not wrap these statements in a transaction.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "places_public_geography_gist_idx"
  ON "places" USING GIST (
    (ST_SetSRID(ST_MakePoint("longitude"::double precision, "latitude"::double precision), 4326)::geography)
  )
  WHERE "deleted_at" IS NULL AND "status" = 'approved';

CREATE INDEX CONCURRENTLY IF NOT EXISTS "places_public_newest_cursor_idx"
  ON "places" ("created_at" DESC, "id" DESC)
  WHERE "deleted_at" IS NULL AND "status" = 'approved';

CREATE INDEX CONCURRENTLY IF NOT EXISTS "places_public_rating_cursor_idx"
  ON "places" ("rating_avg" DESC, "rating_count" DESC, "id" DESC)
  WHERE "deleted_at" IS NULL AND "status" = 'approved';

CREATE INDEX CONCURRENTLY IF NOT EXISTS "places_public_category_district_idx"
  ON "places" ("category_id", "district_id", "id" DESC)
  WHERE "deleted_at" IS NULL AND "status" = 'approved';

CREATE INDEX CONCURRENTLY IF NOT EXISTS "places_name_trgm_idx"
  ON "places" USING GIN ("name" gin_trgm_ops)
  WHERE "deleted_at" IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "reviews_title_trgm_idx"
  ON "reviews" USING GIN ("title" gin_trgm_ops)
  WHERE "deleted_at" IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "reviews_content_trgm_idx"
  ON "reviews" USING GIN ("content" gin_trgm_ops)
  WHERE "deleted_at" IS NULL;
