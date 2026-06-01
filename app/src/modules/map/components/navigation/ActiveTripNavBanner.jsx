import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../../../constants/design-tokens";

/**
 * Banner dẫn đường turn-by-turn cho Active Trip Mode.
 * Hiển thị hướng dẫn rẽ kế tiếp + ETA/khoảng cách + nút thoát hành trình.
 */
const getTravelModeIcon = (mode) => {
  switch (mode) {
    case "walking":
      return "directions-walk";
    case "driving":
      return "directions-car";
    case "cycling":
      return "directions-bike";
    case "bus":
      return "directions-bus";
    default:
      return "motorcycle";
  }
};

const ActiveTripNavBanner = memo(function ActiveTripNavBanner({
  visible,
  topOffset = 0,
  instruction,
  instructionIcon = "navigation",
  targetName,
  etaLabel,
  distanceLabel,
  isFetching,
  travelMode,
  onExit,
}) {
  if (!visible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.outer, { top: topOffset }]}
    >
      <BlurView
        tint="dark"
        intensity={36}
        style={styles.card}
      >
        <View style={styles.iconWrap}>
          <MaterialIcons name={instructionIcon} size={26} color="#FFFFFF" />
        </View>

        <View style={styles.content}>
          <Text style={styles.instruction} numberOfLines={2}>
            {instruction || "Đang tính tuyến đường..."}
          </Text>
          <View style={styles.metaRow}>
            {targetName ? (
              <Text style={styles.metaTarget} numberOfLines={1}>
                Đến {targetName}
              </Text>
            ) : null}
            {travelMode ? (
              <MaterialIcons name={getTravelModeIcon(travelMode)} size={14} color="#5DD39E" />
            ) : null}
            {etaLabel || distanceLabel ? (
              <Text style={styles.metaTravel}>
                {[distanceLabel, etaLabel].filter(Boolean).join(" • ")}
              </Text>
            ) : isFetching ? (
              <Text style={styles.metaTravel}>Đang cập nhật…</Text>
            ) : null}
          </View>
        </View>

        <Pressable onPress={onExit} hitSlop={10} style={styles.exitBtn}>
          <MaterialIcons name="close" size={18} color="#FFFFFF" />
        </Pressable>
      </BlurView>
    </View>
  );
});

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 80,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(16,32,24,0.82)",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "hsl(145, 63%, 32%)",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  instruction: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaTarget: {
    flexShrink: 1,
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
  },
  metaTravel: {
    color: "#5DD39E",
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
  },
  exitBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
});

export default ActiveTripNavBanner;
