# Admin Place Wizard Ivory Cinematic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the web place create/edit wizard as an ivory, monochrome, cinematic workspace while preserving every existing form, validation, store, API, and administrative-location behavior.

**Architecture:** Keep `PlaceWizardPage` responsible for the shell and step navigation, and keep each existing step responsible for its own data and validation. Add a small wizard presentation layer for reusable surfaces and restrained GSAP entrance transitions; apply it incrementally to the three existing steps without changing data contracts.

**Tech Stack:** React 19, Vite 7, Tailwind CSS 3, Zustand, React Router, Lucide React, GSAP with `@gsap/react`, Vitest, Testing Library.

## Global Constraints

- Web only; do not modify files under `app/`.
- Canvas uses warm ivory `#F4F0E8`; primary surface uses `#FFFEFB`; primary ink uses `#11110F`.
- Decorative icons are black or graphite. Semantic error icons may remain red.
- No colored gradients, full-screen photography, new place fields, backend changes, database changes, or API changes.
- Preserve create and edit routes, Zustand wizard state, validation, administrative province/ward loading, and form submission.
- The ward search matches display names only and ignores Vietnamese diacritics.
- Respect `prefers-reduced-motion`.
- Preserve unrelated dirty-worktree changes and stage only files belonging to the current task.

---

### Task 1: Generate and review the three wizard visual references

**Files:**
- Reference only: generated images returned by `imagegen-frontend-web`; do not add production image assets.
- Review against: `docs/superpowers/specs/2026-07-20-admin-place-wizard-ivory-cinematic-design.md`

**Interfaces:**
- Consumes: approved ivory cinematic design spec.
- Produces: one horizontal reference for each of the three wizard steps.

- [ ] **Step 1: Run the required design preflight**

Use prompt-length seed `185` and record the deterministic direction:

```text
seed=185 -> hero=Editorial Split, font=Geist
components=[Pristine Gapless Bento Grid, Vertical Rhythm Lines, Product UI Panel Stack]
motion=[Image Scale & Fade, Card Stacking]
```

Adapt the selected motion to a form workspace: short image/preview scale-fade and subtle workspace stacking only. Do not add scroll pinning or autoplay motion.

- [ ] **Step 2: Generate step 1 reference**

Generate one 16:9 horizontal web UI reference showing the header, three-step navigation, category panel, basic fields, searchable location controls, address field, and black primary action.

- [ ] **Step 3: Generate step 2 reference**

Generate one 16:9 horizontal web UI reference showing the same shell with editorial tabs for description, media, location, and contact; all icons black.

- [ ] **Step 4: Generate step 3 reference**

Generate one 16:9 horizontal web UI reference showing the same shell with a place-review composition, image preview, metadata rail, and decisive black save action.

- [ ] **Step 5: Review references against constraints**

Expected: all three references share the same ivory, paper, white-surface, black-ink system; each is one section per image; no colored decorative icons, purple/blue gradients, floating blobs, or marketing-page furniture.

---

### Task 2: Add the reusable ivory wizard presentation layer

**Files:**
- Create: `web/src/components/place/wizard/PlaceWizardSurface.jsx`
- Create: `web/src/components/place/wizard/PlaceWizardSurface.test.jsx`
- Modify: `web/package.json`
- Modify: `web/package-lock.json`

**Interfaces:**
- Consumes: React children and optional `className`.
- Produces: `WizardPanel`, `WizardSectionHeading`, `WizardActions`, and `useWizardEntrance(scopeRef, dependency)`.

- [ ] **Step 1: Write the failing presentation contract test**

```jsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WizardPanel, WizardSectionHeading } from "./PlaceWizardSurface";

describe("PlaceWizardSurface", () => {
  it("renders a labelled ivory panel with monochrome icon styling", () => {
    render(
      <WizardPanel aria-label="Location panel">
        <WizardSectionHeading title="Địa chỉ" description="Xác định vị trí" />
      </WizardPanel>,
    );
    expect(screen.getByLabelText("Location panel")).toHaveClass("bg-[#FFFEFB]");
    expect(screen.getByText("Địa chỉ")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd web && npx vitest run src/components/place/wizard/PlaceWizardSurface.test.jsx`

Expected: FAIL because `PlaceWizardSurface.jsx` does not exist.

