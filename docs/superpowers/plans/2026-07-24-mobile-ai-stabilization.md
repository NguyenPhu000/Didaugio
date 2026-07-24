# Mobile AI Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize the existing Genie mobile AI flows by removing duplicate intent routing, preserving planner input, enforcing server-side contracts and output allow-lists, protecting cost/privacy, bounding local retention, and serializing the Expo audio session.

**Architecture:** `AIPlanner.jsx` is the only mobile intent-routing boundary. Chat and itinerary generation remain separate features, while shared backend request guards, provider error normalization, per-user limiting, and structured-output validation protect every AI call. Small pure helpers hold parsing, retention, output-validation, and audio-transition logic so each behavior can be driven by focused tests.

**Tech Stack:** React Native 0.81, Expo SDK 54, React 19, Zustand 5, Vitest 3, Node.js test runner, Express 5, Zod 4, Prisma 5, Groq SDK 0.18.

## Global Constraints

- Preserve chat, itinerary preview/confirmation, voice transcription, and spoken replies.
- Do not build Admin UI, vector search, document ingestion, provider switching, or new AI product features.
- Mobile uses endpoint paths relative to `API_BASE_URL`; no path passed to `apiClient` may begin with `/api/`.
- Client messages may contain only `user` and `assistant` roles.
- Keep at most 20 messages, 4,000 characters per message, 16,000 combined characters, and seven days of local history.
- Structured itinerary output may reference only approved DB candidate IDs.
- Production logs must not contain raw prompts, raw responses, or response previews.
- Use tests first for every production-code change.
- Do not modify the user's unrelated changes in `app/package.json` or `web/src/components/auth/`.

---

### Task 1: Make Intent Routing Single-Source and Preserve Planner Parameters

**Files:**
- Create: `app/src/modules/ai/lib/plannerPreferences.js`
- Create: `app/src/modules/ai/lib/plannerPreferences.test.js`
- Create: `app/src/modules/ai/hooks/useGroqChat.contract.test.js`
- Modify: `app/src/modules/ai/lib/genieAssistantExperience.test.js`
- Modify: `app/src/modules/ai/lib/intentDetector.js`
- Modify: `app/src/modules/ai/hooks/useAIPlanner.js`
- Modify: `app/src/modules/ai/hooks/useGroqChat.js`
- Modify: `app/src/modules/ai/screens/AIPlanner.jsx`

**Interfaces:**
- Produces: `inferPlannerPreferences(text) -> { totalDays?, groupSize?, budget?, travelStyle? }`.
- Preserves: `useAIPlanner.sendMessage(userText, explicitPreferences)` sends `notes: userText`.
- Enforces: `useGroqChat.sendMessage(text, options?)` always calls `ENDPOINTS.ai.groqChat` and never calls a planner endpoint.
- Produces: `retryLastMessage()` resends the last failed chat request without appending a duplicate user message.

- [ ] **Step 1: Write failing intent, preference, and chat-only contract tests**

```js
// plannerPreferences.test.js
import { describe, expect, it } from "vitest";
import { inferPlannerPreferences } from "./plannerPreferences";

describe("inferPlannerPreferences", () => {
  it("extracts days, group size, and Vietnamese budget while preserving raw text elsewhere", () => {
    expect(inferPlannerPreferences("Lên lịch 3 ngày giá rẻ dưới 2 triệu cho 2 người")).toEqual({
      totalDays: 3,
      groupSize: 2,
      budget: 2_000_000,
      travelStyle: "budget",
    });
  });

  it("supports k notation and bounds unsafe quantities", () => {
    expect(inferPlannerPreferences("đi 99 ngày cho 40 người, khoảng 500k")).toMatchObject({
      totalDays: 14,
      groupSize: 12,
      budget: 500_000,
    });
  });
});
```

```js
// additions to genieAssistantExperience.test.js
test("keeps point-to-point route questions in chat", () => {
  expect(
    detectGenieIntent("Chỉ tôi lộ trình từ khách sạn ra bến Ninh Kiều"),
  ).toBe(GENIE_INTENT_TYPES.CHAT);
});

test("routes explicit multi-day planning to itinerary", () => {
  expect(detectGenieIntent("Lên lịch 3 ngày giá rẻ cho 2 người")).toBe(
    GENIE_INTENT_TYPES.ITINERARY,
  );
});
```

