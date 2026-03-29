import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useCallback, useMemo, useRef, useState } from "react";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import {
  usePlaceDetail,
  usePlaceReviews,
} from "../../src/modules/place/hooks/usePlaceDetail";
import {
  useSavePlace,
  useUnsavePlace,
} from "../../src/modules/saved/hooks/useSaved";
import { useAuthStore } from "../../src/stores/authStore";
import { useTrips } from "../../src/modules/trips/hooks/useTrips";
import { useAddDestination } from "../../src/modules/trips/hooks/useTripDetail";
import { GLASS_THEME, TOKENS } from "../../src/constants/design-tokens";

const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const DETAIL_THEME = {
  background: "#05070B",
  card: "#111111",
  glass: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.12)",
  text: "#FFFFFF",
  textSecondary: "#A3A3A3",
  neon: "#00F0FF",
};

const StarRow = ({ rating, size = 16 }) =>
  [1, 2, 3, 4, 5].map((s) => (
    <MaterialIcons
      key={s}
      name={s <= Math.round(rating) ? "star" : "star-border"}
      size={size}
      color="#FCD34D"
    />
  ));

const ReviewCard = ({ review }) => {
  const author =
    review?.user?.profile?.fullName ||
    review?.user?.email?.split("@")[0] ||
    "Ẩn danh";
  const avatar = review?.user?.profile?.avatar;

  return (
    <View
      style={{
        backgroundColor: DETAIL_THEME.glass,
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: DETAIL_THEME.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,240,255,0.1)",
          }}
        >
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={{ width: 44, height: 44 }}
              contentFit="cover"
            />
          ) : (
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: DETAIL_THEME.neon,
              }}
            >
              {author.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: DETAIL_THEME.text,
              fontSize: 14,
              fontWeight: "700",
            }}
          >
            {author}
          </Text>
          <View style={{ flexDirection: "row", gap: 1, marginTop: 2 }}>
            <StarRow rating={review.rating} size={12} />
          </View>
        </View>
        <Text style={{ color: DETAIL_THEME.textSecondary, fontSize: 11 }}>
          {new Date(review.createdAt).toLocaleDateString("vi-VN")}
        </Text>
      </View>
      {review.content ? (
        <Text
          style={{
            color: DETAIL_THEME.textSecondary,
            fontSize: 13,
            lineHeight: 22,
            marginTop: 12,
          }}
        >
          {review.content}
        </Text>
      ) : null}
    </View>
  );
};

