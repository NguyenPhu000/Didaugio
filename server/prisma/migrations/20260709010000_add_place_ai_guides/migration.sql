CREATE TABLE "place_ai_guides" (
    "id" SERIAL NOT NULL,
    "place_id" INTEGER NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'vi-VN',
    "text" TEXT,
    "summary" TEXT,
    "audio_url" TEXT,
    "audio_public_id" TEXT,
    "audio_format" TEXT,
    "audio_size_bytes" INTEGER,
    "duration_seconds" INTEGER,
    "content_hash" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "generated_at" TIMESTAMP(3),
    "regenerated_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_ai_guides_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "place_ai_guides_place_id_locale_key" ON "place_ai_guides"("place_id", "locale");
CREATE INDEX "place_ai_guides_status_idx" ON "place_ai_guides"("status");
CREATE INDEX "place_ai_guides_place_id_idx" ON "place_ai_guides"("place_id");

ALTER TABLE "place_ai_guides"
ADD CONSTRAINT "place_ai_guides_place_id_fkey"
FOREIGN KEY ("place_id") REFERENCES "places"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
