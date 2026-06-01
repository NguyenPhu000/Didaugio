import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BOOKING_APPLE_THEME as THEME,
  TOKENS,
} from "../../../src/constants/design-tokens";
import {
  useMyBookingDetail,
  useMyBookingQR,
  useLinkBookingToTrip,
} from "../../../src/modules/booking/hooks/useBooking";
import { useSavePlace } from "../../../src/modules/saved/hooks/useSaved";
import {
  useCreateTrip,
  useTrips,
} from "../../../src/modules/trips/hooks/useTrips";
import { useOffline } from "../../../src/hooks/useOffline";


const QR_CACHE_KEY = "@booking_qr_cache";
const QR_CACHE_VERSION = "v1";
const QR_CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

const TerminalStatuses = new Set([
  "completed",
  "cancelled",
  "rejected",
  "expired",
  "no_show",
]);

const STATUS_META = {
  pending: {
    label: "Chờ xác nhận",
    color: "#1D1D1F",
    bg: "#EDEDF2",
  },
  confirmed: {
    label: "Đã xác nhận",
    color: "#FFFFFF",
    bg: "#1D1D1F",
  },
  completed: {
    label: "Hoàn thành",
    color: "#1D1D1F",
    bg: "#DFDFE4",
  },
  cancelled: {
    label: "Đã hủy",
    color: "#5A5A5E",
    bg: "#ECECEF",
  },
  rejected: {
    label: "Bị từ chối",
    color: "#5A5A5E",
    bg: "#F2E8DF",
  },
  expired: {
    label: "Hết hạn",
    color: "#5A5A5E",
    bg: "#ECECEF",
  },
  no_show: {
    label: "Không đến",
    color: "#5A5A5E",
    bg: "#ECECEF",
  },
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("vi-VN")}đ`;
};

const formatDateVN = (dateStr) => {
  if (!dateStr) return "--/--/----";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "--/--/----";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateTime = (booking) => {
  if (booking?.useDate || booking?.useTime) {
    const date = formatDateVN(booking?.useDate);
    return `${date} • ${booking?.useTime || "--:--"}`;
  }

  if (booking?.bookingAt) {
    const at = new Date(booking.bookingAt);
    if (!Number.isNaN(at.getTime())) {
      const day = String(at.getDate()).padStart(2, "0");
      const month = String(at.getMonth() + 1).padStart(2, "0");
      const year = at.getFullYear();
      const hour = String(at.getHours()).padStart(2, "0");
      const minute = String(at.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} • ${hour}:${minute}`;
    }
  }

  return "Chưa xác định";
};