```js
// useGroqChat.contract.test.js
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./useGroqChat.js", import.meta.url)),
  "utf8",
);

describe("useGroqChat routing contract", () => {
  it("is chat-only", () => {
    expect(source).not.toContain("ITINERARY_PATTERN");
    expect(source).not.toContain("hybrid-plan");
    expect(source).toContain("ENDPOINTS.ai.groqChat");
  });

  it("supports retry without appending a duplicate user message", () => {
    expect(source).toContain("appendUserMessage");
    expect(source).toContain("retryLastMessage");
  });
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```powershell
npm.cmd test -- src/modules/ai/lib/plannerPreferences.test.js src/modules/ai/lib/genieAssistantExperience.test.js src/modules/ai/hooks/useGroqChat.contract.test.js
```

Expected: FAIL because `plannerPreferences.js` does not exist, route wording is misclassified, and `useGroqChat.js` still contains `ITINERARY_PATTERN` and `hybrid-plan`.

- [ ] **Step 3: Add the preference parser and remove planner routing from the chat hook**

```js
// plannerPreferences.js
const clamp = (value, max) =>
  Number.isFinite(value) && value > 0 ? Math.min(value, max) : undefined;

function parseBudget(text) {
  const match = text.match(
    /(?:dưới|khoảng|tầm|budget|ngân sách|giá)?\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|k|nghìn|ngàn)/i,
  );
  if (!match) return undefined;
  const amount = Number(match[1].replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  return Math.round(amount * (/triệu|tr/i.test(match[2]) ? 1_000_000 : 1_000));
}

export function inferPlannerPreferences(text = "") {
  const value = String(text);
  const dayMatch = value.match(/(\d{1,2})\s*(?:ngày|day)/i);
  const groupMatch = value.match(/(\d{1,2})\s*(?:người|person|people)/i);
  const result = {
    totalDays: clamp(Number(dayMatch?.[1]), 14),
    groupSize: clamp(Number(groupMatch?.[1]), 12),
    budget: parseBudget(value),
    travelStyle: /giá rẻ|tiết kiệm|du lịch bụi|budget/i.test(value)
      ? "budget"
      : undefined,
  };
  return Object.fromEntries(Object.entries(result).filter(([, item]) => item !== undefined));
}
```

In `useAIPlanner.js`, delete the local `inferPlannerPreferences`, import the helper, and build the payload with explicit preferences taking precedence:

```js
const inferred = inferPlannerPreferences(userText);
const payload = {
  totalDays: preferences.totalDays ?? inferred.totalDays ?? 1,
  travelStyle: preferences.travelStyle ?? inferred.travelStyle,
  groupSize: preferences.groupSize ?? inferred.groupSize ?? 1,
  budget: preferences.budget ?? inferred.budget,
  notes: userText.trim(),
};
```

In `intentDetector.js`, ensure navigation is evaluated before schedule and remove route-only terms from the schedule expression. In `useGroqChat.js`, delete `ITINERARY_PATTERN`, `hasCoords`, and the complete `if (isItineraryRequest && hasCoords)` branch. Add `lastFailedMessageRef`; append the user message only when `options.appendUserMessage !== false`; clear the ref on success; and expose:

```js
const retryLastMessage = useCallback(() => {
  const text = lastFailedMessageRef.current;
  if (!text) return Promise.resolve(null);
  return sendMessage(text, { appendUserMessage: false });
}, [sendMessage]);

const safeContext = {
  currentCoords: sessionContext.currentLocation,
  currentCity: sessionContext.currentCity,
  timeOfDay: sessionContext.timeOfDay,
  preferences: sessionContext.preferences,
  visitedPlaceIds: sessionContext.visitedPlaceIds,
  isPlaceQuery,
};

