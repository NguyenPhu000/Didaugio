# Place Spoken Guide Design

## Goal

Replace the generated AI audio-guide pipeline with a simple, manually curated spoken guide. Admin and business users author the guide while creating or editing a place. Mobile users read the text or listen through the device's `expo-speech` voice. No MP3 files, TTS provider, AI generation job, or audio storage remain in this feature.

## Scope

- Add one introduction script and up to five ordered FAQ entries to a place.
- Expose the same editor in the existing admin and business place create/edit flows.
- Preserve the existing rule that a business edit returns the place to `PENDING` for admin approval.
- Present the guide and FAQ on mobile Place Detail with play/stop controls backed by `expo-speech`.
- Remove the booking CTA from Place Detail when `priceRange` is `FREE`.
- Remove the unfinished Groq generation, TTS adapter, audio upload, regenerate endpoint, and related UI from this feature.

Out of scope: recorded audio, cloud audio storage, automatic writing, speech-to-text, voice selection UI, background playback, and changes to the place approval workflow.

## Data Model

Reuse the existing `PlaceAiGuide` table as the place-owned text guide to avoid unnecessary data migration and table churn. Retain `id`, `placeId`, `locale`, `text`, `createdAt`, and `updatedAt`. Remove generation and audio-specific fields. The public concept and UI label are "Thuyet minh dia diem", not AI Audio Guide.

Add `PlaceGuideFaq` with:

- `id`
- `guideId`, cascading on guide deletion
- `question`, required and trimmed
- `answer`, required and trimmed
- `sortOrder`, integer from 0 to 4
- timestamps

Constraints:

- One guide per `(placeId, locale)`; default locale is `vi-VN`.
- At most five FAQ entries per guide, enforced in the server service before writes.
- Introduction maximum: 5,000 characters.
- Question maximum: 200 characters.
- Answer maximum: 2,000 characters.
- Empty guide text and empty FAQ rows are normalized away. A place may have no guide.

## Server Flow

The place create and update payload accepts:

```json
{
  "spokenGuide": {
    "locale": "vi-VN",
    "text": "...",
    "faqs": [
      { "question": "...", "answer": "..." }
    ]
  }
}
```

Guide writes occur inside the existing place transaction. The server validates and normalizes the nested payload, upserts the guide, and replaces its ordered FAQ rows. Omitting `spokenGuide` leaves the existing guide unchanged during edit; explicitly sending `null` removes it.

Place detail returns:

```json
{
  "spokenGuide": {
    "locale": "vi-VN",
    "text": "...",
    "faqs": [
      { "id": 1, "question": "...", "answer": "...", "sortOrder": 0 }
    ]
  }
}
```

No provider status, prompt, error details, audio URL, or storage identifier is exposed. Business authorization and the existing `PENDING` transition remain owned by the current place update service.

## Web Editor

Add a "Thuyet minh dia diem" section to the shared place wizard data flow used by admin and business:

- A multi-line introduction input with a clear character counter.
- An ordered FAQ editor with question and answer fields.
- Add FAQ is disabled after five entries.
- Each FAQ has its own remove action; no separate bulk-delete control.
- Inline validation uses plain language and matches server limits.
- Existing wizard save actions submit the guide with the rest of the place. There is no regenerate button or generation status panel.

The visual direction is a quiet editorial listening panel: white surface, restrained cyan accent already associated with Genie, compact typography, and a headphone icon. It must remain visually subordinate to core place information.

## Mobile Place Detail

Render the section only when introduction text or at least one complete FAQ exists.

- The introduction appears in a compact listening panel with one prominent play/stop button.
- FAQ entries use an accordion row. Expanding reveals the answer and a small speaker icon button.
- Starting any item stops the currently spoken item first.
- The active item has a subtle state change and a stop icon; no simulated audio progress is shown because `expo-speech` does not provide reliable word-level progress across platforms.
- Speech uses `vi-VN`, rate `0.9`, pitch `1`, and stops when navigation leaves the screen.
- Errors produce a short toast without exposing device or provider details.
- Controls have accessible labels and stable dimensions; motion is limited to opacity/transform and respects reduced-motion behavior.

For `priceRange === "FREE"`, do not render the bottom booking bar or invoke the booking route. The scroll content bottom inset contracts so the page has no empty CTA-shaped gap. Other price ranges retain the current booking flow.

## Migration And Cleanup

- Add `PlaceGuideFaq` and remove audio/generation columns from `PlaceAiGuide` in one Prisma migration.
- Preserve existing `PlaceAiGuide.text` rows.
- Remove the background generation call from place creation.
- Remove the regenerate route/controller/query/mutation and the TTS service.
- Remove obsolete FPT/audio environment examples and Cloudinary audio-only helpers only when they have no other callers.
- Do not delete existing remote audio assets automatically in this migration; no trustworthy storage cleanup transaction exists. They become unreferenced and can be audited separately.

## Error Handling And Security

- Reject malformed nested payloads with HTTP 400 and field-safe messages.
- Enforce limits server-side regardless of web validation.
- Escape/render all guide content as text; never interpret authored content as HTML.
- Public API includes only approved place content through the existing place visibility rules.
- The server never logs full authored scripts on validation or persistence failure.

## Testing

- Server tests cover normalization, length limits, five-FAQ maximum, create/upsert/delete behavior, ordering, and public DTO shape.
- Web tests cover adding/removing FAQ rows, maximum-five behavior, initial edit values, and submitted payload.
- Mobile tests cover speech text selection, switching/stopping items, guide visibility, and free-place booking CTA visibility through extracted pure helpers where rendering infrastructure is unavailable.
- Run Prisma validation, focused tests, server syntax checks, web lint, and app lint.
- Manually verify admin edit, business edit to `PENDING`, mobile speech lifecycle, FAQ accordion, safe areas, and free/paid Place Detail layouts.

## Acceptance Criteria

- Admin and business can save one guide and up to five FAQs from the existing place wizard.
- Business edits continue to require admin approval.
- Place Detail reads the introduction and individual FAQ answers using `expo-speech` without network TTS calls.
- Only one spoken item runs at a time and speech stops on unmount.
- Free places show no "Dat ngay" CTA or leftover bottom-bar spacing.
- Groq/TTS/audio-storage behavior is absent from this feature and existing guide text is preserved.
