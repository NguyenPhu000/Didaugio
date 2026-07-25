# Task 6 Report — Published Mobile AI Runtime and Thumbs Feedback

## Status

Implemented and verified. Commit: `d7f301c` (`feat: apply published AI runtime to mobile`).

## Scope delivered

- Chat, Trip Planner, Hybrid Planner, Voice introduction, transcription, TTS, and the remaining Navigation Groq call sites now consume published provider credentials/base URL/model parameters through the production runtime path.
- `executeAiRequest` retains its UUID and additively returns the successful `AiRequestLog.id` as `requestLogId`.
- Chat, Planner preview, and Voice introduction expose `requestLogId` only for completed assistant text. Transcription and TTS transport responses do not expose it.
- Published Chat/Planner/Voice prompts are prepended as persona/task input. Server-owned place allowlists, output schemas, and safety/output instructions remain appended and authoritative. Unknown `{{variable}}` references fail before the provider call.
- Groq STT/TTS retain the server-owned transcription model, TTS model, and TTS voice environment settings while consuming the published credential/base URL and timeout.
- Removed the new `AiPromptHistory` write from trip generation; the legacy table remains untouched.
- Existing `/api/feedback` now verifies an AI request log, updates only `feedback` and `feedbackReason`, and creates a de-identified existing `FeedbackReport` without prompt/response content.
- Mobile Chat and Planner preserve `requestLogId` in assistant messages. Accessible memoized thumbs controls use `Pressable`, static styles, 44px targets, stable callbacks, duplicate-submission gating, pending/success/error states, and the existing authenticated API client.
- Voice/chat SSE text is buffered until output safety succeeds, then emitted under the existing SSE content contract with an additive named `metadata` event for `requestLogId`.

## Files

### Server

- `server/src/controllers/ai/ai.controller.js`
- `server/src/controllers/ai/aiNavigation.controller.js`
- `server/src/controllers/ai/groqChat.controller.js`
- `server/src/controllers/ai/hybridPlanner.controller.js`
- `server/src/lib/promptBuilder.js`
- `server/src/modules/navigation/navigation.service.js`
- `server/src/services/ai/aiNavigation.service.js`
- `server/src/services/ai/aiProviderPolicy.js`
- `server/src/services/ai/aiStreaming.service.js`
- `server/src/services/ai/groq.service.js`
- `server/src/services/ai/groqSpeech.service.js`
- `server/src/services/ai/hybridPlanner.service.js`
- `server/src/services/ai/itinerary.service.js`
- `server/src/services/ai/runtime/aiRuntimeExecution.js`
- `server/src/services/app/app.service.js`
- `server/src/services/trip/tripAiPlanner.service.js`
- `server/test/aiProviderPolicy.test.js`
- `server/test/aiRuntimeIntegration.test.js` (force-added because repository ignore rules exclude `server/test`)
- `server/test/aiFeedbackIntegration.test.js` (force-added for metadata-only feedback behavior)

### Mobile

- `app/src/modules/ai/components/genie/AIPlannerMessageItem.jsx`
- `app/src/modules/ai/hooks/useAIPlanner.js`
- `app/src/modules/ai/hooks/useAIPlanner.contract.test.js`
- `app/src/modules/ai/hooks/useGroqChat.js`
- `app/src/modules/ai/hooks/useGroqChat.contract.test.js`
- `app/src/modules/ai/lib/aiFeedback.js`
- `app/src/modules/ai/lib/aiFeedback.test.js` (force-added because repository ignore rules exclude new tests)
- `app/src/modules/ai/lib/genieAssistantExperience.js`
- `app/src/modules/ai/lib/genieAssistantExperience.test.js`

## TDD RED evidence

1. `cd server; node --test test/aiRuntimeIntegration.test.js`
   - RED: 1 pass, 2 fails.
   - Expected failures: hard-coded `process.env.GROQ_API_KEY`; successful runtime execution omitted numeric `requestLogId`.
   - The AiPromptHistory assertion was strengthened to match the real multiline call and then failed until the write was removed.
2. `cd app; npm.cmd test -- src/modules/ai/lib/aiFeedback.test.js`
   - RED: suite failed because `./aiFeedback` did not exist.
3. `cd server; node --test test/aiFeedbackIntegration.test.js`
   - RED: module did not export `createFeedbackSubmissionService`.
4. First focused regression run:
   - 62/65 passed; three suites failed on the stale `GROQ_MODEL` navigation import.
   - After following that real call site, the next run was 84/86; the remaining expectations still required the old environment-owned timeout contract.
   - The contract was updated to require published `providerOptions.timeoutMs`.

## Verification commands and results

### Server

```powershell
cd D:\didaugio\.worktrees\lean-admin-ai\server
node --test test/aiOutputGuard.test.js test/aiProviderPolicy.test.js test/aiRequestContract.test.js test/aiRouteSecurity.test.js test/aiStreaming.test.js test/hybridPlannerFallback.test.js test/itineraryFallback.test.js test/tripAiPlannerSecurity.test.js test/aiRuntimeIntegration.test.js test/aiRuntimeConfig.test.js test/aiRuntimeSafety.test.js test/aiFeedbackIntegration.test.js
```

