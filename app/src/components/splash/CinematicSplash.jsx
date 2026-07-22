import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  SPLASH_TIMING,
  createSplashLifecycle,
} from "./cinematicSplashTiming";

const VIDEO_SOURCE = require("../../../assets/splash.mp4");
const FALLBACK_SOURCE = require("../../../assets/splash.png");

export default function CinematicSplash({ active, onFinish }) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [showFallback, setShowFallback] = useState(false);
  const onFinishRef = useRef(onFinish);
  const reduceMotionRef = useRef(reduceMotion);

  const overlayOpacity = useSharedValue(1);
  const mediaOpacity = useSharedValue(0);
  const brandOpacity = useSharedValue(0);
  const brandTranslateY = useSharedValue(reduceMotion ? 0 : 12);
  const progressScale = useSharedValue(0);
  const shadeOpacity = useSharedValue(0.12);

  const player = useVideoPlayer(VIDEO_SOURCE, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.muted = true;
  });

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const deliverFinish = useCallback((reason) => {
    onFinishRef.current?.(reason);
  }, []);

  const beginExit = useCallback(
    (reason) => {
      overlayOpacity.value = withTiming(
        0,
        {
          duration: SPLASH_TIMING.EXIT_FADE_MS,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished) runOnJS(deliverFinish)(reason);
        },
      );
    },
    [deliverFinish, overlayOpacity],
  );

  const revealFallback = useCallback(() => setShowFallback(true), []);
  const lifecycle = useMemo(
    () =>
      createSplashLifecycle({
        onFallback: revealFallback,
        onExit: beginExit,
      }),
    [beginExit, revealFallback],
  );

  useEffect(() => {
    lifecycle.prepare();
    return () => lifecycle.dispose();
  }, [lifecycle]);

  // Subscribe while the native splash is still visible so early media failures
  // cannot be missed before playback is activated.
  useEffect(() => {
    const endSubscription = player.addListener("playToEnd", () => {
      lifecycle.playbackEnd();
    });
    const statusSubscription = player.addListener("statusChange", ({ status }) => {
      if (status === "error") lifecycle.playbackError();
    });

    if (player.status === "error") lifecycle.playbackError();

    return () => {
      endSubscription.remove();
      statusSubscription.remove();
    };
  }, [lifecycle, player]);

  useEffect(() => {
    reduceMotionRef.current = reduceMotion;
    if (reduceMotion) {
      cancelAnimation(brandTranslateY);
      brandTranslateY.value = withTiming(0, { duration: 120 });
    }
  }, [brandTranslateY, reduceMotion]);

  useEffect(() => {
    if (!active) return;

    mediaOpacity.value = withTiming(1, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });

    brandOpacity.value = withDelay(
      SPLASH_TIMING.BRAND_IN_MS,
      withSequence(
        withTiming(1, {
          duration: 600,
          easing: Easing.out(Easing.cubic),
        }),
        withDelay(
          SPLASH_TIMING.BRAND_OUT_MS - SPLASH_TIMING.BRAND_IN_MS - 600,
          withTiming(0, {
            duration: SPLASH_TIMING.VIDEO_END_MS - SPLASH_TIMING.BRAND_OUT_MS,
            easing: Easing.inOut(Easing.quad),
          }),
        ),
      ),
    );

    if (!reduceMotionRef.current) {
      brandTranslateY.value = withDelay(
        SPLASH_TIMING.BRAND_IN_MS,
        withTiming(0, {
          duration: 600,
          easing: Easing.out(Easing.cubic),
        }),
      );
    }

    progressScale.value = withDelay(
      SPLASH_TIMING.BRAND_IN_MS,
      withTiming(1, {
        duration:
          SPLASH_TIMING.PROGRESS_END_MS - SPLASH_TIMING.BRAND_IN_MS,
        easing: Easing.linear,
      }),
    );

    shadeOpacity.value = withDelay(
      SPLASH_TIMING.BRAND_OUT_MS,
      withTiming(0.38, {
        duration: SPLASH_TIMING.VIDEO_END_MS - SPLASH_TIMING.BRAND_OUT_MS,
        easing: Easing.inOut(Easing.quad),
      }),
    );

    if (lifecycle.activate()) {
      try {
        player.play();
      } catch {
        lifecycle.playbackError();
      }
    }
  }, [
    active,
    brandOpacity,
    brandTranslateY,
    lifecycle,
    mediaOpacity,
    player,
    progressScale,
    shadeOpacity,
  ]);

  useEffect(
    () => () => {
      cancelAnimation(overlayOpacity);
      cancelAnimation(mediaOpacity);
      cancelAnimation(brandOpacity);
      cancelAnimation(brandTranslateY);
      cancelAnimation(progressScale);
      cancelAnimation(shadeOpacity);
    },
    [
      brandOpacity,
      brandTranslateY,
      mediaOpacity,
      overlayOpacity,
      progressScale,
      shadeOpacity,
    ],
  );

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));
  const mediaStyle = useAnimatedStyle(() => ({
    opacity: mediaOpacity.value,
  }));
  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ translateY: brandTranslateY.value }],
  }));
  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progressScale.value }],
  }));
  const shadeStyle = useAnimatedStyle(() => ({
    opacity: shadeOpacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.root, overlayStyle]}
      testID="cinematic-splash"
    >
      <Animated.View style={[styles.media, mediaStyle]}>
        <VideoView
          style={styles.media}
          player={player}
          allowsFullscreen={false}
          nativeControls={false}
          resizeMode="cover"
        />

        {showFallback ? (
          <Image
            source={FALLBACK_SOURCE}
            style={styles.media}
            contentFit="cover"
            transition={180}
          />
        ) : null}
      </Animated.View>

      <View style={styles.edgeTop} />
      <Animated.View style={[styles.cinematicShade, shadeStyle]} />

      <Animated.View
        style={[
          styles.brandLockup,
          { bottom: Math.max(insets.bottom + 112, 132) },
          brandStyle,
        ]}
      >
        <Text style={styles.wordmark}>iPoint Genie</Text>
        <Text style={styles.tagline}>Trợ lý hành trình thông minh</Text>
      </Animated.View>

      <View
        style={[
          styles.progressTrack,
          { bottom: Math.max(insets.bottom + 34, 48) },
        ]}
      >
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    backgroundColor: "#02030A",
  },
  media: {
    ...StyleSheet.absoluteFillObject,
  },
  edgeTop: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    height: "18%",
    backgroundColor: "rgba(2, 3, 10, 0.16)",
  },
  cinematicShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#02030A",
  },
  brandLockup: {
    position: "absolute",
    right: 24,
    left: 24,
    alignItems: "center",
  },
  wordmark: {
    color: "#F8FAFF",
    fontFamily: "BeVietnamPro_600SemiBold",
    fontSize: 31,
    letterSpacing: -0.8,
    lineHeight: 39,
    textAlign: "center",
    textShadowColor: "rgba(4, 8, 22, 0.72)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  tagline: {
    marginTop: 7,
    color: "rgba(244, 247, 255, 0.78)",
    fontFamily: "BeVietnamPro_400Regular",
    fontSize: 13,
    letterSpacing: 0.25,
    lineHeight: 19,
    textAlign: "center",
    textShadowColor: "rgba(4, 8, 22, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  progressTrack: {
    position: "absolute",
    right: "15%",
    left: "15%",
    height: 1,
    overflow: "hidden",
    backgroundColor: "rgba(224, 229, 244, 0.2)",
  },
  progressFill: {
    ...StyleSheet.absoluteFillObject,
    transformOrigin: "left center",
    backgroundColor: "rgba(238, 242, 255, 0.92)",
    shadowColor: "#D9D6FF",
    shadowOpacity: 0.7,
    shadowRadius: 5,
  },
});
