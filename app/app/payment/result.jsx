import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { getMyBookingDetailApi } from "@/modules/booking/api/bookingApi";
import { formatPriceLocale, formatLongDate } from "../../src/utils/dateFormat";

const THEME = {
  background: "#F5F5F7",
  surface: "#FFFFFF",
  primary: "#1D1D1F",
  text: "#1D1D1F",
  textSecondary: "rgba(0,0,0,0.48)",
  textMuted: "rgba(0,0,0,0.36)",
  border: "#D2D2D7",
  white: "#FFFFFF",
};

const METHOD_LABELS = {
  VNPAY: "VNPAY",
  MOMO: "MoMo",
};

const formatPrice = (price) => {
  if (price == null) return "—";
  return formatPriceLocale(price);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return formatLongDate(dateStr) || "—";
};

const STATUS_CONFIG = {
  success: {
    iconBg: "#DCFCE7",
    iconColor: "#16A34A",
    iconName: "check-circle",
    title: "Thanh toán thành công",
    subtitleSuccess: "Cảm ơn bạn! Đơn hàng đã được thanh toán thành công.",
    subtitleExpired: "Đơn hàng đã quá hạn 15 phút, dòng tiền sẽ được hoàn trả trong 24h.",
    primaryLabel: "Xem chi tiết",
    secondaryLabel: "Về trang chủ",
  },
  failed: {
    iconBg: "#FEE2E2",
    iconColor: "#DC2626",
    iconName: "cancel",
    title: "Thanh toán thất bại",
    subtitleSuccess: "Giao dịch không thành công. Vui lòng thử lại.",
    subtitleExpired: "Đơn hàng đã quá hạn 15 phút. Vui lòng đặt lại.",
    primaryLabel: "Thanh toán lại",
    secondaryLabel: "Về trang chủ",
  },
  pending_verify: {
    iconBg: "#FEF9C3",
    iconColor: "#CA8A04",
    iconName: "schedule",
    title: "Đang xác nhận giao dịch",
    subtitleSuccess: "Hệ thống đang xác nhận giao dịch. Vui lòng đợi trong giây lát.",
    primaryLabel: "Kiểm tra lại",
    secondaryLabel: "Về trang chủ",
  },
};

function InfoRow({ icon, label, value, valueColor, valueBold }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}>
      <MaterialIconsRounded name={icon} size={18} color={THEME.textMuted} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ color: THEME.textMuted, fontSize: 12 }}>{label}</Text>
        <Text
          style={{
            color: valueColor || THEME.text,
            fontSize: 14,
            fontWeight: valueBold ? "700" : "500",
            marginTop: 2,
          }}
          numberOfLines={2}
        >
          {value || "—"}
        </Text>
      </View>
    </View>
  );
}