const response = await apiClient.post(
  ENDPOINTS.ai.groqChat,
  { messages: cleanMessages, context: safeContext },
  { signal: abortRef.current.signal, timeout: AI_REQUEST_TIMEOUT },
);
```

In `AIPlanner.jsx`, render the existing `common.retry` action only for `chatError` and call `retryLastMessage` inside the same loading/error lifecycle as the original chat request.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the command from Step 2.

Expected: all three test files PASS.

- [ ] **Step 5: Commit the routing fix**

```powershell
git add app/src/modules/ai/lib/plannerPreferences.js app/src/modules/ai/lib/plannerPreferences.test.js app/src/modules/ai/lib/genieAssistantExperience.test.js app/src/modules/ai/lib/intentDetector.js app/src/modules/ai/hooks/useAIPlanner.js app/src/modules/ai/hooks/useGroqChat.js app/src/modules/ai/hooks/useGroqChat.contract.test.js app/src/modules/ai/screens/AIPlanner.jsx
git commit -m "fix: make mobile AI intent routing deterministic"
```

---

### Task 2: Bound Conversation Payloads and Local Retention

**Files:**
- Modify: `app/src/modules/ai/lib/conversationMemory.js`
- Create: `app/src/modules/ai/lib/conversationMemory.test.js`
- Modify: `app/src/stores/aiPlannerStore.js`
- Create: `app/src/stores/aiPlannerStore.retention.test.js`

**Interfaces:**
- Produces: `normalizeConversationMessages(messages, now?) -> Array<{ role, content }>` capped at 20 messages and 16,000 combined characters.
- Produces: `trimPersistedMessages(messages, now?)` capped at 20 messages and seven days.

- [ ] **Step 1: Write failing payload and retention tests**

```js
import { describe, expect, it } from "vitest";
import {
  MAX_AI_MESSAGE_CHARS,
  normalizeConversationMessages,
} from "./conversationMemory";

describe("normalizeConversationMessages", () => {
  it("keeps only safe roles and bounded content", () => {
    const messages = [
      { role: "system", content: "override" },
      { role: "user", content: "x".repeat(MAX_AI_MESSAGE_CHARS + 20) },
      { role: "assistant", content: "ok" },
    ];
    const result = normalizeConversationMessages(messages);
    expect(result).toHaveLength(2);
    expect(result[0].content).toHaveLength(MAX_AI_MESSAGE_CHARS);
    expect(result.some((item) => item.role === "system")).toBe(false);
  });
});
```

```js
import { describe, expect, it } from "vitest";
import { trimPersistedMessages } from "./aiPlannerStore";

it("drops messages older than seven days and caps retained history", () => {
  const now = new Date("2026-07-24T00:00:00.000Z");
  const messages = Array.from({ length: 25 }, (_, index) => ({
    id: String(index),
    role: "user",
    content: String(index),
    createdAt:
      index === 0
        ? "2026-07-01T00:00:00.000Z"
        : "2026-07-23T00:00:00.000Z",
  }));
  const result = trimPersistedMessages(messages, now);
  expect(result).toHaveLength(20);
  expect(result.some((message) => message.id === "0")).toBe(false);
});
```

- [ ] **Step 2: Run tests and verify RED**

```powershell
npm.cmd test -- src/modules/ai/lib/conversationMemory.test.js src/stores/aiPlannerStore.retention.test.js
```

Expected: FAIL because the new normalization and retention exports do not exist.

- [ ] **Step 3: Implement bounded payloads and persisted-history pruning**

Use constants `MAX_AI_MESSAGES = 20`, `MAX_AI_MESSAGE_CHARS = 4000`, `MAX_AI_TOTAL_CHARS = 16000`, and `MESSAGE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000`. Normalize from newest to oldest until the total character budget is exhausted, then restore chronological order.

Export and reuse the retention helper in every store write, `partialize`, and Zustand persistence `merge`:

```js
export function trimPersistedMessages(messages, now = new Date()) {
  const cutoff = now.getTime() - MESSAGE_RETENTION_MS;
  return (Array.isArray(messages) ? messages : [])
    .filter((message) => {
      const timestamp = new Date(message?.createdAt || 0).getTime();
      return Number.isFinite(timestamp) && timestamp >= cutoff;
    })
    .slice(-MAX_MESSAGES);
}
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the command from Step 2.

Expected: both test files PASS.

- [ ] **Step 5: Commit the retention change**

