import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../../../constants/design-tokens";

/**
 * Banner nhắc nhở di chuyển sang địa điểm tiếp theo (khi còn dưới 10 phút so với endTime của điểm cũ).
 * Thiết kế mờ kính với tone màu xanh dương dịu nhẹ (info / notification style) sang trọng.
 */
const DepartureReminderBanner = memo(function DepartureReminderBanner({
  visible,
  bottomOffset = 0,
  nextName = "địa điểm tiếp theo",
  minutesLeft = 10,
}) {
  if (!visible) return null;

  return (
    <View
      pointerEvents="none"
      style={[styles.outer, { bottom: bottomOffset }]}
    >
      <BlurView
        tint="dark"
        intensity={36}
        style={styles.card}
      >
        <View style={styles.iconWrap}>
          <MaterialIcons name="departure-board" size={20} color="#0A84FF" />
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            Chuẩn bị di chuyển
          </Text>
          <Text style={styles.subtext} numberOfLines={2}>
            {minutesLeft > 0
              ? `Còn khoảng ${minutesLeft} phút nữa là đến giờ đi tiếp sang ${nextName}.`
              : `Đã đến giờ xuất phát sang ${nextName}. Hãy di chuyển nhé!`}
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
    zIndex: 78,
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
    borderColor: "rgba(10, 132, 255, 0.3)",
    backgroundColor: "rgba(10, 18, 30, 0.85)",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 132, 255, 0.15)",
  },
  content: {
    flex: 1,
    gap: 1,
  },
  title: {
    color: "#0A84FF",
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

export default DepartureReminderBanner;
