# Lean Admin AI Control Center — Design Specification

**Date:** 2026-07-24

**Status:** Approved design, awaiting written-spec review

**Delivery constraint:** One full-stack developer; prioritize a small, operable system over enterprise completeness.

## 1. Goal

Build a compact `/admin/ai` control center for the AI features already used by Mobile. Admins must be able to:

- See whether AI is healthy.
- Configure an approved provider, model, prompts, allowed context, keyword safety, and basic quotas.
- Test a draft before it affects Mobile.
- Publish or roll back configuration without redeploying the server.
- Disable AI safely during an incident.
- Inspect token usage, latency, errors, and feedback.

The implementation must add exactly three new Prisma models in phase one. Adding another model requires a separately approved design change.

## 2. Deliberate Scope Reduction

This specification replaces the earlier enterprise-scale design. Phase one does not build:

- RAG, Vector DB, Places/Events embedding synchronization, or document upload.
- Cache-management UI or cache invalidation jobs.
- Email/Telegram alerts.
- A general rule engine.
- Admin-authored regular expressions.
- Automatic multi-provider fallback.
- Redis Pub/Sub solely for AI configuration.
- Background-job infrastructure.
- Permanent raw conversation storage.
- A separate conversation-audit subsystem.
- Arbitrary REST APIs, headers, request templates, SQL, or executable code.

These items are not hidden requirements. Each needs its own future design and approval.

## 3. Existing Components to Reuse

- `SystemConfig`: store the global AI kill switch and other small scalar flags.
- `ApiKeyManagement`: migrate provider credentials to encrypted-at-rest values plus provider metadata.
- `AuditLog`: record sensitive configuration reads and all mutations.
- Existing Admin routes, sidebar, forms, tables, RBAC middleware, and permission cache.
- Existing Mobile Chat, Planner, Voice, and itinerary fallbacks.

`AiPromptHistory` stops receiving new requests after the new logging path is released. Required historical aggregates may be migrated once; two AI log systems must not run indefinitely.

## 4. Data Model: Exactly Three New Tables

### 4.1 `ai_configs`

One logical configuration record named `mobile_ai`.

Proposed fields:

- `id`
- `key` — unique; phase one uses `mobile_ai`
- `activeVersionId` — nullable pointer to the published version
- `draftVersionId` — nullable pointer to the current draft
- `status` — `active`, `maintenance`, or `disabled`
- `revision` — optimistic-lock counter
- `updatedBy`
- `createdAt`
- `updatedAt`

This table contains pointers and runtime state, not duplicated configuration JSON.

### 4.2 `ai_config_versions`

Stores immutable configuration snapshots.

Proposed fields:

- `id`
- `aiConfigId`
- `version`
- `status` — `draft`, `published`, or `archived`
- `configData` — validated JSON
- `changeReason`
- `createdBy`
- `createdAt`
- `publishedAt`

`configData` has a server-owned schema:

```text
provider:
  adapter, baseUrl, model, secretReference
modelParameters:
  temperature, topP, maxTokens, timeoutMs
prompts:
  chat, planner, voice
context:
  enabledSources, fieldAllowlist, maxTokens, freshnessTtl
safety:
  blockedKeywords, matchMode, safeResponse
quotas:
  freeDailyRequests, premiumDailyRequests
fallback:
  maintenanceMessage, staticPlannerEnabled
```

The schema rejects unknown top-level properties. Admins cannot store executable code, raw SQL, arbitrary HTTP bodies, or unregistered context sources.

Only the ten newest versions are retained after publication. The active version, current draft, and version needed for rollback are never deleted. Retention cleanup runs synchronously after a successful publish because the bounded operation does not justify background-job infrastructure.

Rollback copies a previous snapshot into a new version and publishes it. History is never rewritten.

### 4.3 `ai_request_logs`

Stores operational facts needed by the dashboard.

Proposed fields:

- `id`
- `requestId`
- `anonymousUserRef`
- `feature` — `chat`, `planner`, or `voice`
- `provider`
- `model`
- `configVersion`
- `inputTokens`
- `outputTokens`
- `latencyMs`
- `status`
- `errorCode`
- `safetyBlocked`
- `feedback` — nullable `up` or `down`
- `feedbackReason` — nullable bounded enum
- `isTest`
- `createdAt`
- `expiresAt`

Raw prompts, raw responses, exact coordinates, email, phone number, authentication data, and internal user IDs are not stored by default.

Production logs and Test Lab logs share the table but are separated by `isTest`. Dashboard queries exclude test rows unless explicitly requested.

Operational rows use a bounded retention period configured on the server. Phase one defaults to 90 days.

## 5. Provider and Secret Policy

Phase one supports the existing Groq adapter. The configuration schema may recognize other reviewed adapter names later, but the UI only exposes adapters implemented and tested by the backend.

Admin-configurable fields:

- Provider display name.
- Approved adapter.
- Allowlisted base URL.
- Model.
- Temperature, Top P, maximum output tokens, timeout.
- Secret reference.