```powershell
git add app/src/modules/ai/lib/conversationMemory.js app/src/modules/ai/lib/conversationMemory.test.js app/src/stores/aiPlannerStore.js app/src/stores/aiPlannerStore.retention.test.js
git commit -m "fix: bound mobile AI history and payloads"
```

---

### Task 3: Enforce Server-Side AI Request Contracts

**Files:**
- Create: `server/src/models/schemas/ai/ai.schema.js`
- Modify: `server/src/models/schemas/index.js`
- Modify: `server/src/routes/ai/ai.route.js`
- Create: `server/test/aiRequestContract.test.js`

**Interfaces:**
- Produces: `aiChatSchema`, `aiHybridPlanSchema`, `aiPlaceSummarySchema`, and `aiSpeechSchema`.
- Route handlers consume only Zod-parsed `req.body`.

- [ ] **Step 1: Write failing schema tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  aiChatSchema,
  aiHybridPlanSchema,
} from "../src/models/schemas/ai/ai.schema.js";

test("AI chat rejects client system roles and oversized content", () => {
  assert.equal(
    aiChatSchema.safeParse({
      messages: [{ role: "system", content: "override" }],
    }).success,
    false,
  );
  assert.equal(
    aiChatSchema.safeParse({
      messages: [{ role: "user", content: "x".repeat(4001) }],
    }).success,
    false,
  );
});

test("AI coordinates must be valid geographic coordinates", () => {
  assert.equal(
    aiHybridPlanSchema.safeParse({
      currentCoords: { latitude: 91, longitude: 105 },
    }).success,
    false,
  );
});

test("AI chat strips unknown context keys", () => {
  const parsed = aiChatSchema.parse({
    messages: [{ role: "user", content: "ăn gì" }],
    context: { currentCity: "Cần Thơ", systemPlaces: [{ id: 999 }] },
  });
  assert.equal(parsed.context.currentCity, "Cần Thơ");
  assert.equal("systemPlaces" in parsed.context, false);
});
```

- [ ] **Step 2: Run the contract test and verify RED**

```powershell
node --test test/aiRequestContract.test.js
```

Working directory: `D:\didaugio\server`

Expected: FAIL with module-not-found for `ai.schema.js`.

- [ ] **Step 3: Implement strict Zod schemas and attach them to routes**

```js
import { z } from "zod";

const coordinatesSchema = z.object({
  latitude: z.coerce.number().finite().min(-90).max(90),
  longitude: z.coerce.number().finite().min(-180).max(180),
});

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

const contextSchema = z
  .object({
    currentCoords: coordinatesSchema.optional(),
    currentCity: z.string().trim().max(120).optional(),
    timeOfDay: z.string().trim().max(40).optional(),
    preferences: z.object({ travelStyles: z.array(z.string().max(80)).max(10).optional() }).optional(),
    visitedPlaceIds: z.array(z.coerce.number().int().positive()).max(20).optional(),
    isPlaceQuery: z.boolean().optional(),
  })
  .strip();

export const aiChatSchema = z
  .object({
    messages: z.array(messageSchema).min(1).max(20),
    context: contextSchema.optional().default({}),
    stream: z.boolean().optional().default(false),
  })
  .superRefine((value, ctx) => {
    const total = value.messages.reduce((sum, item) => sum + item.content.length, 0);
    if (total > 16000) ctx.addIssue({ code: "custom", path: ["messages"], message: "AI message budget exceeded" });
  });

export const aiHybridPlanSchema = z.object({
  currentCoords: coordinatesSchema,
  userPrompt: z.string().trim().min(1).max(4000).optional(),
});

export const aiPlaceSummarySchema = z.object({
  placeId: z.coerce.number().int().positive(),
  context: z
    .object({ timeOfDay: z.string().trim().max(40).optional() })
    .strip()
    .optional()
    .default({}),
});

export const aiSpeechSchema = z.object({
  input: z.string().trim().min(1).max(1600),
  voice: z.string().trim().max(80).optional(),
});
```

Apply `validateBody(...)` to `/chat`, `/groq-chat`, `/hybrid-plan`, `/place-summary`, and `/voice/speech`. Multipart transcription remains validated after Multer because its fields are not JSON.

- [ ] **Step 4: Run contract and route tests**

```powershell
node --test test/aiRequestContract.test.js test/rateLimitStore.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit server request contracts**

