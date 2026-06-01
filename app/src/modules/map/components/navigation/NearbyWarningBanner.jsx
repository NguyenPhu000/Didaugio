import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../../../constants/design-tokens";

/**
 * Banner cảnh báo sắp đến địa điểm (khoảng cách <= 150m) sử dụng thuật toán Hysteresis.
 * Thiết kế mờ kính với tông màu hổ phách/vàng nhẹ (amber/gold) cao cấp.
 */
const NearbyWarningBanner = memo(function NearbyWarningBanner({
  visible,
  topOffset = 0,
  targetName = "Điểm đến",
  distanceMeters = 0,
}) {
  if (!visible) return null;

  const displayDistance = Math.round(distanceMeters);

  return (
    <View
      pointerEvents="none"
      style={[styles.outer, { top: topOffset }]}
    >
      <BlurView
        tint="dark"
        intensity={36}
        style={styles.card}
      >
        <View style={styles.iconWrap}>
          <MaterialIcons name="near-me" size={20} color="#FFD60A" />
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            Sắp đến nơi rồi!
          </Text>
          <Text style={styles.subtext} numberOfLines={2}>
            Chỉ còn {displayDistance}m nữa là đến {targetName}.
          </Text>
        </View>
      </BlurView>
    </View>
  );
});

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 79,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 214, 10, 0.3)",
    backgroundColor: "rgba(30, 26, 10, 0.85)",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 214, 10, 0.15)",
  },
  content: {
    flex: 1,
    gap: 1,
  },
  title: {
    color: "#FFD60A",
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.1,
  },
  subtext: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
    lineHeight: 16,
  },
});

export default NearbyWarningBanner;
