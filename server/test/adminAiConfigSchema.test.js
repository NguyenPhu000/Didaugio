import assert from "node:assert/strict";
import test from "node:test";
import {
  aiConfigDataSchema,
  aiDraftUpdateSchema,
  aiKillSwitchSchema,
  aiLogsQuerySchema,
  aiPublishSchema,
  aiRollbackSchema,
  aiTestRequestSchema,
  normalizeKeyword,
} from "../src/models/schemas/adminAi/adminAi.schema.js";
import { DEFAULT_AI_CONFIG } from "../src/config/defaultAiConfig.js";

const validConfig = {
  provider: {
    adapter: "groq",
    baseUrl: "https://api.groq.com",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    secretReference: "groq-primary",
  },
  modelParameters: { temperature: 0.3, topP: 0.9, maxTokens: 2000, timeoutMs: 15000 },
  prompts: { chat: "Chat {{context}}", planner: "Plan {{context}}", voice: "Voice {{context}}" },
  context: {
    enabledSources: ["coarseLocation", "travelPreferences", "places"],
    fieldAllowlist: ["currentCity", "budget", "partySize", "tripDuration"],
    maxTokens: 1800,
    freshnessTtl: 300,
  },
  safety: {
    blockedKeywords: ["từ cấm"],
    matchMode: "substring",
    diacriticInsensitive: false,
    safeResponse: "Yêu cầu này không thể được xử lý.",
  },
  quotas: { freeDailyRequests: 20, premiumDailyRequests: 200 },
  fallback: { maintenanceMessage: "AI đang bảo trì.", staticPlannerEnabled: true },
};

test("accepts the lean config and rejects unapproved executable or provider values", () => {
  assert.equal(aiConfigDataSchema.safeParse(validConfig).success, true);
  assert.equal(aiConfigDataSchema.safeParse({ ...validConfig, javascript: "process.exit()" }).success, false);
  assert.equal(aiConfigDataSchema.safeParse({
    ...validConfig,
    provider: { ...validConfig.provider, adapter: "arbitrary-rest" },
  }).success, false);
  assert.equal(aiConfigDataSchema.safeParse({
    ...validConfig,
    provider: { ...validConfig.provider, baseUrl: "http://127.0.0.1:11434" },
  }).success, false);
  assert.equal(aiConfigDataSchema.safeParse({
    ...validConfig,
    prompts: { ...validConfig.prompts, injected: "{{code}}" },
  }).success, false);
});

test("enforces registered context and bounded snapshot values", () => {
  assert.equal(aiConfigDataSchema.safeParse({
    ...validConfig,
    context: { ...validConfig.context, enabledSources: ["sql"] },
  }).success, false);
  assert.equal(aiConfigDataSchema.safeParse({
    ...validConfig,
    safety: { ...validConfig.safety, blockedKeywords: Array.from({ length: 501 }, () => "blocked") },
  }).success, false);
  assert.equal(aiConfigDataSchema.safeParse({
    ...validConfig,
    modelParameters: { ...validConfig.modelParameters, timeoutMs: 30001 },
  }).success, false);
});

test("draft updates require a revision and bounded reason", () => {
  assert.equal(aiDraftUpdateSchema.safeParse({
    revision: 2,
    configData: validConfig,
    changeReason: "Điều chỉnh prompt Chat",
  }).success, true);
  assert.equal(aiDraftUpdateSchema.safeParse({ revision: 2, configData: validConfig }).success, false);
  assert.equal(aiDraftUpdateSchema.safeParse({
    revision: 2,
    configData: validConfig,
    changeReason: "Điều chỉnh prompt Chat",
    unknown: true,
  }).success, false);
});

test("validates all Admin AI action and filter contracts", () => {
  assert.equal(aiTestRequestSchema.safeParse({
    source: "draft", feature: "voice", message: "Giới thiệu địa điểm", context: { currentCity: "Huế" },
  }).success, true);
  assert.equal(aiTestRequestSchema.safeParse({ source: "draft", feature: "speech", message: "x" }).success, false);
  assert.equal(aiPublishSchema.safeParse({ revision: 4, changeReason: "Xuất bản cấu hình đã kiểm tra" }).success, true);
  assert.equal(aiRollbackSchema.safeParse({ targetVersion: 3, changeReason: "Khôi phục cấu hình ổn định" }).success, true);
  assert.equal(aiKillSwitchSchema.safeParse({ enabled: true, reason: "Nhà cung cấp đang gặp sự cố" }).success, true);
  assert.equal(aiLogsQuerySchema.safeParse({ page: "2", limit: "50", feature: "chat", isTest: "false" }).success, true);
  assert.equal(aiLogsQuerySchema.safeParse({ feature: "transcription" }).success, false);
});

test("Vietnamese normalization is deterministic without pattern matching", () => {
  assert.equal(normalizeKeyword("  Từ   CẤM ", false), "từ cấm");
  assert.equal(normalizeKeyword("  Từ   CẤM ", true), "tu cam");
});

test("the default Groq snapshot is schema-valid", () => {
  assert.equal(aiConfigDataSchema.safeParse(DEFAULT_AI_CONFIG).success, true);
});
