# Durable Tag Groups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store reusable, localized tag groups in the database and migrate tags from fixed `tagType` values to `tagGroupId` without breaking existing data.

**Architecture:** A new `TagGroup` Prisma model owns localized labels, visibility, and order. `PlaceTag` receives a nullable foreign key, while `tagType` stays as a temporary compatibility write (`general`). Server endpoints own group lifecycle and validate assignments; the web admin uses those endpoints from a combobox and management dialog.

**Tech Stack:** Prisma 5, PostgreSQL, Express, Zod, React, TanStack Query, Vitest, Vite.

## Global Constraints

- Retain `PlaceTag.tagType` until the removal-readiness audit passes in a later release.
- Do not send or render optional tag icons in the web form.
- Group delete must reject non-empty groups with HTTP 409.
- New tag assignment requires an active group.
- Use exact-file staging; do not stage pre-existing unrelated worktree changes.

---

### Task 1: Database schema and safe backfill

**Files:**
- Modify: `server/prisma/schema.prisma:549`
- Create: `server/prisma/migrations/<timestamp>_add_tag_groups/migration.sql`
- Create: `server/test/tagGroupMigration.test.js`

**Interfaces:**
- Produces Prisma `TagGroup` and `PlaceTag.tagGroupId` consumed by tag services.
- Migration creates `general` (`Chung` / `General`) and links every legacy tag.

- [ ] **Step 1: Write the failing migration contract test**

```js
it("backfills every legacy tag to the unique general group", async () => {
  const audit = await auditTagGroupBackfill(prisma);
  expect(audit.orphanedTagCount).toBe(0);
  expect(audit.generalGroup.slug).toBe("general");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tagGroupMigration.test.js`

Expected: FAIL because `auditTagGroupBackfill` and the schema relation do not exist.

- [ ] **Step 3: Add Prisma models and migration**

```prisma
model TagGroup {
  id        Int      @id @default(autoincrement())
  slug      String   @unique
  nameVi    String   @map("name_vi")
  nameEn    String?  @map("name_en")
  isActive  Boolean  @default(true) @map("is_active")
  sortOrder Int      @default(0) @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  tags      PlaceTag[]
  @@map("tag_groups")
}

// PlaceTag additions
tagGroupId Int? @map("tag_group_id")
tagGroup   TagGroup? @relation(fields: [tagGroupId], references: [id], onDelete: Restrict)
@@index([tagGroupId], map: "idx_place_tags_tag_group_id")
```

Migration SQL inserts one `general` group with `ON CONFLICT (slug) DO NOTHING`, adds the nullable FK and index, then updates tags with null `tag_group_id` from that group inside the migration transaction.

- [ ] **Step 4: Implement audit helper and run test**

Run: `npm test -- tagGroupMigration.test.js`

Expected: PASS; rerun migration/audit fixture to prove no duplicate group and no orphan tags.

- [ ] **Step 5: Generate Prisma client and commit**

Run: `npm run generate`

```bash
git add server/prisma/schema.prisma server/prisma/migrations/<timestamp>_add_tag_groups server/test/tagGroupMigration.test.js
git commit -m "feat(server): add durable tag groups"
```

### Task 2: Server group lifecycle API

**Files:**
- Create: `server/src/models/schemas/tag/tagGroup.schema.js`
- Modify: `server/src/models/index.js`
- Create: `server/src/services/tag/tagGroup.service.js`
- Create: `server/src/controllers/tag/tagGroup.controller.js`
- Create: `server/src/routes/tag/tagGroup.route.js`
- Modify: `server/src/routes/index.js`
- Create: `server/test/tagGroup.service.test.js`

**Interfaces:**
- Produces `GET/POST/PATCH/DELETE /api/tag-groups` for the web hooks.
- Uses `categories.manage_tags` permission on mutations.

- [ ] **Step 1: Write failing service tests**

```js
it("rejects an active group with a duplicate Vietnamese name", async () => {
  await createTagGroup({ slug: "am-thuc", nameVi: "Ẩm thực" });
  await expect(createTagGroup({ slug: "food", nameVi: "ẩm THỰC" }))
    .rejects.toMatchObject({ statusCode: 409 });
});

it("does not delete a group with linked tags", async () => {
  await expect(deleteTagGroup(groupWithTag.id))
    .rejects.toMatchObject({ statusCode: 409 });
});
```

