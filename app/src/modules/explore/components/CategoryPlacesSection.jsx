import { memo, useCallback, useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { Pressable } from "@/components/primitives/Pressable";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import {
  resolvePlaceImageUri,
  getOptimizedCloudinaryUrl,
} from "../../../lib/media-url";
import {
  getPlaceLocation,
} from "../utils/exploreHelpers";
import { getCategoryIconName } from "../../../constants/categoryIcons";

// Tinh chỉnh lại tỷ lệ: Hẹp hơn một chút và cao hơn để ra dáng ảnh Portrait cao cấp
const CARD_W = 148;
const IMAGE_H = 190;
const CARD_GAP = 16; // Tăng gap lên 16px để tạo khoảng thở
const ITEM_LENGTH = CARD_W + CARD_GAP;

const keyExtractor = (item, index) =>
  item?.id != null ? String(item.id) : `cat-place-${index}`;

function CategoryPlaceCard({ place, onPress }) {
  const rawImageUri = resolvePlaceImageUri(place);
  const imageUri = rawImageUri?.includes("res.cloudinary.com")
    ? getOptimizedCloudinaryUrl(rawImageUri, 300) // Tăng res lên chút cho nét
    : rawImageUri;

  const location = getPlaceLocation(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating);
  const hasRating = Number.isFinite(rating) && rating > 0;

  return (
    <Pressable haptic="light" onPress={onPress} style={styles.cardContainer}>
      {/* 1. Khối Hình Ảnh Độc Lập (Không bị viền trắng bao quanh) */}
      <View style={styles.imageWrapper}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialIconsRounded
              name="travel-explore"
              size={32}
              color={APPLE_THEME.textMuted}
            />
          </View>
        )}

        {/* 2. Rating Badge kiểu kính mờ (Glassmorphism) tinh tế */}
        {hasRating && (
          <View style={styles.ratingBadge}>
            <MaterialIconsRounded name="star" size={12} color="#FBBF24" />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      {/* 3. Typography tự do, phóng khoáng bên dưới ảnh */}
      <View style={styles.infoContainer}>
        <Text style={styles.placeTitle} numberOfLines={1}>
          {place?.name}
        </Text>

        {location && (
          <View style={styles.locationRow}>
            <MaterialIconsRounded
              name="place"
              size={12}
              color={APPLE_THEME.textMuted}
            />
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function ViewMoreButton({ onPress }) {
  return (
    <Pressable
      haptic="light"
      onPress={onPress}
      className="w-[148px] h-[190px] rounded-[20px] items-center justify-center bg-slate-100"
    >
      <View className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-sm">
        <MaterialIconsRounded
          name="arrow-forward"
          size={20}
          color={APPLE_THEME.text}
        />
      </View>
    </Pressable>
  );
}

function Separator() {
  return <View style={{ width: CARD_GAP }} />;
}

function CategoryPlacesSectionInner({
  categoryName,
  categoryId,
  places,
  onPressPlace,
  onPressViewAll,
  icon,
}) {
  const categoryIcon = getCategoryIconName({ name: categoryName, icon });

  const renderItem = useCallback(
    ({ item, index }) => {
      if (index === places.length) {
        return <ViewMoreButton onPress={onPressViewAll} />;
      }
      return (
        <CategoryPlaceCard place={item} onPress={() => onPressPlace(item)} />
      );
    },
    [places, onPressPlace, onPressViewAll],
  );

  const dataWithViewMore = useMemo(
    () => [...places, { id: "view-more-btn" }],
    [places],
  );

  if (!places?.length) return null;

  return (
    <View style={styles.sectionContainer}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.headerIconCircle}>
            <MaterialCommunityIcons
              name={categoryIcon}
              size={16}
              color={APPLE_THEME.focusBlue}
            />
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {categoryName}
          </Text>
        </View>
      </View>

      {/* Danh sách cuộn ngang */}
      <FlatList
        data={dataWithViewMore}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_LENGTH}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={Separator}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: TAB_SCREEN_PADDING,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,113,227,0.08)",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: TOKENS.font.heading,
    color: APPLE_THEME.text,
    letterSpacing: -0.5,
  },
  listContent: {
    paddingHorizontal: TAB_SCREEN_PADDING,
    paddingBottom: 8,
  },
  cardContainer: {
    width: CARD_W,
  },
  imageWrapper: {
    width: CARD_W,
    height: IMAGE_H,
    borderRadius: 20,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: APPLE_THEME.surfaceMuted,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)", // Viền siêu mỏng tạo độ nét
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_THEME.surfaceMuted,
  },
  ratingBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)", // Nền trắng sáng sang trọng
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingText: {
    color: APPLE_THEME.text,
    fontSize: 11,
    fontFamily: TOKENS.font.bold,
  },
  infoContainer: {
    marginTop: 12, // Đẩy text ra ngoài ảnh
    gap: 4,
    paddingHorizontal: 2,
  },
  placeTitle: {
    fontSize: 15,
    fontFamily: TOKENS.font.bold,
    color: APPLE_THEME.text,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
    color: APPLE_THEME.textMuted,
    flex: 1,
  },
});

export const CategoryPlacesSection = memo(CategoryPlacesSectionInner);
