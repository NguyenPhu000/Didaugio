import { beforeEach, describe, expect, it, vi } from "vitest";
import { IDLE_AUDIO_MODE, RECORDING_AUDIO_MODE } from "./audioSessionController";
import { useGenieVoice } from "./useGenieVoice";

const mocks = vi.hoisted(() => {
  const cleanups = [];
  const stateSetters = [];
  const recorder = {
    isRecording: false,
    uri: null,
    prepareToRecordAsync: vi.fn(),
    record: vi.fn(() => {
      recorder.isRecording = true;
    }),
    stop: vi.fn(async () => {
      recorder.isRecording = false;
    }),
  };

  return {
    cleanups,
    stateSetters,
    ignoreFunctionalStateUpdaters: false,
    recorder,
    requestPermission: vi.fn(),
    setAudioMode: vi.fn(),
    speech: { stop: vi.fn(), speak: vi.fn() },
    apiClient: { post: vi.fn() },
    resetReact: () => {
      cleanups.length = 0;
      stateSetters.length = 0;
      mocks.ignoreFunctionalStateUpdaters = false;
    },
    unmount: () => {
      cleanups.splice(0).reverse().forEach((cleanup) => cleanup());
    },
  };
});

vi.mock("react", () => ({
  useCallback: (callback) => callback,
  useRef: (initialValue) => ({ current: initialValue }),
  useState: (initialValue) => {
    let value = initialValue;
    const setter = vi.fn((nextValue) => {
      if (mocks.ignoreFunctionalStateUpdaters && typeof nextValue === "function") {
        return;
      }
      value = typeof nextValue === "function" ? nextValue(value) : nextValue;
    });
    mocks.stateSetters.push(setter);
    return [value, setter];
  },
  useEffect: (effect) => {
    const cleanup = effect();
    if (typeof cleanup === "function") mocks.cleanups.push(cleanup);
  },
}));

vi.mock("expo-audio", () => ({
  RecordingPresets: { HIGH_QUALITY: { extension: ".m4a" } },
  requestRecordingPermissionsAsync: mocks.requestPermission,
  setAudioModeAsync: mocks.setAudioMode,
  useAudioRecorder: () => mocks.recorder,
  useAudioRecorderState: () => ({ metering: null }),
}));

vi.mock("expo-speech", () => mocks.speech);
vi.mock("../../../api/endpoints", () => ({
  ENDPOINTS: { ai: { voiceTranscribe: "/voice" } },
}));
vi.mock("../../../api/client", () => ({ default: mocks.apiClient }));
vi.mock("../../../constants/api", () => ({ AI_REQUEST_TIMEOUT: 1000 }));
vi.mock("../../../constants/voice-error-codes", () => ({
  VOICE_ERROR_CODES: {
    PERMISSION_DENIED: "VOICE_PERMISSION_DENIED",
    EMPTY_RECORDING: "VOICE_EMPTY_RECORDING",
  },
}));

