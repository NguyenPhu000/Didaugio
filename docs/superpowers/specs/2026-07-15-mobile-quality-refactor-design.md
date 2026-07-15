# Mobile Quality Refactor Design

## Goal

Reduce the mobile app's oversized screen modules, centralize non-UI duplicated literals, and replace multi-argument route and itinerary helper APIs with named-object parameters without changing user-visible behavior.

## Scope and constraints

- Preserve the current uncommitted `MapScreen.jsx` logger changes.
- Keep the map's selection, route-preview, active-trip, check-in, location, and navigation behavior unchanged.
- Keep the AI planner's text chat, voice recording, transcription, speech, history, and alert behavior unchanged.
- Do not centralize NativeWind utility strings. Only stable storage keys, shared error codes, and repeated non-theme literals move to constants.
- Every changed pure helper and controller boundary receives a Vitest regression test before its production change.

## Architecture

### Map screen

`MapScreen.jsx` becomes a composition root under 900 lines. It keeps router bindings and assembles three focused modules:

- `hooks/useMapTripExperience.js` owns active-trip derived state, preview-route loading, arrival handling, departure reminders, voice mute persistence, and its callbacks.
- `components/MapScreenCanvas.jsx` renders `MapView`, boundary data, user-location marker, route polylines, snap line, and trip-preview markers. It receives grouped `map`, `route`, and `tripPreview` view models rather than a long positional prop list.
- `components/MapScreenOverlays.jsx` renders loading/error state, top controls, FAB controls, place preview, check-in, filters, navigation banners, and trip modals. It receives grouped `place`, `navigation`, `controls`, and `status` models.

Existing `useMapLocationTracker`, `useNavigationController`, `MapTopControls`, `MapFabStack`, `MapPlacePreviewCard`, and navigation/banner components remain the owning implementation of their current responsibilities. The new modules only relocate composition and presentation; they do not duplicate location or navigation logic.

### AI planner

`AIPlanner.jsx` becomes a screen composition root under 700 lines:

- `components/genie/GenieAvatar.jsx` owns the visual avatar and gradient constants used only by that visual.
- `components/genie/GenieVoicePanel.jsx` owns the voice-card rendering and waveform presentation.
- `hooks/useGenieVoiceController.js` wraps `useGenieVoice` and exposes `voiceState`, `handleVoicePress`, `getStatusText`, `getWaveLabel`, `getWaveSublabel`, `speakText`, and `stopSpeaking`.

The controller accepts `{ isLoading, onTranscript, t }`. It deduplicates transcript versions, calls `onTranscript(transcript)` once for each new transcript, and maps voice errors to translated status text. `AIPlanner` remains responsible for planner/chat intent routing and its alert state.

### Shared constants

Create `src/constants/storage.js` with an immutable `OFFLINE_STORAGE_KEYS` object for the persisted trip cache, pending trip actions, saved places, saved collections, and React Query persister key. Replace direct string literals at all AsyncStorage/query-persist call sites.

Extend `src/constants/errors.js` with immutable `VOICE_ERROR_CODES` for `VOICE_PERMISSION_DENIED` and `VOICE_EMPTY_RECORDING`. Error display remains translated at the caller; constants are identifiers, not English UI copy.

### Object parameter APIs

Replace positional route-helper calls with destructured object parameters:

- `pointToSegmentDistance({ gpsPoint, segmentStart, segmentEnd })`
- `snapToRoute({ gpsPoint, polylineCoords, lastKnownIndex, options })`
- `isOffRoute({ distanceToRouteM, thresholdM })`
- `calculateProgress({ gpsPoint, polylineCoords, steps, speedKmh, lastKnownIndex })`
- `hasPassedManeuver({ gpsPoint, maneuverPoint, nextSegmentHeading, currentHeading })`
- `getDayNumberFromDate({ tripStartYmd, targetYmd, dayCount })`

All direct callers and tests change in the same commit. No compatibility overload is retained: internal callers use the named API exclusively, making future additions non-breaking.

## Data flow and failure handling

Map controller hooks continue receiving data from the existing query and location hooks, build memoized view models, and pass them to the canvas/overlay components. Location-permission and route failures continue to reach the existing alert/status UI. The screen does not create new network calls.

The AI voice controller delegates audio lifecycle to `useGenieVoice`; it only converts state into display-ready values and prevents duplicate transcript dispatch. Recording/transcription failures are surfaced through the existing translated status/error UI and do not send an empty message.

## Tests and verification

- Add controller tests for transcript deduplication, listening-to-stop behavior, and voice error mapping using the existing Vitest setup.
- Update route-engine tests to assert the object APIs preserve snap, off-route, progress, and maneuver behavior.
- Add trip-helper coverage for named day-number arguments.
- Add constants tests/import assertions where they protect key names used for persisted data.
- Run targeted Vitest suites, then `npm test` and `npm run lint` from `app`.
- Verify with line counts that `MapScreen.jsx` and `AIPlanner.jsx` no longer exceed the thresholds above, and search confirms no former offline-key or route-helper positional call remains.

## Out of scope

- Redesigning the map or AI planner UI.
- Changing the routing backend, cache schema/version, or storage values.
- A project-wide hex-color migration; design-token cleanup outside the affected modules is a separate effort.