- [ ] **Step 3: Install GSAP dependencies**

Run: `cd web && npm install gsap @gsap/react`

Expected: `package.json` and `package-lock.json` contain `gsap` and `@gsap/react`.

- [ ] **Step 4: Implement the presentation layer**

```jsx
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

export const WizardPanel = ({ className, children, ...props }) => (
  <section
    className={cn(
      "rounded-[24px] border border-black/10 bg-[#FFFEFB] shadow-[0_24px_70px_rgba(32,28,20,0.08)]",
      className,
    )}
    {...props}
  >
    {children}
  </section>
);

export const WizardSectionHeading = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-3">
    {Icon ? <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 text-[#11110F]" /> : null}
    <div>
      <h2 className="text-base font-semibold tracking-[-0.01em] text-[#11110F]">{title}</h2>
      {description ? <p className="mt-1 text-sm leading-6 text-[#6B675F]">{description}</p> : null}
    </div>
  </div>
);

export const WizardActions = ({ className, children }) => (
  <div className={cn("sticky bottom-4 z-20 flex items-center justify-between rounded-[20px] border border-black/10 bg-[#FFFEFB]/95 p-3 shadow-xl backdrop-blur", className)}>
    {children}
  </div>
);

export const useWizardEntrance = (scopeRef, dependency) => {
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      "[data-wizard-reveal]",
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.07, ease: "power3.out" },
    );
  }, { scope: scopeRef, dependencies: [dependency] });
};
```

- [ ] **Step 5: Run the focused test**

Run: `cd web && npx vitest run src/components/place/wizard/PlaceWizardSurface.test.jsx`

Expected: PASS.

- [ ] **Step 6: Commit the presentation layer**

```bash
git add web/package.json web/package-lock.json web/src/components/place/wizard/PlaceWizardSurface.jsx web/src/components/place/wizard/PlaceWizardSurface.test.jsx
git commit -m "feat(web): add ivory place wizard surfaces"
```

---

### Task 3: Redesign the wizard shell and step navigation

**Files:**
- Modify: `web/src/pages/admin/PlaceWizardPage.jsx`
- Create: `web/src/pages/admin/PlaceWizardPage.test.jsx`

**Interfaces:**
- Consumes: `WizardPanel`, `useWizardEntrance`, Zustand wizard step state, existing translations.
- Produces: the ivory canvas, sticky editorial header, black progress bar, and responsive three-step navigation.

- [ ] **Step 1: Write the failing shell contract test**

```jsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/queries/usePlaceQueries", () => ({ usePlaceDetail: () => ({}) }));
vi.mock("@/components/place/StepBasicInfo", () => ({ default: () => <div>Basic content</div> }));
vi.mock("@/components/place/StepDetails", () => ({ default: () => <div>Details content</div> }));
vi.mock("@/components/place/StepPreview", () => ({ default: () => <div>Preview content</div> }));

import PlaceWizardPage from "./PlaceWizardPage";

describe("PlaceWizardPage", () => {
  it("renders the ivory workspace and three-step navigation", () => {
    render(<MemoryRouter><PlaceWizardPage /></MemoryRouter>);
    expect(screen.getByTestId("place-wizard-canvas")).toHaveClass("bg-[#F4F0E8]");
    expect(screen.getAllByRole("button", { name: /step/i })).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run the shell test and verify it fails**

Run: `cd web && npx vitest run src/pages/admin/PlaceWizardPage.test.jsx`

Expected: FAIL because the canvas test ID and accessible step buttons do not exist.

- [ ] **Step 3: Implement the shell redesign**

Apply these exact layout contracts:

```jsx
<main ref={pageRef} data-testid="place-wizard-canvas" className="min-h-screen overflow-x-hidden bg-[#F4F0E8] text-[#11110F]">
  <header data-wizard-reveal className="sticky top-0 z-40 border-b border-black/10 bg-[#F4F0E8]/92 backdrop-blur-xl">
    {/* max-w-7xl, back action, editorial title, 01 / 03 */}
  </header>
  <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <nav data-wizard-reveal aria-label="Place creation progress" className="grid grid-cols-1 gap-2 md:grid-cols-3">
      {/* active black/white; completed and future ivory/ink */}
    </nav>
    <div data-wizard-reveal className="mt-8">{StepComponent && <StepComponent isEditMode={isEditMode} />}</div>
  </div>
