import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import safeAsyncStorage from "../../../src/utils/safeAsyncStorage";
import {
  BOOKING_APPLE_THEME as THEME,
} from "../../../src/constants/design-tokens";
import {
  useMyBookingDetail,
  useMyBookingQR,
  useLinkBookingToTrip,
  useCancelBooking,
} from "../../../src/modules/booking/hooks/useBooking";
import BookingTicketCard from "../../../src/modules/booking/components/BookingTicketCard";
import RefundPolicyModal from "../../../src/modules/booking/components/RefundPolicyModal";
import {
  useCreateTrip,
  useTrips,
} from "../../../src/modules/trips/hooks/useTrips";
import { useSavePlace } from "../../../src/modules/saved/hooks/useSaved";
import { useOffline } from "../../../src/hooks/useOffline";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { formatShortDate, formatDateTimeLocale } from "../../../src/utils/dateFormat";


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

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";
  return `${amount.toLocaleString(locale)}đ`;
};

const formatDateTime = (booking, notDeterminedLabel) => {
  if (booking?.useDate || booking?.useTime) {
    const date = formatShortDate(booking?.useDate) || "--/--/----";
    return `${date} • ${booking?.useTime || "--:--"}`;
  }

  if (booking?.bookingAt) {
    const at = new Date(booking.bookingAt);
    if (!Number.isNaN(at.getTime())) {
      return formatDateTimeLocale(at, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  return notDeterminedLabel || "Not determined";
};

export default function BookingDetailScreen() {
  const { t } = useTranslation();
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

  // Cache QR to safeAsyncStorage when fetched successfully
  useEffect(() => {
    if (!qrData?.qrCode || !bookingId) return;
    const cacheEntry = {
      data: { qrCode: qrData.qrCode, bookingCode: qrData.bookingCode },
      timestamp: Date.now(),
      version: QR_CACHE_VERSION,
    };
    safeAsyncStorage.setItem(
      `${QR_CACHE_KEY}:${bookingId}`,
      JSON.stringify(cacheEntry),
    ).catch(() => {});
    setCachedQr(cacheEntry.data);
  }, [qrData, bookingId]);

  // Load cached QR on mount (for offline support)
  useEffect(() => {
    if (!bookingId || !canShowQr) return;
    safeAsyncStorage.getItem(`${QR_CACHE_KEY}:${bookingId}`)
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

  const { data: trips = [] } = useTrips(!isTerminal);
  const createTripMutation = useCreateTrip();
  const linkBookingToTripMutation = useLinkBookingToTrip();
  const cancelBookingMutation = useCancelBooking();
  const savePlaceMutation = useSavePlace();
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showRefundPolicyModal, setShowRefundPolicyModal] = useState(false);

  const bookingDateYmd = useMemo(() => {
    const raw = String(booking?.useDate || "").slice(0, 10);
    if (raw) return raw;
    return null;
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
      Alert.alert(t("bookingDetail.alerts.saved.title"), t("bookingDetail.alerts.saved.message"));
    } catch (error) {
      Alert.alert(
        t("bookingDetail.alerts.saveFailed.title"),
        error?.message || t("bookingDetail.alerts.saveFailed.message"),
      );
    }
  };

  const handleLinkBookingToTrip = async (tripId) => {
    const normalizedTripId = Number(tripId);
    if (!Number.isInteger(normalizedTripId) || normalizedTripId <= 0) {
      Alert.alert(t("bookingDetail.alerts.selectTrip.title"), t("bookingDetail.alerts.selectTrip.message"));
      return;
    }

    try {
      await linkBookingToTripMutation.mutateAsync({
        bookingId,
        tripId: normalizedTripId,
      });
      await refetch();
      Alert.alert(t("bookingDetail.alerts.linkSuccess.title"), t("bookingDetail.alerts.linkSuccess.message"));
    } catch (error) {
      Alert.alert(
        t("bookingDetail.alerts.linkFailed.title"),
        error?.message || t("bookingDetail.alerts.linkFailed.message"),
      );
    }
  };

  const handleCreateTripAndLink = async () => {
    try {
      const title = booking?.service?.place?.name
        ? `Trip ${booking.service.place.name} ${bookingDateYmd}`
        : t("bookingDetail.tripFromBooking", { date: bookingDateYmd });

      const createdTripRes = await createTripMutation.mutateAsync({
        title,
        description: booking?.service?.name
          ? t("bookingDetail.tripDescription.withService", { service: booking.service.name })
          : t("bookingDetail.tripDescription.default"),
        startDate: bookingDateYmd,
        endDate: bookingDateYmd,
        totalDays: 1,
        groupSize: 1,
      });

      const tripId = Number(createdTripRes?.data?.id || createdTripRes?.id);
      if (!Number.isInteger(tripId) || tripId <= 0) {
        throw {
          message: t("bookingDetail.errors.tripCreateFailed"),
          code: "TRIP_CREATE_FAILED",
        };
      }

      await handleLinkBookingToTrip(tripId);
    } catch (error) {
      Alert.alert(
        t("bookingDetail.errors.tripCreateTitle"),
        error?.message || t("bookingDetail.errors.generic"),
      );
    }
  };

  const handleRetryPayment = () => {
    setIsRetrying(true);
    try {
      router.replace(`/payment/checkout?bookingId=${bookingId}`);
    } catch {
      setIsRetrying(false);
    }
    // Reset after 3s in case navigation doesn't complete
    setTimeout(() => setIsRetrying(false), 3000);
  };

  const handleCancelBooking = async ({ cancelReason }) => {
    try {
      await cancelBookingMutation.mutateAsync({ bookingId, cancelReason });
      setShowRefundPolicyModal(false);
      await refetch();
      Alert.alert(
        t("bookingDetail.cancel.alertSuccessTitle"),
        t("bookingDetail.cancel.alertSuccessMessage"),
      );
    } catch (error) {
      Alert.alert(
        t("bookingDetail.cancel.alertErrorTitle"),
        error?.message || t("bookingDetail.cancel.alertErrorMessage"),
      );
    }
  };

  const paymentStatusConfig = (() => {
    const refundReason = booking?.payment?.refundReason || null;
    const isRejected = refundReason?.startsWith("REJECTED:");
    const rejectedReason = isRejected
      ? refundReason.replace(/^REJECTED:/, "").trim()
      : null;

    if (isRejected) {
      return {
        tone: { bg: "#FEF2F2", border: "#FECACA", iconBg: "#FEE2E2", icon: "#DC2626" },
        icon: "close-circle-outline",
        title: t("bookingDetail.payment.refundRejected"),
        description: rejectedReason || t("bookingDetail.payment.refundRejectedDesc"),
      };
    }

    if (booking?.paymentStatus === "fully_refunded") {
      return {
        tone: { bg: "#ECFDF5", border: "#A7F3D0", iconBg: "#D1FAE5", icon: "#059669" },
        icon: "checkmark-circle-outline",
        title: t("bookingDetail.payment.refunded"),
        description: t("bookingDetail.payment.refundedDesc"),
      };
    }

    if (booking?.paymentStatus === "partially_refunded") {
      return {
        tone: { bg: "#EFF6FF", border: "#BFDBFE", iconBg: "#DBEAFE", icon: "#2563EB" },
        icon: "swap-horizontal-outline",
        title: t("bookingDetail.payment.partialRefund"),
        description: t("bookingDetail.payment.partialRefundDesc"),
      };
    }

    if (booking?.paymentStatus === "paid") {
      return {
        tone: { bg: "#F9FAFB", border: "#E5E7EB", iconBg: "#F3F4F6", icon: "#111827" },
        icon: "card-outline",
        title: t("bookingDetail.payment.paid"),
        description: t("bookingDetail.payment.paidDesc"),
      };
    }

    return null;
  })();

  const canCancelBooking =
    ["pending", "confirmed"].includes(booking?.status) &&
    !cancelBookingMutation.isPending;

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
          <Text className="text-[19px] text-[#1D1D1F] font-semibold">{t("bookingDetail.title")}</Text>
          <View className="w-[38px] h-[38px] rounded-xl items-center justify-center bg-white border border-[#D2D2D7]" />
        </View>

        <View className="flex-1 items-center justify-center">
          <Text className="text-[rgba(0,0,0,0.8)] text-[14px] font-medium">{t("bookingDetail.notFound")}</Text>
        </View>
      </View>
    );
  }

  const placeId = booking?.service?.place?.id;

  return (
    <View className="flex-1 bg-[#F5F5F7]" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-[14px] border-b border-b-[#D2D2D7]">
        <Pressable onPress={() => router.back()} className="w-[38px] h-[38px] rounded-xl items-center justify-center bg-white border border-[#D2D2D7]">
          <MaterialIconsRounded name="arrow-back" size={22} color={THEME.text} />
        </Pressable>
        <Text className="text-[19px] text-[#1D1D1F] font-semibold">{t("bookingDetail.title")}</Text>
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
        <BookingTicketCard
          booking={booking}
          qrCode={activeQrCode}
          qrLoading={qrLoading}
          qrError={qrError}
          offline={isOffline}
          variant="detail"
        />

        {canCancelBooking ? (
          <Pressable
            className="rounded-full border border-[#FCA5A5] bg-[#FEF2F2] py-3 items-center"
            onPress={() => setShowRefundPolicyModal(true)}
          >
            <Text className="text-[#DC2626] text-[14px] font-semibold">
              {t("bookingDetail.cancel.cta")}
            </Text>
          </Pressable>
        ) : null}

        {paymentStatusConfig ? (
          <View
            style={{
              backgroundColor: paymentStatusConfig.tone.bg,
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: paymentStatusConfig.tone.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor: paymentStatusConfig.tone.iconBg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={paymentStatusConfig.icon}
                  size={20}
                  color={paymentStatusConfig.tone.icon}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#1D1D1F", fontSize: 14, fontWeight: "700" }}>
                  {paymentStatusConfig.title}
                </Text>
                <Text
                  style={{
                    color: "rgba(0,0,0,0.62)",
                    fontSize: 12,
                    marginTop: 4,
                    lineHeight: 18,
                  }}
                >
                  {paymentStatusConfig.description}
                </Text>
                {booking?.payment?.refundAmount ? (
                  <Text style={{ color: "#111827", fontSize: 13, fontWeight: "600", marginTop: 10 }}>
                    {t("bookingDetail.payment.refundAmount")}: {formatCurrency(booking.payment.refundAmount)}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}

        <View className="bg-white rounded-[20px] border border-[#D2D2D7] p-[15px]">
          <Text className="text-[16px] text-[#1D1D1F] font-semibold">{t("bookingDetail.linkTrip")}</Text>
          {booking?.linkedTrip ? (
            <View className="mt-2 gap-[6px]">
              <Text className="text-[15px] text-[#1D1D1F] font-semibold">
                {booking.linkedTrip.title || `Trip #${booking.linkedTrip.id}`}
              </Text>
              <Text className="mt-[6px] text-[13px] leading-5 text-[rgba(0,0,0,0.8)] font-sans">
                {t("bookingDetail.currentTripDay", { day: booking.linkedTrip.dayNumber || 1 })}
              </Text>
              <Pressable
                className="mt-[6px] flex-1 border border-[#D2D2D7] rounded-full py-3 items-center bg-[#EDEDF2]"
                onPress={() => router.push(`/trip/${booking.linkedTrip.id}`)}
              >
                <Text className="text-[rgba(0,0,0,0.8)] text-[14px] font-semibold">{t("bookingDetail.openLinkedTrip")}</Text>
              </Pressable>
            </View>
          ) : (
            <Text className="mt-[6px] text-[13px] leading-5 text-[rgba(0,0,0,0.8)] font-sans">
              {t("bookingDetail.noLinkedTripDesc")}
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
                      {t("bookingDetail.daysCount", { count: trip.totalDays || 1 })}
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
              <Text className="text-[rgba(0,0,0,0.8)] text-[14px] font-semibold">{t("bookingDetail.linkSelectedTrip")}</Text>
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
                  ? t("common.processing")
                  : t("bookingDetail.createTripAndLink")}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Payment retry — shown when booking is pending and explicitly unpaid */}
        {booking?.status === "pending" &&
        booking?.paymentStatus === "unpaid" ? (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: "#D2D2D7",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: "#FEF9C3",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIconsRounded name="payment" size={20} color="#CA8A04" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#1D1D1F", fontSize: 14, fontWeight: "700" }}>
                  {t("bookingDetail.payment.unpaid")}
                </Text>
                <Text style={{ color: "rgba(0,0,0,0.48)", fontSize: 12, marginTop: 2 }}>
                  {t("bookingDetail.payment.unpaidDesc")}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleRetryPayment}
              disabled={isRetrying}
              style={{
                backgroundColor: "#1D1D1F",
                borderRadius: 999,
                paddingVertical: 12,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {isRetrying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIconsRounded name="qr-code" size={16} color="#FFFFFF" />
              )}
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
                {isRetrying ? t("bookingDetail.payment.redirecting") : t("bookingDetail.payment.payNow")}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View className="flex-row gap-[10px]">
          {placeId ? (
            <Pressable
              className="flex-1 border border-[#D2D2D7] rounded-full py-3 items-center bg-[#EDEDF2]"
              onPress={() => router.push(`/place/${placeId}`)}
            >
              <Text className="text-[rgba(0,0,0,0.8)] text-[14px] font-semibold">{t("bookingDetail.viewPlace")}</Text>
            </Pressable>
          ) : null}

          {placeId ? (
            <Pressable
              className="flex-1 bg-[#1D1D1F] rounded-full py-3 items-center"
              onPress={handleSavePlace}
              disabled={savePlaceMutation.isPending}
            >
              <Text className="text-white text-[14px] font-semibold">
                {savePlaceMutation.isPending ? t("common.saving") : t("bookingDetail.savePlace")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <RefundPolicyModal
        visible={showRefundPolicyModal}
        onClose={() => setShowRefundPolicyModal(false)}
        onConfirm={handleCancelBooking}
        booking={booking}
        isLoading={cancelBookingMutation.isPending}
      />
    </View>
  );
}
