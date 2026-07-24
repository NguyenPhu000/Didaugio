# Mobile AI Stabilization Design

**Date:** 2026-07-24

**Scope:** React Native/Expo mobile AI flows and the backend endpoints they call

**Excluded:** Admin Control Center, vector database, document ingestion, provider switching, and new AI product features

## Objective

Make the existing Genie mobile experience deterministic, safe, and testable without introducing a second routing system or a provider rewrite. The completed work must preserve chat, itinerary preview/confirmation, voice transcription, and spoken replies while eliminating the known routing, payload, validation, privacy, and audio-session defects.

## Confirmed Root Causes

1. `AIPlanner.jsx` classifies intent with `detectGenieIntent`, but `useGroqChat.js` independently reclassifies the same text with `ITINERARY_PATTERN`. Two classifiers with different vocabularies can route one message to different features.
2. The duplicated planner branch inside `useGroqChat.js` calls `"/api/ai/hybrid-plan"` even though `API_BASE_URL` already includes `/api`, producing `/api/api/ai/hybrid-plan` under the normal configuration.
3. That duplicated branch sends only coordinates. It discards the raw user request and therefore loses requested days, group size, budget, and travel style.
4. AI chat controllers accept arbitrary message roles and unbounded content, then append the client messages directly after the trusted system prompt.
5. Hybrid-plan output is parsed as JSON but is not fully constrained to the input place allow-list or bounded numeric values.
6. AI request and response previews are written to application logs.
7. Conversation content is retained in ordinary AsyncStorage with a high message cap and no age-based pruning.
8. Voice recording changes the global audio session between exclusive and ducking modes. Rapid actions are only partially serialized, and unmount/error cleanup does not guarantee restoration of the playback session.

## Chosen Architecture

### One Routing Decision

`AIPlanner.jsx` remains the single mobile routing boundary for this stabilization phase:

- `ITINERARY` calls `useAIPlanner.sendMessage`.
- Every other supported intent calls `useGroqChat.sendMessage`.
- `useGroqChat` becomes chat-only and must never call a planner endpoint.
- `useAIPlanner` always preserves the original text in `notes` and extracts only safe deterministic hints such as days, group size, and budget. The backend still receives the raw request.

Moving all intent classification to an LLM-backed backend router is intentionally deferred. It would add latency, cost, and a new failure point to every message. The current classifier will instead become one tested source of truth, with navigation phrases such as “lộ trình từ A đến B” explicitly separated from itinerary creation.

### Request Contracts

All chat requests are normalized at the server boundary:

- Allowed roles: `user`, `assistant`.
- Maximum messages: 20.
- Maximum content per message: 4,000 characters.
- Maximum combined content: 16,000 characters.
- Empty content and client-supplied `system` messages are rejected.
- Coordinates must be finite and within latitude/longitude bounds.
- Only approved context keys are accepted; client data cannot overwrite server-derived places, profile preferences, or location context.

Validation returns stable `400` responses with explicit error codes. The Groq service also normalizes roles defensively before provider invocation.

### Planner Output Guardrails

Hybrid output is accepted only after schema validation:

- Timeline contains 1–6 unique places.
- Every `placeId` exists in the server-provided allow-list.
- Price fields are finite, non-negative, and bounded.
- Time-slot and reason fields have bounded lengths.
- Invalid or duplicate entries are removed only when a valid plan remains; otherwise the request fails with `AI_INVALID_OUTPUT`.
- Navigation distance and duration are computed by server code, not trusted from model output.

The main itinerary flow continues using its existing Zod schema and deterministic fallback, with added checks that output place IDs belong to the clustered input places.

### Resilience and Cost Protection

- Chat, hybrid planner, place summary, and voice endpoints receive explicit AI rate limiting.
- Rate-limit identity prefers authenticated `userId` and falls back to IP.
- Provider calls use a bounded server timeout and convert timeout/quota/unavailable errors into stable application error codes.
- Hybrid planner gets a deterministic DB-based fallback when the provider is unavailable; malformed model output is not silently presented as a successful AI plan.
- Mobile request cancellation remains supported, and aborted requests do not append an assistant error message.