</main>
```

Every step control must be `type="button"`, have an accessible label beginning with `Step`, and preserve the existing rule that only completed steps can be revisited.

- [ ] **Step 4: Run the shell test**

Run: `cd web && npx vitest run src/pages/admin/PlaceWizardPage.test.jsx`

Expected: PASS.

- [ ] **Step 5: Commit the shell**

```bash
git add web/src/pages/admin/PlaceWizardPage.jsx web/src/pages/admin/PlaceWizardPage.test.jsx
git commit -m "feat(web): redesign place wizard shell"
```

---

### Task 4: Redesign step one and retain searchable administrative selection

**Files:**
- Modify: `web/src/components/place/StepBasicInfo.jsx`
- Modify: `web/src/components/common/ProvinceWardSelect.jsx`
- Create: `web/src/components/common/ProvinceWardSelect.test.jsx`

**Interfaces:**
- Consumes: existing `wizardData`, `updateWizardData`, validation handlers, `WizardPanel`, `WizardSectionHeading`, `WizardActions`.
- Produces: two-column basic/location workspace and the existing searchable ward combobox with display-name-only matching.

- [ ] **Step 1: Write the failing ward-search contract test**

```jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/apis/locationService", () => ({
  locationService: {
    getAllProvinces: vi.fn().mockResolvedValue([{ code: "92", fullName: "Thành phố Cần Thơ" }]),
    getWardsByProvince: vi.fn().mockResolvedValue([
      { wardCode: "31117", fullName: "Phường Ninh Kiều" },
      { wardCode: "31201", fullName: "Xã Cờ Đỏ" },
    ]),
  },
}));

import ProvinceWardSelect from "./ProvinceWardSelect";

