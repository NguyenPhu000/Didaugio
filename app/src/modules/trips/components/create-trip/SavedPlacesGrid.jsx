import { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { TOKENS, BOOKING_APPLE_THEME as APPLE_THEME } from "../../../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../../../lib/media-url";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const T = {
  ink: APPLE_THEME.text,
  canvas: APPLE_THEME.surface,
  parchment: APPLE_THEME.background,
  muted48: APPLE_THEME.textMuted,
  primary: APPLE_THEME.primary,
  onPrimary: APPLE_THEME.white,
};

function SavedPlaceChip({ entry, selected, onToggle, index }) {
  const place = entry?.place || entry;
  const placeId = Number(place?.id);
  const scale = useSharedValue(1);
  const imageUri = resolvePlaceImageUri(place);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, TOKENS.spring.press);
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

  if (!Number.isInteger(placeId) || placeId <= 0) return null;

  return (
    <AnimatedPressable
      entering={FadeInRight.delay(index * 50).duration(350)}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.chip, selected && styles.chipActive, animStyle]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.chipImage}
          contentFit="cover"
          transition={180}
        />
      ) : (
        <View style={styles.chipImageFallback}>
          <MaterialIcons name="place" size={18} color={T.muted48} />
        </View>
      )}

      <Text style={[styles.chipText, selected && styles.chipTextActive]} numberOfLines={1}>
        {place?.name || "Địa điểm"}
      </Text>

      {selected && (
        <View style={styles.checkBadge}>
          <MaterialIcons name="check" size={12} color={T.onPrimary} />
        </View>
      )}
    </AnimatedPressable>
  );
}

function SavedPlacesGridInner({
  savedPlaces,
  selectedIds,
  isLoading,
  isError,
  onToggle,
}) {
  if (isLoading) {
    return (
      <View style={styles.loadingRow}>
        <View style={styles.skeletonRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.skeletonChip} />
          ))}
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIconWrap}>
          <MaterialIcons name="cloud-off" size={24} color={T.muted48} />
        </View>
        <Text style={styles.emptyTitle}>Không thể tải</Text>
        <Text style={styles.emptyText}>
          Vui lòng thử lại sau
        </Text>
      </View>
    );
  }

  if (savedPlaces.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIconWrap}>
          <MaterialIcons name="bookmark-border" size={24} color={T.muted48} />
        </View>
        <Text style={styles.emptyTitle}>Chưa có địa điểm đã lưu</Text>
        <Text style={styles.emptyText}>
          Hãy lưu những địa điểm yêu thích để thêm vào chuyến đi
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.gridWrap}>
      <View style={styles.chipGrid}>
        {savedPlaces.map((entry, index) => {
          const place = entry?.place || entry;
          const placeId = Number(place?.id);
          return (
            <SavedPlaceChip
              key={`${entry?.id || placeId}:${placeId}`}
              entry={entry}
              selected={selectedIds.includes(placeId)}
              onToggle={onToggle}
              index={index}
            />
          );
        })}
      </View>

      {selectedIds.length > 0 && (
        <Animated.View
          entering={FadeInRight.duration(300)}
          style={styles.selectedHint}
        >
          <MaterialIcons name="check-circle" size={14} color={T.primary} />
          <Text style={styles.selectedHintText}>
            {selectedIds.length} địa điểm sẽ được thêm vào ngày 1
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

export const SavedPlacesGrid = memo(SavedPlacesGridInner);

const styles = StyleSheet.create({
  gridWrap: {
    gap: 12,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingLeft: 4,
    paddingRight: 14,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    gap: 8,
    maxWidth: 180,
  },
  chipActive: {
    borderColor: T.primary,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  chipImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.parchment,
  },
  chipImageFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.parchment,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    color: T.ink,
    letterSpacing: -0.224,
  },
  chipTextActive: {
    color: T.primary,
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: T.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
    paddingHorizontal: 4,
  },
  selectedHintText: {
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
    color: T.primary,
    letterSpacing: -0.12,
  },
  loadingRow: {
    paddingVertical: 4,
  },
  skeletonRow: {
    flexDirection: "row",
    gap: 10,
  },
  skeletonChip: {
    width: 120,
    height: 44,
    borderRadius: 999,
    backgroundColor: T.parchment,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: T.parchment,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: T.ink,
    letterSpacing: -0.24,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    color: T.muted48,
    textAlign: "center",
    lineHeight: 18,
    letterSpacing: -0.12,
    paddingHorizontal: 20,
  },
});