```powershell
git add server/src/models/schemas/ai/ai.schema.js server/src/models/schemas/index.js server/src/routes/ai/ai.route.js server/test/aiRequestContract.test.js
git commit -m "fix: enforce AI request contracts"
```

---

### Task 4: Validate AI Structured Output Against DB Allow-Lists

**Files:**
- Create: `server/src/services/ai/aiOutputGuard.js`
- Create: `server/test/aiOutputGuard.test.js`
- Modify: `server/src/services/ai/hybridPlanner.service.js`
- Modify: `server/src/services/ai/itinerary.service.js`

**Interfaces:**
- Produces: `validateHybridPlanOutput(raw, places) -> validatedPlan`.
- Produces: `assertItineraryPlaceIds(days, places) -> days`.
- Throws errors with `statusCode = 502` and `code = "AI_INVALID_OUTPUT"`.

- [ ] **Step 1: Write failing allow-list tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  assertItineraryPlaceIds,
  validateHybridPlanOutput,
} from "../src/services/ai/aiOutputGuard.js";

const places = [{ id: 1 }, { id: 2 }];

test("hybrid output rejects unknown and duplicate place IDs", () => {
  assert.throws(
    () =>
      validateHybridPlanOutput(
        {
          tripSummary: {
            totalEstimatedPriceFrom: 0,
            totalEstimatedPriceTo: 100000,
            currency: "VND",
            costBreakdown: {
              food: { from: 0, to: 100000 },
              tickets: { from: 0, to: 0 },
              transportEstimated: { from: 0, to: 0 },
            },
          },
          timeline: [
            { timeSlot: "Sáng", placeId: 1, reason: "A" },
            { timeSlot: "Trưa", placeId: 1, reason: "B" },
            { timeSlot: "Chiều", placeId: 999, reason: "C" },
          ],
        },
        places,
      ),
    (error) => error.code === "AI_INVALID_OUTPUT",
  );
});

test("itinerary days reject IDs outside the candidate set", () => {
  assert.throws(
    () => assertItineraryPlaceIds([{ dayNumber: 1, destinations: [{ placeId: 9 }] }], places),
    (error) => error.code === "AI_INVALID_OUTPUT",
  );
});
```

- [ ] **Step 2: Run the output test and verify RED**

```powershell
node --test test/aiOutputGuard.test.js
```

Expected: FAIL because `aiOutputGuard.js` does not exist.

- [ ] **Step 3: Implement strict output schemas and wire both planners**

Create bounded Zod schemas for the hybrid summary and timeline. Use `.min(0).max(1_000_000_000)` for monetary values, `.min(1).max(6)` for timeline length, and `.max(240)` for reasons. After schema parsing, compare every ID with `new Set(places.map(({ id }) => Number(id)))` and reject duplicates or unknown IDs.

In `hybridPlanner.service.js`, replace the structural `if` check with:

```js
planData = validateHybridPlanOutput(parseAiJsonObject(rawText), places);
```

In `itinerary.service.js`, after parsing and before correcting or caching:

```js
parsed.days = assertItineraryPlaceIds(parsed.days, places);
```

- [ ] **Step 4: Run output and itinerary-focused tests**

```powershell
node --test test/aiOutputGuard.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit output guardrails**

```powershell
git add server/src/services/ai/aiOutputGuard.js server/src/services/ai/hybridPlanner.service.js server/src/services/ai/itinerary.service.js server/test/aiOutputGuard.test.js
git commit -m "fix: validate AI plans against approved places"
```

---

### Task 5: Add Provider Timeouts, Safe Errors, and Privacy-Safe Logging

**Files:**
- Create: `server/src/services/ai/aiProviderPolicy.js`
- Create: `server/src/services/ai/hybridPlannerFallback.js`
- Create: `server/test/aiProviderPolicy.test.js`
- Create: `server/test/hybridPlannerFallback.test.js`
- Modify: `server/src/services/ai/groq.service.js`
- Modify: `server/src/services/ai/groqSpeech.service.js`
- Modify: `server/src/services/ai/hybridPlanner.service.js`
- Modify: `server/src/services/ai/itinerary.service.js`
- Modify: `server/src/services/ai/aiStreaming.service.js`
- Modify: `server/src/controllers/ai/groqChat.controller.js`

