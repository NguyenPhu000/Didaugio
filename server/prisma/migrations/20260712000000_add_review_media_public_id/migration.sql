-- Preserve Cloudinary identifiers for review media so files can be deleted safely.
ALTER TABLE "review_media"
ADD COLUMN IF NOT EXISTS "public_id" TEXT;
