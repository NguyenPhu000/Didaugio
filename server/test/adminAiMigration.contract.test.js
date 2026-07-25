import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync(
  new URL("../prisma/schema.prisma", import.meta.url),
  "utf8",
);
const migration = readFileSync(
  new URL(
    "../prisma/migrations/20260724170000_create_lean_admin_ai_control_center/migration.sql",
    import.meta.url,
  ),
  "utf8",
);

const baselineModels = [
  "Role", "Permission", "RolePermission", "UserPermission", "User",
  "UserProfile", "UserSession", "EmailVerification", "PasswordReset",
  "SystemConfig", "ApiKeyManagement", "AuditLog", "FeedbackReport",
  "BannerMarketing", "NotificationGlobal", "NotificationRecipient",
  "PushSubscription", "DistrictCantho", "WardCantho",
  "AdministrativeDatasetRelease", "Province", "AdministrativeWard",
  "ProvinceDatasetRecord", "AdministrativeWardDatasetRecord",
  "PlaceAdministrativeLocationException", "Category", "PlaceTag", "TagGroup",
  "CategoryTag", "Place", "PlaceTelemetry", "PlaceAiGuide", "PlaceGuideFaq",
  "PlaceImage", "PlaceOpeningHour", "PlaceAmenity", "PlaceTagLink", "Review",
  "ReviewMedia", "ReviewReply", "ReviewModerationLog", "Favorite", "SavedTrip",
  "UserCheckin", "TripPlan", "TripStop", "BookingTripLink",
  "TripExecutionSession", "TripExecutionOperation", "TripLegacyMap", "DomainJob",
  "AiPromptHistory", "TripShare", "Business", "SensitiveDocument", "BusinessRole",
  "StaffInvitation", "BusinessService", "BusinessBlockedDate", "PlaceResource",
  "Voucher", "AutoApproveRule", "BookingActionLog", "Booking", "BookingTransaction",
  "Payment", "PaymentReceipt", "RefundAttempt", "PaymentWebhookLog", "Payout",
  "PartnerWallet", "PlatformWallet", "FinancialLedger", "SubscriptionPlan",
  "Subscription", "SubscriptionInvoice", "SubscriptionStats", "CachedItinerary",
  "Event", "EventParticipant", "EventMoment", "ActiveSession",
];

const addedModels = ["AiConfig", "AiConfigVersion", "AiRequestLog"];

function modelBlock(model) {
  const match = schema.match(new RegExp(`^model ${model} \\{([\\s\\S]*?)^\\}`, "m"));
  assert.ok(match, `missing ${model} model`);
  return match[1];
}

function tableBlock(table) {
  const start = migration.indexOf(`CREATE TABLE "${table}" (`);
  const end = migration.indexOf("\n);", start);
  assert.ok(start >= 0 && end >= 0, `missing ${table} table DDL`);
  return migration.slice(start, end);
}

function assertContainsAll(source, fragments, label) {
  for (const fragment of fragments) {
    assert.ok(source.includes(fragment), `${label} is missing ${fragment}`);
  }
}

test("lean Admin AI adds exactly the three approved Prisma models", () => {
  const actualModels = [...schema.matchAll(/^model\s+(\w+)\s+\{/gm)].map(
    ([, name]) => name,
  );
  assert.deepEqual(
    [...actualModels].sort(),
    [...baselineModels, ...addedModels].sort(),
  );

  for (const model of ["SystemConfig", "AuditLog", "AiPromptHistory", "ApiKeyManagement"]) {
    assert.ok(actualModels.includes(model), `${model} must remain present`);
  }
});

test("schema preserves credential contract and all AI model columns and relations", () => {
  const apiKeyManagement = modelBlock("ApiKeyManagement");
  assertContainsAll(apiKeyManagement, [
    'serviceName  String    @unique @map("service_name")',
    'apiKey       String    @map("api_key") @db.Text',
    'keySuffix    String?   @map("key_suffix")',
    'updatedAt    DateTime  @updatedAt @map("updated_at")',
  ], "ApiKeyManagement schema");

  assertContainsAll(modelBlock("AiConfig"), [
    'key             String            @unique',
    'activeVersionId Int?              @unique @map("active_version_id")',
    'draftVersionId  Int?              @unique @map("draft_version_id")',
    '@relation("AiConfigVersions")',
    '@relation("ActiveAiConfigVersion"',
    '@relation("DraftAiConfigVersion"',
    '@relation("AiConfigUpdatedBy"',
    '@@map("ai_configs")',
  ], "AiConfig schema");
  assertContainsAll(modelBlock("AiConfigVersion"), [
    'configData    Json      @map("config_data")',
    'changeReason  String    @map("change_reason")',
    '@@unique([aiConfigId, version])',
    '@@index([aiConfigId, status])',
    '@@map("ai_config_versions")',
  ], "AiConfigVersion schema");
  assertContainsAll(modelBlock("AiRequestLog"), [
    'requestId        String   @unique @map("request_id")',
    'safetyBlocked    Boolean  @default(false) @map("safety_blocked")',
    'isTest           Boolean  @default(false) @map("is_test")',
    '@@index([createdAt])',
    '@@index([isTest, createdAt])',
    '@@index([feature, status, createdAt])',
    '@@map("ai_request_logs")',
  ], "AiRequestLog schema");
  assertContainsAll(modelBlock("User"), [
    'aiConfigsUpdated        AiConfig[]',
    'aiConfigVersionsCreated AiConfigVersion[]',
  ], "User schema");
});

function executableSql(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/--[^\r\n]*/g, "")
    .trim();
}

