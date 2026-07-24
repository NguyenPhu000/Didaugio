# Admin AI Control Center — Design Specification

**Date:** 2026-07-24

**Status:** Approved design, awaiting written-spec review

**Scope:** Web Admin, supporting backend APIs and persistence for the existing mobile AI experience

## 1. Purpose

Build `/admin/ai` as the operational control center for the AI features already used by the mobile application. Administrators must be able to configure, test, publish, observe, limit, and safely disable AI behavior without editing source code or redeploying the Node.js server.

The control center must preserve these boundaries:

- Mobile remains a consumer of published AI configuration. It never receives provider secrets or unpublished drafts.
- Provider integrations use reviewed adapters. Admins cannot define arbitrary HTTP requests or executable code.
- Configuration changes are versioned, permission-gated, testable, reversible, and audited.
- Personal data is minimized before it becomes model context or observable log content.
- Operational data and Test Lab traffic remain distinguishable.

## 2. Existing System Context

The repository already provides:

- A React Admin application with route, sidebar, dashboard, settings, and permission patterns.
- Server-side RBAC middleware and a permission cache.
- Prisma models including `SystemConfig`, `ApiKeyManagement`, `AuditLog`, and `AiPromptHistory`.
- Mobile Chat, Planner, Voice, and itinerary flows.

The new control center will follow the existing Admin shell and RBAC conventions. It will not be added as an oversized tab inside the general Settings page.

`SystemConfig` remains appropriate for small global flags. It must not become the primary store for versioned prompts, providers, policies, rules, logs, or knowledge-index jobs.

The existing `ApiKeyManagement.apiKey` model is not suitable as the browser-facing provider-secret interface. Provider credentials require encrypted server-side storage or a secret-manager reference and must never be returned in plaintext.

## 3. Product Principles

1. **Safe by default:** drafts do not affect Mobile; dangerous actions require explicit confirmation.
2. **One published truth:** runtime services consume a resolved, immutable published snapshot.
3. **Explainable configuration:** Test Lab shows which provider, prompt, context sources, and rules were selected.
4. **Minimal personal data:** only task-relevant, normalized context reaches the model.
5. **Operational clarity:** health, quota, latency, failures, fallback, and cache effectiveness are visible.
6. **No arbitrary execution:** Admin configuration cannot contain JavaScript, raw SQL, shell commands, or arbitrary REST request templates.

## 4. Roles and Permissions

Permissions are granular capabilities rather than page-level role checks.

### Super Admin

- Manage provider adapters, provider endpoints, secret references, and models.
- Publish model/runtime configuration.
- Configure system-wide quota policy.
- Operate the global kill switch.
- View all metadata analytics.
- Grant AI permissions to other roles.

### Admin

- Manage prompt drafts and publish them when granted `ai.prompts.publish`.
- Manage scoped safety rules and keyword lists.
- Manage cache, alerts, feedback, and knowledge synchronization.
- Run Test Lab scenarios.
- View masked conversation content when explicitly granted audit permission.

### Staff

- View the operational dashboard.
- Run approved Test Lab scenarios.
- View non-sensitive metadata and aggregate quality metrics.
- Cannot publish, reveal audit content, manage secrets, or perform destructive operations.

### Proposed permission set

- `ai.dashboard.view`
- `ai.providers.view`
- `ai.providers.manage`
- `ai.providers.publish`
- `ai.prompts.view`
- `ai.prompts.manage`
- `ai.prompts.publish`
- `ai.context.view`
- `ai.context.manage`
- `ai.rules.view`
- `ai.rules.manage`
- `ai.rules.publish`
- `ai.usage.view`
- `ai.quotas.manage`
- `ai.conversations.view_metadata`
- `ai.conversations.audit_content`
- `ai.feedback.manage`
- `ai.cache.view`
- `ai.cache.clear`
- `ai.knowledge.view`
- `ai.knowledge.sync`
- `ai.alerts.manage`
- `ai.test_lab.run`
- `ai.kill_switch.manage`

Super Admin retains the existing system-level bypass behavior. UI visibility never replaces backend permission checks.

