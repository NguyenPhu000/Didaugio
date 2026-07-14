import { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import { getOptimizedCloudinaryUrl, resolveMediaUrl } from "../../../lib/media-url";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FeaturedEventCampaignCardInner({ event, width, onPress }) {
  const scale = useSharedValue(1);

  const imageUri = useMemo(() => {
    const raw = event?.thumbnail || event?.imageUrl;
    return raw ? getOptimizedCloudinaryUrl(resolveMediaUrl(raw), 900) : null;
  }, [event?.imageUrl, event?.thumbnail]);

  const participantCount = event?._count?.participants || event?.participantCount || 0;
  const checkInCount = event?.totalCheckIns || 0;
  const legCount = event?.trip?.destinations?.length || 0;

  const status = useMemo(() => {
    const now = Date.now();
    const start = event?.startDate ? new Date(event.startDate).getTime() : null;
    const end = event?.endDate ? new Date(event.endDate).getTime() : null;
    if (start && end && now >= start && now <= end) return "Đang diễn ra";
    if (end && now > end) return "Đã kết thúc";
    return "Sắp mở";
  }, [event?.endDate, event?.startDate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(event);
  }, [event, onPress]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.985, TOKENS.spring.press);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, TOKENS.spring.press);
      }}
      style={[styles.card, animatedStyle, { width }]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          contentFit="cover"
          transition={260}
          cachePolicy="memory-disk"
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <LinearGradient
          colors={["#052E2B", "#0F766E", "#134E4A"]}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <LinearGradient
        colors={["rgba(4,12,10,0.06)", "rgba(4,12,10,0.52)", "rgba(4,12,10,0.9)"]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.topRow}>
        <View style={styles.featuredBadge}>
          <MaterialIconsRounded name="campaign" size={13} color="#FFFFFF" />
          <Text style={styles.featuredText}>NỔI BẬT</Text>
        </View>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      <View style={styles.copy}>
        <Text style={styles.kicker}>Community event</Text>
        <Text style={styles.title} numberOfLines={2}>
          {event?.title}
        </Text>
        {event?.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {event.description}
          </Text>
        ) : null}

        <View style={styles.metricRow}>
          <Metric icon="people" value={participantCount} label="tham gia" />
          <Metric icon="photo-camera" value={checkInCount} label="check-in" />
          <Metric icon="route" value={legCount} label="chặng" />
        </View>

        <View style={styles.cta}>
          <Text style={styles.ctaText}>Mở chiến dịch</Text>
          <MaterialIconsRounded name="arrow-forward" size={14} color="#06352F" />
        </View>
      </View>
    </AnimatedPressable>
  );
}

function Metric({ icon, value, label }) {
  return (
    <View style={styles.metric}>
      <MaterialIconsRounded name={icon} size={13} color="rgba(255,255,255,0.86)" />
      <Text style={styles.metricText}>{value} {label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 214,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#052E2B",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },
  topRow: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  featuredBadge: {
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 15,
    backgroundColor: "rgba(239,68,68,0.92)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featuredText: {
    color: "#FFFFFF",
    fontFamily: TOKENS.font.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  statusPill: {
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#6EE7B7",
  },
  statusText: {
    color: "#FFFFFF",
    fontFamily: TOKENS.font.bold,
    fontSize: 11,
  },
  copy: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 16,
    zIndex: 2,
  },
  kicker: {
    color: "#A7F3D0",
    fontFamily: TOKENS.font.bold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    color: "#FFFFFF",
    fontFamily: TOKENS.font.heading,
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.6,
    marginTop: 5,
  },
  description: {
    color: "rgba(255,255,255,0.76)",
    fontFamily: TOKENS.font.medium,
    fontSize: 12,
    marginTop: 4,
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 12,
  },
  metric: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.13)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metricText: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: TOKENS.font.semibold,
    fontSize: 11,
  },
  cta: {
    position: "absolute",
    right: 0,
    bottom: 0,
    height: 34,
    paddingLeft: 13,
    paddingRight: 9,
    borderRadius: 17,
    backgroundColor: "#D1FAE5",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  ctaText: {
    color: "#06352F",
    fontFamily: TOKENS.font.bold,
    fontSize: 12,
  },
});

export const FeaturedEventCampaignCard = memo(FeaturedEventCampaignCardInner);
