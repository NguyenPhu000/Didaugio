ALTER TABLE "businesses"
  ADD COLUMN "id_card_front_public_id" TEXT,
  ADD COLUMN "id_card_back_public_id" TEXT,
  ADD COLUMN "business_license_public_id" TEXT;

ALTER TABLE "trip_plans"
  ADD COLUMN "cover_image_public_id" TEXT;