Credential behavior:

- API keys are submitted as a write-only field of the draft-update endpoint.
- The server encrypts the value before saving it through the existing `ApiKeyManagement` model.
- The browser never receives the plaintext value after submission.
- Read responses expose only `configured`, masked suffix, and last-updated time.
- Logs and validation errors redact keys and authorization headers.

Cloud adapters reject loopback, link-local, metadata-service, and private-network destinations. Phase one does not support arbitrary REST provider definitions.

## 6. Dynamic Context

Admins select only backend-registered context sources:

- Coarse location or area.
- Travel preferences.
- Budget.
- Party size.
- Trip duration.
- Transport preference.
- Relevant Places and Events records.
- Bounded current-session messages.
- Time, weather, or opening status when an existing trusted source is available.

Excluded fields:

- Email and phone number.
- Authentication tokens.
- Internal user IDs.
- Full account profile.
- Complete historical conversations.
- Payment or unrelated booking data.
- Arbitrary database fields.

Each allowed source has a server-owned field allowlist. Admins may enable it and configure its token budget and freshness TTL. They cannot enter SQL, field paths outside the allowlist, or transformation code.

Test Lab displays a masked context preview with source, freshness, and token contribution.

## 7. Prompt Configuration

Phase one manages exactly three prompt scopes:

- Chat
- Planner
- Voice

Prompts live inside the versioned `configData` snapshot. A separate prompt-template table is intentionally not created.

Before saving or publishing, the server validates:

- Prompt length.
- Supported variables.
- Required variables.
- Rendered size limit.
- Absence of secrets.

Draft changes do not affect Mobile. Publish atomically changes `activeVersionId`. Concurrent edits use the `revision` value and cannot silently overwrite a newer draft.

## 8. Keyword Safety

Phase one supports:

- Exact phrase matching.
- Normalized substring matching.

It does not support Admin-authored regular expressions or topic classifiers.

Vietnamese input is normalized for case, whitespace, and Unicode composition. Diacritic-insensitive matching is an explicit per-list option because enabling it globally can produce false positives.

The same keyword list checks:

- User input before provider execution.
- Model output before returning to Mobile.

When blocked, the service records `safetyBlocked`, returns a stable public error code, and uses the configured safe response. Mobile never receives internal keyword details.

## 9. Basic Quotas

Phase one supports only daily request limits:

- Free user daily requests.
- Premium user daily requests.

It does not introduce a quota-policy table. Values live in versioned `configData`.

Quota counters reuse the project's existing shared cache if one is already operational. If the deployment is single-instance and no shared counter exists, a bounded database-backed implementation may be used. Redis is not introduced solely for this module without evidence that multi-instance quota consistency is required.

## 10. Runtime Resolution

For each Mobile AI request:

1. Read the kill switch.
2. Load the active configuration snapshot.
3. Check the daily request quota.
4. Normalize and check blocked input keywords.
5. Resolve only allowed context fields.
6. Render the feature prompt.
7. Call the configured provider adapter.
8. Validate the expected response shape.
9. Check blocked output keywords.
10. Return the response and record operational metadata.

The runtime may cache the published snapshot locally with a short TTL and its version number. Publish updates the database pointer first and invalidates the publishing process's local cache.

For a single server instance, no additional invalidation infrastructure is needed. Before a multi-instance deployment, configuration propagation must be revisited; Redis Pub/Sub or an equivalent shared invalidation mechanism is then a deployment requirement.

If configuration cannot be loaded, the service uses the last known valid snapshot. If none exists or the kill switch is active, Mobile receives the existing static fallback or maintenance response rather than crashing.

## 11. Admin Information Architecture

Phase one contains five screens.

### 11.1 Overview

- Active/maintenance/disabled state.
- Active provider and model.
- Request and token usage.
- Success/error rate.
- Average and P95 latency.
- Safety blocks.
- Recent negative feedback.

### 11.2 Configuration

One coherent page with sections for:

- Provider and model.
- Model parameters.
- API key status and rotation.
- Chat, Planner, and Voice prompts.
- Allowed dynamic context.
- Basic quotas.
- Fallback messages.

The sticky action bar separates `Save Draft`, `Test Draft`, `Publish`, and `Rollback`.

### 11.3 Safety

- Exact/substr keyword list.
- Import and export CSV.
- Vietnamese normalization options.
- Safe replacement response.
- Input/output batch test.
- Keyword trigger count.

### 11.4 Logs & Feedback

- Metadata-first request table.
- Feature, provider, status, error, safety, feedback, and date filters.
- Token and latency details.
- No raw conversation viewer in phase one.

### 11.5 Test Lab

- Select draft or production.
- Enter a test message and feature.
- Preview masked context.
- Show rendered prompt with sensitive values removed.
- Display result, tokens, latency, keyword matches, and validation errors.
- Mark every request as `isTest`.