function BookingInfoCard({ booking }) {
  const service = booking?.service;
  const payment = booking?.payment;

  const methodInfo = payment?.paymentMethod
    ? METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod
    : null;

  return (
    <View
      style={{
        backgroundColor: THEME.surface,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: THEME.border,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: THEME.border,
          marginBottom: 4,
        }}
      >
        {service?.thumbnail ? (
          <Image
            source={{ uri: service.thumbnail }}
            style={{ width: 52, height: 52, borderRadius: 12 }}
          />
        ) : (
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              backgroundColor: "#F0F0F0",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIconsRounded name="image" size={24} color={THEME.textMuted} />
          </View>
        )}
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text
            style={{ color: THEME.text, fontSize: 16, fontWeight: "700", lineHeight: 22 }}
            numberOfLines={2}
          >
            {service?.name || "—"}
          </Text>
          {service?.place?.name ? (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3 }}>
              <MaterialIconsRounded name="place" size={13} color={THEME.textMuted} />
              <Text
                style={{ color: THEME.textMuted, fontSize: 12, marginLeft: 3 }}
                numberOfLines={1}
              >
                {service.place.name}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Info rows */}
      <View style={{ paddingTop: 4 }}>
        <InfoRow
          icon="qr-code"
          label="Mã đơn hàng"
          value={booking?.bookingCode || `#${booking?.id}`}
          valueBold
        />

        {booking?.useDate ? (
          <InfoRow
            icon="event"
            label="Ngày sử dụng"
            value={formatDate(booking.useDate)}
          />
        ) : null}

        {booking?.useTime ? (
          <InfoRow
            icon="schedule"
            label="Giờ sử dụng"
            value={booking.useTime}
          />
        ) : null}

        {booking?.quantity != null ? (
          <InfoRow
            icon="people"
            label="Số lượng"
            value={`${booking.quantity} người`}
          />
        ) : null}

        {booking?.guestName ? (
          <InfoRow
            icon="person"
            label="Tên khách"
            value={booking.guestName}
          />
        ) : null}

        {methodInfo ? (
          <InfoRow
            icon="account-balance-wallet"
            label="Phương thức"
            value={methodInfo}
          />
        ) : null}
      </View>

      {/* Amount */}
      {booking?.finalPrice != null && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 14,
            marginTop: 4,
            borderTopWidth: 1,
            borderTopColor: THEME.border,
          }}
        >
          <Text style={{ color: THEME.textSecondary, fontSize: 14, fontWeight: "600" }}>
            Số tiền thanh toán
          </Text>
          <Text
            style={{
              color: THEME.primary,
              fontSize: 20,
              fontWeight: "800",
              fontVariant: ["tabular-nums"],
            }}
          >
            {formatPrice(booking.finalPrice)}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function PaymentResultScreen() {
  const { status, bookingId, reason } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isChecking, setIsChecking] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [booking, setBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(true);

  const isExpired = reason === "expired";

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      router.replace("/");
      return true;
    });
    return () => backHandler.remove();
  }, [router]);

  useEffect(() => {
    if (!bookingId) {
      setLoadingBooking(false);
      return;
    }
    let cancelled = false;
    setLoadingBooking(true);
    getMyBookingDetailApi(bookingId)
      .then((res) => {
        if (!cancelled) setBooking(res?.data || res);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingBooking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  useEffect(() => {
    if (status) setCurrentStatus(status);
  }, [status]);

  const handleRecheck = async () => {
    if (!bookingId) return;
    setIsChecking(true);
    try {
      const res = await getMyBookingDetailApi(bookingId);
      const data = res?.data ?? res;
      const paymentStatus = data?.payment?.status || data?.paymentStatus;

      if (paymentStatus === "paid") {
        setCurrentStatus("success");
        setBooking(data);
      } else if (paymentStatus === "failed" || paymentStatus === "fully_refunded") {
        setCurrentStatus("failed");
        setBooking(data);
      } else {
        Alert.alert(
          "Đang xác nhận",
          "Hệ thống vẫn đang xử lý giao dịch. Vui lòng thử lại sau ít phút."
        );
      }
    } catch {
      Alert.alert("Lỗi", "Không thể kiểm tra trạng thái. Vui lòng thử lại.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleViewDetails = () => {
    router.replace(`/profile/booking/${bookingId}`);
  };

  const handleGoHome = () => {
    router.replace("/");
  };

  const handleRetryPayment = () => {
    router.replace(`/payment/checkout?bookingId=${bookingId}`);
  };

  const config = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending_verify;
  const subtitle =
    isExpired && config.subtitleExpired
      ? config.subtitleExpired
      : config.subtitleSuccess || config.subtitle;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <View
        style={{
          flex: 1,
          backgroundColor: THEME.background,
          paddingTop: insets.top,
        }}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Icon */}
          <View
            style={{
              alignItems: "center",
              paddingTop: 32,
              paddingBottom: 20,
            }}
          >
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: config.iconBg,
                alignItems: "center",
                justifyContent: "center",
                ...Platform.select({
                  ios: {
                    shadowColor: config.iconColor,
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.25,
                    shadowRadius: 24,
                  },
                  android: { elevation: 8 },
                }),
              }}
            >
              <MaterialIconsRounded
                name={config.iconName}
                size={44}
                color={config.iconColor}
              />
            </View>
            <Text
              style={{
                color: THEME.text,
                fontSize: 22,
                fontWeight: "800",
                textAlign: "center",
                marginTop: 18,
                marginBottom: 8,
              }}
            >
              {config.title}
            </Text>
            <Text
              style={{
                color: THEME.textSecondary,
                fontSize: 13,
                textAlign: "center",
                lineHeight: 20,
                paddingHorizontal: 16,
              }}
            >
              {subtitle}
            </Text>
          </View>

          {/* Booking Info Card */}
          {loadingBooking ? (
            <View
              style={{
                height: 160,
                borderRadius: 20,
                backgroundColor: THEME.surface,
                borderWidth: 1,
                borderColor: THEME.border,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <ActivityIndicator size="small" color={THEME.textMuted} />
            </View>
          ) : (
            <View style={{ marginBottom: 20 }}>
              <BookingInfoCard booking={booking} />
            </View>
          )}

          {/* Primary Action */}
          <Pressable
            onPress={
              currentStatus === "success"
                ? handleViewDetails
                : currentStatus === "failed"
                ? handleRetryPayment
                : handleRecheck
            }
            disabled={config.primaryLabel === "Kiểm tra lại" && isChecking}
            style={{
              backgroundColor: THEME.primary,
              borderRadius: 22,
              paddingVertical: 16,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              shadowColor: THEME.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            {isChecking ? (
              <ActivityIndicator size="small" color={THEME.white} />
            ) : null}
            <Text
              style={{
                color: THEME.white,
                fontSize: 15,
                fontWeight: "800",
              }}
            >
              {isChecking ? "Đang kiểm tra..." : config.primaryLabel}
            </Text>
          </Pressable>

          {/* Secondary Action */}
          <Pressable
            onPress={handleGoHome}
            style={{
              borderRadius: 22,
              paddingVertical: 14,
              alignItems: "center",
              marginTop: 10,
              borderWidth: 1,
              borderColor: THEME.border,
              backgroundColor: THEME.surface,
            }}
          >
            <Text
              style={{
                color: THEME.textSecondary,
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {config.secondaryLabel}
            </Text>
          </Pressable>

          {/* Hotline hint */}
          <View style={{ marginTop: 28 }}>
            <Text
              style={{
                textAlign: "center",
                color: THEME.textMuted,
                fontSize: 11,
                lineHeight: 16,
              }}
            >
              Nếu cần hỗ trợ, liên hệ hotline hoặc chat với chúng tôi qua ứng dụng.
            </Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
