import { memo, useCallback, useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { Pressable } from "@/components/primitives/Pressable";
import { useTranslation } from "react-i18next";
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
  formatRatingLabel,
  getCategoryIcon,
} from "../utils/exploreHelpers";

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
  const { t } = useTranslation();

  return (
    <Pressable
      haptic="light"
      onPress={onPress}
      style={styles.viewMoreContainer}
    >
      <View style={styles.viewMoreIconWrapper}>
        <MaterialIconsRounded
          name="arrow-forward"
          size={20}
          color={APPLE_THEME.text}
        />
      </View>
      <Text style={styles.viewMoreText}>
        {t("common.viewAll") || "Xem tất cả"}
      </Text>
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
  const { t } = useTranslation();
  const categoryIcon = icon || getCategoryIcon(categoryName);

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
      {/* 4. Section Header siêu tối giản, bỏ các khối màu nặng nề */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <MaterialIconsRounded
            name={categoryIcon}
            size={22}
            color={APPLE_THEME.text}
          />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {categoryName}
          </Text>
        </View>

        <Pressable
          haptic="light"
          onPress={onPressViewAll}
          hitSlop={8}
          style={styles.headerAction}
        >
          <Text style={styles.headerActionText}>{t("common.viewAll")}</Text>
        </Pressable>
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
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: TOKENS.font.bold,
    color: APPLE_THEME.text,
    letterSpacing: -0.5,
  },
  headerAction: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerActionText: {
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
    color: APPLE_THEME.textMuted, // Dùng xám thay vì xanh dương chói mắt
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
  viewMoreContainer: {
    width: CARD_W,
    height: IMAGE_H, // Bằng đúng chiều cao ảnh, không cộng thêm phần text
    borderRadius: 20,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_THEME.surfaceMuted, // Thay nét đứt bằng nền xám khối đặc
    gap: 12,
  },
  viewMoreIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_THEME.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  viewMoreText: {
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
    color: APPLE_THEME.text,
  },
});

export const CategoryPlacesSection = memo(CategoryPlacesSectionInner);
