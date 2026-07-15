import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIconsRounded } from "../../../../components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../../constants/design-tokens";
import { GenieAvatar } from "./GenieAvatar";

const ACCENT = "#3478F6";
const VOICE_BAR_FACTORS = [0.35, 0.72, 1, 0.6, 0.42];

export function GenieVoicePanel({
  active,
  intensity,
  label,
  sublabel,
  compact = false,
  loading = false,
}) {
  const level = active ? Math.max(0.24, Math.min(1, intensity || 0.48)) : 0.22;
  const size = compact ? 52 : 72;
  const barMax = compact ? 22 : 30;
  const barMin = compact ? 7 : 9;

  return (
    <View
      className={`w-full overflow-hidden rounded-[28px] border border-slate-100 bg-white ${compact ? "p-3" : "p-4"}`}
      style={{ boxShadow: "0 14px 36px rgba(15, 23, 42, 0.08)" }}
    >
      <LinearGradient
        colors={["rgba(37,99,235,0.10)", "rgba(219,39,119,0.08)", "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View className="flex-row items-center gap-3">
        <GenieAvatar size={size} />
        <View className="min-w-0 flex-1">
          <Text
            className={`${compact ? "text-[13px]" : "text-[17px]"} text-slate-950`}
            style={{ fontFamily: TOKENS.font.semibold }}
            numberOfLines={1}
          >
            {label}
          </Text>
          {sublabel ? (
            <Text
              className="mt-1 text-[12px] leading-4 text-slate-500"
              style={{ fontFamily: TOKENS.font.body }}
              numberOfLines={compact ? 1 : 2}
            >
              {sublabel}
            </Text>
          ) : null}

          <View className="mt-3 flex-row items-end gap-1.5">
            {VOICE_BAR_FACTORS.map((factor, index) => {
              const height = barMin + barMax * Math.min(1, level * factor);
              return (
                <View
                  key={`voice-bar-${index}`}
                  className="w-1.5 rounded-full"
                  style={{
                    height,
                    backgroundColor: active ? "#2563EB" : "#CBD5E1",
                    opacity: active ? 0.72 + factor * 0.22 : 0.7,
                  }}
                />
              );
            })}
          </View>
        </View>

        <View className={`items-center justify-center rounded-full ${active ? "bg-blue-600" : "bg-slate-100"} ${compact ? "h-10 w-10" : "h-12 w-12"}`}>
          {loading ? (
            <ActivityIndicator size="small" color={active ? "#FFFFFF" : ACCENT} />
          ) : (
            <MaterialIconsRounded
              name={active ? "graphic-eq" : "mic"}
              size={compact ? 19 : 22}
              color={active ? "#FFFFFF" : "#64748B"}
            />
          )}
        </View>
      </View>
    </View>
  );
}
