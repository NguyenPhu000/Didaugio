import { useEffect, useState, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import safeAsyncStorage from "../../src/utils/safeAsyncStorage";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useCheckout, usePollPaymentStatus, PENDING_PAYMENT_REF_KEY, PENDING_PAYMENT_BOOKING_KEY } from "@/modules/booking/hooks/usePayment";
import { getMyBookingDetailApi } from "@/modules/booking/api/bookingApi";
import { OrderSummary } from "@/modules/booking/components/OrderSummary";
import { PaymentMethodSelector } from "@/modules/booking/components/PaymentMethodSelector";

const BOOKING_THEME = {
  background: "#F5F5F7",
  surface: "#FFFFFF",
  primary: "#1D1D1F",
  border: "#D2D2D7",
  text: "#1D1D1F",
  textSecondary: "rgba(0,0,0,0.48)",
  textMuted: "rgba(0,0,0,0.36)",
  primaryTint: "rgba(29,29,31,0.08)",
  white: "#FFFFFF",
};

const PAYMENT_EXPIRY_MINUTES = 15;
const PAYMENT_EXPIRY_MS = PAYMENT_EXPIRY_MINUTES * 60 * 1000;

const getLocale = () => "vi-VN";

const formatCountdown = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const formatPrice = (price) => {
  if (price == null) return "—";
  return new Intl.NumberFormat(getLocale(), {
    style: "currency",
    currency: "VND",
  }).format(price);
};