- [ ] **Step 2: Run the tests to verify failure**

Run: `npm test -- tagGroup.service.test.js`

Expected: FAIL because service and routes do not exist.

- [ ] **Step 3: Implement schemas, service, controller, and routes**

`createTagGroupSchema` validates `slug`, `nameVi`, optional `nameEn`, and `sortOrder`. The service performs case-insensitive Vietnamese-name conflict detection; list returns `_count.tags`; update changes names/status/order; delete counts tags and throws `ServiceError` status 409 before deleting.

- [ ] **Step 4: Run service tests and route validation tests**

Run: `npm test -- tagGroup.service.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/models server/src/services/tag/tagGroup.service.js server/src/controllers/tag/tagGroup.controller.js server/src/routes server/test/tagGroup.service.test.js
git commit -m "feat(server): add tag group management API"
```

### Task 3: Make tag APIs group-aware with legacy compatibility

**Files:**
- Modify: `server/src/models/schemas/tag/tag.schema.js`
- Modify: `server/src/services/tag/tag.service.js`
- Modify: `server/src/controllers/tag/tag.controller.js`
- Modify: `server/src/routes/tag/tag.route.js`
- Create: `server/test/tagGroupAssignment.test.js`

**Interfaces:**
- Consumes `TagGroup` from Task 1 and group service rules from Task 2.
- Tag create/update consumes `{ name, slug, tagGroupId, color, isActive? }` and returns `tagGroup`.

- [ ] **Step 1: Write failing assignment tests**

```js
it("creates a tag with an active group and legacy general type", async () => {
  const tag = await createTag({ name: "Yên tĩnh", slug: "yen-tinh", tagGroupId: activeGroup.id });
  expect(tag.tagGroupId).toBe(activeGroup.id);
  expect(tag.tagType).toBe("general");
});

it("rejects assigning an inactive group", async () => {
  await expect(createTag({ name: "X", slug: "x", tagGroupId: inactiveGroup.id }))
    .rejects.toMatchObject({ statusCode: 400 });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- tagGroupAssignment.test.js`

Expected: FAIL because tag schemas require `tagType` rather than `tagGroupId`.

- [ ] **Step 3: Implement group ID validation and response includes**

Remove enum validation for new create/update payloads. Validate the target group is active, write `tagType: TAG_TYPES.GENERAL`, include `tagGroup` in tag query results, and keep legacy tags readable.

- [ ] **Step 4: Run tag tests**

Run: `npm test -- tagGroupAssignment.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/models/schemas/tag/tag.schema.js server/src/services/tag/tag.service.js server/src/controllers/tag/tag.controller.js server/src/routes/tag/tag.route.js server/test/tagGroupAssignment.test.js
git commit -m "feat(server): assign tags to active groups"
```

### Task 4: Web data layer and group combobox

**Files:**
- Create: `web/src/apis/tagGroupService.js`
- Create: `web/src/hooks/queries/useTagGroupQueries.js`
- Create: `web/src/components/tag/TagGroupCombobox.jsx`
- Modify: `web/src/components/tag/TagFormDialog.jsx`
- Create: `web/src/components/tag/TagGroupCombobox.test.jsx`

**Interfaces:**
- Consumes `/api/tag-groups` from Task 2.
- Emits `onChange(tagGroupId)` and `onCreate({ slug, nameVi })`.

- [ ] **Step 1: Write failing combobox test**

```jsx
it("offers inline creation for a name that is not in the group list", async () => {
  render(<TagGroupCombobox groups={[]} value={null} onChange={vi.fn()} onCreate={vi.fn()} />);
  await userEvent.type(screen.getByRole("combobox"), "Đặc sản");
  expect(screen.getByRole("option", { name: /tạo nhóm.*đặc sản/i })).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run --environment jsdom src/components/tag/TagGroupCombobox.test.jsx`

Expected: FAIL because component does not exist.

- [ ] **Step 3: Implement API hooks and combobox**

The component displays localized `nameVi` / `nameEn`, filters active groups, calls create mutation for an unmatched query, then selects the returned ID. `TagFormDialog` removes `tagType`, sends `tagGroupId`, retains colors/status, and still has no icon field.

