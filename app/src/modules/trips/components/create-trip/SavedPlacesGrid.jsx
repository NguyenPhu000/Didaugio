import { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInRight, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
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

// Bọc memo cho từng Chip để tránh re-render toàn bộ lưới khi chọn/bỏ chọn
const SavedPlaceChip = memo(({ entry, selected, onToggle, index }) => {
  const place = entry?.place || entry;
  const placeId = place?.id;
  const scale = useSharedValue(1);
  const imageUri = resolvePlaceImageUri(place);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, TOKENS.spring.press);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, TOKENS.spring.press);
  }, []);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle?.(placeId);
  }, [placeId, onToggle]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!placeId) return null;

  return (
    <Animated.View entering={FadeInRight.delay(index * 40).duration(300)}>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.chip, selected && styles.chipActive, animStyle]}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.chipImage} contentFit="cover" transition={150} />
        ) : (
          <View style={styles.chipImageFallback}>
            <MaterialIcons name="place" size={16} color={T.muted48} />
          </View>
        )}

        <Text style={[styles.chipText, selected && styles.chipTextActive]} numberOfLines={1}>
          {place?.name || "Địa điểm"}
        </Text>

        {selected && (
          <View style={styles.checkBadge}>
            <MaterialIcons name="check" size={10} color={T.onPrimary} />
          </View>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
});

function SavedPlacesGridInner({
  savedPlaces,
  selectedIds = [],
  targetDay = 1, // Sửa lỗi hardcode: Truyền ngày đang chọn vào đây
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

  if (isError || !savedPlaces || savedPlaces.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIconWrap}>
          <MaterialIcons name={isError ? "cloud-off" : "bookmark-border"} size={22} color={T.muted48} />
        </View>
        <Text style={styles.emptyTitle}>{isError ? "Không thể tải dữ liệu" : "Chưa có địa điểm đã lưu"}</Text>
        <Text style={styles.emptyText}>
          {isError ? "Vui lòng kiểm tra kết nối và thử lại" : "Hãy lưu những địa điểm yêu thích để lên lịch trình nhanh hơn"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.gridWrap}>
      <View style={styles.chipGrid}>
        {savedPlaces.map((entry, index) => {
          const place = entry?.place || entry;
          const isSelected = selectedIds.map(String).includes(String(place?.id));
          return (
            <SavedPlaceChip
              key={`${entry?.id || place?.id}-${index}`}
              entry={entry}
              selected={isSelected}
              onToggle={onToggle}
              index={index}
            />
          );
        })}
      </View>

      {selectedIds.length > 0 && (
        <Animated.View entering={FadeInRight.duration(200)} style={styles.selectedHint}>
          <MaterialIcons name="check-circle" size={14} color={T.primary} />
          <Text style={styles.selectedHintText}>
            Đã chọn {selectedIds.length} địa điểm cho ngày {targetDay}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

export const SavedPlacesGrid = memo(SavedPlacesGridInner);

const styles = StyleSheet.create({
  gridWrap: { gap: 12 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    paddingLeft: 4,
    paddingRight: 12,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    gap: 6,
    maxWidth: 170,
  },
  chipActive: {
    borderColor: T.primary,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  chipImage: { width: 32, height: 32, borderRadius: 16, backgroundColor: T.parchment },
  chipImageFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.parchment,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    color: T.ink,
    letterSpacing: -0.2,
  },
  chipTextActive: { color: T.primary },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: T.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedHint: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 2, paddingHorizontal: 4 },
  selectedHintText: {
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
    color: T.primary,
    letterSpacing: -0.1,
  },
  loadingRow: { paddingVertical: 4 },
  skeletonRow: { flexDirection: "row", gap: 8 },
  skeletonChip: { width: 110, height: 40, borderRadius: 20, backgroundColor: T.parchment },
  emptyWrap: { alignItems: "center", paddingVertical: 24, gap: 6 },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: T.parchment,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  emptyTitle: { fontSize: 14, fontFamily: TOKENS.font.semibold, color: T.ink, letterSpacing: -0.2 },
  emptyText: {
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: T.muted48,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 32,
  },
})