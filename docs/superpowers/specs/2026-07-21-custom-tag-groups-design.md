# Custom Tag Groups Design

## Goal

Replace the fixed `tagType` dropdown with admin-managed tag groups. An admin can select an existing group while creating or editing a tag, or create a group from the same picker. Group names can be renamed, hidden, and safely deleted from a dedicated management view.

## Current state

`PlaceTag.tagType` is a string column, but both the web UI and API validation currently constrain it to a fixed enum. This caused the create-tag validation failure when the two enum lists diverged. Tags also expose an optional `icon` field in the form; that input has been removed and future tag creation will not send it.

## Data model

Create a `TagGroup` table:

- `id`: primary key.
- `name`: unique, trimmed display name (1–80 chars).
- `slug`: unique normalized identifier (1–100 chars).
- `isActive`: boolean, default true. Inactive groups remain attached to existing tags but are unavailable for new tags.
- `sortOrder`: integer, default 0.
- audit timestamps.

Add nullable `tagGroupId` to `PlaceTag`, indexed and related to `TagGroup` with `onDelete: Restrict`.

Keep `tagType` during the transition only. A data migration creates a `Chung` group, maps every existing tag to it, and gives newly-created tags both a `tagGroupId` and the legacy `tagType: "general"`. API responses expose the group object. After all consumers have migrated, a separate future release can remove `tagType`; it is out of scope here.

## API

Add admin-protected endpoints:

- `GET /api/tag-groups?includeInactive=false`: list groups ordered by `sortOrder`, then name.
- `POST /api/tag-groups`: create a group with name and optional sort order.
- `PATCH /api/tag-groups/:id`: rename, activate/deactivate, or change sort order.
- `DELETE /api/tag-groups/:id`: only succeeds when it contains no tags; otherwise returns a validation error with the current tag count.

Change tag create/update payloads to accept `tagGroupId` instead of `tagType`. Server verifies that the referenced group exists and is active for creation/assignment. The server writes `tagType: "general"` only as the legacy compatibility value.

## Web experience

The tag form replaces its type select with a searchable group combobox:

- Existing active groups appear as choices.
- Typing an unmatched valid name offers `Tạo nhóm “…”`.
- Creating the group selects it immediately and continues the tag form without losing fields.
- The form sends `tagGroupId`; it has no icon input or icon payload.

The tag-management page adds a compact `Nhóm tag` action that opens a dialog with group name, status, tag count, rename, activate/deactivate, and delete controls. Deletion is disabled with a plain explanation when the group has tags. The existing tag list shows the group name and filters by `tagGroupId`.

## Error handling

- Duplicate normalized name/slug returns a field-level conflict.
- Deactivated or missing groups cannot be assigned to a tag.
- Group deletion with linked tags returns `409` and the number of linked tags.
- A group name created inline uses the same server endpoint and validation as dedicated management.

## Testing

- Server schema/service tests cover group CRUD, duplicate name, inactive assignment, and restricted delete.
- Tag create/update tests show `tagGroupId` is accepted and legacy `tagType` is written as `general`.
- Web tests verify inline creation is offered for a new name, select/create returns the group ID, and the form never sends icon/tagType.
- Migration test verifies every existing tag receives `tagGroupId` and no tag is orphaned.

## Non-goals

- No nesting, colors, icons, or permissions per group.
- No automated cleanup of existing icon database values.
- No deletion of the legacy `tagType` column in this release.