const OpeningHours = ({ hours }) => {
  const today = new Date().getDay();
  return (
    <View style={{ gap: 8 }}>
      {DAY_NAMES.map((day, idx) => {
        const dayNumber = idx === 6 ? 0 : idx + 1;
        const h = hours?.find((item) => item.dayOfWeek === dayNumber);
        const isToday = today === dayNumber;
        return (
          <View
            key={day}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 16,
              backgroundColor: isToday
                ? "rgba(0,240,255,0.08)"
                : DETAIL_THEME.glass,
              borderWidth: 1,
              borderColor: isToday
                ? "rgba(0,240,255,0.25)"
                : DETAIL_THEME.border,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: isToday ? "700" : "500",
                color: isToday ? DETAIL_THEME.neon : DETAIL_THEME.textSecondary,
              }}
            >
              {day}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: isToday ? "600" : "400",
                color: isToday ? DETAIL_THEME.neon : DETAIL_THEME.textSecondary,
              }}
            >
              {h?.isClosed
                ? "Đóng cửa"
                : h?.openTime && h?.closeTime
                  ? `${h.openTime} - ${h.closeTime}`
                  : "-"}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const SectionCard = ({ title, children }) => (
  <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
    <View
      style={{
        backgroundColor: DETAIL_THEME.card,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: DETAIL_THEME.border,
      }}
    >
      <Text
        style={{
          color: DETAIL_THEME.text,
          fontSize: 18,
          fontWeight: "700",
          marginBottom: 16,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  </View>
);

const TripSelectorSheet = ({ placeId, placeName, onClose }) => {
  const router = useRouter();
  const { data: trips = [], isLoading } = useTrips();
  const [selectedTripId, setSelectedTripId] = useState(null);
  const addMutation = useAddDestination(selectedTripId);

  const handleSelect = useCallback(
    async (tripId) => {
      setSelectedTripId(tripId);
      try {
        await addMutation.mutateAsync({
          placeId: parseInt(placeId),
          dayNumber: 1,
          order: 0,
        });
        onClose();
      } catch {
        setSelectedTripId(null);
      }
    },
    [addMutation, placeId, onClose],
  );

  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
          Thêm vào chuyến đi
        </Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <MaterialIcons
            name="close"
            size={22}
            color={GLASS_THEME.textSecondary}
          />
        </Pressable>
      </View>

      {placeName ? (
        <Text
          style={{
            color: GLASS_THEME.textSecondary,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          "{placeName}"
        </Text>
      ) : null}

      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={GLASS_THEME.neon}
          style={{ marginTop: 20 }}
        />
      ) : trips.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 24, gap: 12 }}>
          <Text
            style={{ color: GLASS_THEME.textSecondary, textAlign: "center" }}
          >
            Bạn chưa có chuyến đi nào
          </Text>
          <Pressable
            onPress={() => {
              onClose();
              router.push("/trip/create");
            }}
            style={{
              backgroundColor: GLASS_THEME.neon,
              borderRadius: 18,
              paddingHorizontal: 20,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: "#03131A", fontWeight: "800", fontSize: 13 }}>
              Tạo chuyến đi mới
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={trips}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => {
              const isAdding =
                selectedTripId === item.id && addMutation.isPending;
              return (
                <Pressable
                  onPress={() => handleSelect(item.id)}
                  disabled={addMutation.isPending}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    borderRadius: 18,
                    backgroundColor: GLASS_THEME.glass,
                    borderWidth: 1,
                    borderColor: GLASS_THEME.glassBorder,
                    marginBottom: 10,
                  }}
                >
                  <MaterialIcons
                    name="luggage"
                    size={20}
                    color={GLASS_THEME.neon}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={{
                        color: GLASS_THEME.textSecondary,
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      {item.destinations?.length || 0} điểm đến
                    </Text>
                  </View>
                  {isAdding ? (
                    <ActivityIndicator size="small" color={GLASS_THEME.neon} />
                  ) : (
                    <MaterialIcons
                      name="add-circle-outline"
                      size={22}
                      color={GLASS_THEME.neon}
                    />
                  )}
                </Pressable>
              );
            }}
            style={{ maxHeight: 300 }}
            showsVerticalScrollIndicator={false}
          />
          <Pressable
            onPress={() => {
              onClose();
              router.push("/trip/create");
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: 14,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: GLASS_THEME.glassBorderStrong,
              marginTop: 4,
            }}
          >
            <MaterialIcons
              name="add"
              size={18}
              color={GLASS_THEME.neonAccent}
            />
            <Text
              style={{
                color: GLASS_THEME.neonAccent,
                fontSize: 14,
                fontWeight: "700",
              }}
            >
              Tạo chuyến đi mới
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
};

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams();
  const placeId = useMemo(() => {
    const raw = Array.isArray(id) ? id[0] : id;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [id]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const bottomSheetRef = useRef(null);

  const { data: place, isLoading, isError, error } = usePlaceDetail(placeId);
  const { data: reviewData } = usePlaceReviews(placeId, { limit: 5 });
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
      router.push({
        pathname: "/(tabs)/map",
        params: {
          focusLat: String(place.latitude),
          focusLng: String(place.longitude),
          focusPlaceId: String(place.id || ""),
        },
      });
    } else if (place?.address) {
      router.push({
        pathname: "/(tabs)/map",
        params: {
          search: String(place.name || place.address),
        },
      });
    }
  };

  const handleAddToTrip = useCallback(() => {
    if (!accessToken) {
      router.push("/(auth)/login");
      return;
    }
    bottomSheetRef.current?.expand();
  }, [accessToken, router]);

  const handleGetTicket = useCallback(() => {
    router.push(`/booking/${id}`);
  }, [id, router]);

  const bottomBarHeight = Math.max(insets.bottom, 18) + 72;

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: DETAIL_THEME.background,
        }}
      >
        <ActivityIndicator size="large" color={DETAIL_THEME.neon} />
      </View>
    );
  }

  if (isError || !place) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: DETAIL_THEME.background,
          gap: 16,
          paddingHorizontal: 40,
        }}
      >
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(239,68,68,0.12)",
          }}
        >
          <MaterialIcons name="error-outline" size={42} color="#EF4444" />
        </View>
        <Text
          style={{
            color: "#fff",
            fontSize: 20,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          {error?.message || "Không tìm thấy địa điểm"}
        </Text>
      </View>
    );
  }

  const images = place?.images || [];
  const currentImage =
    images[activeImage]?.secureUrl ||
    images[activeImage]?.imageData ||
    place?.thumbnail;
  const rating = Number(place?.ratingAvg || place?.averageRating || 0);

  return (
    <View style={{ flex: 1, backgroundColor: DETAIL_THEME.background }}>
      <View style={{ position: "relative" }}>
        {currentImage ? (
          <Image
            source={{ uri: currentImage }}
            style={{ width: "100%", height: 340 }}
            contentFit="cover"
            transition={240}
          />
        ) : (
          <View
            style={{
              width: "100%",
              height: 340,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: DETAIL_THEME.glass,
            }}
          >
            <MaterialIcons name="place" size={64} color={DETAIL_THEME.neon} />
          </View>
        )}

        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 144,
            backgroundColor: "rgba(5,7,11,0.72)",
          }}
          pointerEvents="none"
        />

        <Pressable
          onPress={() => router.back()}
          style={{
            position: "absolute",
            left: 16,
            top: insets.top + 10,
            width: 44,
            height: 44,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.4)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.3)",
          }}
        >
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </Pressable>

        <Pressable
          onPress={handleSaveToggle}
          style={{
            position: "absolute",
            right: 16,
            top: insets.top + 10,
            width: 44,
            height: 44,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: place?.isSaved
              ? "rgba(0,240,255,0.2)"
              : "rgba(0,0,0,0.4)",
            borderWidth: 1,
            borderColor: place?.isSaved
              ? "rgba(0,240,255,0.5)"
              : "rgba(255,255,255,0.3)",
          }}
        >
          <MaterialIcons
            name={place?.isSaved ? "bookmark" : "bookmark-border"}
            size={22}
            color={place?.isSaved ? DETAIL_THEME.neon : "#fff"}
          />
        </Pressable>

        {images.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            style={{ position: "absolute", bottom: 12, left: 0, right: 0 }}
          >
            {images.map((img, index) => (
              <Pressable
                key={img.id || index}
                onPress={() => setActiveImage(index)}
              >
                <Image
                  source={{ uri: img.secureUrl || img.imageData }}
                  contentFit="cover"
                  style={{
                    width: 60,
                    height: 48,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor:
                      index === activeImage ? DETAIL_THEME.neon : "transparent",
                  }}
                />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomBarHeight + 20 }}
      >
        <View style={{ paddingHorizontal: 16, marginTop: -48 }}>
          <View
            style={{
              backgroundColor: DETAIL_THEME.card,
              borderRadius: 28,
              padding: 20,
              borderWidth: 1,
              borderColor: DETAIL_THEME.border,
            }}
          >
            {place?.category?.name ? (
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "rgba(0,240,255,0.12)",
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "rgba(0,240,255,0.25)",
                }}
              >
                <Text
                  style={{
                    color: DETAIL_THEME.neon,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {place.category.name}
                </Text>
              </View>
            ) : null}

            <Text
              style={{
                color: DETAIL_THEME.text,
                fontSize: 26,
                fontWeight: "800",
                letterSpacing: -0.8,
              }}
            >
              {place?.name}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: 12,
              }}
            >
              <View style={{ flexDirection: "row", gap: 1 }}>
                <StarRow rating={rating} />
              </View>
              <Text
                style={{
                  color: DETAIL_THEME.text,
                  fontSize: 15,
                  fontWeight: "700",
                }}
              >
                {rating.toFixed(1)}
              </Text>
              {place?._count?.reviews > 0 ? (
                <Text
                  style={{ color: DETAIL_THEME.textSecondary, fontSize: 13 }}
                >
                  ({place._count.reviews} đánh giá)
                </Text>
              ) : null}
            </View>

            <View style={{ gap: 10, marginTop: 16 }}>
              {place?.address ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <MaterialIcons
                    name="place"
                    size={16}
                    color={DETAIL_THEME.neon}
                  />
                  <Text
                    style={{
                      flex: 1,
                      color: DETAIL_THEME.textSecondary,
                      fontSize: 13,
                      lineHeight: 20,
                    }}
                  >
                    {place.address}
                    {place?.ward?.name ? `, ${place.ward.name}` : ""}
                    {place?.district?.name ? `, ${place.district.name}` : ""}
                  </Text>
                </View>
              ) : null}

              {place?.phone ? (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <MaterialIcons
                    name="phone"
                    size={16}
                    color={DETAIL_THEME.neon}
                  />
                  <Text
                    style={{ color: DETAIL_THEME.textSecondary, fontSize: 13 }}
                  >
                    {place.phone}
                  </Text>
                </View>
              ) : null}

              {place?.website ? (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <MaterialIcons
                    name="link"
                    size={16}
                    color={DETAIL_THEME.neon}
                  />
                  <Text
                    style={{ color: DETAIL_THEME.neon, fontSize: 13, flex: 1 }}
                    numberOfLines={1}
                  >
                    {place.website}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 10,
            paddingHorizontal: 16,
            marginTop: 14,
          }}
        >
          <Pressable
            onPress={handleAddToTrip}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              paddingVertical: 14,
              borderRadius: 18,
              backgroundColor: DETAIL_THEME.glass,
              borderWidth: 1,
              borderColor: DETAIL_THEME.border,
            }}
          >
            <MaterialIcons name="playlist-add" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>
              Thêm vào trip
            </Text>
          </Pressable>

          <Pressable
            onPress={handleGetTicket}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              paddingVertical: 14,
              borderRadius: 18,
              backgroundColor: DETAIL_THEME.neon,
              shadowColor: DETAIL_THEME.neon,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            <MaterialIcons
              name="confirmation-number"
              size={18}
              color="#03131A"
            />
            <Text style={{ color: "#03131A", fontSize: 13, fontWeight: "800" }}>
              Đặt vé
            </Text>
          </Pressable>
        </View>

        {place?.description ? (
          <SectionCard title="Giới thiệu">
            <Text
              style={{
                color: DETAIL_THEME.textSecondary,
                fontSize: 14,
                lineHeight: 26,
              }}
            >
              {place.description}
            </Text>
          </SectionCard>
        ) : null}

        {place?.openingHours?.length > 0 ? (
          <SectionCard title="Giờ mở cửa">
            <OpeningHours hours={place.openingHours} />
          </SectionCard>
        ) : null}

        <SectionCard title="Đánh giá">
          <View style={{ marginBottom: 4 }}>
            {reviews.length === 0 ? (
              <Text
                style={{
                  color: DETAIL_THEME.textSecondary,
                  fontSize: 13,
                  textAlign: "center",
                  paddingVertical: 20,
                }}
              >
                Chưa có đánh giá nào
              </Text>
            ) : (
              reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            )}
            {accessToken ? (
              <Pressable
                style={{
                  marginTop: 8,
                  paddingVertical: 12,
                  borderRadius: 16,
                  backgroundColor: DETAIL_THEME.glass,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: DETAIL_THEME.border,
                }}
                onPress={() => {}}
              >
                <Text
                  style={{
                    color: DETAIL_THEME.textSecondary,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  Viết đánh giá
                </Text>
              </Pressable>
            ) : null}
          </View>
        </SectionCard>
      </ScrollView>

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: "rgba(5,7,11,0.92)",
          borderTopWidth: 1,
          borderTopColor: DETAIL_THEME.border,
        }}
      >
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={handleSaveToggle}
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: DETAIL_THEME.glass,
              borderWidth: 1,
              borderColor: DETAIL_THEME.border,
            }}
          >
            <MaterialIcons
              name={place?.isSaved ? "bookmark" : "bookmark-border"}
              size={22}
              color={
                place?.isSaved ? DETAIL_THEME.neon : DETAIL_THEME.textSecondary
              }
            />
          </Pressable>

          <Pressable
            onPress={handleNavigate}
            style={{
              flex: 1,
              height: 54,
              borderRadius: 18,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: DETAIL_THEME.neon,
              shadowColor: DETAIL_THEME.neon,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <MaterialIcons name="directions" size={20} color="#03131A" />
            <Text style={{ color: "#03131A", fontSize: 15, fontWeight: "800" }}>
              Chỉ đường
            </Text>
          </Pressable>
        </View>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={["55%", "80%"]}
        enablePanDownToClose
        backgroundStyle={{
          backgroundColor: "#0D1117",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          borderWidth: 1,
          borderColor: GLASS_THEME.glassBorder,
        }}
        handleIndicatorStyle={{
          backgroundColor: "rgba(255,255,255,0.3)",
          width: 36,
        }}
      >
        <BottomSheetView style={{ flex: 1 }}>
          <TripSelectorSheet
            placeId={id}
            placeName={place?.name}
            onClose={() => bottomSheetRef.current?.close()}
          />
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
