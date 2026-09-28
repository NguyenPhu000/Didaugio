import { memo, useCallback, useMemo, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import { resolveMediaUrl, getOptimizedCloudinaryUrl } from "../../../lib/media-url";
import { formatDayMonthNumeric } from "@/utils/dateFormat";
import { EXPLORE_THEME as C } from "./exploreTheme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SCREEN_W = Dimensions.get("window").width;
const CARD_W = Math.min(340, SCREEN_W - 40);
const CARD_H = 154;

function EventCardInner({ event, onPress }) {
  const { t } = useTranslation();
  const [failedUri, setFailedUri] = useState(null);
  const scale = useSharedValue(1);
  const imageUri = useMemo(() => {
    const raw = event?.thumbnail || event?.imageUrl;
    return raw ? getOptimizedCloudinaryUrl(resolveMediaUrl(raw), 480) : null;
  }, [event?.imageUrl, event?.thumbnail]);
  const displayUri = imageUri && imageUri !== failedUri ? imageUri : null;
  const dateRange = event?.startDate ? formatDayMonthNumeric(event.startDate) : null;
  const participantCount = event?._count?.participants || event?.participantCount || 0;
  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={event?.title}
      accessibilityHint={t("explore.accessibility.openEvent")}
      onPress={handlePress}
      onPressIn={() => { scale.set(withSpring(0.985, TOKENS.spring.press)); }}
      onPressOut={() => { scale.set(withSpring(1, TOKENS.spring.press)); }}
      style={[styles.card, animatedStyle]}
    >
      <View style={styles.imageWrap}>
        {displayUri ? (
          <Image source={{ uri: displayUri }} contentFit="cover" transition={220} cachePolicy="memory-disk" onError={() => setFailedUri(displayUri)} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={styles.placeholder}><MaterialIconsRounded name="event" size={28} color={C.muted} /></View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{event?.title}</Text>
        <Text style={styles.description} numberOfLines={1}>{event?.description || t("explore.event.defaultDescription")}</Text>
        <View style={styles.metaRow}>
          {dateRange ? <View style={styles.meta}><MaterialIconsRounded name="schedule" size={13} color={C.river} /><Text style={styles.metaText}>{dateRange}</Text></View> : null}
          {participantCount > 0 ? <View style={styles.meta}><Text style={styles.metaText}>{t("explore.event.participants", { count: participantCount })}</Text></View> : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: { width: CARD_W, height: CARD_H, borderRadius: C.radius, padding: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, flexDirection: "row", gap: 12 },
  imageWrap: { width: 112, borderRadius: 12, overflow: "hidden", backgroundColor: C.sand },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.sand },
  content: { flex: 1, paddingTop: 3 },
  title: { color: C.ink, fontFamily: C.font.semibold, fontSize: 14, lineHeight: 20, letterSpacing: -0.2 },
  description: { color: C.muted, fontFamily: C.font.medium, fontSize: 12, marginTop: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 10 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: C.river, fontFamily: C.font.medium, fontSize: 11 },
});

export const EventCard = memo(EventCardInner);
export { CARD_W as EVENT_CARD_W, CARD_H as EVENT_CARD_H };
