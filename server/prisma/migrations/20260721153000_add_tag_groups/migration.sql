BEGIN;

CREATE TABLE IF NOT EXISTS "tag_groups" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name_vi" TEXT NOT NULL,
    "name_en" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tag_groups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tag_groups_slug_key" ON "tag_groups"("slug");

INSERT INTO "tag_groups" ("slug", "name_vi", "name_en", "is_active", "sort_order", "updated_at")
VALUES ('general', 'Chung', 'General', true, 0, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "place_tags"
  ADD COLUMN IF NOT EXISTS "tag_group_id" INTEGER;

CREATE INDEX IF NOT EXISTS "idx_place_tags_tag_group_id"
  ON "place_tags"("tag_group_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'place_tags_tag_group_id_fkey'
      AND conrelid = 'place_tags'::regclass
  ) THEN
    ALTER TABLE "place_tags"
      ADD CONSTRAINT "place_tags_tag_group_id_fkey"
      FOREIGN KEY ("tag_group_id") REFERENCES "tag_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

UPDATE "place_tags"
SET "tag_group_id" = (
  SELECT "id"
  FROM "tag_groups"
  WHERE "slug" = 'general'
)
WHERE "tag_group_id" IS NULL;

COMMIT;
