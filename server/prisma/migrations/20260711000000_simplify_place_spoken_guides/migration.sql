DROP INDEX IF EXISTS "place_ai_guides_status_idx";

ALTER TABLE "place_ai_guides"
DROP COLUMN IF EXISTS "summary",
DROP COLUMN IF EXISTS "audio_url",
DROP COLUMN IF EXISTS "audio_public_id",
DROP COLUMN IF EXISTS "audio_format",
DROP COLUMN IF EXISTS "audio_size_bytes",
DROP COLUMN IF EXISTS "duration_seconds",
DROP COLUMN IF EXISTS "content_hash",
DROP COLUMN IF EXISTS "version",
DROP COLUMN IF EXISTS "status",
DROP COLUMN IF EXISTS "error_message",
DROP COLUMN IF EXISTS "generated_at",
DROP COLUMN IF EXISTS "regenerated_by";

CREATE TABLE "place_guide_faqs" (
    "id" SERIAL NOT NULL,
    "guide_id" INTEGER NOT NULL,
    "question" VARCHAR(200) NOT NULL,
    "answer" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "place_guide_faqs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "place_guide_faqs_guide_id_sort_order_key"
ON "place_guide_faqs"("guide_id", "sort_order");

CREATE INDEX "place_guide_faqs_guide_id_idx"
ON "place_guide_faqs"("guide_id");

ALTER TABLE "place_guide_faqs"
ADD CONSTRAINT "place_guide_faqs_guide_id_fkey"
FOREIGN KEY ("guide_id") REFERENCES "place_ai_guides"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