Result: PASS — 89 tests, 89 passed, 0 failed.

### Mobile

```powershell
cd D:\didaugio\.worktrees\lean-admin-ai\app
npm.cmd test -- src/modules/ai/lib/aiFeedback.test.js src/modules/ai/lib/genieAssistantExperience.test.js src/modules/ai/hooks/useGroqChat.contract.test.js src/modules/ai/hooks/useAIPlanner.contract.test.js
```

Result: PASS — 4 files, 21 tests passed.

```powershell
npx.cmd eslint src/modules/ai/components/genie/AIPlannerMessageItem.jsx src/modules/ai/hooks/useGroqChat.js src/modules/ai/hooks/useAIPlanner.js src/modules/ai/lib/aiFeedback.js src/modules/ai/lib/genieAssistantExperience.js src/modules/feedback/api/feedbackApi.js
```

Result: PASS — exit code 0, no lint findings.

```powershell
git diff --check
```

Result: PASS — no whitespace errors (only repository line-ending notices).

## Self-review

- Runtime override and kill-switch bypass were not added; production calls use `executeAiRequest`.
- Keyword safety remains normalized substring-only; exact/regex modes were not introduced.
- Provider secrets resolve only inside the runtime operation and are never returned or logged.
- Context is filtered through `buildAllowedContext`; exact navigation coordinates were removed from provider prompts.
- Provider events contain metadata only. AI feedback reports set `reporterId: null` and do not copy prompt/response text.
- Planner fallback remains deterministic and intentionally receives no successful `requestLogId`.
- Existing mobile API client, auth refresh, request cancellation, error mapping, and response shapes remain in place; additions are additive.

## Concerns / follow-up

- SSE response timing changes from token-by-token forwarding to buffered emission so the shared output-safety gate can complete before text reaches the client. The payload framing remains SSE-compatible, but perceived first-token latency may increase.
- No live Groq/credential integration call was made; verification uses repository integration and contract tests.

## Review fix round 1/5

All four Important findings in `task-6-review.md` were fixed without adding a table or endpoint:

1. AI feedback now requires an authenticated actor, derives the same domain-separated `ai-log:` HMAC used at reservation time, and atomically looks up only an owner-matching, successful, non-Test-Lab, completed text feature. Guest, foreign, unknown, failed, test, and STT/TTS targets share the same safe unavailable response. The update remains exactly `feedback` plus `feedbackReason`.
2. Navigation now constructs a strict bounded provider payload before entering the runtime operation. Only bounded origin/destination labels, route IDs/numeric metrics/summaries, waypoint labels, and approved context primitives can reach the prompt; direct identifiers, coordinates, extra keys, and excess text are removed. Every provider-bound primitive is included in input safety, with injected-provider tests proving blocked values never cross the provider boundary.
3. Test Lab now calls `renderConfiguredPrompt` with the allowed context before credential resolution or provider execution. Unknown variables return stable `AI_INVALID_REQUEST`, record metadata-only failure completion, and cause zero secret/provider calls.
4. Numeric feedback IDs are now limited to non-empty successful production output from `chat`, `planner`, and `voice-introduction`. Empty and tag-only chat output and empty voice introductions complete as `error/AI_EMPTY_OUTPUT` while preserving existing local fallback behavior and expose no ID. Voice transcription and speech use distinct free-form log features and never expose IDs. Mobile response normalization and the chat hook defensively drop IDs from empty/local no-content fallback messages.

### Round 1 RED evidence

```powershell
cd D:\didaugio\.worktrees\lean-admin-ai\server
node --test test/aiFeedbackIntegration.test.js test/aiRuntimeIntegration.test.js test/aiRuntimeConfig.test.js
```

Result: RED as expected — feedback tests failed on the ID-only `findUnique`; Test Lab accepted an unknown variable; navigation lacked the injectable safe service boundary. The run reported 31 passes and 4 failing test files/tests.

```powershell
cd D:\didaugio\.worktrees\lean-admin-ai\app
npm.cmd test -- --run src/modules/ai/lib/genieAssistantExperience.test.js
```

Result: RED as expected — 8 passed, 1 failed because an empty provider reply retained request log ID `73`.

### Round 1 GREEN and final verification

Focused GREEN:

- Server feedback/runtime/navigation/Test Lab: 42/42 passed.
- Mobile response normalization: 9/9 passed.
- Final focused mobile normalization + no-content hook behavior: 15/15 passed.
- Final focused navigation runtime behavior: 8/8 passed.

Full verification:

```powershell
cd D:\didaugio\.worktrees\lean-admin-ai\server
npm.cmd test
```

Result: PASS — 138/138.

```powershell
cd D:\didaugio\.worktrees\lean-admin-ai\app
npm.cmd test
npm.cmd run lint
```

Result: tests PASS — 25 files, 100/100. Expo lint PASS with 0 errors and one unrelated pre-existing unused import warning in `app/(auth)/login.jsx`.

Focused lint on all changed Mobile files: PASS with no findings.

`node --check` on every changed Server source/test file: PASS.

`git diff --check`: PASS.