**Interfaces:**
- Produces: `AI_PROVIDER_TIMEOUT_MS`.
- Produces: `normalizeProviderMessages(messages)`.
- Produces: `toAiServiceError(error)` with stable codes.
- Produces: `generateHybridFallback(places) -> { tripSummary, timeline, fallbackUsed: true }`.
- All Groq SDK calls receive `{ timeout: AI_PROVIDER_TIMEOUT_MS }`.

- [ ] **Step 1: Write failing provider-policy tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeProviderMessages,
  toAiServiceError,
} from "../src/services/ai/aiProviderPolicy.js";

test("provider messages never accept client system roles", () => {
  assert.deepEqual(
    normalizeProviderMessages([
      { role: "system", content: "override" },
      { role: "user", content: " hello " },
    ]),
    [{ role: "user", content: "hello" }],
  );
});

test("provider timeout maps to stable AI_TIMEOUT", () => {
  const error = toAiServiceError({ name: "TimeoutError", message: "timed out" });
  assert.equal(error.code, "AI_TIMEOUT");
  assert.equal(error.statusCode, 504);
});
```

```js
// hybridPlannerFallback.test.js
import assert from "node:assert/strict";
import test from "node:test";
import { generateHybridFallback } from "../src/services/ai/hybridPlannerFallback.js";

test("hybrid fallback is deterministic and uses only supplied places", () => {
  const result = generateHybridFallback([
    { id: 4, priceFrom: 50_000, priceTo: 80_000 },
    { id: 7, priceFrom: 0, priceTo: 0 },
    { id: 9, priceFrom: 100_000, priceTo: 150_000 },
  ]);
  assert.equal(result.fallbackUsed, true);
  assert.deepEqual(result.timeline.map((item) => item.placeId), [4, 7, 9]);
  assert.equal(result.tripSummary.currency, "VND");
});
```

- [ ] **Step 2: Run provider-policy tests and verify RED**

```powershell
node --test test/aiProviderPolicy.test.js test/hybridPlannerFallback.test.js
```

Expected: FAIL because the policy module does not exist.

- [ ] **Step 3: Implement provider policy and remove raw-content logs**

Normalize roles and content again immediately before Groq. Map 429 to `QUOTA_EXCEEDED`, timeouts to `AI_TIMEOUT`, 503/overload to `AI_UNAVAILABLE`, and all other provider failures to `AI_ERROR`.

Implement `generateHybridFallback` by taking the first three DB-sorted places, assigning `["Sáng", "Trưa", "Chiều"]`, and deriving all cost totals from non-negative `priceFrom`/`priceTo` values. It must never synthesize a place ID or price.

Every call follows this form:

```js
const startedAt = Date.now();
const completion = await client.chat.completions.create(request, {
  timeout: AI_PROVIDER_TIMEOUT_MS,
});
console.info("[AI]", {
  feature: "chat",
  model: GROQ_MODEL,
  latencyMs: Date.now() - startedAt,
  totalTokens: completion.usage?.total_tokens ?? null,
  finishReason: completion.choices?.[0]?.finish_reason ?? null,
});
```

Delete raw reply previews, raw failed JSON, and related-place arrays from logs. SSE errors send `[ERROR] AI_UNAVAILABLE` or another stable code, never `error.message`.

Pass `{ timeout: AI_PROVIDER_TIMEOUT_MS }` to chat, itinerary, hybrid, transcription, and speech SDK calls. In `generateHybridPlan`, catch only `AI_TIMEOUT`, `QUOTA_EXCEEDED`, and `AI_UNAVAILABLE` and return `generateHybridFallback(places)`; continue rejecting `AI_INVALID_OUTPUT`.

- [ ] **Step 4: Run provider and output tests**

```powershell
node --test test/aiProviderPolicy.test.js test/hybridPlannerFallback.test.js test/aiOutputGuard.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit provider resilience**

