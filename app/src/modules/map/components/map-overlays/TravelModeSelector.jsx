import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "../../../../components/primitives/MaterialIconsRounded";
import { BlurView } from "expo-blur";
import { TOKENS } from "../../../../constants/design-tokens";
import { cn } from "../../../../lib/cn";

const TRAVEL_MODES = [
  { id: "motorcycle", icon: "motorcycle", labelKey: "travelMode.motorbike" },
  { id: "driving", icon: "directions-car", labelKey: "travelMode.car" },
  { id: "cycling", icon: "directions-bike", labelKey: "travelMode.bicycle" },
  { id: "walking", icon: "directions-walk", labelKey: "travelMode.walking" },
];

const TravelModeSelector = memo(function TravelModeSelector({
  currentMode = "motorcycle",
  onSelectMode,
  compact = false,
  isExpanded = false,
  onToggleExpand,
  style,
}) {
  const { t } = useTranslation();
  const activeModeItem = TRAVEL_MODES.find((m) => m.id === currentMode) || TRAVEL_MODES[0];

  // Nếu ở dạng compact và chưa được expand (dành cho Active Trip)
  if (compact && !isExpanded) {
    return (
      <View className="w-full" style={style} pointerEvents="box-none">
        <BlurView
          intensity={70}
          tint="dark"
          className="flex-row items-center self-center rounded-[20px] border"
          style={{
            paddingHorizontal: 12,
            height: 38,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            borderColor: "rgba(255, 255, 255, 0.1)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Pressable onPress={onToggleExpand} className="flex-row items-center gap-1.5" hitSlop={6}>
            <MaterialIconsRounded name={activeModeItem.icon} size={18} color="#FFFFFF" />
            <Text
              className="text-[11px] font-semibold"
              style={{ color: "#FFFFFF", fontFamily: TOKENS.font.semibold }}
            >
              {t(activeModeItem.labelKey)}
            </Text>
            <MaterialIconsRounded name="keyboard-arrow-down" size={16} color="rgba(255,255,255,0.6)" />
          </Pressable>

        </BlurView>
      </View>
    );
  }

  // Chế độ mở rộng đầy đủ (cho Single Route hoặc Active Trip khi được tap mở ra)
  return (
    <View className="w-full" style={style} pointerEvents="box-none">
      <BlurView
        intensity={80}
        tint="dark"
        className="rounded-2xl border"
        style={{
          padding: 10,
          backgroundColor: "rgba(15, 23, 42, 0.85)",
          borderColor: "rgba(255, 255, 255, 0.12)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        {compact && isExpanded && (
          <Pressable
            onPress={onToggleExpand}
            className="flex-row items-center justify-between pb-1.5 mb-2 border-b"
            style={{ borderBottomColor: "rgba(255,255,255,0.1)" }}
            hitSlop={8}
          >
            <Text
              className="text-[11px] font-semibold"
              style={{ color: "#FFFFFF", fontFamily: TOKENS.font.semibold }}
            >
              {t("travelMode.title")}
            </Text>
            <MaterialIconsRounded name="keyboard-arrow-up" size={16} color="#FFFFFF" />
          </Pressable>
        )}

        <View className="flex-row justify-between gap-1.5">
          {TRAVEL_MODES.map((mode) => {
            const isSelected = mode.id === currentMode;
            return (
              <Pressable
                key={mode.id}
                onPress={() => {
                  onSelectMode(mode.id);
                  if (compact && isExpanded && onToggleExpand) {
                    onToggleExpand();
                  }
                }}
                className={cn(
                  "flex-1 flex-row items-center justify-center gap-1 h-8 rounded-lg border",
                  isSelected
                    ? "border-primary-400"
                    : "border-white/5",
                )}
                style={{
                  backgroundColor: isSelected
                    ? TOKENS.color.primary[500]
                    : "rgba(255, 255, 255, 0.04)",
                }}
                android_ripple={{ color: "rgba(255,255,255,0.15)" }}
              >
                <MaterialIconsRounded
                  name={mode.icon}
                  size={18}
                  color={isSelected ? "#FFFFFF" : "rgba(255,255,255,0.5)"}
                />
                <Text
                  className={cn(
                    "text-[10.5px]",
                    isSelected ? "font-bold" : "",
                  )}
                  style={{
                    color: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)",
                    fontFamily: isSelected ? TOKENS.font.bold : TOKENS.font.medium,
                  }}
                >
                  {t(mode.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
});

export default TravelModeSelector;
