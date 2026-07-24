-- AlterTable
ALTER TABLE "api_keys_management"
  ADD COLUMN "key_suffix" TEXT,
  ADD COLUMN "updated_at" TIMESTAMP(3);

UPDATE "api_keys_management"
SET "updated_at" = CURRENT_TIMESTAMP
WHERE "updated_at" IS NULL;

ALTER TABLE "api_keys_management"
  ALTER COLUMN "updated_at" SET NOT NULL;

-- Existing credentials must be reconciled by an operator instead of being
-- silently discarded before service_name becomes a unique identifier.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "api_keys_management"
    WHERE "service_name" IS NOT NULL
    GROUP BY "service_name"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'duplicate non-null service names block AI credential migration';
  END IF;
END $$;

-- CreateTable
CREATE TABLE "ai_configs" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "active_version_id" INTEGER,
    "draft_version_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_config_versions" (
    "id" SERIAL NOT NULL,
    "ai_config_id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "config_data" JSONB NOT NULL,
    "change_reason" TEXT NOT NULL,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "ai_config_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_request_logs" (
    "id" SERIAL NOT NULL,
    "request_id" TEXT NOT NULL,
    "anonymous_user_ref" TEXT,
    "feature" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "config_version" INTEGER,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "latency_ms" INTEGER,
    "status" TEXT NOT NULL,
    "error_code" TEXT,
    "safety_blocked" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "feedback_reason" TEXT,
    "is_test" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_management_service_name_key" ON "api_keys_management"("service_name");

-- CreateIndex
DROP INDEX "api_keys_management_api_key_key";

-- CreateIndex
CREATE UNIQUE INDEX "ai_configs_key_key" ON "ai_configs"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ai_configs_active_version_id_key" ON "ai_configs"("active_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_configs_draft_version_id_key" ON "ai_configs"("draft_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_config_versions_ai_config_id_version_key" ON "ai_config_versions"("ai_config_id", "version");

-- CreateIndex
CREATE INDEX "ai_config_versions_ai_config_id_status_idx" ON "ai_config_versions"("ai_config_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ai_request_logs_request_id_key" ON "ai_request_logs"("request_id");

-- CreateIndex
CREATE INDEX "ai_request_logs_created_at_idx" ON "ai_request_logs"("created_at");

-- CreateIndex
CREATE INDEX "ai_request_logs_is_test_created_at_idx" ON "ai_request_logs"("is_test", "created_at");

-- CreateIndex
CREATE INDEX "ai_request_logs_feature_status_created_at_idx" ON "ai_request_logs"("feature", "status", "created_at");

-- AddForeignKey
ALTER TABLE "ai_configs" ADD CONSTRAINT "ai_configs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_config_versions" ADD CONSTRAINT "ai_config_versions_ai_config_id_fkey" FOREIGN KEY ("ai_config_id") REFERENCES "ai_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_config_versions" ADD CONSTRAINT "ai_config_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_configs" ADD CONSTRAINT "ai_configs_active_version_id_fkey" FOREIGN KEY ("active_version_id") REFERENCES "ai_config_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_configs" ADD CONSTRAINT "ai_configs_draft_version_id_fkey" FOREIGN KEY ("draft_version_id") REFERENCES "ai_config_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "permissions" ("name", "display_name", "module", "description")
VALUES
  ('ai.view', 'Xem AI Control Center', 'ai', 'Xem dashboard và cấu hình AI'),
  ('ai.config.manage', 'Sửa cấu hình AI', 'ai', 'Tạo và sửa draft'),
  ('ai.config.publish', 'Phát hành cấu hình AI', 'ai', 'Publish và rollback'),
  ('ai.secrets.manage', 'Quản lý khóa AI', 'ai', 'Thay khóa provider'),
  ('ai.logs.view', 'Xem log AI', 'ai', 'Xem metadata vận hành'),
  ('ai.test.run', 'Chạy AI Test Lab', 'ai', 'Chạy request thử nghiệm'),
  ('ai.kill_switch.manage', 'Điều khiển AI khẩn cấp', 'ai', 'Bật hoặc tắt AI')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r.name = 'super_admin' AND p.module = 'ai'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id
FROM "roles" r
JOIN "permissions" p ON p.name IN (
  'ai.view', 'ai.config.manage', 'ai.logs.view', 'ai.test.run'
)
WHERE r.name = 'admin'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