function normalizeSql(sql) {
  return sql.replace(/\s+/g, " ").trim();
}

const executableMigration = executableSql(migration);
const normalizedMigration = normalizeSql(executableMigration);

test("migration is an explicit transaction with duplicate preflight as its first statement", () => {
  assert.match(executableMigration, /^BEGIN;\s*DO \$\$/);
  assert.match(executableMigration, /COMMIT;\s*$/);

  const preflightStart = executableMigration.indexOf("DO $$");
  const preflightEnd = executableMigration.indexOf("$$;", preflightStart) + 3;
  assert.ok(preflightStart >= 0 && preflightEnd > preflightStart, "missing duplicate preflight");
  assert.equal(
    executableMigration.slice("BEGIN;".length, preflightStart).trim(),
    "",
    "only BEGIN may precede the duplicate preflight",
  );
  const preflightBlock = executableMigration.slice(preflightStart, preflightEnd);
  assertContainsAll(preflightBlock, [
    'FROM "api_keys_management"',
    'WHERE "service_name" IS NOT NULL',
    'GROUP BY "service_name"',
    "HAVING COUNT(*) > 1",
    "RAISE EXCEPTION",
  ], "duplicate preflight");
  assert.doesNotMatch(
    executableMigration,
    /\b(?:DELETE\s+FROM|TRUNCATE(?:\s+TABLE)?)\s+(?:"api_keys_management"|api_keys_management)\b/i,
  );
});

test("migration DDL fully matches the required table columns and defaults", () => {
  assert.equal((executableMigration.match(/^CREATE TABLE/gm) || []).length, 3);
  assertContainsAll(tableBlock("ai_configs"), [
    '"id" SERIAL NOT NULL',
    '"key" TEXT NOT NULL',
    '"active_version_id" INTEGER',
    '"draft_version_id" INTEGER',
    '"status" TEXT NOT NULL DEFAULT \'active\'',
    '"revision" INTEGER NOT NULL DEFAULT 0',
    '"updated_by" INTEGER',
    '"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP',
    '"updated_at" TIMESTAMP(3) NOT NULL',
    'CONSTRAINT "ai_configs_pkey" PRIMARY KEY ("id")',
  ], "ai_configs DDL");
  assertContainsAll(tableBlock("ai_config_versions"), [
    '"id" SERIAL NOT NULL',
    '"ai_config_id" INTEGER NOT NULL',
    '"version" INTEGER NOT NULL',
    '"status" TEXT NOT NULL',
    '"config_data" JSONB NOT NULL',
    '"change_reason" TEXT NOT NULL',
    '"created_by" INTEGER',
    '"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP',
    '"published_at" TIMESTAMP(3)',
    'CONSTRAINT "ai_config_versions_pkey" PRIMARY KEY ("id")',
  ], "ai_config_versions DDL");
  assertContainsAll(tableBlock("ai_request_logs"), [
    '"id" SERIAL NOT NULL',
    '"request_id" TEXT NOT NULL',
    '"anonymous_user_ref" TEXT',
    '"feature" TEXT NOT NULL',
    '"provider" TEXT NOT NULL',
    '"model" TEXT NOT NULL',
    '"config_version" INTEGER',
    '"input_tokens" INTEGER',
    '"output_tokens" INTEGER',
    '"latency_ms" INTEGER',
    '"status" TEXT NOT NULL',
    '"error_code" TEXT',
    '"safety_blocked" BOOLEAN NOT NULL DEFAULT false',
    '"feedback" TEXT',
    '"feedback_reason" TEXT',
    '"is_test" BOOLEAN NOT NULL DEFAULT false',
    '"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP',
    '"expires_at" TIMESTAMP(3) NOT NULL',
    'CONSTRAINT "ai_request_logs_pkey" PRIMARY KEY ("id")',
  ], "ai_request_logs DDL");
  assertContainsAll(normalizedMigration, [
    'ALTER TABLE "api_keys_management" ADD COLUMN "key_suffix" TEXT, ADD COLUMN "updated_at" TIMESTAMP(3);',
    'ALTER TABLE "api_keys_management" ALTER COLUMN "updated_at" SET NOT NULL;',
    'CREATE UNIQUE INDEX "api_keys_management_service_name_key" ON "api_keys_management"("service_name");',
    'DROP INDEX "api_keys_management_api_key_key";',
  ], "credential DDL");
});