export default function BookingDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const bookingId = Array.isArray(id) ? id[0] : id;

  const {
    data: booking,
    isLoading,
    refetch,
    isRefetching,
  } = useMyBookingDetail(bookingId);

  const { isOffline } = useOffline();
  const [cachedQr, setCachedQr] = useState(null);

  const canShowQr = booking?.status === "confirmed";
  const isTerminal = TerminalStatuses.has(booking?.status);
  const {
    data: qrData,
    isLoading: qrLoading,
    error: qrError,
    refetch: refetchQr,
  } = useMyBookingQR(bookingId, { enabled: canShowQr && !isOffline });

  const activeQrCode = qrData?.qrCode || cachedQr?.qrCode || null;

  // Cache QR to AsyncStorage when fetched successfully
  useEffect(() => {
    if (!qrData?.qrCode || !bookingId) return;
    const cacheEntry = {
      data: { qrCode: qrData.qrCode, bookingCode: qrData.bookingCode },
      timestamp: Date.now(),
      version: QR_CACHE_VERSION,
    };
    AsyncStorage.setItem(
      `${QR_CACHE_KEY}:${bookingId}`,
      JSON.stringify(cacheEntry),
    ).catch(() => {});
    setCachedQr(cacheEntry.data);
  }, [qrData, bookingId]);

  // Load cached QR on mount (for offline support)
  useEffect(() => {
    if (!bookingId || !canShowQr) return;
    AsyncStorage.getItem(`${QR_CACHE_KEY}:${bookingId}`)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (
          parsed?.version === QR_CACHE_VERSION &&
          Date.now() - parsed.timestamp < QR_CACHE_EXPIRY_MS
        ) {
          setCachedQr(parsed.data);
        }
      })
      .catch(() => {});
  }, [bookingId, canShowQr]);

  const { data: trips = [] } = useTrips(true);
  const createTripMutation = useCreateTrip();
  const linkBookingToTripMutation = useLinkBookingToTrip();
  const savePlaceMutation = useSavePlace();
  const [selectedTripId, setSelectedTripId] = useState(null);

  const bookingDateYmd = useMemo(() => {
    const raw = String(booking?.useDate || "").slice(0, 10);
    if (raw) return raw;
    return new Date().toISOString().slice(0, 10);
  }, [booking?.useDate]);

  useEffect(() => {
    if (booking?.linkedTrip?.id) {
      setSelectedTripId(booking.linkedTrip.id);
    }
  }, [booking?.linkedTrip?.id]);

  const handleSavePlace = async () => {
    const placeId = Number(booking?.service?.place?.id);
    if (!Number.isInteger(placeId) || placeId <= 0) return;

    try {
      await savePlaceMutation.mutateAsync({ placeId });
      Alert.alert("Đã lưu", "Địa điểm đã được thêm vào danh sách đã lưu.");
    } catch (error) {
      Alert.alert(
        "Không thể lưu địa điểm",
        error?.message || "Vui lòng thử lại sau.",
      );
    }
  };

  const handleLinkBookingToTrip = async (tripId) => {
    const normalizedTripId = Number(tripId);
    if (!Number.isInteger(normalizedTripId) || normalizedTripId <= 0) {
      Alert.alert("Chọn Trip", "Vui lòng chọn một trip hợp lệ để liên kết.");
      return;
    }

    try {
      await linkBookingToTripMutation.mutateAsync({
        bookingId,
        tripId: normalizedTripId,
      });
      await refetch();
      Alert.alert("Thành công", "Booking đã được liên kết vào trip.");
    } catch (error) {
      Alert.alert(
        "Không thể liên kết trip",
        error?.message || "Vui lòng thử lại sau.",
      );
    }
  };

  const handleCreateTripAndLink = async () => {
    try {
      const title = booking?.service?.place?.name
        ? `Trip ${booking.service.place.name} ${bookingDateYmd}`
        : `Trip từ booking ${bookingDateYmd}`;

      const createdTripRes = await createTripMutation.mutateAsync({
        title,
        description: booking?.service?.name
          ? `Tạo từ booking dịch vụ ${booking.service.name}`
          : "Tạo từ booking dịch vụ",
        startDate: bookingDateYmd,
        endDate: bookingDateYmd,
        totalDays: 1,
        groupSize: 1,
      });

      const tripId = Number(createdTripRes?.data?.id || createdTripRes?.id);
      if (!Number.isInteger(tripId) || tripId <= 0) {
        throw {
          message: "Không thể tạo trip mới",
          code: "TRIP_CREATE_FAILED",
        };
      }

      await handleLinkBookingToTrip(tripId);
    } catch (error) {
      Alert.alert(
        "Không thể tạo trip",
        error?.message || "Vui lòng thử lại sau.",
      );
    }
  };

  if (isLoading) {
    return (
      <View
        className="flex-1 bg-[#F5F5F7] items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color={THEME.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View className="flex-1 bg-[#F5F5F7]" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-4 py-[14px] border-b border-b-[#D2D2D7]">
          <Pressable onPress={() => router.back()} className="w-[38px] h-[38px] rounded-xl items-center justify-center bg-white border border-[#D2D2D7]">
            <MaterialIconsRounded name="arrow-back" size={22} color={THEME.text} />
          </Pressable>
          <Text className="text-[19px] text-[#1D1D1F] font-semibold">Chi tiết booking</Text>
          <View className="w-[38px] h-[38px] rounded-xl items-center justify-center bg-white border border-[#D2D2D7]" />
        </View>

        <View className="flex-1 items-center justify-center">
          <Text className="text-[rgba(0,0,0,0.8)] text-[14px] font-medium">Không tìm thấy booking.</Text>
        </View>
      </View>
    );
  }

  const statusMeta = STATUS_META[booking.status] || {
    label: booking.status || "Không xác định",
    color: THEME.text,
    bg: "#ECECEF",
  };
  const placeId = booking?.service?.place?.id;

  return (
    <View className="flex-1 bg-[#F5F5F7]" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-[14px] border-b border-b-[#D2D2D7]">
        <Pressable onPress={() => router.back()} className="w-[38px] h-[38px] rounded-xl items-center justify-center bg-white border border-[#D2D2D7]">
          <MaterialIconsRounded name="arrow-back" size={22} color={THEME.text} />
        </Pressable>
        <Text className="text-[19px] text-[#1D1D1F] font-semibold">Chi tiết booking</Text>
        <Pressable onPress={() => refetch()} className="w-[38px] h-[38px] rounded-xl items-center justify-center bg-white border border-[#D2D2D7]">
          <MaterialIconsRounded name="refresh" size={20} color={THEME.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 26, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
              if (canShowQr) refetchQr();
            }}
            tintColor={THEME.primary}
            colors={[THEME.primary]}
            progressBackgroundColor={THEME.surface}
          />
        }
      >
        <View className="bg-white rounded-[20px] border border-[#D2D2D7] p-[15px]">
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-1">
              <Text className="text-[12px] text-[rgba(0,0,0,0.48)] font-medium">Mã booking</Text>
              <Text className="text-[15px] text-[#1D1D1F] font-semibold">{booking.bookingCode}</Text>
            </View>

            <View
              className="rounded-full px-[10px] py-[5px] border border-[rgba(0,0,0,0.08)]"
              style={{ backgroundColor: statusMeta.bg }}
            >
              <Text className="text-[11px] font-semibold" style={{ color: statusMeta.color }}>
                {statusMeta.label}
              </Text>
            </View>
          </View>

          <Text className="text-[12px] text-[rgba(0,0,0,0.48)] font-medium mt-3">Dịch vụ</Text>
          <Text className="text-[14px] text-[#1D1D1F] font-sans">{booking?.service?.name || "--"}</Text>

          <Text className="text-[12px] text-[rgba(0,0,0,0.48)] font-medium mt-3">Địa điểm</Text>
          <Text className="text-[14px] text-[#1D1D1F] font-sans">
            {booking?.service?.place?.name || "--"}
          </Text>

          <Text className="text-[12px] text-[rgba(0,0,0,0.48)] font-medium mt-3">Thời gian sử dụng</Text>
          <Text className="text-[14px] text-[#1D1D1F] font-sans">{formatDateTime(booking)}</Text>

          <Text className="text-[12px] text-[rgba(0,0,0,0.48)] font-medium mt-3">Tổng thanh toán</Text>
          <Text className="text-[15px] text-[#1D1D1F] font-semibold">
            {formatCurrency(booking?.finalPrice)}
          </Text>
        </View>

        {/* QR Check-in Card */}
        {canShowQr ? (
          <View
            className="bg-white rounded-[20px] border border-[#D2D2D7] p-[18px]"
            style={Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
              },
              android: { elevation: 4 },
            })}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="qr-code" size={18} color={THEME.primary} />
              <Text className="text-[16px] text-[#1D1D1F] font-semibold">Mã QR check-in</Text>
            </View>
            <Text className="mt-[6px] text-[13px] leading-5 text-[rgba(0,0,0,0.8)] font-sans">
              Đưa mã này cho phía doanh nghiệp quét khi bạn đến sử dụng dịch vụ.
            </Text>

            {qrLoading && !activeQrCode ? (
              <View className="mt-5 h-[200px] rounded-2xl bg-[#EDEDF2] items-center justify-center gap-[10px]">
                <ActivityIndicator size="small" color={THEME.primary} />
                <Text className="text-[13px] text-[rgba(0,0,0,0.48)] font-medium">Đang tải mã QR...</Text>
              </View>
            ) : activeQrCode ? (
              <View className="mt-4 items-center relative">
                <Image
                  source={{ uri: activeQrCode }}
                  className="w-[220px] h-[220px] rounded-2xl bg-white border border-[#D2D2D7]"
                  contentFit="contain"
                />
                {/* Offline indicator */}
                {isOffline && (
                  <View className="absolute top-2 right-2 flex-row items-center gap-1 bg-black/60 rounded-full px-2 py-1">
                    <Ionicons name="cloud-offline" size={12} color="#fff" />
                    <Text className="text-white text-[10px] font-semibold">Offline</Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="mt-4 h-40 rounded-2xl bg-[#EDEDF2] items-center justify-center gap-2">
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={THEME.danger}
                />
                <Text className="text-[#FF3B30] text-[13px] font-medium text-center px-4">
                  {qrError?.message || "Chưa tải được mã QR."}
                </Text>
                <Pressable className="mt-1 bg-[#1D1D1F] rounded-full px-4 py-2" onPress={() => refetchQr()}>
                  <Text className="text-white text-[12px] font-semibold">Thử lại</Text>
                </Pressable>
              </View>
            )}

            {/* Booking code below QR */}
            {activeQrCode && (
              <View className="mt-3 self-center bg-[#EDEDF2] rounded-full px-[14px] py-[6px]">
                <Text className="text-[13px] text-[#1D1D1F] font-semibold tracking-[1.5px]">
                  {booking.bookingCode}
                </Text>
              </View>
            )}

            {/* Expired overlay for terminal statuses */}
            {isTerminal && (
              <View
                className="rounded-[20px] bg-white/82 items-center justify-center"
                style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
              >
                <View className="items-center gap-[6px] bg-black/70 rounded-2xl px-5 py-[14px]">
                  <Ionicons
                    name={
                      booking.status === "completed"
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={28}
                    color="#fff"
                  />
                  <Text className="text-white text-[14px] font-semibold">
                    {booking.status === "completed"
                      ? "Đã sử dụng"
                      : statusMeta.label}
                  </Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View
            className="bg-white rounded-[20px] border border-[#D2D2D7] p-[18px]"
            style={Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
              },
              android: { elevation: 4 },
            })}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="qr-code" size={18} color={THEME.textMuted} />
              <Text className="text-[16px] font-semibold" style={{ color: THEME.textMuted }}>
                Mã QR check-in
              </Text>
            </View>
            <View className="mt-4 h-[120px] rounded-2xl bg-[#EDEDF2] items-center justify-center gap-2">
              <Ionicons
                name="time-outline"
                size={32}
                color={THEME.textMuted}
              />
              <Text className="text-[13px] text-[rgba(0,0,0,0.48)] font-sans text-center px-5">
                {isTerminal
                  ? "QR không khả dụng cho booking này."
                  : "QR sẽ xuất hiện khi booking được xác nhận."}
              </Text>
            </View>
          </View>
        )}

        <View className="bg-white rounded-[20px] border border-[#D2D2D7] p-[15px]">
          <Text className="text-[16px] text-[#1D1D1F] font-semibold">Liên kết Trip</Text>
          {booking?.linkedTrip ? (
            <View className="mt-2 gap-[6px]">
              <Text className="text-[15px] text-[#1D1D1F] font-semibold">
                {booking.linkedTrip.title || `Trip #${booking.linkedTrip.id}`}
              </Text>
              <Text className="mt-[6px] text-[13px] leading-5 text-[rgba(0,0,0,0.8)] font-sans">
                Đang ở ngày {booking.linkedTrip.dayNumber || 1} của trip.
              </Text>
              <Pressable
                className="mt-[6px] flex-1 border border-[#D2D2D7] rounded-full py-3 items-center bg-[#EDEDF2]"
                onPress={() => router.push(`/trip/${booking.linkedTrip.id}`)}
              >
                <Text className="text-[rgba(0,0,0,0.8)] text-[14px] font-semibold">Mở trip đã liên kết</Text>
              </Pressable>
            </View>
          ) : (
            <Text className="mt-[6px] text-[13px] leading-5 text-[rgba(0,0,0,0.8)] font-sans">
              Booking này chưa liên kết trip. Bạn có thể chọn trip có sẵn hoặc
              tạo trip mới để thêm địa điểm vào đúng ngày booking.
            </Text>
          )}

          {trips.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, marginTop: 10 }}
            >
              {trips.map((trip) => {
                const selected = Number(selectedTripId) === Number(trip.id);
                return (
                  <Pressable
                    key={trip.id}
                    onPress={() => setSelectedTripId(trip.id)}
                    style={{
                      minWidth: 170,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: selected ? THEME.primary : THEME.border,
                      backgroundColor: selected
                        ? THEME.primaryTint
                        : THEME.surfaceMuted,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                    }}
                  >
                    <Text
                      className="text-[12px] font-semibold"
                      style={{ color: THEME.text }}
                      numberOfLines={1}
                    >
                      {trip.title || `Trip #${trip.id}`}
                    </Text>
                    <Text
                      className="mt-0.5 text-[11px] font-sans"
                      style={{ color: THEME.textMuted }}
                    >
                      {trip.totalDays || 1} ngày
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          <View className="flex-row gap-[10px] mt-3">
            <Pressable
              className="flex-1 border border-[#D2D2D7] rounded-full py-3 items-center bg-[#EDEDF2]"
              onPress={() => handleLinkBookingToTrip(selectedTripId)}
              disabled={linkBookingToTripMutation.isPending || !selectedTripId}
            >
              <Text className="text-[rgba(0,0,0,0.8)] text-[14px] font-semibold">Liên kết trip đã chọn</Text>
            </Pressable>

            <Pressable
              className="flex-1 bg-[#1D1D1F] rounded-full py-3 items-center"
              onPress={handleCreateTripAndLink}
              disabled={
                createTripMutation.isPending ||
                linkBookingToTripMutation.isPending
              }
            >
              <Text className="text-white text-[14px] font-semibold">
                {createTripMutation.isPending ||
                linkBookingToTripMutation.isPending
                  ? "Đang xử lý..."
                  : "Tạo trip và liên kết"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="flex-row gap-[10px]">
          {placeId ? (
            <Pressable
              className="flex-1 border border-[#D2D2D7] rounded-full py-3 items-center bg-[#EDEDF2]"
              onPress={() => router.push(`/place/${placeId}`)}
            >
              <Text className="text-[rgba(0,0,0,0.8)] text-[14px] font-semibold">Xem địa điểm</Text>
            </Pressable>
          ) : null}

          {placeId ? (
            <Pressable
              className="flex-1 bg-[#1D1D1F] rounded-full py-3 items-center"
              onPress={handleSavePlace}
              disabled={savePlaceMutation.isPending}
            >
              <Text className="text-white text-[14px] font-semibold">
                {savePlaceMutation.isPending ? "Đang lưu..." : "Lưu địa điểm"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