describe("useGenieVoice audio lifecycle", () => {
  beforeEach(() => {
    mocks.resetReact();
    mocks.recorder.isRecording = false;
    mocks.recorder.uri = null;
    mocks.recorder.prepareToRecordAsync.mockReset().mockResolvedValue(undefined);
    mocks.recorder.record.mockClear();
    mocks.recorder.stop.mockReset().mockImplementation(async () => {
      mocks.recorder.isRecording = false;
    });
    mocks.requestPermission.mockReset();
    mocks.setAudioMode.mockReset().mockResolvedValue(undefined);
    mocks.speech.stop.mockReset().mockResolvedValue(undefined);
    mocks.speech.speak.mockReset();
    mocks.apiClient.post.mockReset().mockResolvedValue({ data: { text: "xin chào" } });
  });

  it("ignores a second start while permission is pending", async () => {
    let grantPermission;
    mocks.requestPermission.mockImplementation(
      () => new Promise((resolve) => {
        grantPermission = resolve;
      }),
    );
    const voice = useGenieVoice();

    const firstStart = voice.startRecording();
    await Promise.resolve();

    await expect(voice.startRecording()).resolves.toBe(false);
    grantPermission({ granted: true });

    await expect(firstStart).resolves.toBe(true);
    expect(mocks.requestPermission).toHaveBeenCalledTimes(1);
    expect(mocks.recorder.prepareToRecordAsync).toHaveBeenCalledTimes(1);
    expect(mocks.recorder.record).toHaveBeenCalledTimes(1);
    expect(mocks.setAudioMode).toHaveBeenCalledWith(RECORDING_AUDIO_MODE);
  });

  it("restores playback mode before transcribing a stopped recording", async () => {
    mocks.requestPermission.mockResolvedValue({ granted: true });
    mocks.recorder.stop.mockImplementation(async () => {
      mocks.recorder.isRecording = false;
      mocks.recorder.uri = "file:///voice.m4a";
    });
    const voice = useGenieVoice();

    await expect(voice.startRecording()).resolves.toBe(true);
    await expect(voice.stopRecordingAndTranscribe()).resolves.toBe("xin chào");

    expect(mocks.setAudioMode.mock.calls.map(([mode]) => mode)).toEqual([
      RECORDING_AUDIO_MODE,
      IDLE_AUDIO_MODE,
    ]);
    expect(mocks.apiClient.post).toHaveBeenCalledTimes(1);
  });

  it("keeps the status ref current when React defers functional state updaters", async () => {
    mocks.ignoreFunctionalStateUpdaters = true;
    mocks.requestPermission.mockResolvedValue({ granted: true });
    mocks.recorder.stop.mockImplementation(async () => {
      mocks.recorder.isRecording = false;
      mocks.recorder.uri = "file:///voice.m4a";
    });
    const voice = useGenieVoice();

    await expect(voice.startRecording()).resolves.toBe(true);
    await expect(voice.stopRecordingAndTranscribe()).resolves.toBe("xin chào");

    expect(mocks.apiClient.post).toHaveBeenCalledTimes(1);
  });

  it("waits for existing speech to stop before requesting recording permission", async () => {
    let releaseSpeechStop;
    mocks.speech.stop.mockImplementation(
      () => new Promise((resolve) => {
        releaseSpeechStop = resolve;
      }),
    );
    mocks.requestPermission.mockResolvedValue({ granted: true });
    const voice = useGenieVoice();

    const start = voice.startRecording();
    await Promise.resolve();

    expect(mocks.requestPermission).not.toHaveBeenCalled();
    releaseSpeechStop();

    await expect(start).resolves.toBe(true);
  });

  it("waits for existing speech to stop before starting a new utterance", async () => {
    let releaseSpeechStop;
    mocks.speech.stop.mockImplementation(
      () => new Promise((resolve) => {
        releaseSpeechStop = resolve;
      }),
    );
    const voice = useGenieVoice();

    const speak = voice.speakText("xin chào");
    await Promise.resolve();

    expect(mocks.speech.speak).not.toHaveBeenCalled();
    releaseSpeechStop();

    await expect(speak).resolves.toBe(true);
    expect(mocks.speech.speak).toHaveBeenCalledTimes(1);
  });

  it("restores idle mode and reports a stable error when speech stop fails before recording", async () => {
    mocks.speech.stop.mockRejectedValue(new Error("speech native failure"));
    const voice = useGenieVoice();

    await expect(voice.startRecording()).resolves.toBe(false);

    expect(mocks.requestPermission).not.toHaveBeenCalled();
    expect(mocks.setAudioMode).toHaveBeenCalledWith(IDLE_AUDIO_MODE);
    expect(mocks.stateSetters[0]).toHaveBeenLastCalledWith("error");
    expect(mocks.stateSetters[4]).toHaveBeenLastCalledWith("VOICE_SESSION_FAILED");
  });

  it("returns a stable error instead of rejecting when speech stop fails before speaking", async () => {
    mocks.speech.stop.mockRejectedValue(new Error("speech native failure"));
    const voice = useGenieVoice();

    await expect(voice.speakText("xin chào")).resolves.toBe(false);

    expect(mocks.speech.speak).not.toHaveBeenCalled();
    expect(mocks.stateSetters[0]).toHaveBeenLastCalledWith("error");
    expect(mocks.stateSetters[4]).toHaveBeenLastCalledWith("VOICE_SESSION_FAILED");
  });

  it("ignores stale callbacks from speech superseded by a newer utterance", async () => {
    const voice = useGenieVoice();

    await expect(voice.speakText("first")).resolves.toBe(true);
    const staleCallbacks = mocks.speech.speak.mock.calls[0][1];
    await expect(voice.speakText("second")).resolves.toBe(true);
    mocks.stateSetters[0].mockClear();

    staleCallbacks.onError();

    expect(mocks.stateSetters[0]).not.toHaveBeenCalled();
  });

  it("queues unmount cleanup behind an active native audio transition", async () => {
    const calls = [];
    let releaseRecordingMode;
    let speechStops = 0;
    mocks.speech.stop.mockImplementation(async () => {
      speechStops += 1;
      calls.push(`speech-stop:${speechStops}`);
    });
    mocks.requestPermission.mockResolvedValue({ granted: true });
    mocks.setAudioMode.mockImplementation((mode) => {
      if (mode === RECORDING_AUDIO_MODE) {
        calls.push("recording-mode:start");
        return new Promise((resolve) => {
          releaseRecordingMode = () => {
            calls.push("recording-mode:end");
            resolve();
          };
        });
      }
      calls.push("idle-mode");
      return Promise.resolve();
    });
    const voice = useGenieVoice();

    const start = voice.startRecording();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(releaseRecordingMode).toBeTypeOf("function");
    mocks.unmount();
    expect(calls).toEqual(["speech-stop:1", "recording-mode:start"]);
    expect(mocks.recorder.stop).not.toHaveBeenCalled();

    releaseRecordingMode();
    await expect(start).resolves.toBe(false);
    await Promise.resolve();
    await Promise.resolve();

    expect(calls).toEqual([
      "speech-stop:1",
      "recording-mode:start",
      "recording-mode:end",
      "idle-mode",
      "speech-stop:2",
      "idle-mode",
    ]);
  });

  it("stops speech, restores idle mode, and prevents post-unmount setters", async () => {
    let grantPermission;
    mocks.requestPermission.mockImplementation(
      () => new Promise((resolve) => {
        grantPermission = resolve;
      }),
    );
    const voice = useGenieVoice();
    const start = voice.startRecording();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    mocks.stateSetters.forEach((setter) => setter.mockClear());
    mocks.unmount();
    grantPermission({ granted: true });

    await expect(start).resolves.toBe(false);
    await Promise.resolve();
    expect(mocks.speech.stop).toHaveBeenCalled();
    expect(mocks.setAudioMode).toHaveBeenCalledWith(IDLE_AUDIO_MODE);
    expect(mocks.recorder.prepareToRecordAsync).not.toHaveBeenCalled();
    expect(mocks.stateSetters.every((setter) => setter.mock.calls.length === 0)).toBe(true);
  });
});