## 12. UI/UX Direction

Use the existing Admin shell and an **AI Operations Cockpit** visual language:

- Light neutral/slate surfaces and graphite text.
- Indigo used sparingly for AI identity.
- Green, amber, red, and gray for operational states, always paired with text/icon labels.
- Tables and charts for dense operational data.
- Cards limited to priority KPIs and incidents.
- No decorative AI imagery, neon gradients, excessive glass effects, or marketing animations.
- Desktop supports all editing; mobile Admin focuses on Overview, logs, and kill-switch status.

Dangerous operations:

- Publish, rollback, credential replacement, and kill switch require a reason.
- Kill switch requires typed confirmation.
- Other operations use a normal confirmation dialog.
- Every mutation produces an existing `AuditLog` record.

## 13. API Surface: Eight Endpoints

All routes are under `/api/v1/admin/ai`.

1. `GET /overview`
2. `GET /config`
3. `PUT /config/draft`
4. `POST /config/test`
5. `POST /config/publish`
6. `POST /config/rollback`
7. `PUT /kill-switch`
8. `GET /logs`

Provider secret replacement is handled as an action within `PUT /config/draft`: the request may contain a new write-only secret, but configuration read responses never include it. The service writes the encrypted credential through the existing credential repository before storing its reference in the draft.

Safety CSV import/export is a client-side conversion between CSV and the blocked-keyword array already carried by the Configuration payload; it creates no additional endpoint. Feedback is read-only in this Admin phase and is ingested through the existing Mobile interaction path. If either workflow becomes unwieldy in real use, splitting endpoints requires a measured follow-up change.

## 14. Permissions

Phase one uses these capabilities:

- `ai.view`
- `ai.config.manage`
- `ai.config.publish`
- `ai.secrets.manage`
- `ai.logs.view`
- `ai.test.run`
- `ai.kill_switch.manage`

Suggested role defaults:

- Super Admin: all capabilities.
- Admin: view, manage draft, logs, test; publish only when explicitly granted.

Only Super Admin and Admin participate in the Admin AI module in phase one. Accounts without an explicitly granted AI permission cannot see its navigation or call its APIs.

Every endpoint enforces permissions on the backend. Sidebar and button visibility are convenience only.

## 15. Error Handling

- Draft validation returns field-level errors.
- A revision conflict returns the current revision and does not overwrite data.
- Provider tests distinguish timeout, authentication, quota, DNS/TLS, and response-format errors without exposing secrets.
- Publish is transactional: the complete version becomes active or the previous version remains active.
- Rollback cannot target an invalid or deleted snapshot.
- Dashboard panel failures are isolated and label stale data.
- Logging failures do not turn a successful Mobile AI response into an error.
- Mobile receives stable public codes and safe messages; stack traces remain server-side.

## 16. Testing

### Unit

- JSON configuration schema.
- Prompt-variable validation and rendering.
- Context allowlist, masking, TTL, and token limits.
- Vietnamese exact/substr keyword normalization.
- Input and output blocking.
- Secret redaction.
- Quota calculation.
- Config-version retention.

### Integration

- Draft, test, publish, and rollback.
- Optimistic-lock conflicts.
- Encrypted credential replacement and write-only reads.
- Kill switch and static fallback.
- Production/test log separation.
- Permission enforcement.
- `AiPromptHistory` write cutover.

### End-to-end

- Accounts without AI permissions cannot see the module or call its APIs.
- Admin can save a draft but cannot publish without permission.
- Super Admin can replace a key, test, publish, roll back, and operate the kill switch.
- Mobile keeps working through invalid drafts and provider incidents.

### Security

- SSRF protection for provider URLs.
- Stored-XSS protection for prompts and keywords in Admin.
- Authorization bypass attempts.
- Secret exposure in responses, logs, errors, and audit payloads.
- Oversized prompt/config payloads.

## 17. Delivery Order

1. Prisma migration for the three approved tables and credential encryption update.
2. Configuration schema, repository, permissions, and audit integration.
3. Runtime configuration resolver and Mobile fallback integration.
4. Eight Admin APIs.
5. Overview and Configuration screens.
6. Safety, Logs & Feedback, and Test Lab.
7. Regression, permission, security, and Mobile failure-path testing.

No deferred function may be pulled into this phase merely because the schema or UI leaves room for it.

## 18. Acceptance Criteria

- Exactly three new Prisma models are introduced.
- The Admin module exposes no more than the eight approved endpoints.
- Draft changes never affect Mobile before publish.
- Published configuration can be rolled back using one of the retained ten versions.
- Provider secrets are encrypted at rest and never returned to the browser.
- Admins cannot configure arbitrary HTTP requests, SQL, code, or regex.
- Dynamic context contains only registered and masked fields.
- Keyword safety evaluates input and output.
- Overview separates Test Lab traffic from production.
- Kill switch and static fallback prevent Mobile crashes during provider failures.
- Existing user changes outside the AI module remain untouched.
