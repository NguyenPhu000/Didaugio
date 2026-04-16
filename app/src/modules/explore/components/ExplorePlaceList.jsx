import { memo, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import { getPlaceLocation, formatRatingLabel } from "../utils/exploreHelpers";

const EST_ITEM_SIZE = 92;

const PlaceRow = memo(function PlaceRow({ place, onPress }) {
  const img = resolvePlaceImageUri(place);
  const location = getPlaceLocation(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating ?? 0);
  const ratingMeta = formatRatingLabel(place);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.thumb}>
        {img ? (
          <Image
            source={{ uri: img }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={180}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.thumbFallback}>
            <MaterialIcons
              name="place"
              size={22}
              color={APPLE_THEME.textMuted}
            />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {place?.name || "Địa điểm"}
        </Text>
        <View style={styles.metaRow}>
          <MaterialIcons name="place" size={12} color={APPLE_THEME.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {location}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialIcons name="star" size={12} color="#FF9F0A" />
          <Text style={styles.metaText} numberOfLines={1}>
            {rating > 0 ? `${rating.toFixed(1)} • ${ratingMeta}` : ratingMeta}
          </Text>
        </View>
      </View>

      <MaterialIcons
        name="chevron-right"
        size={20}
        color={APPLE_THEME.textMuted}
      />
    </Pressable>
  );
});

function ExplorePlaceListInner({
  data = [],
  loading = false,
  fetchingMore = false,
  onEndReached,
  emptyTitle = "Chưa có dữ liệu",
  emptyCopy = "Hãy thử chọn mục khác để khám phá thêm.",
}) {
  const router = useRouter();

  const renderItem = useCallback(
    ({ item }) => (
      <PlaceRow
        place={item}
        onPress={() =>
          router.push({ pathname: "/place/[id]", params: { id: item.id } })
        }
      />
    ),
    [router],
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  if (!loading && (!Array.isArray(data) || data.length === 0)) {
    return (
      <View style={styles.empty}>
        <MaterialIcons
          name="travel-explore"
          size={42}
          color={APPLE_THEME.textMuted}
        />
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyCopy}>{emptyCopy}</Text>
      </View>
    );
  }

  return (
    <FlashList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={EST_ITEM_SIZE}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={RowSeparator}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        fetchingMore ? (
          <ActivityIndicator
            color={APPLE_THEME.focusBlue}
            style={styles.footerLoader}
          />
        ) : null
      }
    />
  );

  function RowSeparator() {
    return <View style={styles.rowSeparator} />;
  }
}

export const ExplorePlaceList = memo(ExplorePlaceListInner);

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: TOKENS.space[6],
    paddingTop: 12,
    paddingBottom: 24,
  },
  rowSeparator: {
    height: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 11,
    borderRadius: TOKENS.radius["2xl"],
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: APPLE_THEME.border,
    ...TOKENS.shadow.sm,
  },
  rowPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: APPLE_THEME.surfaceMuted,
  },
  thumbFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    color: APPLE_THEME.text,
    fontSize: 16.5,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: APPLE_THEME.textSecondary,
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 44,
    gap: 10,
  },
  emptyTitle: {
    color: APPLE_THEME.text,
    fontSize: 17,
    fontFamily: TOKENS.font.heading,
    textAlign: "center",
  },
  emptyCopy: {
    color: APPLE_THEME.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: TOKENS.font.body,
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: 18,
  },
});