## 5. Information Architecture

The `/admin/ai` section contains:

1. **Overview**
2. **Prompt Studio**
3. **Model & Runtime**
4. **Context Studio**
5. **Safety & Rules**
6. **Usage & Quotas**
7. **Conversations & Quality**
8. **Cache Management**
9. **Knowledge Base**
10. **Alerts**
11. **AI Test Lab**

The shared header shows:

- Runtime state: active, degraded, maintenance, or disabled.
- Active provider and model.
- Quota consumption.
- Error rate for the last 15 minutes.
- Configuration version and publication time.
- Permission-gated kill switch.

## 6. Provider and Model Management

### Adapter policy

Phase-one runtime launches with the existing Groq integration. The configuration architecture supports:

- Groq
- Gemini
- OpenAI-compatible providers
- Ollama or another approved self-hosted adapter

A provider must be implemented and reviewed as a backend adapter before it appears as a selectable type. Admins cannot enter arbitrary headers, body templates, authentication scripts, or response parsers.

### Provider configuration

Each provider configuration contains:

- Display name and adapter type.
- Environment: development, staging, or production.
- Allowlisted base URL.
- Default model and approved model list.
- Encrypted credential or secret-manager reference.
- Connection and response timeout.
- Retry count and backoff policy.
- Maximum concurrent requests.
- Temperature, Top P, and maximum output tokens within adapter-supported bounds.
- Request quota and token quota.
- Health-check configuration.
- Primary or fallback priority.
- Draft, active, degraded, or disabled status.
- Version and optimistic-lock revision.

Provider secrets are write-only. The browser receives only `configured`, `lastRotatedAt`, and a masked identifier. Replacing a credential creates an audit event; the old value cannot be retrieved through the UI.

Cloud provider URLs reject loopback, link-local, private-network, and metadata-service targets. A self-hosted adapter may use private addresses only through a separately approved deployment allowlist.

### Publishing flow

`Add provider → Test connection → Test prompt → Save draft → Super Admin publish → Observe health`

Publishing creates an immutable runtime snapshot. The runtime loads the last valid published snapshot and does not assemble configuration from mutable draft rows during each request.

### Fallback behavior

Fallback may activate for:

- Connection failure or timeout.
- Retryable 429 or 5xx responses.
- Explicit quota threshold.
- Failed health checks over a configured window.

Authentication errors, invalid configuration, policy violations, and malformed requests do not automatically cascade through every provider. They fail safely and create an alert.

## 7. Dynamic Context Studio

Context Studio controls which normalized context blocks may be supplied to Chat, Planner, Voice, and RAG.

### Allowed context

- Coarse location or area; exact coordinates only when routing requires them.
- Travel preferences.
- Budget, party size, trip duration, and transport preference.
- Relevant Places and Events records.
- Current-session messages within a bounded token window.
- Time, weather, and opening status when their source and freshness are known.

### Excluded context

- Email, phone number, authentication tokens, and internal identifiers.
- Full account profile or full conversation history.
- Unrelated payment, booking, or administrative data.
- Unmasked personal information.
- Raw SQL results or arbitrary JSON selected by an Admin.

### Context-source configuration

Each source defines:

- Supported scopes: global, Chat, Planner, Voice, or RAG.
- Schema version and allowed fields.
- Enabling condition.
- Priority and maximum token allocation.
- Freshness TTL and fallback behavior.
- PII transformation policy.
- Data provenance label.
- Draft/published state.

Admins select from server-defined sources and fields. They cannot author SQL or executable transformations.

Test Lab exposes a masked **Context Preview** containing the resolved sources, field names, token contribution, freshness, and provenance.

## 8. Prompt Studio

Prompts are versioned artifacts, not free-form values in `SystemConfig`.

### Prompt model

Each template contains:

- Stable key and human-readable name.
- Scope: global, Chat, Planner, Voice, RAG, or adapter-specific.
- System/developer template content.
- Declared variables and their schemas.
- Output-contract reference where structured output is required.
- Model compatibility.
- Draft, published, archived, or rolled-back state.
- Version, author, timestamps, and change reason.