- [ ] **Step 4: Run test and web lint**

Run: `npx vitest run --environment jsdom src/components/tag/TagGroupCombobox.test.jsx && npm run lint`

Expected: PASS, aside from pre-existing dashboard warning if still present.

- [ ] **Step 5: Commit**

```bash
git add web/src/apis/tagGroupService.js web/src/hooks/queries/useTagGroupQueries.js web/src/components/tag/TagGroupCombobox.jsx web/src/components/tag/TagGroupCombobox.test.jsx web/src/components/tag/TagFormDialog.jsx
git commit -m "feat(web): select or create tag groups inline"
```

### Task 5: Web group administration and tag filtering

**Files:**
- Create: `web/src/components/tag/TagGroupManagementDialog.jsx`
- Modify: `web/src/pages/admin/TagManagementPage.jsx`
- Modify: `web/src/components/tag/TagList.jsx`
- Create: `web/src/components/tag/TagGroupManagementDialog.test.jsx`

**Interfaces:**
- Consumes group hooks from Task 4.
- Filter queries tags by `tagGroupId`; tag list displays locale-aware group name.

- [ ] **Step 1: Write failing dialog tests**

```jsx
it("disables delete for a group with linked tags", () => {
  render(<TagGroupManagementDialog groups={[{ id: 1, nameVi: "Ẩm thực", _count: { tags: 2 } }]} open />);
  expect(screen.getByRole("button", { name: /xóa/i })).toBeDisabled();
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run --environment jsdom src/components/tag/TagGroupManagementDialog.test.jsx`

Expected: FAIL because dialog does not exist.

- [ ] **Step 3: Implement dialog and integrate page**

Add one `Quản lý nhóm` action beside create-tag. The dialog supports create, name updates, `nameEn`, order, activation and empty-only delete. Replace fixed type filters with active/all group options and display `tag.tagGroup.nameEn || tag.tagGroup.nameVi` for English, otherwise `nameVi`.

- [ ] **Step 4: Run tests, lint, and production build**

Run: `npx vitest run --environment jsdom src/components/tag/TagGroupManagementDialog.test.jsx src/components/tag/TagGroupCombobox.test.jsx && npm run lint && npm run build`

Expected: PASS; record any unrelated existing lint warnings separately.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/tag/TagGroupManagementDialog.jsx web/src/components/tag/TagGroupManagementDialog.test.jsx web/src/pages/admin/TagManagementPage.jsx web/src/components/tag/TagList.jsx
git commit -m "feat(web): manage durable tag groups"
```

### Task 6: Removal-readiness audit and handoff

**Files:**
- Create: `server/src/scripts/auditTagGroupReadiness.js`
- Create: `server/test/auditTagGroupReadiness.test.js`
- Modify: `docs/releases/two-tier-admin-production-runbook.md` only if it already owns schema-audit operations; otherwise create `server/docs/tag-group-rollout.md`.

**Interfaces:**
- Audit returns `{ orphanedTagCount, inactiveAssignments, legacyTagTypeValues }`.
- It does not drop or alter `tagType`.

- [ ] **Step 1: Write failing audit test**

```js
it("reports the legacy removal gate as blocked when a tag lacks a group", async () => {
  const result = await auditTagGroupReadiness(prisma);
  expect(result.readyToRemoveLegacyTagType).toBe(false);
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- auditTagGroupReadiness.test.js`

Expected: FAIL because audit script does not exist.

- [ ] **Step 3: Implement read-only audit and rollout doc**

The audit reports counts and exits non-zero when groups are missing or inactive assignments exist. Document the later release gate: zero orphaned tags, all consumers deployed against `tagGroup`, backup verified, then a separately reviewed migration may drop `tagType`.

- [ ] **Step 4: Run full relevant verification**

Run: `npm test -- tagGroupMigration.test.js tagGroup.service.test.js tagGroupAssignment.test.js auditTagGroupReadiness.test.js && npm --prefix web run build`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/scripts/auditTagGroupReadiness.js server/test/auditTagGroupReadiness.test.js server/docs/tag-group-rollout.md
git commit -m "docs: add tag group legacy removal audit"
```
