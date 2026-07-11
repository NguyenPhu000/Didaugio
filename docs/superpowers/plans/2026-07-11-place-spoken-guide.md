# Place Spoken Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admin and business author a text introduction plus up to five FAQs for each place, and let mobile users hear that content through `expo-speech` while hiding booking UI for free places.

**Architecture:** Keep the existing `PlaceAiGuide` record as a text-only guide and add ordered `PlaceGuideFaq` children. The existing place create/update transaction owns guide persistence and the existing role/status logic remains unchanged. Web edits the nested payload in the shared wizard; mobile consumes a minimal `spokenGuide` DTO and owns speech playback locally.

**Tech Stack:** Prisma 5, Express 5, Zod 4, React 19, Zustand, Vitest, Expo SDK 54, React Native 0.81, `expo-speech`.

## Global Constraints

- Default locale is exactly `vi-VN`.
- Maximum five FAQ entries, 5,000 introduction characters, 200 question characters, and 2,000 answer characters.
- No Groq, TTS provider, MP3 file, Cloudinary audio storage, background audio generation, or new dependency.
- Preserve the current business edit transition to `PENDING` and all existing place authorization checks.
- Reuse files already modified in the dirty worktree only where this feature requires them; never revert unrelated edits.
- Do not use `@expo/ui` runtime components because the installed Expo SDK is 54 and the skill's universal layer requires SDK 56+.
- Animate only opacity and transform; use `Pressable`, stable dimensions, text-safe rendering, and accessible labels.

---