```powershell
git add server/src/services/ai/aiProviderPolicy.js server/src/services/ai/hybridPlannerFallback.js server/src/services/ai/groq.service.js server/src/services/ai/groqSpeech.service.js server/src/services/ai/hybridPlanner.service.js server/src/services/ai/itinerary.service.js server/src/services/ai/aiStreaming.service.js server/src/controllers/ai/groqChat.controller.js server/test/aiProviderPolicy.test.js server/test/hybridPlannerFallback.test.js
git commit -m "fix: bound AI provider calls and protect logs"
```

---

### Task 6: Apply Per-User AI Rate Limiting to Every AI Endpoint

**Files:**
- Modify: `server/src/middlewares/rateLimitMiddleware.js`
- Modify: `server/src/routes/ai/ai.route.js`
- Modify: `server/src/routes/index.js`
- Modify: `server/test/rateLimitStore.test.js`

**Interfaces:**
- Produces: `buildAiRateLimitKey(req) -> "user:<id>" | "ip:<normalized-ip>"`.
- Produces: `aiUserLimiter`, applied after authentication inside the AI router.

- [ ] **Step 1: Write failing identity-key tests**

```js
import { buildAiRateLimitKey } from "../src/middlewares/rateLimitMiddleware.js";

test("AI limiter isolates authenticated users behind one IP", () => {
  assert.equal(buildAiRateLimitKey({ user: { id: 41 }, ip: "10.0.0.1" }), "user:41");
  assert.equal(buildAiRateLimitKey({ user: { id: 42 }, ip: "10.0.0.1" }), "user:42");
});
```

- [ ] **Step 2: Run limiter tests and verify RED**

```powershell
node --test test/rateLimitStore.test.js
```

Expected: FAIL because `buildAiRateLimitKey` is not exported.

- [ ] **Step 3: Implement and place the limiter after authentication**

Extend `createLimiter` to accept `keyGenerator`. Export `aiUserLimiter` with namespace `ai-user`, the existing `GROQ_CHAT_RATE_LIMIT_MAX` override, production default 60 requests/minute, and `keyGenerator: buildAiRateLimitKey`.

In `ai.route.js`:

```js
router.use(authenticate);
router.use(aiUserLimiter);
```

Remove repeated route-level `authenticate` calls. Remove the earlier global `/api/ai/groq-chat` and `/api/ai/voice` limiter registrations from `routes/index.js` to prevent double charging.

- [ ] **Step 4: Run limiter and AI request tests**

```powershell
node --test test/rateLimitStore.test.js test/aiRequestContract.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit AI cost protection**

```powershell
git add server/src/middlewares/rateLimitMiddleware.js server/src/routes/ai/ai.route.js server/src/routes/index.js server/test/rateLimitStore.test.js
git commit -m "fix: rate limit AI requests per authenticated user"
```

---

### Task 7: Serialize and Restore the Expo Audio Session

**Files:**
- Create: `app/src/modules/ai/hooks/audioSessionController.js`
- Create: `app/src/modules/ai/hooks/audioSessionController.test.js`
- Modify: `app/src/modules/ai/hooks/useGenieVoice.js`
- Modify: `app/src/modules/ai/hooks/useGenieVoiceController.test.js`

**Interfaces:**
- Produces: `RECORDING_AUDIO_MODE`, `IDLE_AUDIO_MODE`.
- Produces: `createAsyncGate() -> { run(task), isLocked() }`.
- `useGenieVoice` uses one gate for permission, audio-mode, recorder prepare/start, recorder stop, and mode restoration.

- [ ] **Step 1: Write failing audio-mode and serialization tests**

```js
import { describe, expect, it, vi } from "vitest";
import {
  IDLE_AUDIO_MODE,
  RECORDING_AUDIO_MODE,
  createAsyncGate,
} from "./audioSessionController";

