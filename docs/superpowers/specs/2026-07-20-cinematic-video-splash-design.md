# Cinematic Video Splash Design

## Goal

Turn the existing eight-second `app/assets/splash.mp4` into a polished, cinematic app introduction without replacing or editing the video. The splash must feel intentional, preserve the iPoint Genie identity, and transition into the application without white flashes, abrupt cuts, or startup deadlocks.

## Visual Direction

- Platform mode: cross-platform premium neutral.
- Theme: deep near-black navy with white and pearlescent lavender/cyan accents taken from the current logo artwork.
- The video remains full-bleed and visually dominant.
- UI is limited to a restrained wordmark, one short Vietnamese descriptor, a thin progress line, and subtle edge treatment.
- No buttons, cards, pills, badges, decorative icon packs, or additional gradients.
- Use Be Vietnam Pro, which is already loaded by the application.

## Eight-Second Timeline

1. `0.0–2.0s`: show only the video. The overlay fades in from the native splash so the opening remains cinematic.
2. `2.0–2.6s`: reveal the `iPoint Genie` wordmark and `Trợ lý hành trình thông minh` with a short opacity/translate transition.
3. `2.0–7.6s`: animate a one-pixel progress line from left to right near the bottom safe area.
4. `6.5–8.0s`: dissolve the wordmark and descriptor while a restrained dark edge vignette increases slightly.
5. At video completion, fade the entire splash overlay out and reveal the already-mounted application underneath.

The splash must not be shortened during normal playback. A nine-second fail-safe prevents a broken video event from trapping the user.

## Component Boundary

Create a focused `CinematicSplash` component outside the Expo Router route directory. It owns:

- the existing `expo-video` player;
- phase and completion events;
- visual overlays and safe-area placement;
- progress and exit animations;
- the static fallback when playback fails.

The root layout owns only application readiness and whether the splash is mounted. This keeps startup orchestration separate from presentation.

## Startup Flow

1. Keep the native splash visible while fonts and persisted stores hydrate.
2. Match the native splash background to the video's near-black opening color.
3. Mount the application behind `CinematicSplash` once readiness is reached.
4. Hide the native splash, revealing the already-prepared video layer.
5. When playback completes or the fail-safe fires, `CinematicSplash` performs its exit transition and calls `onFinish` once.

The video may begin preparing before application readiness, but the eight-second user-visible timeline starts only after the native splash is hidden.

## Motion and Performance

- Animate only opacity and transform for the wordmark and full-screen exit.
- Animate progress with a horizontal scale transform, not width layout updates.
- Keep the video as a single full-screen `VideoView` using `resizeMode="cover"`.
- Avoid blur views and real-time image filters over video.
- Respect Reduce Motion: retain the video, remove translate motion, and use short opacity changes only.
- Prevent duplicate completion callbacks when both `playToEnd` and the fail-safe execute.

## Failure Handling

- If playback reports an error, show the existing static `splash.png` artwork on the same dark background and finish through the normal fade.
- If the end event is never received, complete at nine seconds.
- If fonts or persisted stores exceed the existing readiness timeout, preserve the current application fallback behavior.
- Cleanup player listeners and timers on unmount.

## Expo Compatibility

The application is on Expo SDK 54. Do not add `@expo/ui`: its universal UI layer requires SDK 56+, and native UI controls provide no benefit for this video overlay. Continue using React Native primitives, `expo-video`, safe-area insets, and the fonts already installed in the app.

## Testing and Acceptance Criteria

- Unit-test phase timing, completion idempotency, error fallback, and fail-safe behavior using extracted pure helpers where appropriate.
- Existing app tests and lint must continue to pass.
- Native splash and video background visually match with no white flash.
- Video plays for its full normal duration.
- Text remains inside top and bottom safe areas on supported phone sizes.
- Playback controls never appear and the video remains muted.
- Splash exits exactly once on successful completion, playback error, or timeout.
- No new native dependency or Expo SDK upgrade is introduced.
