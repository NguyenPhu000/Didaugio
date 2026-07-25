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

const withConfig = (section, value) => ({
  ...validConfig,
  [section]: { ...validConfig[section], ...value },
});

const parses = (schema, value) => schema.safeParse(value).success;

test("allows only the approved Groq origin and never throws for malformed URLs", () => {
  const invalidUrls = [
    "not-a-url",
    "",
    "api.groq.com",
    "http://api.groq.com",
    "https://other.example.com",
    "https://api.groq.com.evil.example",
    "https://sub.api.groq.com",
    "https://api.groq.com:444",
  ];

  for (const baseUrl of invalidUrls) {
    assert.doesNotThrow(() => aiConfigDataSchema.safeParse(withConfig("provider", { baseUrl })));
    assert.equal(parses(aiConfigDataSchema, withConfig("provider", { baseUrl })), false, baseUrl);
  }

  for (const baseUrl of ["https://api.groq.com", "https://api.groq.com/openai/v1?region=us"]) {
    assert.equal(parses(aiConfigDataSchema, withConfig("provider", { baseUrl })), true, baseUrl);
  }
});

test("rejects unknown keys in every persisted config object", () => {
  const cases = [
    ["provider", withConfig("provider", { executable: "process.exit()" })],
    ["modelParameters", withConfig("modelParameters", { extra: 1 })],
    ["prompts", withConfig("prompts", { injected: "{{code}}" })],
    ["context", withConfig("context", { sql: "SELECT 1" })],
    ["safety", withConfig("safety", { pattern: ".*" })],
    ["quotas", withConfig("quotas", { premiumTier: true })],
    ["fallback", withConfig("fallback", { handler: "run()" })],
  ];

  for (const [name, config] of cases) {
    assert.equal(parses(aiConfigDataSchema, config), false, name);
  }
  assert.equal(parses(aiConfigDataSchema, { ...validConfig, javascript: "process.exit()" }), false);
});

