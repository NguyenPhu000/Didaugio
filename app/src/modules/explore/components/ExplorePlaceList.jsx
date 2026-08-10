import { memo, useCallback } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import Animated from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import { getPlaceLocation, formatRatingLabel } from "../utils/exploreHelpers";
import { TOKENS } from "../../../constants/design-tokens";
import {
  ArrowCircle,
  CREAM,
  Eyebrow,
  INK,
  MetaChip,
  POSTER_INSET,
  POSTER_MEDIA_RADIUS,
  POSTER_RADIUS,
  PosterMedia,
  PosterScrim,
  STAR,
  posterShadow,
  usePressScale,
} from "./cinematic";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const LIST_PAD = 24;
/** 4:3 — khổ rộng điện ảnh, thay cho dải ảnh 160px cố định của bản cũ. */
const MEDIA_ASPECT = 4 / 3;
const EST_ITEM_SIZE = 330;

const PlaceRow = memo(function PlaceRow({ place, onPress }) {
  const { t } = useTranslation();
  const imageUri = resolvePlaceImageUri(place);
  const location = getPlaceLocation(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating ?? 0);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const ratingMeta = formatRatingLabel(place);
  const categoryName = place?.category?.name || t("explore.card.recommended");

  const { onPressIn, onPressOut, cardStyle, mediaStyle } = usePressScale({
    to: 0.982,
    mediaTo: 1.03,
  });

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={place?.name}
      accessibilityHint={t("explore.accessibility.openPlace")}
      style={[
        cardStyle,
        {
          padding: POSTER_INSET,
          borderRadius: POSTER_RADIUS,
          borderCurve: "continuous",
          backgroundColor: "#FFFFFF",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "rgba(11,11,12,0.08)",
          ...posterShadow,
        },
      ]}
    >
      <View
        style={{
          aspectRatio: MEDIA_ASPECT,
          borderRadius: POSTER_MEDIA_RADIUS,
          borderCurve: "continuous",
          overflow: "hidden",
          backgroundColor: CREAM,
        }}
      >
        <Animated.View style={[StyleSheet.absoluteFillObject, mediaStyle]}>
          <PosterMedia uri={imageUri} width={420} />
        </Animated.View>

        <PosterScrim bottomHeight="60%" topHeight="26%" strength={0.9} />

        {hasRating ? (
          <View style={{ position: "absolute", top: 12, right: 12 }}>
            <MetaChip icon="star" iconColor={STAR} label={rating.toFixed(1)} />
          </View>
        ) : null}

        <View style={{ position: "absolute", left: 18, right: 18, bottom: 16 }}>
          <Eyebrow>{categoryName}</Eyebrow>

          <Text
            style={{
              marginTop: 6,
              color: "#FFFFFF",
              fontSize: 22,
              lineHeight: 27,
              letterSpacing: -0.6,
              fontFamily: TOKENS.font.heading,
            }}
            numberOfLines={2}
          >
            {place?.name}
          </Text>

          <View
            style={{
              marginTop: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <View style={{ flex: 1, gap: 3 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <MaterialIconsRounded
                  name="place"
                  size={13}
                  color="rgba(255,255,255,0.6)"
                />
                <Text
                  style={{
                    flex: 1,
                    color: "rgba(255,255,255,0.76)",
                    fontSize: 12.5,
                    fontFamily: TOKENS.font.medium,
                  }}
                  numberOfLines={1}
                >
                  {location}
                </Text>
              </View>
              <Text
                style={{
                  color: "rgba(255,255,255,0.56)",
                  fontSize: 10.5,
                  letterSpacing: 0.3,
                  fontFamily: TOKENS.font.semibold,
                }}
                numberOfLines={1}
              >
                {ratingMeta}
              </Text>
            </View>

            <ArrowCircle size={38} tone="light" />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
});

function RowSeparator() {
  return <View style={{ height: 14 }} />;
}

function ExplorePlaceListInner({
  data = [],
  loading = false,
  fetchingMore = false,
  onEndReached,
  emptyTitle,
  emptyCopy,
}) {
  const router = useRouter();
  const { t } = useTranslation();

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
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 40,
          gap: 10,
        }}
      >
        <View
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: CREAM,
            marginBottom: 4,
          }}
        >
          <MaterialIconsRounded name="explore-off" size={30} color="rgba(11,11,12,0.32)" />
        </View>
        <Text
          style={{
            color: INK,
            fontSize: 18,
            letterSpacing: -0.4,
            textAlign: "center",
            fontFamily: TOKENS.font.heading,
          }}
        >
          {emptyTitle || t("explore.empty.noResults")}
        </Text>
        <Text
          style={{
            color: "rgba(11,11,12,0.5)",
            fontSize: 14,
            lineHeight: 21,
            textAlign: "center",
            fontFamily: TOKENS.font.medium,
          }}
        >
          {emptyCopy || t("explore.empty.noResultsDesc")}
        </Text>
      </View>
    );
  }

  return (
    <FlashList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={EST_ITEM_SIZE}
      contentContainerStyle={{
        paddingHorizontal: LIST_PAD,
        paddingTop: 14,
        paddingBottom: 44,
      }}
      ItemSeparatorComponent={RowSeparator}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        fetchingMore ? (
          <View style={{ paddingVertical: 22 }}>
            <ActivityIndicator color={INK} />
          </View>
        ) : null
      }
    />
  );
}

export const ExplorePlaceList = memo(ExplorePlaceListInner);
