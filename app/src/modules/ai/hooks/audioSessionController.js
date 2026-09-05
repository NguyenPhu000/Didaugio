export const RECORDING_AUDIO_MODE = Object.freeze({
  allowsRecording: true,
  playsInSilentMode: true,
  interruptionMode: "duckOthers",
});

export const IDLE_AUDIO_MODE = Object.freeze({
  allowsRecording: false,
  playsInSilentMode: true,
  interruptionMode: "mixWithOthers",
});

export function createAsyncGate() {
  let userTransitionActive = false;
  let queuedTransitions = 0;
  let tail = Promise.resolve();

  const schedule = (task, onSettled) => {
    const operation = tail.then(task);
    tail = operation.catch(() => {});
    return operation.finally(onSettled);
  };

  return {
    isLocked: () => userTransitionActive || queuedTransitions > 0,
    run: async (task) => {
      if (userTransitionActive || queuedTransitions > 0) return false;

      userTransitionActive = true;
      return schedule(task, () => {
        userTransitionActive = false;
      });
    },
    enqueue: (task) => {
      queuedTransitions += 1;
      return schedule(task, () => {
        queuedTransitions -= 1;
      });
    },
  };
}

export function createMountedCallbackGuard() {
  let mounted = true;

  return {
    isMounted: () => mounted,
    unmount: () => {
      mounted = false;
    },
    run: (callback, ...args) => {
      if (!mounted) return false;
      callback(...args);
      return true;
    },
  };
}

export async function restoreIdleAudioMode(setAudioMode) {
  try {
    await setAudioMode(IDLE_AUDIO_MODE);
  } catch {
    // The preceding recorder error is more useful to callers than a cleanup error.
  }
}

export async function startAudioRecording({
  requestPermission,
  setAudioMode,
  recorder,
  recordingOptions,
  canContinue = () => true,
}) {
  const permission = await requestPermission();
  const isGranted = permission?.granted || permission?.status === "granted";
  if (!isGranted || !canContinue()) {
    await restoreIdleAudioMode(setAudioMode);
    return false;
  }

  try {
    await setAudioMode(RECORDING_AUDIO_MODE);
    if (!canContinue()) {
      await restoreIdleAudioMode(setAudioMode);
      return false;
    }

    try {
      if (recorder && recorder.isRecording) {
        await recorder.stop();
      }
    } catch {
      // Ignore prior cleanup error
    }

    await recorder.prepareToRecordAsync(recordingOptions);
    if (!canContinue()) {
      await restoreIdleAudioMode(setAudioMode);
      return false;
    }

    recorder.record({ forDuration: 45 });
    return true;
  } catch (error) {
    await restoreIdleAudioMode(setAudioMode);
    throw error;
  }
}

export async function stopAudioRecording({ recorder, setAudioMode }) {
  try {
    if (recorder) {
      try {
        await recorder.stop();
      } catch {
        // Ignore stop error if already stopped
      }
    }
    return recorder?.uri || null;
  } finally {
    await restoreIdleAudioMode(setAudioMode);
  }
}