describe("audioSessionController", () => {
  it("uses non-exclusive audio interaction modes", () => {
    expect(RECORDING_AUDIO_MODE).toMatchObject({
      allowsRecording: true,
      interruptionMode: "duckOthers",
    });
    expect(IDLE_AUDIO_MODE).toMatchObject({
      allowsRecording: false,
      interruptionMode: "mixWithOthers",
    });
  });

  it("rejects overlapping hardware transitions", async () => {
    let release;
    const gate = createAsyncGate();
    const first = gate.run(() => new Promise((resolve) => { release = resolve; }));
    await Promise.resolve();
    expect(await gate.run(vi.fn())).toBe(false);
    release("done");
    expect(await first).toBe("done");
    expect(gate.isLocked()).toBe(false);
  });
});
```

- [ ] **Step 2: Run audio tests and verify RED**

```powershell
npm.cmd test -- src/modules/ai/hooks/audioSessionController.test.js src/modules/ai/hooks/useGenieVoiceController.test.js
```

Expected: FAIL because `audioSessionController.js` does not exist.

- [ ] **Step 3: Implement the gate and restore session state on every exit**

```js
export const RECORDING_AUDIO_MODE = Object.freeze({
  allowsRecording: true,
  playsInSilentMode: true,
  interruptionMode: "duckOthers",
});

export const IDLE_AUDIO_MODE = Object.freeze({
  allowsRecording: false,
  playsInSilentMode: true,
  interruptionMode: "mixWithOthers",
});

export function createAsyncGate() {
  let locked = false;
  return {
    isLocked: () => locked,
    run: async (task) => {
      if (locked) return false;
      locked = true;
      try {
        return await task();
      } finally {
        locked = false;
      }
    },
  };
}
```

Create the gate once with `useRef(createAsyncGate())`. Wrap start and stop transitions in `gate.run`. Put idle-mode restoration in failure paths and after recorder stop. Add unmount cleanup that stops Expo Speech and calls `setAudioModeAsync(IDLE_AUDIO_MODE).catch(() => {})`. Do not invoke state setters after the hook has unmounted.

- [ ] **Step 4: Run focused voice tests and verify GREEN**

Run the command from Step 2.

Expected: PASS.

- [ ] **Step 5: Commit audio lifecycle stabilization**

```powershell
git add app/src/modules/ai/hooks/audioSessionController.js app/src/modules/ai/hooks/audioSessionController.test.js app/src/modules/ai/hooks/useGenieVoice.js app/src/modules/ai/hooks/useGenieVoiceController.test.js
git commit -m "fix: serialize Genie voice audio sessions"
```

---

### Task 8: Run AI Regression Gates and Document Remaining External Failures

**Files:**
- Modify only if a newly introduced AI regression is discovered.

**Interfaces:**
- Consumes every focused test suite from Tasks 1–7.
- Produces a verified working tree with no new AI regression.

- [ ] **Step 1: Run all mobile AI tests**

```powershell
npm.cmd test -- src/modules/ai src/stores/aiPlannerStore.retention.test.js
```

Working directory: `D:\didaugio\app`

Expected: PASS.

- [ ] **Step 2: Run all new server AI tests**

```powershell
node --test test/aiRequestContract.test.js test/aiOutputGuard.test.js test/aiProviderPolicy.test.js test/hybridPlannerFallback.test.js test/rateLimitStore.test.js
```

Working directory: `D:\didaugio\server`

Expected: PASS.

- [ ] **Step 3: Run mobile lint**

```powershell
npm.cmd run lint
```

Working directory: `D:\didaugio\app`

Expected: zero errors in changed AI files. Pre-existing unrelated errors, if any, are recorded with their exact file paths.

- [ ] **Step 4: Run complete mobile and server suites**

```powershell
npm.cmd test
```

Working directory: `D:\didaugio\app`

```powershell
npm.cmd test
```

Working directory: `D:\didaugio\server`

Expected: all AI tests pass. The known splash-screen failures may remain only if the user's unrelated working-tree changes still violate their existing contract; no AI change may add a failure.

- [ ] **Step 5: Inspect the final diff**

```powershell
git diff --check
git status --short
git diff -- app/src/modules/ai app/src/stores/aiPlannerStore.js server/src/services/ai server/src/routes/ai server/src/middlewares/rateLimitMiddleware.js server/test
```

Expected: no whitespace errors, no API key or secret, no raw prompt/response logging, and unrelated user changes remain untouched.

- [ ] **Step 6: Commit any test-only correction made during final verification**

If verification required an AI-scoped correction, stage only those exact files and commit:

```powershell
git commit -m "test: complete mobile AI stabilization gates"
```

If no correction was required, do not create an empty commit.
