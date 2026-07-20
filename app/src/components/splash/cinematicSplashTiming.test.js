import { describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import {
  SPLASH_TIMING,
  createFinishOnce,
  createSplashLifecycle,
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
    expect(SPLASH_TIMING.PROGRESS_END_MS).toBe(7600);
    expect(getSplashPhase(4800).progress).toBeCloseTo(0.5);
    expect(getSplashPhase(7600).progress).toBe(1);
    expect(getSplashPhase(9000).progress).toBe(1);

    const finish = vi.fn();
    const finishOnce = createFinishOnce(finish);
    finishOnce("ended");
    finishOnce("timeout");

    expect(finish).toHaveBeenCalledOnce();
    expect(finish).toHaveBeenCalledWith("ended");
  });

  it("handles an initial playback error once and exits on the fallback timeline", () => {
    let now = 100;
    let nextTimerId = 1;
    const timers = new Map();
    const schedule = vi.fn((callback, delay) => {
      const id = nextTimerId++;
      timers.set(id, { callback, delay });
      return id;
    });
    const cancel = vi.fn((id) => timers.delete(id));
    const onFallback = vi.fn();
    const onExit = vi.fn();
    const lifecycle = createSplashLifecycle({
      now: () => now,
      schedule,
      cancel,
      onFallback,
      onExit,
    });

    expect(lifecycle.playbackError()).toBe(true);
    expect(lifecycle.playbackError()).toBe(false);
    expect(onFallback).toHaveBeenCalledOnce();
    expect(lifecycle.activate()).toBe(false);

    const fallbackTimer = [...timers.values()].find(
      ({ delay }) => delay === SPLASH_TIMING.VIDEO_END_MS,
    );
    expect(fallbackTimer).toBeDefined();
    fallbackTimer.callback();
    expect(onExit).toHaveBeenCalledOnce();
    expect(onExit).toHaveBeenCalledWith("error");

    now = SPLASH_TIMING.FAIL_SAFE_MS + 100;
    for (const timer of timers.values()) timer.callback();
    expect(onExit).toHaveBeenCalledOnce();
  });

  it("resolves end and timeout races without duplicate exits", () => {
    const timers = new Map();
    const schedule = (callback, delay) => {
      timers.set(delay, callback);
      return delay;
    };
    const onExit = vi.fn();
    const lifecycle = createSplashLifecycle({
      schedule,
      cancel: (id) => timers.delete(id),
      onExit,
    });

    expect(lifecycle.activate()).toBe(true);
    expect(lifecycle.playbackEnd()).toBe(true);
    expect(lifecycle.playbackEnd()).toBe(false);
    timers.get(SPLASH_TIMING.FAIL_SAFE_MS)?.();
    expect(onExit).toHaveBeenCalledOnce();
    expect(onExit).toHaveBeenCalledWith("ended");
  });

  it("can prepare a disposed lifecycle for React effect replay", () => {
    const lifecycle = createSplashLifecycle();

    lifecycle.dispose();
    expect(lifecycle.activate()).toBe(false);
    lifecycle.prepare();

    expect(lifecycle.getPhase()).toBe("prepared");
    expect(lifecycle.activate()).toBe(true);
    lifecycle.dispose();
  });
});

describe("cinematic splash media contract", () => {
  it("keeps playback safe and provides reduced-motion and image fallback paths", async () => {
    const source = await readFile(
      new URL("./CinematicSplash.jsx", import.meta.url),
      "utf8",
    );

    expect(source).toMatch(/muted\s*=\s*true/);
    expect(source).toMatch(/loop\s*=\s*false/);
    expect(source).toContain("showsPlaybackControls={false}");
    expect(source).toContain('resizeMode="cover"');
    expect(source).toContain('addListener("playToEnd"');
    expect(source).toContain('addListener("statusChange"');
    expect(source.indexOf('addListener("playToEnd"')).toBeLessThan(
      source.indexOf("player.play()"),
    );
    expect(source).toContain("useReducedMotion");
    expect(source).toContain("splash.png");
  });

  it("keeps startup orchestration in the root and matches native colors", async () => {
    const [rootSource, appConfigSource] = await Promise.all([
      readFile(new URL("../../../app/_layout.jsx", import.meta.url), "utf8"),
      readFile(new URL("../../../app.json", import.meta.url), "utf8"),
    ]);

    expect(rootSource).toContain('import CinematicSplash from "../src/components/splash/CinematicSplash"');
    expect(rootSource).toContain("SPLASH_TIMING.BOOTSTRAP_DEADLINE_MS");
    expect(rootSource).toContain("<CinematicSplash");
    expect(rootSource).toContain("active={nativeSplashHidden}");
    expect(rootSource).not.toContain(
      "isReady && nativeSplashHidden && !splashFinished",
    );
    expect(rootSource).not.toContain("useVideoPlayer");
    expect(rootSource).not.toContain("VideoView");

    const appConfig = JSON.parse(appConfigSource);
    expect(appConfig.expo.splash.backgroundColor).toBe("#02030A");
    expect(appConfig.expo.androidStatusBar.backgroundColor).toBe("#02030A");
    const splashPlugin = appConfig.expo.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === "expo-splash-screen",
    );
    expect(splashPlugin[1].backgroundColor).toBe("#02030A");
  });
});