Variables must be declared before use. Publishing fails if required variables are missing, unknown variables exist, or the rendered prompt exceeds configured limits.

### Workflow

- **Save Draft:** saves without affecting Mobile.
- **Test Draft:** runs isolated scenarios in Test Lab.
- **Publish:** creates a new immutable runtime version.
- **Rollback:** republishes a previous valid version as a new version; history is never rewritten.
- **Compare:** displays a semantic and text diff between versions.

Concurrent changes use optimistic locking. An outdated editor receives a conflict and must compare or reload; it never silently overwrites a newer draft.

## 9. Safety and Rule Studio

Rules may apply globally or to Chat, Planner, Voice, RAG, and a specific provider/model.

### Rule stages

- User input
- Resolved context
- Model output

Output is always checked even when input passed.

### Match types

- Exact word or phrase.
- Normalized substring.
- Safe regular expression.
- Managed topic/category classifier.

Vietnamese matching normalizes case, whitespace, Unicode composition, and configurable diacritic variants. Word-boundary behavior prevents a short banned token from matching unrelated longer words.

Regular expressions are compiled and evaluated using bounded execution. Unsafe or unsupported patterns cannot be published.

### Actions

- Log only.
- Warn and continue.
- Redact or replace matched content.
- Block request.
- Block response.
- Return a configured safe response.
- Queue for manual quality review.

### Rule properties

- Name, description, scope, and stage.
- Severity and priority.
- Match configuration.
- Action and safe-response key.
- Effective start and end time.
- Draft, published, disabled, or archived state.
- Owner, version, and change reason.

A deterministic precedence policy resolves overlaps:

1. More restrictive action wins.
2. A more specific scope wins when actions have equal severity.
3. Higher explicit priority wins.
4. Stable rule ID is the final deterministic tie-breaker.

The editor detects duplicates, unreachable rules, and common conflicts before publication.

### Related operations

- CSV import/export for keyword lists.
- Batch tests against maintained safety fixtures.
- Match explanation showing stage, rule, normalization, and action.
- Trigger analytics by rule and scope.
- Abnormal block-rate alerts.
- Scoped exceptions by feature, never by individual user.
- Versioned rule-set publication and rollback.

Mobile receives a stable public error code and safe replacement message. It never receives internal rule text or match details.

## 10. Usage, Quotas, and Cost

The dashboard reports:

- Input and output tokens by day, week, provider, model, feature, and user tier.
- Request count and success/error rate.
- P50, P95, and P99 latency.
- 429, timeout, provider 5xx, parsing, validation, and policy-block rates.
- Fallback rate and provider health.
- Cache hit rate and estimated tokens avoided.
- Test Lab traffic separately from production.

Cost is shown only when a versioned provider pricing table exists. Otherwise the UI labels the metric as token usage and does not invent a currency estimate.

Quota policies support:

- Requests and tokens per user tier and time window.
- Global emergency caps.
- Soft-warning and hard-stop thresholds.
- Feature-specific limits.
- Explicit behavior on exhaustion: reject, fallback, or static itinerary.

Counters must use an atomic shared store suitable for multiple server instances. Database aggregates remain the reporting source, not the hot-path limiter.

## 11. Conversations, Feedback, and Privacy

`AiPromptHistory` will be migrated into a more deliberate logging model. New traffic does not retain raw prompt and response indefinitely.

Default views expose metadata only:

- Request ID, feature, model, status, latency, tokens, rule result, and timestamps.
- Coarse region where useful.
- Anonymous user reference.

Conversation content requires `ai.conversations.audit_content`, a stated audit reason, and a recorded access event. Content is masked before display. Raw auditable content is deleted after 30 days; longer-lived analytics retain aggregates and non-reversible metadata.

Feedback supports thumbs up/down, a reason category, optional user comment, request linkage, resolution status, and Admin notes. Quality views highlight repeated failure clusters rather than presenting a leaderboard of raw user prompts.

## 12. Cache Management

Admins can:

- View cached itineraries with scope, age, hit count, dependencies, and expiry.
- Filter by area, place, event, model/config version, and freshness.
- Invalidate selected entries or a bounded scope.
- Preview affected entry count and downstream impact.
- Observe invalidation job progress.

`Clear all` requires `ai.cache.clear`, a typed confirmation, and a reason. Large invalidations run as background jobs. Cache keys include the relevant published prompt, rule, model, and knowledge versions so incompatible configuration is not silently reused.

Semantic or clustered caching is a later optimization. It is not enabled until quality and invalidation behavior can be measured.

## 13. Knowledge Base and RAG

Phase one synchronizes approved PostgreSQL Places and Events into a vector index. PDF/TXT upload is deferred.

The Admin experience provides:

- Source status and last successful synchronization.
- Added, updated, deleted, failed, and skipped record counts.
- Start, retry, or cancel synchronization.
- Index version, embedding model, and active snapshot.
- Retrieval testing with source citations and scores.
- Publish or rollback an index snapshot.

Reindexing runs as a background job and does not replace the active index until validation succeeds. A failed job leaves the previous index active.

## 14. Alerts

Alerts are delivered in Admin in-app notifications and email.

Rules may watch:

- Token/request thresholds.
- Sudden error, latency, fallback, or block-rate increases.
- Provider health and quota exhaustion.
- Failed publish, sync, or cache invalidation jobs.
- Kill-switch transitions.

Alerts support severity, deduplication window, cooldown, acknowledgement, resolution, owner, and direct links to filtered evidence. Notification delivery failures are tracked separately from the triggering incident.

## 15. AI Test Lab

Test Lab compares production behavior with a draft configuration.

It displays:

- Rendered prompt with secrets and PII removed.
- Masked context preview and provenance.
- Selected provider/model and fallback decision.
- Matched input/output rules.
- Raw structured-output validation results.
- Answer, latency, and token usage.
- Side-by-side production/draft difference.

Test traffic is tagged and excluded from production KPIs, quota enforcement, user history, and production cache unless a dedicated test policy explicitly says otherwise.

Saved test suites cover golden travel scenarios, safety cases, malformed inputs, provider failures, and structured-output validation. Publishing can require a minimum suite pass rate, with an explicit Super Admin override and audit reason.

## 16. Data Model

Exact Prisma field definitions belong to the implementation plan. The design introduces these bounded entities:

- `AiProviderConfig`
- `AiProviderSecret`
- `AiModelConfig`
- `AiRuntimeRelease`
- `AiPromptTemplate`
- `AiPromptVersion`
- `AiContextSourceConfig`
- `AiContextVersion`
- `AiRule`
- `AiRuleSetVersion`
- `AiRequestLog`
- `AiConversationAudit`
- `AiFeedback`
- `AiQuotaPolicy`
- `AiAlertRule`
- `AiAlertEvent`
- `AiKnowledgeIndex`
- `AiSyncJob`
- `AiCacheInvalidationJob`
- `AiConfigAudit`
- `AiTestRun`

Versioned configuration tables distinguish a logical artifact from immutable versions. A runtime release references exact published versions for provider/model, prompt, context, rules, and knowledge index.

High-volume request logs require indexes on timestamp, feature, provider/model, status, and anonymous user reference. Large response bodies do not belong in the analytics row.

## 17. API Surface

All endpoints are under `/api/v1/admin/ai` and require authentication plus a specific permission.

### Overview and runtime

- `GET /overview`
- `GET /runtime`
- `POST /runtime/publish`
- `POST /runtime/rollback`
- `PUT /runtime/kill-switch`

### Providers

- `GET /providers`
- `POST /providers`
- `GET /providers/:id`
- `PUT /providers/:id`
- `PUT /providers/:id/secret`
- `POST /providers/:id/test-connection`
- `POST /providers/:id/test-prompt`
- `POST /providers/:id/publish`
- `POST /providers/:id/disable`

### Prompts, context, and rules

