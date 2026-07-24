import { describe, expect, it, vi } from "vitest";
import {
  IDLE_AUDIO_MODE,
  RECORDING_AUDIO_MODE,
  createAsyncGate,
  createMountedCallbackGuard,
  startAudioRecording,
  stopAudioRecording,
} from "./audioSessionController";

describe("audioSessionController", () => {
  it("uses non-exclusive audio interaction modes", () => {
    expect(RECORDING_AUDIO_MODE).toMatchObject({
      allowsRecording: true,
      interruptionMode: "duckOthers",
    });
    expect(IDLE_AUDIO_MODE).toMatchObject({
      allowsRecording: false,
      interruptionMode: "mixWithOthers",
    });
  });

  it("rejects overlapping hardware transitions", async () => {
    let release;
    const gate = createAsyncGate();
    const first = gate.run(
      () => new Promise((resolve) => {
        release = resolve;
      }),
    );

    await Promise.resolve();

    expect(await gate.run(vi.fn())).toBe(false);
    release("done");
    expect(await first).toBe("done");
    expect(gate.isLocked()).toBe(false);
  });

  it("queues cleanup behind an active transition without allowing a parallel call", async () => {
    let release;
    const calls = [];
    const gate = createAsyncGate();
    const activeTransition = gate.run(
      () => new Promise((resolve) => {
        calls.push("recording-mode:start");
        release = () => {
          calls.push("recording-mode:end");
          resolve();
        };
      }),
    );
    await Promise.resolve();

    const cleanup = gate.enqueue(async () => {
      calls.push("idle-mode");
    });

    expect(await gate.run(vi.fn())).toBe(false);
    expect(calls).toEqual(["recording-mode:start"]);

    release();
    await activeTransition;
    await cleanup;

    expect(calls).toEqual([
      "recording-mode:start",
      "recording-mode:end",
      "idle-mode",
    ]);
    expect(gate.isLocked()).toBe(false);
  });

  it("unlocks after a transition throws", async () => {
    const gate = createAsyncGate();

    await expect(gate.run(async () => {
      throw new Error("native failure");
    })).rejects.toThrow("native failure");

    expect(gate.isLocked()).toBe(false);
    await expect(gate.run(async () => "next transition")).resolves.toBe("next transition");
  });

  it("restores idle mode after a failed recorder start", async () => {
    const modes = [];
    const recorder = {
      prepareToRecordAsync: vi.fn().mockRejectedValue(new Error("prepare failed")),
      record: vi.fn(),
    };

    await expect(startAudioRecording({
      requestPermission: vi.fn().mockResolvedValue({ granted: true }),
      setAudioMode: async (mode) => modes.push(mode),
      recorder,
      recordingOptions: { extension: ".m4a" },
    })).rejects.toThrow("prepare failed");

    expect(modes).toEqual([RECORDING_AUDIO_MODE, IDLE_AUDIO_MODE]);
    expect(recorder.record).not.toHaveBeenCalled();
  });

  it("restores idle mode when recording permission is denied", async () => {
    const setAudioMode = vi.fn().mockResolvedValue(undefined);
    const recorder = {
      prepareToRecordAsync: vi.fn(),
      record: vi.fn(),
    };

    await expect(startAudioRecording({
      requestPermission: vi.fn().mockResolvedValue({ granted: false }),
      setAudioMode,
      recorder,
      recordingOptions: { extension: ".m4a" },
    })).resolves.toBe(false);

    expect(setAudioMode).toHaveBeenCalledWith(IDLE_AUDIO_MODE);
    expect(recorder.prepareToRecordAsync).not.toHaveBeenCalled();
  });

  it("captures the recorder URI only after stop and restores idle mode", async () => {
    const modes = [];
    const recorder = {
      uri: null,
      stop: vi.fn(async () => {
        recorder.uri = "file:///recording.m4a";
      }),
    };

    await expect(stopAudioRecording({
      recorder,
      setAudioMode: async (mode) => modes.push(mode),
    })).resolves.toBe("file:///recording.m4a");

    expect(recorder.stop).toHaveBeenCalledTimes(1);
    expect(modes).toEqual([IDLE_AUDIO_MODE]);
  });

  it("does not invoke setters after the owner unmounts", () => {
    const setStatus = vi.fn();
    const guard = createMountedCallbackGuard();

    expect(guard.run(setStatus, "listening")).toBe(true);
    guard.unmount();
    expect(guard.run(setStatus, "idle")).toBe(false);
    expect(setStatus).toHaveBeenCalledTimes(1);
    expect(setStatus).toHaveBeenCalledWith("listening");
  });

  it("does not prepare or record after the owner unmounts during permission", async () => {
    let grantPermission;
    const guard = createMountedCallbackGuard();
    const modes = [];
    const recorder = {
      prepareToRecordAsync: vi.fn(),
      record: vi.fn(),
    };

    const start = startAudioRecording({
      requestPermission: () => new Promise((resolve) => {
        grantPermission = resolve;
      }),
      setAudioMode: async (mode) => modes.push(mode),
      recorder,
      recordingOptions: { extension: ".m4a" },
      canContinue: guard.isMounted,
    });

    guard.unmount();
    grantPermission({ granted: true });

    await expect(start).resolves.toBe(false);
    expect(recorder.prepareToRecordAsync).not.toHaveBeenCalled();
    expect(recorder.record).not.toHaveBeenCalled();
    expect(modes).toEqual([IDLE_AUDIO_MODE]);
  });
});