Daily subscription quota management belongs to the later Admin phase. This stabilization establishes the per-user limiter interface without coupling it to unfinished subscription policy.

### Privacy and Retention

- Production logs contain request metadata only: feature, model, latency, token counts, finish reason, and error code.
- Raw prompt/response previews are removed from normal logs.
- Mobile conversation persistence keeps at most 20 recent messages and drops messages older than seven days during hydration and writes.
- Clearing conversation removes persisted chat content.
- Existing itinerary history storage is not redesigned in this phase, but new chat logging must not add raw content to the database.

### Voice Session Lifecycle

The voice flow uses a serialized session controller:

- Recording mode uses `allowsRecording: true` with `interruptionMode: "duckOthers"` so other audio continues at reduced volume.
- Playback/idle mode uses `allowsRecording: false` with `interruptionMode: "mixWithOthers"` because Expo Speech manages its own playback session.
- Only one start or stop transition may execute at a time.
- A second tap during permission, prepare, stop, or transcription is ignored.
- Failed start/stop operations restore the idle session and expose a stable voice error.
- Component unmount stops speech/recording where safe and restores the idle session.

Expo SDK 54 documents `doNotMix` as exclusive focus, `duckOthers` as reduced background volume, and `mixWithOthers` as coexistence. The design keeps the unavoidable record-to-playback transition but serializes it and guarantees cleanup.

## Data Flow

1. User submits text or a voice transcript.
2. `AIPlanner.jsx` calls `detectGenieIntent` exactly once.
3. Itinerary requests go to `useAIPlanner`, which sends raw `notes` plus extracted structured hints to `/profile/trips/generate`.
4. Other requests go to chat-only `useGroqChat`, which sends a bounded conversation and safe context to `/ai/groq-chat`.
5. Backend validation sanitizes the request before DB retrieval or provider invocation.
6. Provider output is validated against DB-derived allow-lists.
7. Mobile stores a bounded, age-limited conversation and renders only normalized response data.

## Error Handling

- `AI_INVALID_REQUEST`: malformed messages or context.
- `AI_INVALID_OUTPUT`: provider returned unusable structured data.
- `AI_TIMEOUT`: provider exceeded the server deadline.
- `QUOTA_EXCEEDED`: provider or application rate limit reached.
- `AI_UNAVAILABLE`: provider unavailable or overloaded.
- Existing voice error codes remain stable; session restoration occurs before the error is exposed.

Mobile maps these codes to localized messages and offers retry without duplicating the previous user message.

## Test Strategy

Tests are written before each production change.

1. Intent tests prove navigation wording does not create an itinerary and explicit multi-day planning does.
2. Chat-hook contract tests prove it never calls `hybrid-plan`, always calls the canonical chat endpoint, preserves bounded history, and handles cancellation.
3. Planner preference tests prove raw text is preserved and days, people, and Vietnamese budget formats are extracted without overwriting explicit form values.
4. Server request-contract tests reject system roles, oversized histories, empty messages, invalid coordinates, and unsafe context overrides.
5. Hybrid output tests reject unknown/duplicate place IDs and invalid costs while accepting valid allow-listed plans.
6. Rate-limit tests prove authenticated users receive independent buckets.
7. Voice-session tests prove transitions are serialized, use non-exclusive modes, recover after failure, and restore idle mode on cleanup.
8. Persistence tests prove message count and seven-day retention.
9. Focused AI suites must pass. The full mobile and server suites are run afterward; unrelated pre-existing failures are reported separately.

## Acceptance Criteria

- No production code path in `useGroqChat` can create an itinerary.
- “Chỉ tôi lộ trình từ khách sạn ra bến Ninh Kiều” remains a chat/navigation request.
- “Lên lịch 3 ngày giá rẻ cho 2 người” reaches the planner with the original text, three days, two people, and a parsed budget hint when present.
- No normal mobile request produces `/api/api/...`.
- Client-supplied system prompts and oversized payloads never reach Groq.
- Structured plans cannot reference a place outside the DB candidate set.
- Voice actions cannot overlap audio-mode transitions.
- Production logging contains no raw chat or AI response preview.
- New focused tests pass and no new regression is introduced into existing AI tests.
