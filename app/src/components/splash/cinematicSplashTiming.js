export const SPLASH_TIMING = Object.freeze({
  BOOTSTRAP_DEADLINE_MS: 1200,
  BRAND_IN_MS: 2000,
  BRAND_OUT_MS: 6500,
  PROGRESS_END_MS: 7600,
  VIDEO_END_MS: 8000,
  FAIL_SAFE_MS: 9000,
  EXIT_FADE_MS: 420,
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function getSplashPhase(elapsedMs) {
  const elapsed = Math.max(0, Number(elapsedMs) || 0);

  return {
    showBrand:
      elapsed >= SPLASH_TIMING.BRAND_IN_MS &&
      elapsed < SPLASH_TIMING.VIDEO_END_MS,
    brandExiting: elapsed >= SPLASH_TIMING.BRAND_OUT_MS,
    progress: clamp(
      (elapsed - SPLASH_TIMING.BRAND_IN_MS) /
        (SPLASH_TIMING.PROGRESS_END_MS - SPLASH_TIMING.BRAND_IN_MS),
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

export function createSplashLifecycle({
  now = Date.now,
  schedule = setTimeout,
  cancel = clearTimeout,
  onFallback = () => {},
  onExit = () => {},
} = {}) {
  let phase = "prepared";
  let startedAt = 0;
  let playbackFailed = false;
  let errorTimer = null;
  let failSafeTimer = null;

  const clearTimer = (timerId) => {
    if (timerId !== null) cancel(timerId);
  };

  const clearTimers = () => {
    clearTimer(errorTimer);
    clearTimer(failSafeTimer);
    errorTimer = null;
    failSafeTimer = null;
  };

  const requestExit = (reason) => {
    if (phase === "exiting" || phase === "finished") return false;
    phase = "exiting";
    clearTimers();
    onExit(reason);
    return true;
  };

  const scheduleErrorExit = () => {
    if (phase !== "active" || errorTimer !== null) return;
    const elapsed = Math.max(0, now() - startedAt);
    const remaining = Math.max(0, SPLASH_TIMING.VIDEO_END_MS - elapsed);
    errorTimer = schedule(() => {
      errorTimer = null;
      requestExit("error");
    }, remaining);
  };

  return {
    prepare() {
      if (phase !== "finished") return false;
      clearTimers();
      phase = "prepared";
      startedAt = 0;
      playbackFailed = false;
      return true;
    },

    activate() {
      if (phase !== "prepared") return false;
      phase = "active";
      startedAt = now();
      failSafeTimer = schedule(() => {
        failSafeTimer = null;
        requestExit("timeout");
      }, SPLASH_TIMING.FAIL_SAFE_MS);
      if (playbackFailed) scheduleErrorExit();
      return !playbackFailed;
    },

    playbackError() {
      if (playbackFailed || phase === "exiting" || phase === "finished") {
        return false;
      }
      playbackFailed = true;
      onFallback();
      scheduleErrorExit();
      return true;
    },

    playbackEnd() {
      if (phase !== "active") return false;
      return requestExit("ended");
    },

    dispose() {
      clearTimers();
      phase = "finished";
    },

    getPhase() {
      return phase;
    },
  };
}