it("filters ward display names without requiring Vietnamese diacritics", async () => {
  const user = userEvent.setup();
  render(<ProvinceWardSelect provinceCode="92" wardCode="" onProvinceChange={vi.fn()} onWardChange={vi.fn()} />);
  await user.click(await screen.findByRole("button", { name: /chọn phường/i }));
  await user.type(screen.getByLabelText("Tìm kiếm phường xã"), "co do");
  expect(screen.getByRole("option", { name: "Xã Cờ Đỏ" })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: "Phường Ninh Kiều" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the ward-search test**

Run: `cd web && npx vitest run src/components/common/ProvinceWardSelect.test.jsx`

Expected: PASS if the current combobox behavior is preserved; otherwise FAIL and repair only that contract before visual work.

- [ ] **Step 3: Apply the step-one layout**

Use a responsive twelve-column grid with no empty cells:

```jsx
<div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:grid-flow-dense">
  <WizardPanel data-wizard-reveal className="lg:col-span-7">{/* category + identity */}</WizardPanel>
  <WizardPanel data-wizard-reveal className="lg:col-span-5">{/* location + address */}</WizardPanel>
</div>
```

Inputs use `h-12 rounded-[14px] border-black/10 bg-[#F8F5EE] text-[#11110F] focus-visible:border-black focus-visible:ring-black/10`. Section icons use `text-[#11110F]`. Keep semantic validation red.

- [ ] **Step 4: Refine the combobox material without changing behavior**

Use ivory input/trigger surfaces, black search/check/chevron icons, a white dropdown with a black hairline, `max-h-72`, and visible keyboard focus. Do not reintroduce a separate search field.

- [ ] **Step 5: Run focused tests and lint changed files**

Run:

```bash
cd web
npx vitest run src/components/common/ProvinceWardSelect.test.jsx
npx eslint src/components/place/StepBasicInfo.jsx src/components/common/ProvinceWardSelect.jsx
```

Expected: tests PASS and lint exits 0.

- [ ] **Step 6: Commit step one**

```bash
git add web/src/components/place/StepBasicInfo.jsx web/src/components/common/ProvinceWardSelect.jsx web/src/components/common/ProvinceWardSelect.test.jsx
git commit -m "feat(web): redesign place wizard basic step"
```

---

### Task 5: Redesign steps two and three in the same system

**Files:**
- Modify: `web/src/components/place/StepDetails.jsx`
- Modify: `web/src/components/place/StepPreview.jsx`
- Create: `web/src/components/place/PlaceWizardMonochrome.contract.test.jsx`

**Interfaces:**
- Consumes: `WizardPanel`, `WizardSectionHeading`, `WizardActions`, existing step logic and child editors.
- Produces: monochrome editorial detail tabs and review/save composition.

- [ ] **Step 1: Write the failing monochrome contract test**

```jsx
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("place wizard monochrome contract", () => {
  it.each(["StepDetails.jsx", "StepPreview.jsx"])("removes decorative colored icon classes from %s", async (file) => {
    const source = await readFile(new URL(`./${file}`, import.meta.url), "utf8");
    expect(source).not.toMatch(/text-(primary|cyan|green|blue)-[0-9/]/);
    expect(source).not.toMatch(/bg-gradient-to-/);
    expect(source).toContain("text-[#11110F]");
  });
});
```

- [ ] **Step 2: Run the contract test and verify it fails**

Run: `cd web && npx vitest run src/components/place/PlaceWizardMonochrome.contract.test.jsx`

Expected: FAIL on existing primary/cyan/gradient classes.

- [ ] **Step 3: Redesign step two**

Keep the four existing tabs and every child editor. Apply ivory tab rail, black active tab, black icons, `WizardPanel` surfaces, and `WizardActions`. Preserve map lazy loading, lookup behavior, validation, and back/next handlers.

- [ ] **Step 4: Redesign step three**

Replace the colored gradient summary with a white editorial panel. Use a two-column review area (`lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]`), black/graphite icons, restrained image scale-fade on hover, and a black create/save button. Preserve all submission and toast behavior.

- [ ] **Step 5: Run the monochrome test and lint**

Run:

```bash
cd web
npx vitest run src/components/place/PlaceWizardMonochrome.contract.test.jsx
npx eslint src/components/place/StepDetails.jsx src/components/place/StepPreview.jsx
```

Expected: tests PASS and lint exits 0.

- [ ] **Step 6: Commit steps two and three**

```bash
git add web/src/components/place/StepDetails.jsx web/src/components/place/StepPreview.jsx web/src/components/place/PlaceWizardMonochrome.contract.test.jsx
git commit -m "feat(web): complete cinematic place wizard"
```

---

### Task 6: Verify routes, responsive behavior, and production build

**Files:**
- Modify only if verification exposes defects in files from Tasks 2–5.

**Interfaces:**
- Consumes: completed wizard redesign.
- Produces: verified create/edit wizard with no functional regressions.

- [ ] **Step 1: Run all focused tests**

Run:

```bash
cd web
npx vitest run src/components/place/wizard/PlaceWizardSurface.test.jsx src/pages/admin/PlaceWizardPage.test.jsx src/components/common/ProvinceWardSelect.test.jsx src/components/place/PlaceWizardMonochrome.contract.test.jsx
```

Expected: all tests PASS.

- [ ] **Step 2: Run lint**

Run: `cd web && npm run lint -- --no-cache`

Expected: exit 0 with no new warnings in changed files. The pre-existing `BusinessDashboardPage.jsx` purity warning may remain.

- [ ] **Step 3: Run production build**

Run: `cd web && npm run build`

Expected: Vite build exits 0. Existing chunk-size warnings may remain.

- [ ] **Step 4: Browser-check the create route**

Open `http://localhost:5173/admin/places/new` in an authenticated local session. Verify desktop and narrow-web layouts, all three step transitions, province reset, ward search, validation, and black icon treatment.

- [ ] **Step 5: Browser-check the edit route**

Open one existing `/admin/places/:id/edit` route. Verify loaded values, navigation between steps, and that no save action is triggered during visual testing.

- [ ] **Step 6: Review the final diff**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors; unrelated user-owned changes remain un-staged.

- [ ] **Step 7: Commit verification fixes only if needed**

```bash
git add web/src/pages/admin/PlaceWizardPage.jsx web/src/components/place/StepBasicInfo.jsx web/src/components/place/StepDetails.jsx web/src/components/place/StepPreview.jsx web/src/components/common/ProvinceWardSelect.jsx web/src/components/place/wizard/PlaceWizardSurface.jsx
git commit -m "fix(web): polish place wizard responsive states"
```

Skip this commit when verification required no code changes.