export default function PaymentCheckoutScreen() {
  const { bookingId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [booking, setBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState("VNPAY");
  const [timeLeft, setTimeLeft] = useState(PAYMENT_EXPIRY_MINUTES * 60);
  const [isExpired, setIsExpired] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [serverOffset, setServerOffset] = useState(0);

  const checkoutMutation = useCheckout();
  const { startPolling } = usePollPaymentStatus();
  const momoPaymentRef = useRef(null);

  const loadBooking = useCallback(async () => {
    if (!bookingId) return;
    try {
      setLoadingBooking(true);
      const res = await getMyBookingDetailApi(bookingId);
      const data = res?.data || res;
      setBooking(data);

      const now = Date.now();
      const serverTime = data?.serverTime ? new Date(data.serverTime).getTime() : now;
      const offset = serverTime - now;
      setServerOffset(offset);

      const createdAt = data?.createdAt ? new Date(data.createdAt).getTime() : now;
      const elapsed = now + offset - createdAt;
      const remaining = Math.max(0, Math.ceil((PAYMENT_EXPIRY_MS - elapsed) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) setIsExpired(true);
    } catch (err) {
      Alert.alert("Lỗi", err?.message || "Không thể tải thông tin đơn hàng");
    } finally {
      setLoadingBooking(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  useEffect(() => {
    if (isExpired) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isExpired]);

  // Handle return from MoMo app: start polling when app resumes after deeplink
  useEffect(() => {
    const handleAppState = (nextState) => {
      if (nextState === "active" && momoPaymentRef.current) {
        const { transactionRef, paymentId, bookingId: bid } = momoPaymentRef.current;
        momoPaymentRef.current = null;
        startPolling(transactionRef, paymentId, bid);
      }
    };
    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, [startPolling]);

  const handleCheckout = async () => {
    if (isProcessing || isExpired || !selectedMethod || !bookingId) return;
    setIsProcessing(true);

    try {
      const res = await checkoutMutation.mutateAsync({
        bookingId: Number(bookingId),
        paymentMethod: selectedMethod,
        clientType: "mobile",
        ipAddress: "127.0.0.1",
      });

      const paymentData = res?.data ?? res;
      const paymentUrl = paymentData?.paymentUrl;
      const deeplink = paymentData?.deeplink;
      const transactionRef = paymentData?.transactionRef;
      const paymentId = paymentData?.paymentId;

      if (!paymentUrl) {
        throw new Error("Không nhận được liên kết thanh toán");
      }

      // Save BEFORE opening browser/app (may freeze JS)
      try {
        await safeAsyncStorage.setItem(PENDING_PAYMENT_REF_KEY, transactionRef || "");
        await safeAsyncStorage.setItem(PENDING_PAYMENT_BOOKING_KEY, String(bookingId));
      } catch (storageErr) {
        console.warn("[checkout] safeAsyncStorage write failed:", storageErr);
      }

      // MoMo: open native app via deeplink if available
      if (selectedMethod === "MOMO" && deeplink) {
        const canOpen = await Linking.canOpenURL(deeplink);
        if (canOpen) {
          momoPaymentRef.current = { transactionRef, paymentId, bookingId };
          await Linking.openURL(deeplink);
          // Polling will start when app resumes (see AppState listener)
          return;
        }
        // MoMo app not installed — fall through to WebBrowser with payUrl
      }

      const browserResult = await WebBrowser.openBrowserAsync(paymentUrl, {
        toolbarColor: "#1D1D1F",
        controlsColor: "#1D1D1F",
        dismissButtonStyle: "close",
      });

      // Only start polling if user didn't cancel
      if (browserResult.type === "cancel" || browserResult.type === "dismiss") {
        setIsProcessing(false);
        try {
          await safeAsyncStorage.multiRemove([PENDING_PAYMENT_REF_KEY, PENDING_PAYMENT_BOOKING_KEY]);
        } catch {
          // Ignore
        }
        return;
      }

      startPolling(transactionRef, paymentId, bookingId);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Thanh toán thất bại";
      Alert.alert("Lỗi thanh toán", msg);
      try {
        await safeAsyncStorage.multiRemove([PENDING_PAYMENT_REF_KEY, PENDING_PAYMENT_BOOKING_KEY]);
      } catch {
        // Ignore
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayLater = () => {
    router.replace("/profile/bookings");
  };

  if (loadingBooking) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: BOOKING_THEME.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={BOOKING_THEME.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: BOOKING_THEME.background,
          paddingTop: insets.top,
          paddingHorizontal: 20,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: BOOKING_THEME.textSecondary, fontSize: 14 }}>
          Không tìm thấy đơn hàng
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 16,
            backgroundColor: BOOKING_THEME.primary,
            borderRadius: 20,
            paddingHorizontal: 24,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: BOOKING_THEME.white, fontSize: 14, fontWeight: "700" }}>
            Quay lại
          </Text>
        </Pressable>
      </View>
    );
  }

  const isUrgent = timeLeft <= 120;
  const finalPrice = booking?.finalPrice ?? booking?.totalAmount ?? 0;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: BOOKING_THEME.background,
        paddingTop: insets.top,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            backgroundColor: BOOKING_THEME.surface,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: BOOKING_THEME.border,
          }}
        >
          <MaterialIconsRounded name="arrow-back" size={20} color={BOOKING_THEME.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: BOOKING_THEME.text, fontSize: 18, fontWeight: "800" }}>
            Thanh toán
          </Text>
          {booking?.bookingCode ? (
            <Text style={{ color: BOOKING_THEME.textSecondary, fontSize: 12, marginTop: 2 }}>
              Đơn #{booking.bookingCode}
            </Text>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 110,
        }}
        showsVerticalScrollIndicator={false}
      >
        <OrderSummary
          service={booking?.service}
          useDate={booking?.useDate}
          useTime={booking?.useTime}
          quantity={booking?.quantity}
          totalPrice={finalPrice}
        />

        {isExpired ? (
          <View
            style={{
              marginTop: 16,
              backgroundColor: "#FEF2F2",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: "#FECACA",
            }}
          >
            <Text style={{ color: "#DC2626", fontSize: 14, fontWeight: "700", marginBottom: 8 }}>
              Đơn hàng đã hết hạn
            </Text>
            <Text style={{ color: "#7F1D1D", fontSize: 13, marginBottom: 14 }}>
              Đơn hàng đã quá thời hạn thanh toán 15 phút. Vui lòng đặt lại.
            </Text>
            <Pressable
              onPress={() => router.replace("/")}
              style={{
                backgroundColor: "#1D1D1F",
                borderRadius: 999,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
                Quay lại trang chủ
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={{
              marginTop: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: isUrgent ? "#FEF2F2" : "#F0F9FF",
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: isUrgent ? "#FECACA" : "#BAE6FD",
            }}
          >
            <MaterialIconsRounded
              name="schedule"
              size={16}
              color={isUrgent ? "#DC2626" : "#0284C7"}
            />
            <Text
              style={{
                color: isUrgent ? "#DC2626" : "#0284C7",
                fontSize: 13,
                fontWeight: "700",
                fontVariant: ["tabular-nums"],
              }}
            >
              Thời gian thanh toán: {formatCountdown(timeLeft)}
            </Text>
          </View>
        )}

        <View style={{ marginTop: 20 }}>
          <PaymentMethodSelector
            selectedMethod={selectedMethod}
            onSelect={setSelectedMethod}
          />
        </View>

        <View
          style={{
            marginTop: 12,
            backgroundColor: BOOKING_THEME.primaryTint,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: BOOKING_THEME.border,
          }}
        >
          <Text style={{ color: BOOKING_THEME.textSecondary, fontSize: 12, lineHeight: 18 }}>
            {selectedMethod === "MOMO"
              ? 'Bấm "Thanh toán ngay" để mở ứng dụng MoMo. Sau khi hoàn tất, bạn sẽ tự động quay lại.'
              : 'Sau khi chọn phương thức và bấm "Thanh toán ngay", bạn sẽ được chuyển sang cổng thanh toán để hoàn tất. Không tắt ứng dụng trong quá trình thanh toán.'}
          </Text>
        </View>
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
          backgroundColor: BOOKING_THEME.background,
          borderTopWidth: 1,
          borderTopColor: BOOKING_THEME.border,
          gap: 10,
        }}
      >
        <Pressable
          onPress={handleCheckout}
          disabled={isProcessing || isExpired || !selectedMethod}
          style={{
            backgroundColor:
              isProcessing || isExpired || !selectedMethod
                ? "#D1D5DB"
                : BOOKING_THEME.primary,
            borderRadius: 22,
            paddingVertical: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            shadowColor: isExpired || !selectedMethod ? "transparent" : BOOKING_THEME.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 20,
            elevation: isExpired || !selectedMethod ? 0 : 8,
          }}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={BOOKING_THEME.white} />
          ) : (
            <MaterialIconsRounded name="payment" size={18} color={BOOKING_THEME.white} />
          )}
          <Text
            style={{
              color: BOOKING_THEME.white,
              fontSize: 15,
              fontWeight: "800",
            }}
          >
            {isProcessing ? "Đang xử lý..." : "Thanh toán ngay"}
          </Text>
        </Pressable>

        <Pressable
          onPress={handlePayLater}
          disabled={isProcessing}
          style={{
            borderRadius: 22,
            paddingVertical: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: BOOKING_THEME.border,
            backgroundColor: BOOKING_THEME.surface,
          }}
        >
          <Text
            style={{
              color: BOOKING_THEME.textSecondary,
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            Thanh toán sau
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
