import { z } from "zod";

export const AI_CONTEXT_SOURCES = [
  "coarseLocation",
  "travelPreferences",
  "budget",
  "partySize",
  "tripDuration",
  "transportPreference",
  "places",
  "events",
  "sessionMessages",
  "time",
  "weather",
  "openingStatus",
];

export const AI_CONTEXT_FIELDS = [
  "currentCity",
  "travelPreferences",
  "budget",
  "partySize",
  "tripDuration",
  "transportPreference",
  "places",
  "events",
  "messages",
  "timeOfDay",
  "weather",
  "openingStatus",
];

const collapsesWhitespace = (value) => {
  let result = "";
  let needsSpace = false;

  for (const character of value) {
    if (character.trim() === "") {
      needsSpace = result.length > 0;
      continue;
    }
    if (needsSpace) result += " ";
    result += character;
    needsSpace = false;
  }

  return result;
};

const stripsVietnameseDiacritics = (value) => {
  let result = "";
  for (const character of value.normalize("NFD")) {
    const codePoint = character.codePointAt(0);
    if (codePoint >= 0x0300 && codePoint <= 0x036f) continue;
    result += character === "đ" ? "d" : character;
  }
  return result;
};

export const normalizeKeyword = (value, diacriticInsensitive = false) => {
  const normalized = collapsesWhitespace(
    String(value ?? "").normalize("NFC").trim().toLocaleLowerCase("vi-VN"),
  );
  return diacriticInsensitive ? stripsVietnameseDiacritics(normalized) : normalized;
};

const providerSchema = z.object({
  adapter: z.literal("groq"),
  baseUrl: z.string().url().max(300).refine(
    (value) => new URL(value).origin === "https://api.groq.com",
    "Groq base URL is not approved",
  ),
  model: z.string().trim().min(1).max(160),
  secretReference: z.string().trim().min(1).max(100),
}).strict();

const modelParametersSchema = z.object({
  temperature: z.number().min(0).max(1),
  topP: z.number().min(0).max(1),
  maxTokens: z.number().int().min(256).max(4096),
  timeoutMs: z.number().int().min(3000).max(30000),
}).strict();

const promptsSchema = z.object({
  chat: z.string().trim().min(1).max(12000),
  planner: z.string().trim().min(1).max(12000),
  voice: z.string().trim().min(1).max(12000),
}).strict();

const contextSchema = z.object({
  enabledSources: z.array(z.enum(AI_CONTEXT_SOURCES)).max(AI_CONTEXT_SOURCES.length),
  fieldAllowlist: z.array(z.enum(AI_CONTEXT_FIELDS)).max(AI_CONTEXT_FIELDS.length),
  maxTokens: z.number().int().min(256).max(4000),
  freshnessTtl: z.number().int().min(0).max(86400),
}).strict();

const safetySchema = z.object({
  blockedKeywords: z.array(z.string().trim().min(1).max(120)).max(500),
  matchMode: z.enum(["exact", "substring"]),
  diacriticInsensitive: z.boolean(),
  safeResponse: z.string().trim().min(1).max(1000),
}).strict();

const quotasSchema = z.object({
  freeDailyRequests: z.number().int().min(0).max(10000),
  premiumDailyRequests: z.number().int().min(0).max(10000),
}).strict();

const fallbackSchema = z.object({
  maintenanceMessage: z.string().trim().min(1).max(1000),
  staticPlannerEnabled: z.boolean(),
}).strict();

export const aiConfigDataSchema = z.object({
  provider: providerSchema,
  modelParameters: modelParametersSchema,
  prompts: promptsSchema,
  context: contextSchema,
  safety: safetySchema,
  quotas: quotasSchema,
  fallback: fallbackSchema,
}).strict();

const changeReasonSchema = z.string().trim().min(5).max(300);

export const aiDraftUpdateSchema = z.object({
  revision: z.number().int().nonnegative(),
  configData: aiConfigDataSchema,
  changeReason: changeReasonSchema,
  providerSecret: z.string().trim().min(20).max(500).optional(),
}).strict();

export const aiTestRequestSchema = z.object({
  source: z.enum(["draft", "published"]),
  feature: z.enum(["chat", "planner", "voice"]),
  message: z.string().trim().min(1).max(4000),
  context: z.object({
    currentCity: z.string().trim().max(120).optional(),
    budget: z.number().nonnegative().optional(),
    partySize: z.number().int().min(1).max(20).optional(),
    tripDuration: z.number().int().min(1).max(14).optional(),
  }).strict().optional().default({}),
}).strict();

export const aiPublishSchema = z.object({
  revision: z.number().int().nonnegative(),
  changeReason: changeReasonSchema,
}).strict();

export const aiRollbackSchema = z.object({
  targetVersion: z.number().int().positive(),
  changeReason: changeReasonSchema,
}).strict();

export const aiKillSwitchSchema = z.object({
  enabled: z.boolean(),
  reason: changeReasonSchema,
}).strict();

const queryBooleanSchema = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

export const aiLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  feature: z.enum(["chat", "planner", "voice"]).optional(),
  provider: z.literal("groq").optional(),
  status: z.enum(["started", "success", "error", "blocked"]).optional(),
  safetyBlocked: queryBooleanSchema.optional(),
  feedback: z.enum(["up", "down"]).optional(),
  isTest: queryBooleanSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
}).strict();
