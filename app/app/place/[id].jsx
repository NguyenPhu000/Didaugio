import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  usePlaceDetail,
  usePlaceReviews,
} from "../../src/modules/place/hooks/usePlaceDetail";
import {
  useSavePlace,
  useUnsavePlace,
} from "../../src/modules/saved/hooks/useSaved";
import { useAuthStore } from "../../src/stores/authStore";
import { Badge } from "../../src/components/ui/Badge";
import { Button } from "../../src/components/ui/Button";
import { cn } from "../../src/lib/cn";

const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const StarRow = ({ rating, size = 16 }) =>
  [1, 2, 3, 4, 5].map((s) => (
    <MaterialIcons
      key={s}
      name={s <= Math.round(rating) ? "star" : "star-border"}
      size={size}
      color="#f59e0b"
    />
  ));

const ReviewCard = ({ review }) => {
  const author =
    review?.user?.profile?.fullName ||
    review?.user?.email?.split("@")[0] ||
    "Ẩn danh";
  const avatar = review?.user?.profile?.avatar;

  return (
    <View className="border border-gray-100 rounded-2xl p-3 mb-3 gap-2">
      <View className="flex-row items-center gap-2">
        <View
          className="w-9 h-9 rounded-full overflow-hidden items-center justify-center"
          style={{ backgroundColor: "#e6f3fb" }}
        >
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              className="w-9 h-9"
              contentFit="cover"
            />
          ) : (
            <Text className="text-[15px] font-bold text-primary">
              {author.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-[13px] font-bold text-ink">{author}</Text>
          <View className="flex-row gap-px">
            <StarRow rating={review.rating} size={13} />
          </View>
        </View>
        <Text className="text-[11px] text-ink-muted">
          {new Date(review.createdAt).toLocaleDateString("vi-VN")}
        </Text>
      </View>
      {review.content ? (
        <Text className="text-[13px] text-ink-secondary leading-[19px]">
          {review.content}
        </Text>
      ) : null}
    </View>
  );
};

const OpeningHours = ({ hours }) => {
  const today = new Date().getDay();
  return (
    <View className="gap-1.5">
      {DAY_NAMES.map((day, idx) => {
        const dayNumber = idx === 6 ? 0 : idx + 1;
        const h = hours?.find((h) => h.dayOfWeek === dayNumber);
        const isToday = today === dayNumber;
        return (
          <View
            key={day}
            className={cn(
              "flex-row justify-between px-2 py-1 rounded-lg",
              isToday && "bg-blue-50",
            )}
          >
            <Text
              className={cn(
                "text-[13px] font-medium text-ink-secondary w-8",
                isToday && "text-primary font-bold",
              )}
            >
              {day}
            </Text>
            <Text
              className={cn(
                "text-[13px] text-ink-secondary",
                isToday && "text-primary font-semibold",
              )}
            >
              {h?.isClosed
                ? "Đóng cửa"
                : h?.openTime && h?.closeTime
                  ? `${h.openTime} – ${h.closeTime}`
                  : "–"}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);

  const { data: place, isLoading, isError, error } = usePlaceDetail(id);
  const { data: reviewData } = usePlaceReviews(id, { limit: 5 });
  const reviews = reviewData?.reviews || [];

  const saveMutation = useSavePlace();
  const unsaveMutation = useUnsavePlace();

  const [activeImage, setActiveImage] = useState(0);

  const handleSaveToggle = () => {
    if (!accessToken) {
      router.push("/(auth)/login");
      return;
    }
    if (place?.isSaved) {
      unsaveMutation.mutate(place.id);
    } else {
      saveMutation.mutate({ placeId: place.id });
    }
  };

  const handleNavigate = () => {
    if (place?.latitude && place?.longitude) {
      const url = `https://maps.google.com/?q=${place.latitude},${place.longitude}`;
      Linking.openURL(url);
    } else if (place?.address) {
      const query = encodeURIComponent(`${place.name}, ${place.address}`);
      Linking.openURL(`https://maps.google.com/?q=${query}`);
    }
  };

  const BOTTOM_BAR_H = Math.max(insets.bottom, 16) + 56 + 16;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#0077b8" />
      </View>
    );
  }

  if (isError || !place) {
    return (
      <View className="flex-1 items-center justify-center bg-surface gap-3">
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text className="text-[15px] text-red-500">
          {error?.message || "Không tìm thấy địa điểm"}
        </Text>
      </View>
    );
  }

  const images = place?.images || [];
  const currentImage = images[activeImage]?.imageData;
  const rating = Number(place?.ratingAvg || place?.averageRating || 0);

  return (
    <View className="flex-1 bg-surface">
      {/* ── Hero image ── */}
      <View className="relative">
        {currentImage ? (
          <Image
            source={{ uri: currentImage }}
            className="w-full h-[280px]"
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View className="w-full h-[280px] bg-gray-100 items-center justify-center">
            <MaterialIcons name="place" size={64} color="#9ca3af" />
          </View>
        )}

        {/* gradient overlay */}
        <View
          className="absolute bottom-0 left-0 right-0 h-20"
          style={{
            background: "transparent",
            backgroundColor: "rgba(0,0,0,0.12)",
          }}
          pointerEvents="none"
        />

        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          className="absolute left-4 w-10 h-10 rounded-full items-center justify-center"
          style={{ top: 12 + insets.top, backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </Pressable>

        {/* Save button */}
        <Pressable
          onPress={handleSaveToggle}
          className="absolute right-4 w-10 h-10 rounded-full items-center justify-center"
          style={{ top: 12 + insets.top, backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <MaterialIcons
            name={place?.isSaved ? "bookmark" : "bookmark-border"}
            size={22}
            color={place?.isSaved ? "#f59e0b" : "#fff"}
          />
        </Pressable>

        {/* Image thumbs */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
            className="absolute bottom-2.5 left-0 right-0"
          >
            {images.map((img, i) => (
              <Pressable key={img.id} onPress={() => setActiveImage(i)}>
                <Image
                  source={{ uri: img.imageData }}
                  contentFit="cover"
                  className="w-[52px] h-10 rounded-lg"
                  style={{
                    borderWidth: 2,
                    borderColor: i === activeImage ? "#fff" : "transparent",
                  }}
                />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BOTTOM_BAR_H + 8 }}
      >
        {/* ── Name & meta ── */}
        <View className="bg-white px-5 pt-5 pb-4 border-b border-gray-100">
          {place?.category?.name && (
            <Badge
              variant="primary"
              style={{ marginBottom: 8, alignSelf: "flex-start" }}
            >
              {place.category.name}
            </Badge>
          )}
          <Text
            className="text-[22px] font-extrabold text-ink mb-2"
            style={{ letterSpacing: -0.3 }}
          >
            {place?.name}
          </Text>

          <View className="flex-row items-center gap-1 mb-3">
            <View className="flex-row gap-px">
              <StarRow rating={rating} />
            </View>
            <Text className="text-[14px] font-bold text-ink ml-1">
              {rating.toFixed(1)}
            </Text>
            {place?._count?.reviews > 0 && (
              <Text className="text-[12px] text-ink-secondary">
                ({place._count.reviews} đánh giá)
              </Text>
            )}
          </View>

          {place?.address && (
            <View className="flex-row items-start gap-1.5 mb-1.5">
              <MaterialIcons
                name="place"
                size={16}
                color="#0077b8"
                style={{ marginTop: 1 }}
              />
              <Text className="text-[13px] text-ink-secondary flex-1 leading-[18px]">
                {place.address}
                {place?.ward?.name ? `, ${place.ward.name}` : ""}
                {place?.district?.name ? `, ${place.district.name}` : ""}
              </Text>
            </View>
          )}
          {place?.phone && (
            <View className="flex-row items-center gap-1.5 mb-1.5">
              <MaterialIcons name="phone" size={16} color="#0077b8" />
              <Text className="text-[13px] text-ink-secondary">
                {place.phone}
              </Text>
            </View>
          )}
          {place?.website && (
            <View className="flex-row items-center gap-1.5 mb-1.5">
              <MaterialIcons name="link" size={16} color="#0077b8" />
              <Text
                className="text-[13px] text-primary flex-1"
                numberOfLines={1}
              >
                {place.website}
              </Text>
            </View>
          )}
          {place?.priceRange && (
            <View className="flex-row items-center gap-1.5">
              <MaterialIcons name="attach-money" size={16} color="#0077b8" />
              <Text className="text-[13px] text-ink-secondary">
                {place.priceRange}
              </Text>
            </View>
          )}
        </View>

        {/* ── Description ── */}
        {place?.description && (
          <View className="bg-white px-5 py-5 mt-2 border-y border-gray-100">
            <Text
              className="text-[16px] font-extrabold text-ink mb-3"
              style={{ letterSpacing: -0.2 }}
            >
              Giới thiệu
            </Text>
            <Text className="text-[14px] text-ink-secondary leading-[22px]">
              {place.description}
            </Text>
          </View>
        )}

        {/* ── Opening hours ── */}
        {place?.openingHours?.length > 0 && (
          <View className="bg-white px-5 py-5 mt-2 border-y border-gray-100">
            <Text
              className="text-[16px] font-extrabold text-ink mb-3"
              style={{ letterSpacing: -0.2 }}
            >
              Giờ mở cửa
            </Text>
            <OpeningHours hours={place.openingHours} />
          </View>
        )}

        {/* ── Reviews ── */}
        <View className="bg-white px-5 py-5 mt-2 border-y border-gray-100">
          <View className="flex-row justify-between items-center mb-3">
            <Text
              className="text-[16px] font-extrabold text-ink"
              style={{ letterSpacing: -0.2 }}
            >
              Đánh giá
            </Text>
            {reviews.length > 0 && (
              <Text className="text-[12px] text-ink-secondary">
                {reviews.length} nhận xét
              </Text>
            )}
          </View>

          {reviews.length === 0 ? (
            <Text className="text-[13px] text-ink-muted text-center py-4">
              Chưa có đánh giá nào
            </Text>
          ) : (
            reviews.map((r) => <ReviewCard key={r.id} review={r} />)
          )}

          {accessToken && (
            <Button
              variant="secondary"
              size="sm"
              style={{ marginTop: 12 }}
              onPress={() => {}}
            >
              Viết đánh giá
            </Button>
          )}
        </View>
      </ScrollView>

      {/* ── Bottom CTA — Chỉ đường ── */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 flex-row gap-3"
        style={{
          paddingBottom: Math.max(insets.bottom, 16),
          paddingTop: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {/* Save shortcut */}
        <Pressable
          onPress={handleSaveToggle}
          className="w-14 h-14 rounded-2xl items-center justify-center border border-gray-200 bg-surface"
        >
          <MaterialIcons
            name={place?.isSaved ? "bookmark" : "bookmark-border"}
            size={22}
            color={place?.isSaved ? "#f59e0b" : "#6b7280"}
          />
        </Pressable>

        {/* Navigate CTA */}
        <Pressable
          onPress={handleNavigate}
          className="flex-1 h-14 rounded-2xl bg-primary flex-row items-center justify-center gap-2"
          style={{
            shadowColor: "#0077b8",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <MaterialIcons name="directions" size={22} color="#fff" />
          <Text className="text-[16px] font-bold text-white">Chỉ đường</Text>
        </Pressable>
      </View>
    </View>
  );
}
