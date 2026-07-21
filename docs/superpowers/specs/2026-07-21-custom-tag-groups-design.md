# Durable Tag Groups Design

## Goal

Replace the fixed tag-type enum with database-backed tag groups. Groups remain available over time, support Vietnamese and English display names, can be created empty, ordered, renamed, and hidden without changing individual tag records.

## Data model

Create `TagGroup` with:

- `id`: primary key.
- `slug`: unique normalized identifier, 1–100 characters.
- `nameVi`: required Vietnamese name, 1–80 characters.
- `nameEn`: optional English name, 1–80 characters.
- `isActive`: boolean, default `true`.
- `sortOrder`: integer, default `0`.
- `createdAt` and `updatedAt`.

Add nullable, indexed `tagGroupId` to `PlaceTag`, with a relation to `TagGroup` and `onDelete: Restrict`.

Keep the legacy `PlaceTag.tagType` string during the compatibility phase. It is no longer accepted from new web clients. Server writes `"general"` for new/updated tags until the legacy removal release.

## Migration and durability

The database migration creates a `general` group (`Chung` / `General`) and assigns its ID to every existing tag whose `tagGroupId` is null. It leaves current `tagType` values untouched for rollback safety.

The migration is idempotent: rerunning it does not duplicate `general` or change already linked tags. The migration fails transactionally if any tag cannot be assigned.

The later removal release is explicitly separate. Before removing `tagType`, an audit confirms that every tag has a valid group ID and that all API/web/mobile consumers read `tagGroup`. Only then does a migration drop `tagType` and remove compatibility writes.

## API

Add admin-protected tag-group endpoints:

- `GET /api/tag-groups?includeInactive=false`: list groups ordered by `sortOrder`, then `nameVi`, including tag count.
- `POST /api/tag-groups`: create a group from `slug`, `nameVi`, optional `nameEn`, and optional `sortOrder`.
- `PATCH /api/tag-groups/:id`: update names, status, or sort order.
- `DELETE /api/tag-groups/:id`: only succeeds for an empty group. Otherwise return `409` with its tag count.

Tag create/update accepts `tagGroupId`; server validates that the group exists and is active before assignment. Tag read responses include `tagGroup { id, slug, nameVi, nameEn, isActive, sortOrder }`.

## Web admin

The tag form uses a searchable group combobox. It lists active groups using the current UI locale. A typed unmatched label shows `Tạo nhóm “…”`; creation uses `POST /api/tag-groups`, selects the returned group, and retains the rest of the tag form state. The icon input and icon payload remain removed.

Tag management adds a compact `Quản lý nhóm` dialog. It lists group name, status, order, and tag count; supports create, edit, hide/show, and deletes only empty groups. The tag list filters by `tagGroupId` and displays the localized group name.

## Localization

Admin writes both `nameVi` and `nameEn`; `nameEn` may initially be blank. Vietnamese UI displays `nameVi`. English UI displays `nameEn` when present and otherwise falls back to `nameVi`. The group slug never appears as the user-facing label.

## Validation and error handling

- Duplicate slug or case-insensitive duplicate Vietnamese name returns a field-level conflict.
- Inactive groups cannot receive new tag assignments but remain shown on existing tags.
- Empty-group deletion is allowed; deletion with linked tags returns `409` and does not alter tags.
- A missing, inactive, or malformed `tagGroupId` returns a field-level validation error.

## Testing

- Prisma migration test verifies the group table, `tagGroupId`, unique constraints, and one linked group per existing tag.
- API/schema/service tests cover group CRUD, duplicate handling, inactive assignment, restricted deletion, and i18n fallback.
- Tag API tests prove new writes use `tagGroupId`, include the related group in reads, and retain `tagType: "general"` only during compatibility.
- Web tests cover group combobox selection, inline group creation, group dialog controls, locale fallback, and no icon input/payload.
- A removal-readiness audit test reports any tag lacking `tagGroupId` before legacy `tagType` can be removed.

## Non-goals

- No nested groups, per-group icons, colors, permissions, or translations beyond Vietnamese and English.
- No automatic translation of group names.
- No physical deletion of a non-empty group.
