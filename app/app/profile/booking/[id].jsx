import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
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

const formatDateTime = (booking) => {
  if (booking?.useDate || booking?.useTime) {
    const date = booking?.useDate
      ? new Date(booking.useDate).toLocaleDateString("vi-VN")
      : "--/--/----";
    return `${date} • ${booking?.useTime || "--:--"}`;
  }

  if (booking?.bookingAt) {
    const at = new Date(booking.bookingAt);
    if (!Number.isNaN(at.getTime())) {
      return at.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
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
        style={[styles.screen, styles.centerWrap, { paddingTop: insets.top }]}
      >
        <ActivityIndicator size="large" color={THEME.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={22} color={THEME.text} />
          </Pressable>
          <Text style={styles.title}>Chi tiết booking</Text>
          <View style={styles.iconBtn} />
        </View>

        <View style={styles.centerWrap}>
          <Text style={styles.emptyText}>Không tìm thấy booking.</Text>
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
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={22} color={THEME.text} />
        </Pressable>
        <Text style={styles.title}>Chi tiết booking</Text>
        <Pressable onPress={() => refetch()} style={styles.iconBtn}>
          <MaterialIcons name="refresh" size={20} color={THEME.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
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
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Mã booking</Text>
              <Text style={styles.valueBold}>{booking.bookingCode}</Text>
            </View>

            <View
              style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}
            >
              <Text
                style={[styles.statusBadgeText, { color: statusMeta.color }]}
              >
                {statusMeta.label}
              </Text>
            </View>
          </View>

          <Text style={[styles.label, styles.mt12]}>Dịch vụ</Text>
          <Text style={styles.value}>{booking?.service?.name || "--"}</Text>

          <Text style={[styles.label, styles.mt12]}>Địa điểm</Text>
          <Text style={styles.value}>
            {booking?.service?.place?.name || "--"}
          </Text>

          <Text style={[styles.label, styles.mt12]}>Thời gian sử dụng</Text>
          <Text style={styles.value}>{formatDateTime(booking)}</Text>

          <Text style={[styles.label, styles.mt12]}>Tổng thanh toán</Text>
          <Text style={styles.valueBold}>
            {formatCurrency(booking?.finalPrice)}
          </Text>
        </View>

        {/* QR Check-in Card */}
        {canShowQr ? (
          <View style={[styles.card, styles.qrCard]}>
            <View style={styles.qrHeaderRow}>
              <Ionicons name="qr-code" size={18} color={THEME.primary} />
              <Text style={styles.qrTitle}>Mã QR check-in</Text>
            </View>
            <Text style={styles.qrHint}>
              Đưa mã này cho phía doanh nghiệp quét khi bạn đến sử dụng dịch vụ.
            </Text>

            {qrLoading && !activeQrCode ? (
              <View style={styles.qrLoadingContainer}>
                <ActivityIndicator size="small" color={THEME.primary} />
                <Text style={styles.qrLoadingText}>Đang tải mã QR...</Text>
              </View>
            ) : activeQrCode ? (
              <View style={styles.qrImageWrapper}>
                <Image
                  source={{ uri: activeQrCode }}
                  style={styles.qrImage}
                  contentFit="contain"
                />
                {/* Offline indicator */}
                {isOffline && (
                  <View style={styles.qrOfflineTag}>
                    <Ionicons name="cloud-offline" size={12} color="#fff" />
                    <Text style={styles.qrOfflineTagText}>Offline</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.qrErrorContainer}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={THEME.danger}
                />
                <Text style={styles.qrErrorText}>
                  {qrError?.message || "Chưa tải được mã QR."}
                </Text>
                <Pressable style={styles.qrRetryBtn} onPress={() => refetchQr()}>
                  <Text style={styles.qrRetryBtnText}>Thử lại</Text>
                </Pressable>
              </View>
            )}

            {/* Booking code below QR */}
            {activeQrCode && (
              <View style={styles.qrCodeLabel}>
                <Text style={styles.qrCodeLabelText}>
                  {booking.bookingCode}
                </Text>
              </View>
            )}

            {/* Expired overlay for terminal statuses */}
            {isTerminal && (
              <View style={styles.qrOverlay}>
                <View style={styles.qrOverlayBadge}>
                  <Ionicons
                    name={
                      booking.status === "completed"
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={28}
                    color="#fff"
                  />
                  <Text style={styles.qrOverlayText}>
                    {booking.status === "completed"
                      ? "Đã sử dụng"
                      : statusMeta.label}
                  </Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.card, styles.qrCard]}>
            <View style={styles.qrHeaderRow}>
              <Ionicons name="qr-code" size={18} color={THEME.textMuted} />
              <Text style={[styles.qrTitle, { color: THEME.textMuted }]}>
                Mã QR check-in
              </Text>
            </View>
            <View style={styles.qrPlaceholder}>
              <Ionicons
                name="time-outline"
                size={32}
                color={THEME.textMuted}
              />
              <Text style={styles.qrPlaceholderText}>
                {isTerminal
                  ? "QR không khả dụng cho booking này."
                  : "QR sẽ xuất hiện khi booking được xác nhận."}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.qrTitle}>Liên kết Trip</Text>
          {booking?.linkedTrip ? (
            <View style={{ marginTop: 8, gap: 6 }}>
              <Text style={styles.valueBold}>
                {booking.linkedTrip.title || `Trip #${booking.linkedTrip.id}`}
              </Text>
              <Text style={styles.qrHint}>
                Đang ở ngày {booking.linkedTrip.dayNumber || 1} của trip.
              </Text>
              <Pressable
                style={[styles.outlineBtn, { marginTop: 6 }]}
                onPress={() => router.push(`/trip/${booking.linkedTrip.id}`)}
              >
                <Text style={styles.outlineBtnText}>Mở trip đã liên kết</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={[styles.qrHint, { marginTop: 6 }]}>
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
                      style={{
                        color: THEME.text,
                        fontSize: 12,
                        fontFamily: TOKENS.font.semibold,
                      }}
                      numberOfLines={1}
                    >
                      {trip.title || `Trip #${trip.id}`}
                    </Text>
                    <Text
                      style={{
                        marginTop: 2,
                        color: THEME.textMuted,
                        fontSize: 11,
                        fontFamily: TOKENS.font.regular,
                      }}
                    >
                      {trip.totalDays || 1} ngày
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <Pressable
              style={styles.outlineBtn}
              onPress={() => handleLinkBookingToTrip(selectedTripId)}
              disabled={linkBookingToTripMutation.isPending || !selectedTripId}
            >
              <Text style={styles.outlineBtnText}>Liên kết trip đã chọn</Text>
            </Pressable>

            <Pressable
              style={styles.primaryBtn}
              onPress={handleCreateTripAndLink}
              disabled={
                createTripMutation.isPending ||
                linkBookingToTripMutation.isPending
              }
            >
              <Text style={styles.primaryBtnText}>
                {createTripMutation.isPending ||
                linkBookingToTripMutation.isPending
                  ? "Đang xử lý..."
                  : "Tạo trip và liên kết"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.actionRow}>
          {placeId ? (
            <Pressable
              style={styles.outlineBtn}
              onPress={() => router.push(`/place/${placeId}`)}
            >
              <Text style={styles.outlineBtnText}>Xem địa điểm</Text>
            </Pressable>
          ) : null}

          {placeId ? (
            <Pressable
              style={styles.primaryBtn}
              onPress={handleSavePlace}
              disabled={savePlaceMutation.isPending}
            >
              <Text style={styles.primaryBtnText}>
                {savePlaceMutation.isPending ? "Đang lưu..." : "Lưu địa điểm"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: THEME.textSecondary,
    fontSize: 14,
    fontFamily: TOKENS.font.medium,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  title: {
    fontSize: 19,
    color: THEME.text,
    fontFamily: TOKENS.font.semibold,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 26,
    gap: 12,
  },
  card: {
    backgroundColor: THEME.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 15,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: THEME.borderSoft,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  label: {
    fontSize: 12,
    color: THEME.textMuted,
    fontFamily: TOKENS.font.medium,
  },
  value: {
    fontSize: 14,
    color: THEME.text,
    fontFamily: TOKENS.font.regular,
  },
  valueBold: {
    fontSize: 15,
    color: THEME.text,
    fontFamily: TOKENS.font.semibold,
  },
  mt12: {
    marginTop: 12,
  },
  qrCard: {
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
    }),
  },
  qrHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qrTitle: {
    fontSize: 16,
    color: THEME.text,
    fontFamily: TOKENS.font.semibold,
  },
  qrHint: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: THEME.textSecondary,
    fontFamily: TOKENS.font.regular,
  },
  qrLoadingContainer: {
    marginTop: 20,
    height: 200,
    borderRadius: 16,
    backgroundColor: THEME.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  qrLoadingText: {
    fontSize: 13,
    color: THEME.textMuted,
    fontFamily: TOKENS.font.medium,
  },
  qrImageWrapper: {
    marginTop: 16,
    alignItems: "center",
    position: "relative",
  },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: 16,
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  qrOfflineTag: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qrOfflineTagText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: TOKENS.font.semibold,
  },
  qrCodeLabel: {
    marginTop: 12,
    alignSelf: "center",
    backgroundColor: THEME.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  qrCodeLabelText: {
    fontSize: 13,
    color: THEME.text,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 1.5,
  },
  qrOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.82)",
    alignItems: "center",
    justifyContent: "center",
  },
  qrOverlayBadge: {
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  qrOverlayText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
  qrErrorContainer: {
    marginTop: 16,
    height: 160,
    borderRadius: 16,
    backgroundColor: THEME.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  qrErrorText: {
    color: THEME.danger,
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  qrRetryBtn: {
    marginTop: 4,
    backgroundColor: THEME.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  qrRetryBtnText: {
    color: THEME.white,
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
  },
  qrPlaceholder: {
    marginTop: 16,
    height: 120,
    borderRadius: 16,
    backgroundColor: THEME.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  qrPlaceholderText: {
    fontSize: 13,
    color: THEME.textMuted,
    fontFamily: TOKENS.font.regular,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: THEME.primary,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    color: THEME.white,
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: THEME.surfaceMuted,
  },
  outlineBtnText: {
    color: THEME.textSecondary,
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
});
