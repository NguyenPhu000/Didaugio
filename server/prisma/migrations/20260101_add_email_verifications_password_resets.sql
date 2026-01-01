-- Migration: Add email_verifications and password_resets tables
-- Created: 2026-01-01
-- Purpose: Support email verification and password reset functionality

-- Create email_verifications table
CREATE TABLE "email_verifications" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "email_verifications_user_id_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "users"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Create indexes for email_verifications
CREATE INDEX "idx_email_verifications_user" ON "email_verifications"("user_id");
CREATE INDEX "idx_email_verifications_token" ON "email_verifications"("token");

-- Create password_resets table
CREATE TABLE "password_resets" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "password_resets_user_id_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "users"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Create indexes for password_resets
CREATE INDEX "idx_password_resets_user" ON "password_resets"("user_id");
CREATE INDEX "idx_password_resets_token" ON "password_resets"("token");

-- Add comments for documentation
COMMENT ON TABLE "email_verifications" IS 'Stores email verification tokens';
COMMENT ON TABLE "password_resets" IS 'Stores password reset tokens';
COMMENT ON COLUMN "email_verifications"."token" IS 'UUID or secure random string for verification';
COMMENT ON COLUMN "password_resets"."token" IS 'UUID or secure random string for password reset';
COMMENT ON COLUMN "password_resets"."ip_address" IS 'IP address that requested the reset for security tracking';
