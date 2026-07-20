# Cinematic Video Splash Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the temporary full-screen video block with a bounded, cinematic eight-second splash experience while preserving the existing MP4 and limiting pre-video hydration wait to 1,200ms.

**Architecture:** Move splash presentation and playback lifecycle into a focused `CinematicSplash` component. Keep deterministic timing constants and completion guards in a pure helper module so startup behavior is unit-testable, while `_layout.jsx` retains only hydration/readiness orchestration.

**Tech Stack:** Expo SDK 54, React Native 0.81, Expo Router, `expo-video`, `expo-image`, React Native Reanimated, `react-native-safe-area-context`, Vitest.

## Global Constraints

- Keep `app/assets/splash.mp4` unchanged and play its full normal duration.
- Native splash hydration wait is capped at exactly `1,200ms`.
- Use the existing Be Vietnam Pro font and existing brand assets.
- Do not install `@expo/ui`, upgrade Expo, or add any native dependency.
- Animate only opacity and transform; never show playback controls or enable audio.
- Use a nine-second fail-safe and invoke the root completion callback exactly once.
- Respect Reduce Motion with opacity-only brand transitions.

---

### Task 1: Deterministic splash lifecycle

**Files:**
- Create: `app/src/components/splash/cinematicSplashTiming.js`
- Test: `app/src/components/splash/cinematicSplashTiming.test.js`

**Interfaces:**
- Produces: `SPLASH_TIMING`, `getSplashPhase(elapsedMs)`, and `createFinishOnce(onFinish)`.
- `getSplashPhase` returns `{ showBrand, brandExiting, progress }` with progress clamped to `0..1`.
- `createFinishOnce` returns a callback that forwards the first completion reason and ignores later calls.

- [ ] **Step 1: Write failing timing and idempotency tests**

```js
import { describe, expect, it, vi } from "vitest";
import {
  SPLASH_TIMING,
  createFinishOnce,
  getSplashPhase,
} from "./cinematicSplashTiming";

describe("cinematic splash timing", () => {
  it("caps native bootstrap waiting at 1200ms", () => {
    expect(SPLASH_TIMING.BOOTSTRAP_DEADLINE_MS).toBe(1200);
  });

  it("reveals and dissolves branding on the approved timeline", () => {
    expect(getSplashPhase(1999).showBrand).toBe(false);
    expect(getSplashPhase(2000).showBrand).toBe(true);
    expect(getSplashPhase(6500).brandExiting).toBe(true);
    expect(getSplashPhase(8000).showBrand).toBe(false);
  });

  it("clamps progress and completes only once", () => {
    expect(getSplashPhase(0).progress).toBe(0);
    expect(getSplashPhase(4800).progress).toBeCloseTo(0.5);
    expect(getSplashPhase(9000).progress).toBe(1);
    const finish = vi.fn();
    const finishOnce = createFinishOnce(finish);
    finishOnce("ended");
    finishOnce("timeout");
    expect(finish).toHaveBeenCalledOnce();
    expect(finish).toHaveBeenCalledWith("ended");
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --run src/components/splash/cinematicSplashTiming.test.js`

Expected: FAIL because `cinematicSplashTiming.js` does not exist.

- [ ] **Step 3: Implement the pure lifecycle helpers**

```js
export const SPLASH_TIMING = Object.freeze({
  BOOTSTRAP_DEADLINE_MS: 1200,
  BRAND_IN_MS: 2000,
  BRAND_OUT_MS: 6500,
  VIDEO_END_MS: 8000,
  FAIL_SAFE_MS: 9000,
  EXIT_FADE_MS: 420,
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function getSplashPhase(elapsedMs) {
  const elapsed = Math.max(0, Number(elapsedMs) || 0);
  return {
    showBrand: elapsed >= SPLASH_TIMING.BRAND_IN_MS && elapsed < SPLASH_TIMING.VIDEO_END_MS,
    brandExiting: elapsed >= SPLASH_TIMING.BRAND_OUT_MS,
    progress: clamp(
      (elapsed - SPLASH_TIMING.BRAND_IN_MS) /
        (SPLASH_TIMING.VIDEO_END_MS - SPLASH_TIMING.BRAND_IN_MS),
      0,
      1,
    ),
  };
}

export function createFinishOnce(onFinish) {
  let finished = false;
  return (reason) => {
    if (finished) return false;
    finished = true;
    onFinish?.(reason);
    return true;
  };
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npm test -- --run src/components/splash/cinematicSplashTiming.test.js`

