# Admin Place Wizard — Ivory Cinematic Design

## Goal

Redesign the web place creation and editing wizard at `/admin/places/new` and `/admin/places/:id/edit` into the approved premium `Ivory Workspace` administrative workspace without reducing form clarity or changing existing business behavior.

The approved reference is a light ivory paper workspace inside the existing admin sidebar and topbar: black typography and icons, a horizontal stepper panel, white work panels, and a black action button. The redesign covers all three wizard steps so the experience remains coherent from entry through preview and save.

## Scope

- Redesign the shared wizard workspace in `PlaceWizardPage`; preserve `AdminLayout` and `AdminHeader` rather than rebuilding the global sidebar or topbar.
- Redesign the first-step information and address workspace in `StepBasicInfo`.
- Extend the same visual language to `StepDetails` and `StepPreview`.
- Preserve the province selector and searchable ward/commune combobox behavior.
- Preserve validation, store state, API calls, create/edit routes, and submission behavior.
- Web only. No React Native or mobile application changes.

## Visual Direction

### Palette and material

- Canvas: warm ivory paper, approximately `#F4F0E8`.
- Primary surface: soft white, approximately `#FFFEFB`.
- Primary ink: near-black, approximately `#11110F`.
- Secondary ink: warm graphite, approximately `#5B5953`.
- Hairlines: translucent black, approximately `rgba(17, 17, 15, 0.12)`.
- Primary action: black surface with white text.
- Destructive and validation colors remain semantic red where required.
- No colored gradients. A restrained monochrome radial wash or paper-noise texture may provide depth.

All interface icons use black or graphite. Colored decorative icons are removed. Semantic error icons may remain red because they communicate state rather than decoration.

### Typography

- Use the existing project font stack where possible and favor Geist-like editorial proportions.
- The page title is wide, concise, and limited to one or two lines.
- Labels remain compact and readable; no decorative uppercase metadata spam.
- Large step numbers provide editorial hierarchy without becoming ornamental noise.

### Shape and depth

- Primary work surfaces use approximately 24px corner radii.
- Inputs use approximately 14–16px corner radii and 48–52px minimum height.
- Shadows are broad and soft with low opacity.
- Borders remain visible enough to preserve form affordance.

## Page Architecture

### Wizard header

- The existing `AdminHeader` remains the global header and sidebar trigger.
- The wizard workspace begins with a compact page title row: back action on the left, title `Thêm địa điểm mới`, and current-step indicator `01 / 03` on the right.
- The title row uses an ivory surface and a bottom hairline rather than duplicating global navigation.

### Step navigation

- Horizontal editorial step navigation sits inside one large white panel below the title row.
- Each step displays a circled two-digit number, title, and concise description, with hairline connectors between steps.
- The active number is a black circle with white ink; completed steps remain visually strong and clickable; future steps are quiet but legible.
- Mobile web collapses the descriptions without changing the native mobile app.

### Form workspace

- Step one groups category and basic information on the left, location and address on the right.
- Step two uses a large left content panel and a right media-preview panel, matching the approved reference.
- Step three uses a large review panel and a narrow metadata rail.
- Sections use a small black icon, title, and concise helper text.
- The ward selector remains one searchable combobox; search is inside the dropdown.
- The primary action sits in a deliberate black action bar or footer region with clear hierarchy.

### Steps two and three

- Step two applies the same surface, label, input, and upload treatment.
- Step three becomes an editorial review surface with a strong content preview and a clear final-save action.
- No new data fields or workflow states are introduced.

## Motion

- Use one restrained entrance sequence for header, step navigation, and workspace.
- Use one transition sequence when changing wizard steps.
- Motion uses short fade and vertical translation only; it must not delay input readiness.
- Hover states use slight elevation and translation on clickable surfaces.
- Respect reduced-motion preferences.

## Component Boundaries

- `PlaceWizardPage` owns the page canvas, sticky header, progress, and step navigation.
- `StepBasicInfo` owns first-step form grouping and actions.
- `ProvinceWardSelect` owns province loading, ward loading, searchable ward selection, and selection accessibility.
- Shared presentation helpers may be extracted only when they are reused by at least two wizard steps.
- Data fetching and store logic remain outside visual primitives.

## Interaction and Accessibility

- All interactive targets remain at least 40px high.
- Keyboard focus is visible using a black focus ring with adequate offset.
- The ward combobox supports opening, searching, selecting, clearing search, and closing outside.
- Selected, loading, empty, disabled, and validation states remain explicit.
- Color is never the only indication of status.
- Text and control contrast meet WCAG AA expectations.

## Image Reference Plan

Generate three separate horizontal design references in one consistent ivory-and-black system:

1. Basic information and location step.
2. Details, content, and media step.
3. Review and save step.

Each reference represents one wizard step. The images guide layout, spacing, typography, material, and interaction hierarchy; they are not production assets and will not be shipped in the web bundle.

## Verification

- Run web lint and ensure no new warnings are introduced by changed files.
- Run the production Vite build.
- Test the create route and edit route.
- Verify all three step transitions.
- Verify province selection resets the ward selection.
- Verify ward search ignores Vietnamese diacritics and searches display names only.
- Verify keyboard navigation, focus visibility, loading, empty, and validation states.
- Visually check desktop and narrow web breakpoints.
- Confirm no React Native application files are changed by this redesign.

## Non-goals

- No backend, database, API, or administrative dataset changes.
- No new place fields.
- No mobile-native redesign.
- No redesign of unrelated admin pages.
- No decorative colored icon system.
- No full-screen photography that competes with form readability.
- No changes to `AdminLayout`, `AdminHeader`, sidebar menu labels, or global account controls as part of this wizard-only redesign.
