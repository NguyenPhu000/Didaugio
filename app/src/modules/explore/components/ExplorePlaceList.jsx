import { memo, useCallback } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { TOKENS } from "../../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import { getPlaceLocation, formatRatingLabel } from "../utils/exploreHelpers";

const EST_ITEM_SIZE = 100;

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
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={24}
              color="#9CA3AF"
            />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {place?.name || "Địa điểm"}
        </Text>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText} numberOfLines={1}>
            {location}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="star" size={14} color="#000000" />
          <Text style={[styles.metaText, { color: "#000" }]} numberOfLines={1}>
            {rating > 0 ? `${rating.toFixed(1)} • ${ratingMeta}` : ratingMeta}
          </Text>
        </View>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color="#D1D5DB"
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
        <MaterialCommunityIcons
          name="compass-outline"
          size={50}
          color="#D1D5DB"
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
            color="#000000"
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  rowSeparator: {
    height: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 12,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  rowPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  thumbFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  name: {
    color: "#000000",
    fontSize: 16.5,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: "#6B7280", // Gray 500
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    color: "#000000",
    fontSize: 18,
    fontFamily: TOKENS.font.semibold,
    textAlign: "center",
  },
  emptyCopy: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TOKENS.font.body,
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: 20,
  },
});