Expected: 3 tests pass.

### Task 2: Cinematic splash component

**Files:**
- Create: `app/src/components/splash/CinematicSplash.jsx`
- Modify: `app/src/components/splash/cinematicSplashTiming.test.js`

**Interfaces:**
- Consumes: `SPLASH_TIMING` and `createFinishOnce` from Task 1.
- Produces: default component `CinematicSplash({ onFinish })`; `onFinish(reason)` receives `ended`, `error`, or `timeout` exactly once after the exit fade.

- [ ] **Step 1: Add a source contract test for required media safety**

Read `CinematicSplash.jsx` as text and assert it contains `muted = true`, `loop = false`, `showsPlaybackControls={false}`, `resizeMode="cover"`, `playToEnd`, `statusChange`, `useReducedMotion`, and `splash.png`.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --run src/components/splash/cinematicSplashTiming.test.js`

Expected: FAIL because `CinematicSplash.jsx` does not exist.

- [ ] **Step 3: Implement `CinematicSplash`**

Implement a single absolute-fill root containing:

- `VideoView` backed by `useVideoPlayer(require("../../../assets/splash.mp4"))`;
- `expo-image` fallback using `require("../../../assets/splash.png")` after player status `error`;
- `playToEnd` and `statusChange` listener cleanup;
- safe-area-aware brand copy at the lower third;
- Reanimated opacity/translate animations beginning at 2,000ms and dissolving at 6,500ms;
- a one-pixel progress line using `scaleX` with `transformOrigin: "left center"`;
- a nine-second fail-safe;
- a 420ms full-overlay fade before forwarding the completion reason;
- Reduce Motion behavior that omits vertical translation.

Use `StyleSheet.create`, stable styles, and `pointerEvents="none"`. Do not add buttons, controls, blur views, or new assets.

- [ ] **Step 4: Run focused tests and lint the component**

Run: `npm test -- --run src/components/splash/cinematicSplashTiming.test.js`

Run: `npx eslint src/components/splash/CinematicSplash.jsx src/components/splash/cinematicSplashTiming.js src/components/splash/cinematicSplashTiming.test.js`

Expected: all focused tests pass and ESLint reports no errors.

### Task 3: Root startup orchestration and native color continuity

**Files:**
- Modify: `app/app/_layout.jsx`
- Modify: `app/app.json`
- Test: `app/src/components/splash/cinematicSplashTiming.test.js`

**Interfaces:**
- Consumes: `CinematicSplash` and `SPLASH_TIMING.BOOTSTRAP_DEADLINE_MS`.
- Root maintains `splashFinished`; app readiness remains `(stores && fonts) || bootstrapDeadlineReached`.

- [ ] **Step 1: Add root integration contract assertions**

Assert `_layout.jsx` imports `CinematicSplash`, uses `BOOTSTRAP_DEADLINE_MS`, does not import `VideoView` or `useVideoPlayer`, and renders `<CinematicSplash onFinish={...} />` while unfinished.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --run src/components/splash/cinematicSplashTiming.test.js`

Expected: FAIL because root layout still owns the temporary video implementation.

- [ ] **Step 3: Integrate the component into `_layout.jsx`**

- Remove `useVideoPlayer`, `VideoView`, the root video listener, and the 2,500ms timeout.
- Replace them with a 1,200ms bootstrap deadline using `SPLASH_TIMING.BOOTSTRAP_DEADLINE_MS`.
- Keep application content mounted behind the splash once readiness wins or the deadline fires.
- Hide the native splash when readiness/deadline resolves.
- Render `CinematicSplash` above the app until its completion callback sets `splashFinished`.
- Switch the status bar to light content while the cinematic splash is visible and restore dark content afterward.

- [ ] **Step 4: Match native configuration colors**

Set all native splash background declarations and Android startup status bar background in `app.json` to `#02030A`. Keep the existing splash image and `contain` resize mode.

- [ ] **Step 5: Verify focused and full regressions**

Run: `npm test -- --run src/components/splash/cinematicSplashTiming.test.js`

Expected: all splash tests pass.

Run: `npm test`

Expected: the complete app suite passes.

Run: `npm run lint`

Expected: zero ESLint errors.

- [ ] **Step 6: Inspect the final diff**

Run: `git diff --check` and `git diff -- app/app/_layout.jsx app/app.json app/src/components/splash`.

Expected: no whitespace errors, no MP4 changes, no dependency changes, and only the approved splash implementation files are present.
