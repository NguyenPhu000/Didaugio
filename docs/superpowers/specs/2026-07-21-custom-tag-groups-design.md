# Custom Tag Groups Design

## Goal

Replace the fixed `tagType` dropdown with a free-text group label. An admin selects an existing label or types a new one in the tag form. A group exists only when at least one tag uses that label.

## Current state

`PlaceTag.tagType` is already a string column, but the web UI and API validation currently constrain it to a fixed enum. This caused the create-tag validation failure when the two enum lists diverged. Tags also expose an optional `icon` field in the form; that input has been removed and future tag creation will not send it.

## Data model

Keep `PlaceTag.tagType` as the single source of truth. Remove enum validation and replace it with a trimmed string validation (1–80 chars). Normalize whitespace and compare labels case-insensitively when offering existing groups. No new table, relation, endpoint family, or database migration is needed.

## API

Keep the existing tag endpoints. `POST` and `PUT /api/tags` accept `tagType` as a free-text group label. `GET /api/tags/groups` returns the distinct non-empty labels and their tag counts, ordered alphabetically. This is the only new endpoint.

## Web experience

The tag form replaces its type select with a searchable group combobox:

- Existing labels appear as choices.
- Typing an unmatched valid name offers `Dùng nhóm “…”`.
- Selecting that option simply assigns the entered label to this tag; there is no separate creation step.
- The form sends `tagType`; it has no icon input or icon payload.

The tag-management page filters by the selected group label. A group disappears automatically when its last tag is moved or deleted. Renaming a group means editing the tags in that group; bulk rename and a standalone group-management screen are intentionally deferred.

## Error handling

- An empty or overlong group label returns a field-level validation error.
- Group labels are whitespace-normalized before storage.
- Duplicate group labels are not an error: multiple tags can intentionally share the same label.

## Testing

- Server schema/service tests cover free-text label validation, normalization, and distinct group listing.
- Tag create/update tests show custom `tagType` values are accepted.
- Web tests verify a new typed label can be selected and the form never sends icon.

## Non-goals

- No group table, migration, standalone group CRUD, or bulk rename.
- No nesting, colors, icons, or permissions per group.
- No automated cleanup of existing icon database values.
