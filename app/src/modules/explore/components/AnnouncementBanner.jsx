import { memo, useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useTranslation } from "react-i18next";
import { TOKENS } from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { formatDayMonthNumeric } from "@/utils/dateFormat";
import { getOptimizedCloudinaryUrl, resolveMediaUrl } from "../../../lib/media-url";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TONE = {
  info: { icon: "campaign", accent: "#111111", labelKey: "explore.announcement.info" },
  warning: { icon: "priority-high", accent: "#8A5A00", labelKey: "explore.announcement.warning" },
  success: { icon: "check-circle", accent: "#176B48", labelKey: "explore.announcement.success" },
  error: { icon: "priority-high", accent: "#9D2020", labelKey: "explore.announcement.error" },
};

function AnnouncementBannerInner({ announcement }) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const tone = useMemo(
    () => TONE[announcement?.type] || TONE.info,
    [announcement?.type],
  );
  const imageUri = useMemo(() => {
    if (!announcement?.imageUrl) return null;
    return getOptimizedCloudinaryUrl(resolveMediaUrl(announcement.imageUrl), 480);
  }, [announcement?.imageUrl]);
  const dateText = announcement?.sentAt
    ? formatDayMonthNumeric(announcement.sentAt)
    : null;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const handleDismiss = useCallback(() => {
    opacity.value = withTiming(0, { duration: 180 });
    translateY.value = withTiming(-10, { duration: 180 }, () => {
      runOnJS(setDismissed)(true);
    });
  }, [opacity, translateY]);

  const handleToggle = useCallback(() => {
    setExpanded((value) => !value);
  }, []);

  if (!announcement || dismissed) return null;

  return (
    <Animated.View style={[animatedStyle, styles.outer]}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={announcement.title}
        accessibilityHint={t("explore.announcement.toggleHint")}
        accessibilityState={{ expanded }}
        onPress={handleToggle}
        onPressIn={() => { scale.value = withSpring(0.987, TOKENS.spring.press); }}
        onPressOut={() => { scale.value = withSpring(1, TOKENS.spring.press); }}
        style={styles.card}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            contentFit="cover"
            transition={220}
            cachePolicy="memory-disk"
            style={styles.image}
          />
        ) : (
          <View style={[styles.iconPanel, { backgroundColor: tone.accent }]}>
            <MaterialIconsRounded name={tone.icon} size={21} color="#FFFFFF" />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.metaRow}>
            <View style={[styles.labelPill, { borderColor: tone.accent }]}>
              <Text style={[styles.label, { color: tone.accent }]}>{t(tone.labelKey)}</Text>
            </View>
            {dateText ? <Text style={styles.date}>{dateText}</Text> : null}
          </View>
          <Text style={styles.title} numberOfLines={expanded ? undefined : 2}>
            {announcement.title}
          </Text>
          {announcement.body ? (
            <Text style={styles.body} numberOfLines={expanded ? undefined : 2}>
              {announcement.body}
            </Text>
          ) : null}
          <View style={styles.detailRow}>
            <Text style={styles.detailText}>{expanded ? t("explore.announcement.collapse") : t("explore.announcement.details")}</Text>
            <MaterialIconsRounded
              name={expanded ? "keyboard-arrow-up" : "arrow-forward"}
              size={16}
              color="#181819"
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("explore.announcement.dismiss")}
          onPress={handleDismiss}
          hitSlop={12}
          style={styles.closeBtn}
        >
          <MaterialIconsRounded name="close" size={16} color="#181819" />
        </Pressable>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: { paddingHorizontal: TAB_SCREEN_PADDING, marginTop: 12 },
  card: {
    minHeight: 122,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(24,24,25,0.12)",
    padding: 10,
    flexDirection: "row",
    gap: 12,
    ...TOKENS.shadow.sm,
  },
  image: { width: 92, minHeight: 102, borderRadius: 14, backgroundColor: "#E5E3DF" },
  iconPanel: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  content: { flex: 1, paddingTop: 2, paddingRight: 20 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 7 },
  labelPill: { height: 21, paddingHorizontal: 8, borderRadius: 11, borderWidth: 1, justifyContent: "center" },
  label: { fontSize: 11, fontFamily: TOKENS.font.bold, letterSpacing: 0.75 },
  date: { color: "rgba(24,24,25,0.48)", fontSize: 12, fontFamily: TOKENS.font.medium },
  title: { color: "#181819", fontSize: 15, lineHeight: 20, fontFamily: TOKENS.font.semibold, letterSpacing: -0.2 },
  body: { color: "rgba(24,24,25,0.62)", fontSize: 12, lineHeight: 18, fontFamily: TOKENS.font.medium, marginTop: 4 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 },
  detailText: { color: "#181819", fontSize: 12, fontFamily: TOKENS.font.bold },
  closeBtn: { position: "absolute", right: 10, top: 10, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(24,24,25,0.06)" },
});

export const AnnouncementBanner = memo(AnnouncementBannerInner);
