import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { BlurView } from "expo-blur";
import { TOKENS } from "../../../../constants/design-tokens";
import { cn } from "../../../../lib/cn";

const TRAVEL_MODES = [
  { id: "motorcycle", icon: "motorcycle", label: "Xe máy" },
  { id: "driving", icon: "directions-car", label: "Ô tô" },
  { id: "cycling", icon: "directions-bike", label: "Xe đạp" },
  { id: "walking", icon: "directions-walk", label: "Đi bộ" },
];

const TravelModeSelector = memo(function TravelModeSelector({
  currentMode = "motorcycle",
  onSelectMode,
  avoidFerry = false,
  onToggleAvoidFerry,
  compact = false,
  isExpanded = false,
  onToggleExpand,
  style,
}) {
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
              {activeModeItem.label}
            </Text>
            <MaterialIconsRounded name="keyboard-arrow-down" size={16} color="rgba(255,255,255,0.6)" />
          </Pressable>

          <View
            style={{
              width: 1,
              height: 18,
              backgroundColor: "rgba(255,255,255,0.15)",
              marginHorizontal: 10,
            }}
          />

          <Pressable
            onPress={onToggleAvoidFerry}
            className={cn(
              "h-7 w-7 items-center justify-center rounded-full",
              avoidFerry && "relative",
            )}
            style={avoidFerry ? { backgroundColor: "rgba(239, 68, 68, 0.15)" } : undefined}
            hitSlop={6}
          >
            <MaterialIconsRounded
              name="directions-boat"
              size={18}
              color={avoidFerry ? "#F87171" : "rgba(255,255,255,0.6)"}
            />
            {avoidFerry && (
              <View
                className="absolute items-center justify-center rounded"
                style={{
                  top: 2,
                  right: 2,
                  backgroundColor: "#EF4444",
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                }}
              >
                <MaterialIconsRounded name="block" size={8} color="#FFFFFF" />
              </View>
            )}
          </Pressable>
        </BlurView>
      </View>
    );
  }

  // Chế độ mở rộng đầy đủ (cho Single Route, Route Builder hoặc Active Trip khi được tap mở ra)
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
              Phương thức di chuyển
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
                  {mode.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            marginVertical: 8,
          }}
        />

        <Pressable
          onPress={onToggleAvoidFerry}
          className={cn(
            "flex-row items-center h-9 rounded-lg px-2.5 justify-between",
            avoidFerry ? "" : "",
          )}
          style={{
            backgroundColor: avoidFerry
              ? "rgba(239, 68, 68, 0.08)"
              : "rgba(255, 255, 255, 0.03)",
          }}
          android_ripple={{ color: "rgba(255,255,255,0.1)" }}
        >
          <View className="relative h-6 w-6 justify-center">
            <MaterialIconsRounded
              name="directions-boat"
              size={18}
              color={avoidFerry ? "#EF4444" : "rgba(255,255,255,0.6)"}
            />
            {avoidFerry && (
              <View
                className="absolute items-center justify-center rounded-[6px] border"
                style={{
                  top: -2,
                  right: -2,
                  backgroundColor: "#EF4444",
                  width: 12,
                  height: 12,
                  borderColor: "#0F172A",
                }}
              >
                <MaterialIconsRounded name="block" size={10} color="#FFFFFF" />
              </View>
            )}
          </View>
          <Text
            className="flex-1 ml-2 text-[11px]"
            style={{
              color: avoidFerry ? "#F87171" : "rgba(255, 255, 255, 0.7)",
              fontFamily: avoidFerry ? TOKENS.font.semibold : TOKENS.font.medium,
              fontWeight: avoidFerry ? "600" : undefined,
            }}
          >
            {avoidFerry ? "Đang tránh đi phà" : "Tránh đi phà"}
          </Text>
          <View
            className="justify-center rounded-full"
            style={{
              width: 34,
              height: 18,
              borderRadius: 9,
              padding: 2,
              backgroundColor: avoidFerry
                ? "#EF4444"
                : "rgba(255, 255, 255, 0.15)",
            }}
          >
            <View
              className="rounded-full"
              style={{
                width: 14,
                height: 14,
                backgroundColor: avoidFerry ? "#FFFFFF" : "#E2E8F0",
                transform: [{ translateX: avoidFerry ? 16 : 0 }],
              }}
            />
          </View>
        </Pressable>
      </BlurView>
    </View>
  );
});

export default TravelModeSelector;
