import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from "react-native-svg";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { TOKENS } from "../../../constants/design-tokens";

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const RIBBON_COUNT = 13;

function buildWavePath({
  size,
  radius,
  amplitude,
  frequency,
  phase,
  skew = 1,
}) {
  const center = size / 2;
  const points = [];
  const steps = 128;

  for (let i = 0; i <= steps; i += 1) {
    const angle = (Math.PI * 2 * i) / steps;
    const ripple =
      Math.sin(angle * frequency + phase) * amplitude +
      Math.sin(angle * (frequency + 2) - phase * 0.7) * (amplitude * 0.42);
    const resolvedRadius = radius + ripple;
    const x = center + Math.cos(angle) * resolvedRadius;
    const y = center + Math.sin(angle) * resolvedRadius * skew;
    points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  return `${points.join(" ")} Z`;
}

export function VoiceWaveIndicator({
  active = false,
  label,
  sublabel,
  size = 232,
  compact = false,
}) {
  const progress = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: active ? 3000 : 5600,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    shimmer.value = withRepeat(
      withTiming(1, {
        duration: active ? 1800 : 3600,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [active, progress, shimmer]);

  const ribbons = useMemo(() => {
    return Array.from({ length: RIBBON_COUNT }, (_, index) => {
      const offset = index - Math.floor(RIBBON_COUNT / 2);
      const spread = offset / RIBBON_COUNT;
      return {
        d: buildWavePath({
          size,
          radius: size * (0.365 + spread * 0.055),
          amplitude: size * (0.025 + Math.abs(spread) * 0.018),
          frequency: 3 + (index % 5),
          phase: index * 0.58,
          skew: 0.86 + (index % 4) * 0.055,
        }),
        width: index === Math.floor(RIBBON_COUNT / 2) ? 1.35 : 0.72,
        opacity: 0.18 + (1 - Math.abs(spread) * 2) * 0.34,
      };
    });
  }, [size]);

  const accentPaths = useMemo(
    () => [
      buildWavePath({ size, radius: size * 0.43, amplitude: size * 0.035, frequency: 4, phase: 1.3, skew: 0.9 }),
      buildWavePath({ size, radius: size * 0.31, amplitude: size * 0.026, frequency: 6, phase: 3.1, skew: 1.12 }),
    ],
    [size],
  );

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 0.5, 1], [0.95, active ? 1.055 : 1.01, 0.95]);
    return {
      transform: [{ scale }],
      opacity: active ? 1 : 0.82,
    };
  });

  const rotateA = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${progress.value * 330}deg` },
      { scaleX: interpolate(progress.value, [0, 0.5, 1], [1.03, active ? 1.15 : 1.07, 1.03]) },
      { scaleY: interpolate(progress.value, [0, 0.5, 1], [0.96, active ? 1.06 : 1.01, 0.96]) },
    ],
  }));

  const rotateB = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${-progress.value * 230}deg` },
      { scaleX: interpolate(progress.value, [0, 0.5, 1], [0.94, 1.05, 0.94]) },
      { scaleY: interpolate(progress.value, [0, 0.5, 1], [1.07, 0.98, 1.07]) },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.46, active ? 0.92 : 0.64]),
    transform: [
      { scale: interpolate(shimmer.value, [0, 1], [0.86, active ? 1.1 : 0.98]) },
    ],
  }));

  const resolvedSize = compact ? Math.min(size, 168) : size;

  return (
    <View
      className="items-center justify-center overflow-hidden bg-slate-950"
      style={[
        styles.wrap,
        {
          width: resolvedSize,
          height: resolvedSize,
          borderRadius: resolvedSize / 2,
        },
      ]}
    >
      <LinearGradient
        colors={["#020617", "#031826", "#001E2B", "#020617"]}
        start={{ x: 0.15, y: 0.1 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View
        className="absolute rounded-full bg-cyan-400"
        style={[
          glowStyle,
          {
            width: resolvedSize * 0.42,
            height: resolvedSize * 0.42,
            borderRadius: resolvedSize * 0.21,
            boxShadow: "0 0 54px rgba(34, 211, 238, 0.55)",
          },
        ]}
      />
      <Animated.View style={[StyleSheet.absoluteFillObject, pulseStyle]}>
        <AnimatedSvg
          width={resolvedSize}
          height={resolvedSize}
          viewBox={`0 0 ${size} ${size}`}
          style={[StyleSheet.absoluteFillObject, rotateA]}
        >
          <Defs>
            <SvgGradient id="voiceRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#67E8F9" stopOpacity="0.2" />
              <Stop offset="44%" stopColor="#22D3EE" stopOpacity="1" />
              <Stop offset="100%" stopColor="#0284C7" stopOpacity="0.36" />
            </SvgGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size * 0.34}
            fill="none"
            stroke="#0EA5E9"
            strokeWidth="0.7"
            strokeOpacity="0.22"
          />
          {ribbons.map((wave, index) => (
            <Path
              key={`wave-a-${index}`}
              d={wave.d}
              fill="none"
              stroke="url(#voiceRibbon)"
              strokeWidth={wave.width}
              strokeOpacity={wave.opacity}
              strokeLinecap="round"
            />
          ))}
          {accentPaths.map((d, index) => (
            <Path
              key={`accent-a-${index}`}
              d={d}
              fill="none"
              stroke={index === 0 ? "#A5F3FC" : "#38BDF8"}
              strokeWidth={index === 0 ? 1.45 : 1}
              strokeOpacity={index === 0 ? 0.78 : 0.48}
              strokeLinecap="round"
            />
          ))}
        </AnimatedSvg>
        <AnimatedSvg
          width={resolvedSize}
          height={resolvedSize}
          viewBox={`0 0 ${size} ${size}`}
          style={[StyleSheet.absoluteFillObject, rotateB]}
        >
          {ribbons.slice().reverse().map((wave, index) => (
            <Path
              key={`wave-b-${index}`}
              d={wave.d}
              fill="none"
              stroke={index % 2 ? "#38BDF8" : "#0891B2"}
              strokeWidth={wave.width * 0.72}
              strokeOpacity={Math.max(0.08, wave.opacity * 0.62)}
              strokeLinecap="round"
            />
          ))}
        </AnimatedSvg>
      </Animated.View>

      <View className="absolute w-[62%] items-center justify-center">
        <Text
          className="text-center text-base leading-[22px] text-sky-100"
          style={{ fontFamily: TOKENS.font.semibold }}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text
            className="mt-1 text-center text-[11px] leading-[15px] text-cyan-300"
            style={{ fontFamily: TOKENS.font.body }}
          >
            {sublabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.28)",
    boxShadow: "0 22px 70px rgba(8, 145, 178, 0.28)",
  },
});