test("enforces every persisted configuration bound and registered context values", () => {
  const cases = [
    ["temperature below", withConfig("modelParameters", { temperature: -0.01 }), false],
    ["temperature lower", withConfig("modelParameters", { temperature: 0 }), true],
    ["temperature upper", withConfig("modelParameters", { temperature: 1 }), true],
    ["temperature above", withConfig("modelParameters", { temperature: 1.01 }), false],
    ["topP below", withConfig("modelParameters", { topP: -0.01 }), false],
    ["topP lower", withConfig("modelParameters", { topP: 0 }), true],
    ["topP upper", withConfig("modelParameters", { topP: 1 }), true],
    ["topP above", withConfig("modelParameters", { topP: 1.01 }), false],
    ["maxTokens below", withConfig("modelParameters", { maxTokens: 255 }), false],
    ["maxTokens lower", withConfig("modelParameters", { maxTokens: 256 }), true],
    ["maxTokens upper", withConfig("modelParameters", { maxTokens: 4096 }), true],
    ["maxTokens above", withConfig("modelParameters", { maxTokens: 4097 }), false],
    ["timeout below", withConfig("modelParameters", { timeoutMs: 2999 }), false],
    ["timeout lower", withConfig("modelParameters", { timeoutMs: 3000 }), true],
    ["timeout upper", withConfig("modelParameters", { timeoutMs: 30000 }), true],
    ["timeout above", withConfig("modelParameters", { timeoutMs: 30001 }), false],
    ["prompt empty", withConfig("prompts", { chat: "" }), false],
    ["prompt minimum", withConfig("prompts", { planner: "x" }), true],
    ["prompt maximum", withConfig("prompts", { voice: "x".repeat(12000) }), true],
    ["prompt above", withConfig("prompts", { chat: "x".repeat(12001) }), false],
    ["keyword empty", withConfig("safety", { blockedKeywords: [""] }), false],
    ["keyword maximum", withConfig("safety", { blockedKeywords: ["x".repeat(120)] }), true],
    ["keyword above", withConfig("safety", { blockedKeywords: ["x".repeat(121)] }), false],
    ["keyword count maximum", withConfig("safety", { blockedKeywords: Array.from({ length: 500 }, () => "blocked") }), true],
    ["keyword count above", withConfig("safety", { blockedKeywords: Array.from({ length: 501 }, () => "blocked") }), false],
    ["context tokens below", withConfig("context", { maxTokens: 255 }), false],
    ["context tokens lower", withConfig("context", { maxTokens: 256 }), true],
    ["context tokens upper", withConfig("context", { maxTokens: 4000 }), true],
    ["context tokens above", withConfig("context", { maxTokens: 4001 }), false],
    ["free quota below", withConfig("quotas", { freeDailyRequests: -1 }), false],
    ["free quota lower", withConfig("quotas", { freeDailyRequests: 0 }), true],
    ["free quota upper", withConfig("quotas", { freeDailyRequests: 10000 }), true],
    ["free quota above", withConfig("quotas", { freeDailyRequests: 10001 }), false],
    ["premium quota below", withConfig("quotas", { premiumDailyRequests: -1 }), false],
    ["premium quota lower", withConfig("quotas", { premiumDailyRequests: 0 }), true],
    ["premium quota upper", withConfig("quotas", { premiumDailyRequests: 10000 }), true],
    ["premium quota above", withConfig("quotas", { premiumDailyRequests: 10001 }), false],
    ["invalid context source", withConfig("context", { enabledSources: ["sql"] }), false],
    ["invalid context field", withConfig("context", { fieldAllowlist: ["userId"] }), false],
    ["exact safety mode", withConfig("safety", { matchMode: "exact" }), false],
    ["regex safety mode", withConfig("safety", { matchMode: "regex" }), false],
  ];

  for (const [name, config, expected] of cases) {
    assert.equal(parses(aiConfigDataSchema, config), expected, name);
  }
});

test("draft updates have an exact strict shape and bounded write-only secret", () => {
  const valid = { revision: 2, configData: validConfig, changeReason: "Điều chỉnh prompt Chat" };
  const cases = [
    ["valid", valid, true],
    ["missing revision", { configData: validConfig, changeReason: valid.changeReason }, false],
    ["negative revision", { ...valid, revision: -1 }, false],
    ["short reason", { ...valid, changeReason: "ngắn" }, false],
    ["reason upper", { ...valid, changeReason: "x".repeat(300) }, true],
    ["reason above", { ...valid, changeReason: "x".repeat(301) }, false],
    ["secret below", { ...valid, providerSecret: "x".repeat(19) }, false],
    ["secret lower", { ...valid, providerSecret: "x".repeat(20) }, true],
    ["secret upper", { ...valid, providerSecret: "x".repeat(500) }, true],
    ["secret above", { ...valid, providerSecret: "x".repeat(501) }, false],
    ["unknown", { ...valid, unknown: true }, false],
  ];

  for (const [name, value, expected] of cases) {
    assert.equal(parses(aiDraftUpdateSchema, value), expected, name);
  }
});