test("migration defines every required index with its table, ordered columns, and uniqueness", () => {
  assertContainsAll(normalizedMigration, [
    'CREATE UNIQUE INDEX "api_keys_management_service_name_key" ON "api_keys_management"("service_name");',
    'CREATE UNIQUE INDEX "ai_configs_key_key" ON "ai_configs"("key");',
    'CREATE UNIQUE INDEX "ai_configs_active_version_id_key" ON "ai_configs"("active_version_id");',
    'CREATE UNIQUE INDEX "ai_configs_draft_version_id_key" ON "ai_configs"("draft_version_id");',
    'CREATE UNIQUE INDEX "ai_config_versions_ai_config_id_version_key" ON "ai_config_versions"("ai_config_id", "version");',
    'CREATE INDEX "ai_config_versions_ai_config_id_status_idx" ON "ai_config_versions"("ai_config_id", "status");',
    'CREATE UNIQUE INDEX "ai_request_logs_request_id_key" ON "ai_request_logs"("request_id");',
    'CREATE INDEX "ai_request_logs_created_at_idx" ON "ai_request_logs"("created_at");',
    'CREATE INDEX "ai_request_logs_is_test_created_at_idx" ON "ai_request_logs"("is_test", "created_at");',
    'CREATE INDEX "ai_request_logs_feature_status_created_at_idx" ON "ai_request_logs"("feature", "status", "created_at");',
  ], "index definitions");
});

test("migration defines all five foreign keys with exact columns and actions", () => {
  assertContainsAll(normalizedMigration, [
    'ALTER TABLE "ai_configs" ADD CONSTRAINT "ai_configs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;',
    'ALTER TABLE "ai_config_versions" ADD CONSTRAINT "ai_config_versions_ai_config_id_fkey" FOREIGN KEY ("ai_config_id") REFERENCES "ai_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;',
    'ALTER TABLE "ai_config_versions" ADD CONSTRAINT "ai_config_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;',
    'ALTER TABLE "ai_configs" ADD CONSTRAINT "ai_configs_active_version_id_fkey" FOREIGN KEY ("active_version_id") REFERENCES "ai_config_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;',
    'ALTER TABLE "ai_configs" ADD CONSTRAINT "ai_configs_draft_version_id_fkey" FOREIGN KEY ("draft_version_id") REFERENCES "ai_config_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;',
  ], "foreign-key definitions");
});

test("migration grants exactly the seven AI permissions to Super Admin and the approved Admin subset", () => {
  const permissions = [
    "ai.view",
    "ai.config.manage",
    "ai.config.publish",
    "ai.secrets.manage",
    "ai.logs.view",
    "ai.test.run",
    "ai.kill_switch.manage",
  ];
  const permissionSeed = migration.match(
    /INSERT INTO "permissions"[\s\S]*?ON CONFLICT \("name"\) DO NOTHING;/,
  );
  assert.ok(permissionSeed, "missing permission seed");
  for (const permission of permissions) {
    assert.match(permissionSeed[0], new RegExp(`'${permission}'`));
  }
  assert.equal((permissionSeed[0].match(/\('ai\./g) || []).length, 7);

  const roleGrants = [...executableMigration.matchAll(/INSERT INTO "role_permissions"[\s\S]*?DO NOTHING;/g)]
    .map(([grant]) => grant);
  assert.equal(roleGrants.length, 2);
  assert.equal(normalizeSql(roleGrants[0]), 'INSERT INTO "role_permissions" ("role_id", "permission_id") SELECT r.id, p.id FROM "roles" r CROSS JOIN "permissions" p WHERE r.name = \'super_admin\' AND p.module = \'ai\' ON CONFLICT ("role_id", "permission_id") DO NOTHING;');
  assert.equal(normalizeSql(roleGrants[1]), 'INSERT INTO "role_permissions" ("role_id", "permission_id") SELECT r.id, p.id FROM "roles" r JOIN "permissions" p ON p.name IN ( \'ai.view\', \'ai.config.manage\', \'ai.logs.view\', \'ai.test.run\' ) WHERE r.name = \'admin\' ON CONFLICT ("role_id", "permission_id") DO NOTHING;');
  assert.doesNotMatch(executableMigration, /\bstaff\b/i);
});
