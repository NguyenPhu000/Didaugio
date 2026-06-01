import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { TOKENS } from "../../../../constants/design-tokens";

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
      <View style={[styles.outerContainer, style]} pointerEvents="box-none">
        <BlurView intensity={70} tint="dark" style={styles.compactContainer}>
          <Pressable onPress={onToggleExpand} style={styles.compactModeBtn} hitSlop={6}>
            <MaterialIcons name={activeModeItem.icon} size={18} color="#FFFFFF" />
            <Text style={styles.compactModeLabel}>{activeModeItem.label}</Text>
            <MaterialIcons name="keyboard-arrow-down" size={16} color="rgba(255,255,255,0.6)" />
          </Pressable>

          <View style={styles.compactDivider} />

          <Pressable
            onPress={onToggleAvoidFerry}
            style={[styles.compactFerryBtn, avoidFerry && styles.compactFerryBtnActive]}
            hitSlop={6}
          >
            <MaterialIcons
              name="directions-boat"
              size={18}
              color={avoidFerry ? "#F87171" : "rgba(255,255,255,0.6)"}
            />
            {avoidFerry && (
              <View style={styles.compactBadge}>
                <MaterialIcons name="block" size={8} color="#FFFFFF" />
              </View>
            )}
          </Pressable>
        </BlurView>
      </View>
    );
  }

  // Chế độ mở rộng đầy đủ (cho Single Route, Route Builder hoặc Active Trip khi được tap mở ra)
  return (
    <View style={[styles.outerContainer, style]} pointerEvents="box-none">
      <BlurView intensity={80} tint="dark" style={styles.expandedContainer}>
        {compact && isExpanded && (
          <Pressable onPress={onToggleExpand} style={styles.collapseHeader} hitSlop={8}>
            <Text style={styles.collapseHeaderText}>Phương thức di chuyển</Text>
            <MaterialIcons name="keyboard-arrow-up" size={16} color="#FFFFFF" />
          </Pressable>
        )}

        <View style={styles.modesRow}>
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
                style={[styles.modeBtn, isSelected && styles.modeBtnActive]}
                android_ripple={{ color: "rgba(255,255,255,0.15)" }}
              >
                <MaterialIcons
                  name={mode.icon}
                  size={18}
                  color={isSelected ? "#FFFFFF" : "rgba(255,255,255,0.5)"}
                />
                <Text style={[styles.modeLabel, isSelected && styles.modeLabelActive]}>
                  {mode.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.divider} />

        <Pressable
          onPress={onToggleAvoidFerry}
          style={[styles.ferryBtn, avoidFerry && styles.ferryBtnActive]}
          android_ripple={{ color: "rgba(255,255,255,0.1)" }}
        >
          <View style={styles.ferryIconWrap}>
            <MaterialIcons
              name="directions-boat"
              size={18}
              color={avoidFerry ? "#EF4444" : "rgba(255,255,255,0.6)"}
            />
            {avoidFerry && (
              <View style={styles.ferryBlockBadge}>
                <MaterialIcons name="block" size={10} color="#FFFFFF" />
              </View>
            )}
          </View>
          <Text style={[styles.ferryText, avoidFerry && styles.ferryTextActive]}>
            {avoidFerry ? "Đang tránh đi phà" : "Tránh đi phà"}
          </Text>
          <View
            style={[styles.toggleTrack, avoidFerry && styles.toggleTrackActive]}
          >
            <View
              style={[styles.toggleThumb, avoidFerry && styles.toggleThumbActive]}
            />
          </View>
        </Pressable>
      </BlurView>
    </View>
  );
});

const styles = StyleSheet.create({
  outerContainer: {
    width: "100%",
  },
  compactContainer: {
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 38,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: "center",
  },
  compactModeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  compactModeLabel: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    fontFamily: TOKENS.font.semibold,
  },
  compactDivider: {
    width: 1,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 10,
  },
  compactFerryBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    position: "relative",
  },
  compactFerryBtnActive: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  compactBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#EF4444",
    borderRadius: 5,
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  expandedContainer: {
    borderRadius: 16,
    padding: 10,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  collapseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    marginBottom: 8,
  },
  collapseHeaderText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    fontFamily: TOKENS.font.semibold,
  },
  modesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  modeBtnActive: {
    backgroundColor: TOKENS.color.primary[500],
    borderColor: TOKENS.color.primary[400],
  },
  modeLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 10.5,
    fontFamily: TOKENS.font.medium,
  },
  modeLabelActive: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontFamily: TOKENS.font.bold,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginVertical: 8,
  },
  ferryBtn: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    justifyContent: "space-between",
  },
  ferryBtnActive: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  ferryIconWrap: {
    position: "relative",
    width: 24,
    height: 24,
    justifyContent: "center",
  },
  ferryBlockBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    borderRadius: 6,
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#0F172A",
  },
  ferryText: {
    flex: 1,
    marginLeft: 8,
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
    fontFamily: TOKENS.font.medium,
  },
  ferryTextActive: {
    color: "#F87171",
    fontWeight: "600",
    fontFamily: TOKENS.font.semibold,
  },
  toggleTrack: {
    width: 34,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 2,
    justifyContent: "center",
  },
  toggleTrackActive: {
    backgroundColor: "#EF4444",
  },
  toggleThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E2E8F0",
    transform: [{ translateX: 0 }],
  },
  toggleThumbActive: {
    backgroundColor: "#FFFFFF",
    transform: [{ translateX: 16 }],
  },
});

export default TravelModeSelector;
