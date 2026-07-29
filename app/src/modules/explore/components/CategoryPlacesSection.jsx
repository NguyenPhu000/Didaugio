import { memo, useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import Animated from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { TOKENS } from "../../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import { getPlaceLocation } from "../utils/exploreHelpers";
import { getCategoryIconName } from "../../../constants/categoryIcons";
import {
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
  SectionHeading,
  posterShadow,
  usePressScale,
} from "./cinematic";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Card poster: rộng hơn card cũ (164) và ảnh chiếm trọn khung thay vì 148px
 * phía trên — diện tích ảnh tăng ~2.3 lần.
 */
const CARD_W = 212;
const CARD_H = 282;
const CARD_GAP = 12;
const ITEM_LENGTH = CARD_W + CARD_GAP;
const MEDIA_W = CARD_W - POSTER_INSET * 2;

const keyExtractor = (item, index) =>
  item?.id != null ? String(item.id) : `cat-place-${index}`;

function CategoryPlaceCard({ place, onPress }) {
  const imageUri = resolvePlaceImageUri(place);
  const location = getPlaceLocation(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const categoryName = place?.category?.name;

  const { onPressIn, onPressOut, cardStyle, mediaStyle } = usePressScale();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        cardStyle,
        {
          width: CARD_W,
          height: CARD_H,
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
      {/* Lõi trong: ảnh full-bleed, bo cong đồng tâm với vỏ ngoài */}
      <View
        style={{
          flex: 1,
          borderRadius: POSTER_MEDIA_RADIUS,
          borderCurve: "continuous",
          overflow: "hidden",
          backgroundColor: CREAM,
        }}
      >
        <Animated.View style={[StyleSheet.absoluteFillObject, mediaStyle]}>
          <PosterMedia uri={imageUri} width={MEDIA_W} />
        </Animated.View>

        <PosterScrim bottomHeight="66%" topHeight="30%" strength={0.88} />

        {hasRating ? (
          <View style={{ position: "absolute", top: 10, right: 10 }}>
            <MetaChip icon="star" iconColor={STAR} label={rating.toFixed(1)} compact />
          </View>
        ) : null}

        <View style={{ position: "absolute", left: 13, right: 13, bottom: 13, gap: 3 }}>
          {categoryName ? <Eyebrow>{categoryName}</Eyebrow> : null}

          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 16.5,
              lineHeight: 21,
              letterSpacing: -0.4,
              fontFamily: TOKENS.font.heading,
            }}
            numberOfLines={2}
          >
            {place?.name}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 1 }}>
            <MaterialIconsRounded
              name="place"
              size={12}
              color="rgba(255,255,255,0.62)"
            />
            <Text
              style={{
                flex: 1,
                color: "rgba(255,255,255,0.72)",
                fontSize: 11.5,
                fontFamily: TOKENS.font.medium,
              }}
              numberOfLines={1}
            >
              {location}
            </Text>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

function ViewMoreCard({ onPress, label }) {
  const { onPressIn, onPressOut, cardStyle } = usePressScale({ mediaTo: 1 });

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        cardStyle,
        {
          width: CARD_W,
          height: CARD_H,
          borderRadius: POSTER_RADIUS,
          borderCurve: "continuous",
          backgroundColor: CREAM,
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        },
      ]}
    >
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 23,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: INK,
        }}
      >
        <MaterialIconsRounded name="arrow-forward" size={20} color="#FFFFFF" />
      </View>
      <Text
        style={{
          color: INK,
          fontSize: 13.5,
          letterSpacing: -0.2,
          fontFamily: TOKENS.font.semibold,
        }}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

function Separator() {
  return <View style={{ width: CARD_GAP }} />;
}

function CategoryPlacesSectionInner({
  categoryName,
  places,
  onPressPlace,
  onPressViewAll,
  icon,
}) {
  const { t } = useTranslation();
  const categoryIcon = getCategoryIconName({ name: categoryName, icon });
  const viewAllLabel = t("common.viewAll");

  const dataWithViewMore = useMemo(
    () => [...(places || []), { id: "__view-more__" }],
    [places],
  );

  /**
   * Snap theo offset tuyệt đối: FlatList có paddingHorizontal nên
   * snapToInterval một mình sẽ lệch đúng bằng phần padding đầu.
   */
  const snapToOffsets = useMemo(
    () => dataWithViewMore.map((_, index) => index * ITEM_LENGTH),
    [dataWithViewMore],
  );

  const renderItem = useCallback(
    ({ item, index }) => {
      if (index === places.length) {
        return <ViewMoreCard onPress={onPressViewAll} label={viewAllLabel} />;
      }
      return <CategoryPlaceCard place={item} onPress={() => onPressPlace(item)} />;
    },
    [places, onPressPlace, onPressViewAll, viewAllLabel],
  );

  if (!places?.length) return null;

  return (
    <View style={{ marginTop: 34 }}>
      <View style={{ paddingHorizontal: TAB_SCREEN_PADDING, marginBottom: 14 }}>
        <SectionHeading
          title={categoryName}
          icon={
            <MaterialCommunityIcons name={categoryIcon} size={16} color={INK} />
          }
        />
      </View>

      <FlatList
        data={dataWithViewMore}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToOffsets={snapToOffsets}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: TAB_SCREEN_PADDING,
          paddingVertical: 4,
        }}
        ItemSeparatorComponent={Separator}
      />
    </View>
  );
}

export const CategoryPlacesSection = memo(CategoryPlacesSectionInner);
export { CARD_W as CATEGORY_CARD_W, CARD_H as CATEGORY_CARD_H };
