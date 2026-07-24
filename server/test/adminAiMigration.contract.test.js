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

test("duplicate service-name preflight runs before every migration mutation", () => {
  const preflight = migration.indexOf("DO $$");
  const mutations = [
    'ALTER TABLE "api_keys_management"',
    'UPDATE "api_keys_management"',
    "CREATE TABLE",
    "CREATE UNIQUE INDEX",
    "CREATE INDEX",
    "DROP INDEX",
    "INSERT INTO",
  ]
    .map((statement) => migration.indexOf(statement))
    .filter((index) => index >= 0);

  assert.ok(preflight >= 0, "missing duplicate service-name preflight");
  assert.ok(preflight < Math.min(...mutations), "preflight must run before mutation");

  const preflightBlock = migration.slice(preflight, migration.indexOf("$$;", preflight) + 3);
  assertContainsAll(preflightBlock, [
    'FROM "api_keys_management"',
    'WHERE "service_name" IS NOT NULL',
    'GROUP BY "service_name"',
    "HAVING COUNT(*) > 1",
    "RAISE EXCEPTION",
  ], "duplicate preflight");
  assert.doesNotMatch(migration, /\bDELETE\s+FROM\s+"api_keys_management"/i);
});

test("migration DDL matches AI persistence columns, constraints, indexes, and foreign keys", () => {
  assert.equal((migration.match(/^CREATE TABLE/gm) || []).length, 3);
  assertContainsAll(tableBlock("ai_configs"), [
    '"key" TEXT NOT NULL',
    '"active_version_id" INTEGER',
    '"draft_version_id" INTEGER',
    '"updated_by" INTEGER',
    '"updated_at" TIMESTAMP(3) NOT NULL',
  ], "ai_configs DDL");
  assertContainsAll(tableBlock("ai_config_versions"), [
    '"ai_config_id" INTEGER NOT NULL',
    '"config_data" JSONB NOT NULL',
    '"change_reason" TEXT NOT NULL',
    '"created_by" INTEGER',
  ], "ai_config_versions DDL");
  assertContainsAll(tableBlock("ai_request_logs"), [
    '"request_id" TEXT NOT NULL',
    '"safety_blocked" BOOLEAN NOT NULL DEFAULT false',
    '"is_test" BOOLEAN NOT NULL DEFAULT false',
    '"expires_at" TIMESTAMP(3) NOT NULL',
  ], "ai_request_logs DDL");
  assertContainsAll(migration, [
    'ADD COLUMN "key_suffix" TEXT',
    'ADD COLUMN "updated_at" TIMESTAMP(3)',
    'ALTER COLUMN "updated_at" SET NOT NULL',
    'CREATE UNIQUE INDEX "api_keys_management_service_name_key"',
    'DROP INDEX "api_keys_management_api_key_key"',
    'CREATE UNIQUE INDEX "ai_configs_key_key"',
    'CREATE UNIQUE INDEX "ai_configs_active_version_id_key"',
    'CREATE UNIQUE INDEX "ai_configs_draft_version_id_key"',
    'CREATE UNIQUE INDEX "ai_config_versions_ai_config_id_version_key"',
    'CREATE INDEX "ai_config_versions_ai_config_id_status_idx"',
    'CREATE INDEX "ai_request_logs_created_at_idx"',
    'CREATE INDEX "ai_request_logs_is_test_created_at_idx"',
    'CREATE INDEX "ai_request_logs_feature_status_created_at_idx"',
    '"ai_configs_updated_by_fkey"',
    '"ai_config_versions_ai_config_id_fkey"',
    '"ai_config_versions_created_by_fkey"',
    '"ai_configs_active_version_id_fkey"',
    '"ai_configs_draft_version_id_fkey"',
  ], "migration DDL");
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

  const roleGrants = [...migration.matchAll(/INSERT INTO "role_permissions"[\s\S]*?DO NOTHING;/g)]
    .map(([grant]) => grant);
  assert.equal(roleGrants.length, 2);
  assert.match(roleGrants[0], /r\.name = 'super_admin' AND p\.module = 'ai'/);
  assert.match(roleGrants[1], /r\.name = 'admin'/);
  for (const permission of ["ai.view", "ai.config.manage", "ai.logs.view", "ai.test.run"]) {
    assert.match(roleGrants[1], new RegExp(`'${permission}'`));
  }
  for (const permission of ["ai.config.publish", "ai.secrets.manage", "ai.kill_switch.manage"]) {
    assert.doesNotMatch(roleGrants[1], new RegExp(`'${permission}'`));
  }
  assert.doesNotMatch(migration, /\bstaff\b/i);
});
