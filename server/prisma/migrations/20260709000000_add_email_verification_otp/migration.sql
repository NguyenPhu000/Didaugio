ALTER TABLE "email_verifications"
  ADD COLUMN IF NOT EXISTS "otp_hash" TEXT,
  ADD COLUMN IF NOT EXISTS "otp_expires_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "otp_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "otp_locked_until" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "email_verifications_email_otp_hash_idx"
  ON "email_verifications"("email", "otp_hash");
