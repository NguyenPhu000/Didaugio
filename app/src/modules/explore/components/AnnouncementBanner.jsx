import { memo, useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { formatDayMonthNumeric } from "@/utils/dateFormat";

const TONE = {
  info: {
    icon: "campaign",
    bg: "#EFF6FF",
    border: "rgba(0,123,255,0.18)",
    iconBg: "rgba(0,123,255,0.12)",
    accent: "#007BFF",
    label: "THÔNG BÁO",
  },
  warning: {
    icon: "warning-amber",
    bg: "#FFF7ED",
    border: "rgba(245,158,11,0.24)",
    iconBg: "rgba(245,158,11,0.14)",
    accent: "#D97706",
    label: "LƯU Ý",
  },
  success: {
    icon: "check-circle",
    bg: "#ECFDF5",
    border: "rgba(16,185,129,0.22)",
    iconBg: "rgba(16,185,129,0.14)",
    accent: "#059669",
    label: "CẬP NHẬT",
  },
  error: {
    icon: "priority-high",
    bg: "#FEF2F2",
    border: "rgba(239,68,68,0.22)",
    iconBg: "rgba(239,68,68,0.14)",
    accent: "#DC2626",
    label: "KHẨN",
  },
};

function AnnouncementBannerInner({ announcement }) {
  const [dismissed, setDismissed] = useState(false);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  const tone = useMemo(
    () => TONE[announcement?.type] || TONE.info,
    [announcement?.type],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleDismiss = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    opacity.value = withTiming(0, { duration: 220 });
    translateY.value = withTiming(-8, { duration: 220 }, () => {
      runOnJS(setDismissed)(true);
    });
  }, [opacity, translateY]);

  if (!announcement || dismissed) return null;

  const dateText = announcement.sentAt
    ? formatDayMonthNumeric(announcement.sentAt)
    : null;

  return (
    <Animated.View style={[animatedStyle, styles.outer]}>
      <View style={[styles.card, { backgroundColor: tone.bg, borderColor: tone.border }]}>
        <View style={[styles.iconWrap, { backgroundColor: tone.iconBg }]}>
          <MaterialIconsRounded name={tone.icon} size={18} color={tone.accent} />
        </View>

        <View style={styles.content}>
          <View style={styles.metaRow}>
            <Text style={[styles.label, { color: tone.accent }]}>{tone.label}</Text>
            {dateText ? <Text style={styles.date}>{dateText}</Text> : null}
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {announcement.title}
          </Text>
          {announcement.body ? (
            <Text style={styles.body} numberOfLines={2}>
              {announcement.body}
            </Text>
          ) : null}
        </View>

        <Pressable onPress={handleDismiss} hitSlop={12} style={styles.closeBtn}>
          <MaterialIconsRounded name="close" size={15} color="rgba(24,24,25,0.48)" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: TAB_SCREEN_PADDING,
    marginTop: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  content: {
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    fontFamily: TOKENS.font.bold,
    letterSpacing: 1,
  },
  date: {
    color: "rgba(24,24,25,0.42)",
    fontSize: 10,
    fontFamily: TOKENS.font.medium,
  },
  title: {
    color: "#181819",
    fontSize: 14,
    lineHeight: 18,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.15,
  },
  body: {
    color: "rgba(24,24,25,0.58)",
    fontSize: 12,
    lineHeight: 17,
    fontFamily: TOKENS.font.medium,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(24,24,25,0.05)",
  },
});

export const AnnouncementBanner = memo(AnnouncementBannerInner);