test("Test Lab request is strict, bounded, and defaults its context", () => {
  const valid = { source: "draft", feature: "voice", message: "Giới thiệu địa điểm" };
  assert.deepEqual(aiTestRequestSchema.parse(valid).context, {});

  const cases = [
    ["missing source", { feature: "chat", message: "x" }, false],
    ["invalid source", { ...valid, source: "production" }, false],
    ["invalid feature", { ...valid, feature: "speech" }, false],
    ["empty message", { ...valid, message: "" }, false],
    ["message upper", { ...valid, message: "x".repeat(4000) }, true],
    ["message above", { ...valid, message: "x".repeat(4001) }, false],
    ["unknown top level", { ...valid, requestTemplate: {} }, false],
    ["unknown context", { ...valid, context: { sql: "SELECT 1" } }, false],
    ["city above", { ...valid, context: { currentCity: "x".repeat(121) } }, false],
    ["negative budget", { ...valid, context: { budget: -1 } }, false],
    ["party below", { ...valid, context: { partySize: 0 } }, false],
    ["party upper", { ...valid, context: { partySize: 20 } }, true],
    ["party above", { ...valid, context: { partySize: 21 } }, false],
    ["duration below", { ...valid, context: { tripDuration: 0 } }, false],
    ["duration upper", { ...valid, context: { tripDuration: 14 } }, true],
    ["duration above", { ...valid, context: { tripDuration: 15 } }, false],
  ];

  for (const [name, value, expected] of cases) {
    assert.equal(parses(aiTestRequestSchema, value), expected, name);
  }
});

test("publish, rollback, and kill-switch mutations require only their approved fields", () => {
  const cases = [
    ["publish valid", aiPublishSchema, { revision: 4, changeReason: "Xuất bản cấu hình đã kiểm tra" }, true],
    ["publish missing", aiPublishSchema, { changeReason: "Xuất bản cấu hình đã kiểm tra" }, false],
    ["publish unknown", aiPublishSchema, { revision: 4, changeReason: "Xuất bản cấu hình đã kiểm tra", force: true }, false],
    ["rollback valid", aiRollbackSchema, { targetVersion: 3, changeReason: "Khôi phục cấu hình ổn định" }, true],
    ["rollback zero", aiRollbackSchema, { targetVersion: 0, changeReason: "Khôi phục cấu hình ổn định" }, false],
    ["rollback unknown", aiRollbackSchema, { targetVersion: 3, changeReason: "Khôi phục cấu hình ổn định", configData: validConfig }, false],
    ["kill valid", aiKillSwitchSchema, { enabled: true, reason: "Nhà cung cấp đang gặp sự cố" }, true],
    ["kill wrong boolean", aiKillSwitchSchema, { enabled: "true", reason: "Nhà cung cấp đang gặp sự cố" }, false],
    ["kill unknown", aiKillSwitchSchema, { enabled: false, reason: "Khôi phục hoạt động", message: "x" }, false],
  ];

  for (const [name, schema, value, expected] of cases) {
    assert.equal(parses(schema, value), expected, name);
  }
});

test("log filters default pagination and accept only designed boolean semantics", () => {
  assert.deepEqual(aiLogsQuerySchema.parse({}), { page: 1, limit: 50 });

  const cases = [
    ["page below", { page: 0 }, false],
    ["limit upper", { limit: 100 }, true],
    ["limit above", { limit: 101 }, false],
    ["invalid feature", { feature: "transcription" }, false],
    ["invalid provider", { provider: "openai" }, false],
    ["invalid status", { status: "timeout" }, false],
    ["invalid feedback", { feedback: "neutral" }, false],
    ["unknown filter", { rawPrompt: true }, false],
    ["boolean true", { isTest: "true", safetyBlocked: true }, true],
    ["boolean false", { isTest: "false", safetyBlocked: false }, true],
    ["boolean uppercase", { isTest: "TRUE" }, false],
    ["boolean numeric", { isTest: 1 }, false],
  ];

  for (const [name, value, expected] of cases) {
    assert.equal(parses(aiLogsQuerySchema, value), expected, name);
  }
});

test("Vietnamese normalization handles NFC, NFD, and both forms of đ", () => {
  const nfd = "Điện đẹp".normalize("NFD");
  for (const value of ["điện đẹp", "ĐIỆN ĐẸP", nfd]) {
    assert.equal(normalizeKeyword(value, false), "điện đẹp");
    assert.equal(normalizeKeyword(value, true), "dien dep");
  }
});

test("the default Groq snapshot is schema-valid", () => {
  assert.equal(parses(aiConfigDataSchema, DEFAULT_AI_CONFIG), true);
});
