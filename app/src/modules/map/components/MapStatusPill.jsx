import { memo } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";

const STATUS_VISUALS = {
  loading: {
    icon: "hourglass-empty",
    accent: "#0EA5E9",
    background: "rgba(240, 249, 255, 0.96)",
  },
  error: {
    icon: "wifi-off",
    accent: "#E11D48",
    background: "rgba(255, 241, 242, 0.96)",
  },
  empty: {
    icon: "travel-explore",
    accent: "#0F766E",
    background: "rgba(240, 253, 250, 0.96)",
  },
};

const MapStatusPill = memo(function MapStatusPill({
  type = "loading",
  message,
  actionLabel,
  onAction,
  topOffset,
}) {
  const visual = STATUS_VISUALS[type] || STATUS_VISUALS.loading;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        top: topOffset,
        zIndex: 45,
        alignItems: "center",
      }}
    >
      <View
        pointerEvents="auto"
        className="max-w-full flex-row items-center gap-2 rounded-full border border-white/80 px-3 py-2 shadow-lg shadow-slate-900/5"
        style={{ backgroundColor: visual.background }}
      >
        {type === "loading" ? (
          <ActivityIndicator size="small" color={visual.accent} />
        ) : (
          <MaterialIconsRounded name={visual.icon} size={17} color={visual.accent} />
        )}
        <Text numberOfLines={1} className="text-[12.5px] font-semibold text-slate-800">
          {message}
        </Text>
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            accessibilityRole="button"
            hitSlop={8}
            className="rounded-full bg-white/80 px-2.5 py-1"
          >
            <Text className="text-[12px] font-bold" style={{ color: visual.accent }}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

export default MapStatusPill;