- CRUD/version/list endpoints under `/prompts`
- CRUD/version/list endpoints under `/contexts`
- CRUD/version/list endpoints under `/rules`
- `POST /prompts/:id/test`
- `POST /prompts/:id/publish`
- `POST /prompts/:id/rollback`
- `POST /rules/import`
- `GET /rules/export`
- `POST /rules/validate`
- `POST /rules/publish`
- `POST /rules/rollback`

### Operations

- `GET /usage`
- CRUD endpoints under `/quotas` and `/alerts`
- `GET /conversations`
- `GET /conversations/:requestId/content`
- `GET /feedback`
- `PUT /feedback/:id`
- `GET /cache`
- `POST /cache/invalidation-preview`
- `POST /cache/invalidation-jobs`
- `GET /knowledge`
- `POST /knowledge/sync-jobs`
- `POST /knowledge/retrieval-test`
- `GET /test-runs`
- `POST /test-runs`

Pagination, filtering, sorting, and date ranges use a consistent contract. Destructive and publish operations require a change reason. Mutation responses include the new revision/version.

## 18. Runtime Resolution

The mobile-facing AI service resolves configuration in this order:

1. Check global kill switch and maintenance policy.
2. Load the current immutable runtime release from a bounded cache.
3. Resolve feature and user-tier quota.
4. Normalize and evaluate input safety rules.
5. Build allowed context through registered context-source adapters.
6. Render and validate the published prompt.
7. Select provider/model and execute with bounded retry/fallback.
8. Validate structured output where required.
9. Evaluate output safety rules.
10. Return the public response and asynchronously record operational metadata.

If no valid release can be loaded, the service uses the last known valid release. If none exists, it enters the configured static fallback rather than improvising from drafts.

## 19. UI/UX Direction

The selected visual direction is **AI Operations Cockpit**: calm, high-signal, and operational rather than decorative or futuristic.

- Preserve the existing Admin shell.
- Use a light neutral/slate surface with graphite text.
- Use indigo sparingly as AI identity, green for healthy, amber for degraded, red for failure, and gray for disabled.
- Never communicate status using color alone.
- Use the existing typography where practical; Geist is the preferred replacement if a font decision is required.
- Use tabular numerals for metrics.
- Use cards only for priority KPIs and incidents; dense data belongs in tables and charts.
- Avoid purple-blue AI gradients, decorative hero imagery, excessive glass effects, and marketing motion.
- Restrict animation to state transitions, drawers, chart updates, and job progress.

### Key layouts

**Overview:** 12-column grid with status/KPI row, token and request chart, incident rail, model health, quota, cache, and feedback signals.

**Prompt Studio:** version list on the left, editor in the center, Test Lab/results on the right, and a sticky Draft/Test/Publish/Rollback action bar.

**Model & Runtime:** active release summary, provider health, guarded configuration controls, fallback ordering, and publication history.

**Safety & Rules:** filterable rules table, rule editor drawer, conflict preview, batch-test panel, and trigger analytics.

**Conversation Audit:** metadata-first table; content appears only in a permission-gated drawer after an audit reason.

**Knowledge Base:** source/index status, synchronization jobs, active snapshot, and retrieval test.

### Responsive behavior

Desktop supports all workflows. Tablet supports most operations. Mobile Admin prioritizes dashboard, alerts, job status, and maintenance state. Long prompt editing, provider publication, detailed audits, and bulk rule management direct the Admin to desktop.

## 20. Dangerous-Action UX

Publish, rollback, provider switch, secret rotation, quota hard-stop, and scoped cache invalidation require confirmation and a reason.

Typed confirmation is reserved for:

- Global kill switch.
- Clear-all cache.
- Destructive deletion of an unpublished configuration that has dependent test artifacts.

Each confirmation previews scope, current version, resulting version/state, and affected Mobile feature. A successful mutation displays the resulting release or job ID.

## 21. Error Handling

