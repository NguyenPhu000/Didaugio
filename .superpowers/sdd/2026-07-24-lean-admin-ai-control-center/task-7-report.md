# Task 7 report — Web Admin AI contracts

## Status

Complete. Web Admin AI API contracts, React Query hooks, route/permission/sidebar registration, pure form mapping, and a Vitest harness are implemented. The page is deliberately a lazy-loaded empty route stub; Task 8 owns its visual implementation.

## Commit

`feat: wire admin AI web contracts`

## Files and dependencies

- Added `web/src/apis/adminAiService.js` for the eight existing Admin AI endpoints.
- Added `web/src/hooks/queries/useAdminAiQueries.js` with narrowly scoped Admin AI keys and mutation invalidation.
- Added `web/src/pages/admin/ai/adminAiForm.js` and its form-contract tests.
- Added the route-only `web/src/pages/admin/ai/AdminAiPage.jsx` stub.
- Added `web/vitest.config.js` and `web/src/test/setup.js`.
- Updated `web/package.json`, routes, permissions, router, and sidebar menu.
- No packages or lockfile changes were required: `vitest`, `jsdom`, and Testing Library were already present.

## RED evidence

`npm.cmd test -- src/pages/admin/ai/adminAiForm.test.js` failed before implementation because Vite could not resolve `./adminAiForm` from the new test file.

## Verification

- `npm.cmd test -- src/pages/admin/ai/adminAiForm.test.js` — 2 passing tests.
- `npx.cmd eslint src/apis/adminAiService.js src/hooks/queries/useAdminAiQueries.js src/pages/admin/ai/adminAiForm.js src/pages/admin/ai/adminAiForm.test.js src/pages/admin/ai/AdminAiPage.jsx src/constants/routes.js src/constants/permissions.js src/routes.jsx src/layouts/sidebar/menuData.js` — passed.
- `npm.cmd run build` — passed. Vite emitted only the repository's existing large-chunk advisory.
- `git diff --check` — passed.

## Self-review

- All eight endpoints have one web-service mapping and preserve the existing API client's response convention.
- Credential reads map only configured/suffix metadata; the form secret is always empty and an empty secret is omitted from writes.
- Query invalidation targets only Admin AI config, overview, or the logs prefix according to each mutation.
- The route and sidebar item allow only `SUPER_ADMIN` and `ADMIN`; the sidebar is gated by `ai.view`.
- The route is lazy-loaded and the stub has no Task 8 UI.

## Concerns

None. The UI stub intentionally renders nothing until Task 8 replaces it.