### Task 1: Text Guide Domain And Prisma Schema

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/20260711000000_simplify_place_spoken_guides/migration.sql`
- Create: `server/src/services/place/placeSpokenGuide.service.js`
- Create: `server/src/services/place/__tests__/placeSpokenGuide.service.test.js`
- Delete: `server/src/services/place/placeAiGuideTts.service.js`

**Interfaces:**
- Produces: `normalizeSpokenGuideInput(value): null | { locale, text, faqs }`
- Produces: `writeSpokenGuide(tx, placeId, value): Promise<void>` where `undefined` is no-op and `null` deletes.
- Produces: `toPublicSpokenGuide(guide): null | { locale, text, faqs }`.

- [ ] **Step 1: Write failing domain tests**

Use Node's built-in runner and test real normalization behavior:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSpokenGuideInput, toPublicSpokenGuide } from "../placeSpokenGuide.service.js";

test("normalizes and orders a complete spoken guide", () => {
  const value = normalizeSpokenGuideInput({
    locale: "vi-VN",
    text: "  Gioi thieu  ",
    faqs: [{ question: " Cau hoi? ", answer: " Tra loi " }],
  });
  assert.deepEqual(value, {
    locale: "vi-VN",
    text: "Gioi thieu",
    faqs: [{ question: "Cau hoi?", answer: "Tra loi", sortOrder: 0 }],
  });
});

test("rejects more than five FAQs", () => {
  assert.throws(
    () => normalizeSpokenGuideInput({ text: "Guide", faqs: Array.from({ length: 6 }, (_, i) => ({ question: `Q${i}`, answer: `A${i}` })) }),
    /toi da 5/i,
  );
});

test("public DTO excludes generation and audio metadata", () => {
  assert.deepEqual(toPublicSpokenGuide({ locale: "vi-VN", text: "Guide", faqs: [] }), {
    locale: "vi-VN",
    text: "Guide",
    faqs: [],
  });
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `cd server; node --test src/services/place/__tests__/placeSpokenGuide.service.test.js`

Expected: FAIL because `placeSpokenGuide.service.js` does not exist.

- [ ] **Step 3: Implement schema, migration, normalization and persistence**

Retain text data while dropping audio/generation columns and add:

```prisma
model PlaceGuideFaq {
  id        Int          @id @default(autoincrement())
  guideId   Int          @map("guide_id")
  question  String       @db.VarChar(200)
  answer    String       @db.Text
  sortOrder Int          @default(0) @map("sort_order")
  createdAt DateTime     @default(now()) @map("created_at")
  updatedAt DateTime     @updatedAt @map("updated_at")
  guide     PlaceAiGuide @relation(fields: [guideId], references: [id], onDelete: Cascade)

  @@unique([guideId, sortOrder])
  @@index([guideId])
  @@map("place_guide_faqs")
}
```

Implement validation with `ServiceError`, trim fields, discard fully empty rows, reject half-complete rows, and replace FAQs inside the supplied Prisma transaction. Do not log authored text.

- [ ] **Step 4: Verify GREEN and Prisma validity**

Run: `cd server; node --test src/services/place/__tests__/placeSpokenGuide.service.test.js; npx prisma validate`

Expected: tests PASS and Prisma reports the schema is valid.

### Task 2: Place API Integration And Legacy Cleanup

**Files:**
- Modify: `server/src/models/schemas/place/place.schema.js`
- Modify: `server/src/services/place/place.service.js`
- Modify: `server/src/controllers/place/place.controller.js`
- Modify: `server/src/routes/place/place.route.js`
- Modify: `server/.env.example`
- Modify only if now unused: `server/src/utils/cloudinaryService.js`
- Delete: `server/src/services/place/placeAiGuide.service.js`
- Test: `server/src/services/place/__tests__/placeSpokenGuide.service.test.js`

**Interfaces:**
- Consumes: Task 1 `normalizeSpokenGuideInput`, `writeSpokenGuide`, `toPublicSpokenGuide`.
- Produces: create/update accepts `spokenGuide`; place detail returns `spokenGuide`.

- [ ] **Step 1: Extend failing tests for payload semantics**

Add assertions that `undefined` is preserved as no-op, `null` is a delete signal, incomplete FAQ rows throw, and 5,001-character text throws.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `cd server; node --test src/services/place/__tests__/placeSpokenGuide.service.test.js`

Expected: FAIL on the newly asserted validation or persistence contract.

- [ ] **Step 3: Integrate guide into place transactions**

Add a Zod nested schema equivalent to:

```js
const spokenGuideSchema = z.object({
  locale: z.string().trim().default("vi-VN"),
  text: z.string().trim().max(5000).default(""),
  faqs: z.array(z.object({
    question: z.string().trim().max(200),
    answer: z.string().trim().max(2000),
  })).max(5).default([]),
});
```

In `createPlace`, write the guide before the transaction returns. In `updatePlace`, write only when the `spokenGuide` key is present. Include `aiGuides.faqs` ordered by `sortOrder` in detail queries and expose only `spokenGuide`. Remove `schedulePlaceAiGuideGeneration`, regenerate controller/route, provider env examples, and audio-only utility exports with zero remaining callers.

- [ ] **Step 4: Verify server behavior**

Run: `cd server; node --test src/services/place/__tests__/placeSpokenGuide.service.test.js; node --check src/services/place/place.service.js; node --check src/controllers/place/place.controller.js; npx prisma validate`

Expected: all commands exit 0.

### Task 3: Shared Admin And Business Guide Editor

**Files:**
- Create: `web/src/components/place/SpokenGuideEditor.jsx`
- Create: `web/src/components/place/SpokenGuideEditor.test.jsx`
- Modify: `web/src/stores/placeStore.js`
- Modify: `web/src/components/place/StepDetails.jsx`
- Modify: `web/src/components/place/StepPreview.jsx`
- Modify: `web/src/pages/admin/PlaceWizardPage.jsx`
- Modify: `web/src/apis/placeService.js`
- Modify: `web/src/hooks/queries/usePlaceQueries.js`

**Interfaces:**
- Consumes/produces wizard field `spokenGuide: { locale: "vi-VN", text: string, faqs: Array<{ question, answer }> }`.

- [ ] **Step 1: Write failing UI tests**

Test that the editor renders initial values, adds up to five FAQ rows, disables add at five, removes only the selected row, and reports character limits. Mock only the callback boundary.

- [ ] **Step 2: Verify RED**

Run: `cd web; npm test -- src/components/place/SpokenGuideEditor.test.jsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the editor and wizard state**

Build a quiet listening section using existing `Button`, textarea styles, Lucide `Headphones`, `Plus`, `Trash2`, and `Volume2`. Use native buttons/labels, stable icon-button dimensions, visible focus rings, and no nested cards. Initialize/reset/load `spokenGuide` in Zustand. Embed in `StepDetails`; show a read-only summary in preview. Remove the old AI generation panel and regenerate API/query.

