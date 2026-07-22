import { memo, useCallback, useMemo, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import { resolveMediaUrl, getOptimizedCloudinaryUrl } from "../../../lib/media-url";
import { formatDayMonthNumeric } from "@/utils/dateFormat";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SCREEN_W = Dimensions.get("window").width;
const CARD_W = Math.min(340, SCREEN_W - 40);
const CARD_H = 154;

function EventCardInner({ event, onPress }) {
  const [imgError, setImgError] = useState(false);
  const scale = useSharedValue(1);
  const imageUri = useMemo(() => {
    const raw = event?.thumbnail || event?.imageUrl;
    return raw && !imgError ? getOptimizedCloudinaryUrl(resolveMediaUrl(raw), 480) : null;
  }, [event?.imageUrl, event?.thumbnail, imgError]);
  const dateRange = event?.startDate ? formatDayMonthNumeric(event.startDate) : null;
  const participantCount = event?._count?.participants || event?.participantCount || 0;
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={handlePress}
      onPressIn={() => { scale.value = withSpring(0.985, TOKENS.spring.press); }}
      onPressOut={() => { scale.value = withSpring(1, TOKENS.spring.press); }}
      style={[styles.card, animatedStyle]}
    >
      <View style={styles.imageWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} contentFit="cover" transition={220} cachePolicy="memory-disk" onError={() => setImgError(true)} style={StyleSheet.absoluteFillObject} />
        ) : (
          <View style={styles.placeholder}><MaterialIconsRounded name="celebration" size={28} color="#181819" /></View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.eyebrowRow}><MaterialIconsRounded name="calendar-today" size={13} color="#181819" /><Text style={styles.eyebrow}>SỰ KIỆN NỔI BẬT</Text></View>
        <Text style={styles.title} numberOfLines={2}>{event?.title}</Text>
        <Text style={styles.description} numberOfLines={1}>{event?.description || "Cùng khám phá và gặp gỡ cộng đồng"}</Text>
        <View style={styles.metaRow}>
          {dateRange ? <View style={styles.meta}><MaterialIconsRounded name="schedule" size={13} color="#181819" /><Text style={styles.metaText}>{dateRange}</Text></View> : null}
          <View style={styles.meta}><MaterialIconsRounded name="people" size={13} color="#181819" /><Text style={styles.metaText}>{participantCount} tham gia</Text></View>
        </View>
      </View>
      <View style={styles.arrow}><MaterialIconsRounded name="arrow-forward" size={18} color="#FFFFFF" /></View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: { width: CARD_W, height: CARD_H, borderRadius: 22, padding: 10, backgroundColor: "#FFFFFF", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(24,24,25,0.14)", flexDirection: "row", gap: 12, ...TOKENS.shadow.sm },
  imageWrap: { width: 112, borderRadius: 15, overflow: "hidden", backgroundColor: "#EAE6DF" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#EAE6DF" },
  content: { flex: 1, paddingTop: 3, paddingRight: 26 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
  eyebrow: { color: "#181819", fontSize: 9, fontFamily: TOKENS.font.bold, letterSpacing: 0.75 },
  title: { color: "#181819", fontFamily: TOKENS.font.semibold, fontSize: 14, lineHeight: 19, letterSpacing: -0.2 },
  description: { color: "rgba(24,24,25,0.56)", fontFamily: TOKENS.font.medium, fontSize: 11, marginTop: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 10 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: "rgba(24,24,25,0.7)", fontFamily: TOKENS.font.semibold, fontSize: 10 },
  arrow: { position: "absolute", right: 10, bottom: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: "#000000", alignItems: "center", justifyContent: "center" },
});

export const EventCard = memo(EventCardInner);
export { CARD_W as EVENT_CARD_W, CARD_H as EVENT_CARD_H };