- Validation errors point to the exact field, variable, rule, or test case.
- Optimistic-lock conflicts show the newer author/revision and offer compare/reload.
- Provider connection tests distinguish DNS, TLS, authentication, quota, timeout, and response-schema failures without exposing credentials.
- Publish is transactional: either a complete valid release becomes active or the previous release remains active.
- Background jobs are idempotent, retryable, observable, and cancellable where safe.
- Analytics logging failures never leak user data or break a successful user response.
- Alert delivery failure does not mark the source incident as resolved.
- Partial dashboard failures preserve healthy panels and label stale data.
- Mobile receives stable public error codes and safe messages; internal stack traces remain server-side.

## 22. Testing Strategy

### Unit tests

- Prompt variable parsing and rendering.
- Context allowlisting, token budgeting, TTL, and masking.
- Vietnamese keyword normalization and word boundaries.
- Regex safety and timeout controls.
- Rule precedence and conflict detection.
- Provider error classification and fallback eligibility.
- Quota resolution and atomic counter behavior.
- Permission checks and audit payload sanitization.

### Integration tests

- Draft/test/publish/rollback lifecycle.
- Immutable runtime-release resolution.
- Credential write-only behavior.
- Kill switch and static fallback.
- Request logging and 30-day content retention.
- Cache versioning and invalidation preview/jobs.
- Knowledge sync success, partial failure, retry, and rollback.
- Test traffic separation from production metrics and quota.
- Concurrent Admin edits.

### Contract tests

- Admin API schemas, pagination, filters, error codes, and revision headers.
- Mobile behavior for active, maintenance, blocked, quota-exhausted, and provider-failure states.
- Provider adapter request/response normalization.

### End-to-end tests

- Staff can view but cannot mutate.
- Admin can draft/test scoped configuration but cannot manage secrets without permission.
- Super Admin can configure, test, publish, switch, and roll back a provider.
- An auditor must provide a reason and sees only masked content.
- A dangerous action produces an audit record and visible operational result.

### Operational verification

- Load tests for log ingestion and quota counters.
- Provider timeout and 429 fault injection.
- Alert deduplication and cooldown verification.
- Kill-switch propagation-time measurement.
- Security tests for SSRF, secret exposure, stored XSS in prompts/rules, regex denial of service, and authorization bypass.

## 23. Delivery Phases

### Phase 1 — Safe control plane

- Overview and runtime status.
- Groq provider adapter configuration.
- Prompt Studio.
- Context Studio for registered sources.
- Safety rules and keyword lists.
- Kill switch and static fallback.
- Core request metrics and token quotas.
- Test Lab.
- RBAC, versioning, publish/rollback, and audit.

### Phase 2 — Operational depth

- Conversation audit and feedback workflows.
- Cache management.
- In-app/email alerts.
- Provider comparison and fallback analytics.
- Advanced quality and rule-trigger analytics.

### Phase 3 — Knowledge and expansion

- Places/Events vector synchronization.
- Retrieval testing and index publication.
- Additional reviewed provider adapters.
- PDF/TXT knowledge documents only after access control, malware scanning, parsing, provenance, deletion, and reindexing behavior are separately designed.

## 24. Explicitly Out of Scope

- Arbitrary REST API definitions from Admin.
- Arbitrary headers, request bodies, JavaScript, SQL, or shell execution.
- Displaying or retrieving stored provider secrets.
- Training or fine-tuning a foundation model from the Admin UI.
- Permanent raw conversation retention.
- Automatic semantic caching without quality measurements.
- PDF/TXT upload in phase one.
- A full redesign of the existing Admin application.

## 25. Acceptance Criteria

The design is successfully implemented when:

- A permitted Admin can create, test, publish, and roll back prompts, contexts, and rules without redeploying.
- A Super Admin can safely configure a reviewed provider adapter without a secret reaching the browser after submission.
- Mobile behavior uses one auditable runtime release with exact component versions.
- Rule evaluation occurs at input and output with deterministic precedence.
- Dynamic context contains only approved, masked, bounded data.
- Dashboard metrics separate production and test traffic.
- Kill switch and fallback prevent Mobile crashes during provider incidents.
- Conversation audit is permission-gated, reason-gated, masked, and limited to 30 days.
- Every publish and dangerous action has an audit trail and rollback path.
- Staff cannot mutate configuration through either the UI or direct API calls.