- [ ] **Step 4: Verify web**

Run: `cd web; npm test -- src/components/place/SpokenGuideEditor.test.jsx; npm run lint`

Expected: focused tests and lint exit 0.

### Task 4: Mobile Listening Experience And Free Place CTA

**Files:**
- Create: `app/src/modules/place/utils/spokenGuide.js`
- Create: `app/src/modules/place/utils/spokenGuide.test.js`
- Create: `app/src/modules/place/components/SpokenGuideSection.jsx`
- Modify: `app/app/place/[id].jsx`

**Interfaces:**
- Produces: `hasSpokenGuide(guide): boolean`, `shouldShowBookingCta(place): boolean`, `getSpeechText(guide, faqIndex): string | null`.
- Consumes: API `place.spokenGuide` from Task 2.

- [ ] **Step 1: Write failing pure behavior tests**

```js
import { describe, expect, it } from "vitest";
import { getSpeechText, hasSpokenGuide, shouldShowBookingCta } from "./spokenGuide";

describe("spoken guide", () => {
  it("hides booking CTA for FREE places", () => {
    expect(shouldShowBookingCta({ priceRange: "FREE" })).toBe(false);
    expect(shouldShowBookingCta({ priceRange: "BUDGET" })).toBe(true);
  });

  it("selects introduction or FAQ answer", () => {
    const guide = { text: "Intro", faqs: [{ question: "Q", answer: "Answer" }] };
    expect(getSpeechText(guide)).toBe("Intro");
    expect(getSpeechText(guide, 0)).toBe("Answer");
    expect(hasSpokenGuide(guide)).toBe(true);
  });
});
```

- [ ] **Step 2: Verify RED**

Run: `cd app; npm test -- src/modules/place/utils/spokenGuide.test.js`

Expected: FAIL because helpers do not exist.

- [ ] **Step 3: Implement the helpers and listening component**

Use `Pressable`, `MaterialIconsRounded`, `LayoutAnimation` only for the single expanded FAQ when supported, and `expo-speech`. Keep one `activeSpeechKey`; call `Speech.stop()` before starting another item and on unmount. The intro control is a 52px dark play/stop pill. FAQ rows are compact accordions with a separate 44px speaker button, accessible labels, and a subtle cyan active state. Do not fake playback progress.

Replace the current audio player/Groq-status block in Place Detail with `SpokenGuideSection`. Remove `expo-audio` usage only if this file has no other audio responsibility. Conditionally render the entire bottom booking bar with `shouldShowBookingCta(place)`, and derive ScrollView bottom padding from that same boolean.

- [ ] **Step 4: Verify mobile**

Run: `cd app; npm test -- src/modules/place/utils/spokenGuide.test.js; npm run lint`

Expected: focused tests pass; lint has no new errors.

### Task 5: Cross-Surface Verification And Cleanup

**Files:**
- Review all files changed in Tasks 1-4.

**Interfaces:**
- Confirms the end-to-end nested payload and DTO use the exact `spokenGuide` name.

- [ ] **Step 1: Search for legacy feature references**

Run: `rg -n "regeneratePlaceAiGuide|schedulePlaceAiGuideGeneration|placeAiGuideTts|audioPublicId|AI_GUIDE_TTS_PROVIDER|FPT_TTS" server web app -g "!**/node_modules/**"`

Expected: no live feature references; historical migration SQL may remain.

- [ ] **Step 2: Run the complete scoped verification**

Run server focused tests and Prisma validation, then web tests/lint, then app tests/lint. Run `git diff --check` on scoped files.

- [ ] **Step 3: Manual QA**

Verify admin create/edit, business edit returning to `PENDING`, paid Place Detail retaining booking, free Place Detail omitting booking and bottom gap, intro play/stop, FAQ switching, unmount stop, and long Vietnamese text wrapping on a narrow Android viewport.

- [ ] **Step 4: Final review**

Confirm no unrelated dirty-worktree edits were reverted, no test data was inserted, no temporary test file exists outside the committed focused tests, and no provider secret/config is required.
