import { memo, useCallback, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import Animated, {
  FadeIn,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { TOKENS, BOOKING_APPLE_THEME as APPLE_THEME } from "../../../../constants/design-tokens";
import {
  getOptimizedCloudinaryUrl,
  resolvePlaceImageUri,
} from "../../../../lib/media-url";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CARD_WIDTH = 136;
const IMAGE_HEIGHT = 96;
const THUMB_SIZE = 280;

const T = {
  ink: APPLE_THEME.text,
  muted: APPLE_THEME.textMuted,
  primary: APPLE_THEME.primary,
  onPrimary: APPLE_THEME.white,
  surface: APPLE_THEME.surfaceElevated,
  hairline: APPLE_THEME.borderSoft,
};

function getPlaceSubtitle(place) {
  const district = place?.district?.name;
  const category = place?.category?.name;
  if (district && category) return `${district} · ${category}`;
  return district || category || place?.address || "";
}

const SavedPlaceCard = memo(function SavedPlaceCard({
  place,
  placeId,
  selected,
  onToggle,
  index,
}) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const rawUri = resolvePlaceImageUri(place);
  const imageUri =
    rawUri && rawUri.includes("res.cloudinary.com")
      ? getOptimizedCloudinaryUrl(rawUri, THUMB_SIZE)
      : rawUri;

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, TOKENS.spring.press);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, TOKENS.spring.press);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(placeId);
  }, [placeId, onToggle]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInRight.delay(Math.min(index * 50, 300)).duration(400)}>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${place?.name || t("trip.savedGrid.place")}${selected ? `, ${t("trip.savedGrid.selected")}` : ""}`}
        style={[styles.card, selected && styles.cardSelected, animStyle]}
      >
        <View style={styles.imageWrap}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              recyclingKey={`saved-place-${placeId}`}
              style={styles.image}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIconsRounded name="place" size={28} color={T.muted} />
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.35)"]}
            style={styles.imageGradient}
            pointerEvents="none"
          />
          {selected ? (
            <View style={styles.checkBadge}>
              <MaterialIconsRounded name="check" size={14} color={T.onPrimary} />
            </View>
          ) : (
            <View style={styles.addHint}>
              <MaterialIconsRounded name="add" size={14} color={T.onPrimary} />
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.placeName, selected && styles.placeNameSelected]} numberOfLines={2}>
            {place?.name || t("trip.savedGrid.place")}
          </Text>
          {getPlaceSubtitle(place) ? (
            <Text style={styles.placeMeta} numberOfLines={1}>
              {getPlaceSubtitle(place)}
            </Text>
          ) : null}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
});

const SkeletonCard = memo(function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={[styles.imageWrap, styles.skeletonBlock]} />
      <View style={styles.cardBody}>
        <View style={[styles.skeletonLine, { width: "85%" }]} />
        <View style={[styles.skeletonLine, { width: "60%", marginTop: 6 }]} />
      </View>
    </View>
  );
});

function SavedPlacesGridInner({
  savedPlaces,
  selectedIds = [],
  targetDay = 1,
  isLoading,
  isError,
  onToggle,
}) {
  const { t } = useTranslation();
  const selectedSet = useMemo(
    () => new Set(selectedIds.map(String)),
    [selectedIds],
  );

  const entries = useMemo(
    () =>
      (savedPlaces || [])
        .map((entry) => {
          const place = entry?.place || entry;
          const placeId = place?.id;
          if (!placeId) return null;
          return { entry, place, placeId: String(placeId) };
        })
        .filter(Boolean),
    [savedPlaces],
  );

  if (isLoading) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </ScrollView>
    );
  }

  if (isError || entries.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIconRing}>
          <MaterialIconsRounded
            name={isError ? "cloud-off" : "bookmark-border"}
            size={26}
            color={T.muted}
          />
        </View>
        <Text style={styles.emptyTitle}>
          {isError ? t("trip.savedGrid.loadError") : t("trip.savedGrid.noSaved")}
        </Text>
        <Text style={styles.emptySubtitle}>
          {isError
            ? t("trip.savedGrid.retrySubtitle")
            : t("trip.savedGrid.emptySubtitle")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.listHeader}>
        <Text style={styles.listHint}>{t("trip.savedGrid.tapHint")}</Text>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{t("trip.savedGrid.savedCount", { count: entries.length })}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {entries.map(({ place, placeId, entry }, index) => (
          <SavedPlaceCard
            key={entry?.id ? `saved-${entry.id}` : `place-${placeId}`}
            place={place}
            placeId={placeId}
            selected={selectedSet.has(placeId)}
            onToggle={onToggle}
            index={index}
          />
        ))}
      </ScrollView>

      {selectedIds.length > 0 ? (
        <Animated.View entering={FadeIn.duration(220)} style={styles.selectionBar}>
          <MaterialIconsRounded name="check-circle" size={18} color={T.primary} />
          <Text style={styles.selectionText}>
            Đã chọn {selectedIds.length} địa điểm
            {targetDay > 0 ? ` · Ngày ${targetDay}` : ""}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

export const SavedPlacesGrid = memo(SavedPlacesGridInner);

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  listHint: {
    fontSize: 13,
    fontWeight: "500",
    color: T.muted,
    letterSpacing: -0.2,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: T.ink,
    letterSpacing: -0.1,
  },
  scrollContent: {
    gap: 10,
    paddingVertical: 2,
    paddingRight: 4,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 18,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.hairline,
    overflow: "hidden",
  },
  cardSelected: {
    borderColor: T.primary,
    borderWidth: 2,
    backgroundColor: "rgba(0,122,255,0.04)",
  },
  imageWrap: {
    width: "100%",
    height: IMAGE_HEIGHT,
    backgroundColor: APPLE_THEME.background,
    overflow: "hidden",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: T.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: T.onPrimary,
  },
  addHint: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 2,
    minHeight: 52,
  },
  placeName: {
    fontSize: 13,
    fontWeight: "600",
    color: T.ink,
    letterSpacing: -0.2,
    lineHeight: 17,
  },
  placeNameSelected: {
    color: T.primary,
  },
  placeMeta: {
    fontSize: 11,
    fontWeight: "500",
    color: T.muted,
    letterSpacing: -0.1,
  },
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(0,122,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,122,255,0.12)",
  },
  selectionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: T.primary,
    letterSpacing: -0.2,
  },
  skeletonBlock: {
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  skeletonLine: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: T.hairline,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  emptyIconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: T.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: T.ink,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: T.muted,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
});
