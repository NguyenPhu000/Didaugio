import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import { normalizeBookingTicket } from "../utils/bookingTicket";

// 🌊 Asset chuẩn nhận diện du lịch thông minh Cần Thơ (Cầu Cần Thơ + Thuyền miền sông nước)
const TICKET_RIVER_BANNER = require("../../../../assets/ticket-river-banner.png");

const STATUS_CONFIG = {
  confirmed: {
    bg: "bg-[#0A2540]",
    text: "text-white",
    labelVi: "ĐÃ XÁC NHẬN",
  },
  completed: {
    bg: "bg-indigo-700",
    text: "text-white",
    labelVi: "ĐÃ SỬ DỤNG",
  },
  pending: {
    bg: "bg-amber-600",
    text: "text-white",
    labelVi: "CHỜ XÁC NHẬN",
  },
  paid_pending_confirm: {
    bg: "bg-emerald-700",
    text: "text-white",
    labelVi: "ĐÃ THANH TOÁN",
  },
  cancelled: {
    bg: "bg-zinc-700",
    text: "text-white",
    labelVi: "ĐÃ HỦY",
  },
  rejected: {
    bg: "bg-rose-700",
    text: "text-white",
    labelVi: "TỪ CHỐI",
  },
  expired: {
    bg: "bg-zinc-600",
    text: "text-zinc-200",
    labelVi: "HẾT HẠN",
  },
  no_show: {
    bg: "bg-zinc-600",
    text: "text-zinc-200",
    labelVi: "VẮNG MẶT",
  },
};

const STATUS_I18N_KEYS = {
  no_show: "noShow",
};

function getStatusInfo(t, status) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const key = STATUS_I18N_KEYS[status] || status;
  const label = t(`bookings.status.${key}`, config.labelVi);
  return { ...config, label };
}

/**
 * 🎫 Authentic Boarding Pass Semicircle Punch Out Notches
 */
function Notch({ side = "left" }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.notch,
        side === "left" ? styles.notchLeft : styles.notchRight,
      ]}
    />
  );
}

/**
 * Clean 2-Column Metric Cell for Boarding Pass
 */
function MetricCell({ label, value, align = "left", highlight = false }) {
  const isRight = align === "right";
  return (
    <View className={`flex-1 ${isRight ? "items-end" : "items-start"}`}>
      <Text
        numberOfLines={1}
        className={`text-[12px] font-medium text-[#64748B] dark:text-zinc-400 ${
          isRight ? "text-right" : "text-left"
        }`}
      >
        {label}
      </Text>
      <Text
        numberOfLines={2}
        className={`mt-1 font-extrabold leading-[20px] ${
          highlight
            ? "text-[17px] font-black text-[#0F172A] dark:text-white"
            : "text-[16px] text-[#0F172A] dark:text-zinc-100"
        } ${isRight ? "text-right" : "text-left"}`}
      >
        {value || "—"}
      </Text>
    </View>
  );
}

/**
 * Water Wave Transition at the bottom of the Ticket Header
 */
function RiverWaveTransition() {
  return (
    <View style={styles.waveContainer} pointerEvents="none">
      <Svg
        width="100%"
        height="32"
        viewBox="0 0 375 32"
        preserveAspectRatio="none"
      >
        <Path
          d="M0,18 C70,30 140,8 210,18 C280,28 330,12 375,14 L375,32 L0,32 Z"
          fill="#FFFFFF"
        />
      </Svg>
    </View>
  );
}

/**
 * Tropical Palm Watermark at Bottom of Ticket
 */
function WatermarkDecoration() {
  return (
    <View pointerEvents="none" style={styles.watermarkWrapper}>
      <Svg width="120" height="90" viewBox="0 0 120 90" fill="none">
        <Path
          d="M100 85 C95 65, 80 50, 60 45 C75 42, 95 48, 105 55"
          stroke="#BAE6FD"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.4"
        />
        <Path
          d="M105 85 C102 60, 95 40, 75 25 C90 28, 108 38, 115 50"
          stroke="#BAE6FD"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.45"
        />
        <Path
          d="M112 85 C115 65, 118 45, 105 30 C114 38, 120 52, 120 68"
          stroke="#BAE6FD"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.35"
        />
        <Path
          d="M0 88 C40 82, 80 88, 120 84"
          stroke="#E0F2FE"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
      </Svg>
    </View>
  );
}

/**
 * QR Boarding Pass Stub with 1-Tap Copy & Feedback
 */
function QrPanel({
  qrCode,
  bookingCode,
  canShowQr,
  isLoading,
  error,
  offline,
  compact,
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!bookingCode) return;
    try {
      await Clipboard.setStringAsync(bookingCode);
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore fallback
    }
  };

  if (compact) {
    return (
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View
            className={`h-6 w-6 items-center justify-center rounded-full ${
              canShowQr ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-zinc-100 dark:bg-zinc-800"
            }`}
          >
            <MaterialIconsRounded
              name={canShowQr ? "qr-code-scanner" : "lock"}
              size={14}
              color={canShowQr ? "#059669" : "#71717A"}
            />
          </View>
          <Text
            className={`text-[12px] font-bold ${
              canShowQr ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-400"
            }`}
          >
            {canShowQr
              ? t("bookings.qrReady", "Vé điện tử sẵn sàng")
              : t("bookingTicket.qrPending", "QR mở sau khi xác nhận")}
          </Text>
        </View>
        <Text className="font-mono text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
          {bookingCode}
        </Text>
      </View>
    );
  }

  if (!canShowQr) {
    return (
      <View className="items-center rounded-[24px] bg-sky-50/50 dark:bg-zinc-900/50 p-6 border border-dashed border-sky-200 dark:border-zinc-800">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 dark:bg-zinc-800">
          <MaterialIconsRounded name="lock" size={24} color="#0284C7" />
        </View>
        <Text className="mt-3 text-center text-[13px] font-bold text-zinc-700 dark:text-zinc-300">
          {t("bookingTicket.qrPending", "Mã QR mở khóa sau khi xác nhận")}
        </Text>
        <Text className="mt-1 text-center text-[11px] font-medium text-zinc-400 max-w-[240px]">
          Mã check-in sẽ sẵn sàng ngay khi đơn được thanh toán hoặc xác nhận thành công.
        </Text>
      </View>
    );
  }

  if (isLoading && !qrCode) {
    return (
      <View className="h-[220px] items-center justify-center rounded-[24px] bg-sky-50/30">
        <ActivityIndicator color="#0284C7" size="large" />
        <Text className="mt-3 text-[12px] font-bold text-sky-800">
          {t("bookingDetail.loadingQR", "Đang tải mã vé...")}
        </Text>
      </View>
    );
  }

  if (!qrCode) {
    return (
      <View className="items-center rounded-[24px] bg-rose-50/50 p-6 border border-rose-200/60">
        <MaterialIconsRounded name="error-outline" size={28} color="#E11D48" />
        <Text className="mt-2 text-center text-[13px] font-bold text-rose-700">
          {error?.message || t("bookingDetail.qrLoadFailed", "Không thể tải mã QR")}
        </Text>
      </View>
    );
  }

  return (
    <View className="items-center relative">
      {/* 1. Large QR Code Frame (Rounded White Card with Subtle Drop Shadow) */}
      <View style={styles.qrContainer}>
        <Image
          source={{ uri: qrCode }}
          contentFit="contain"
          transition={200}
          style={{ width: 184, height: 184 }}
        />
      </View>

      {/* 2. Booking Code Below QR with Tap-To-Copy */}
      <Pressable
        onPress={handleCopy}
        hitSlop={10}
        style={({ pressed }) => [
          styles.codePill,
          pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
        ]}
      >
        <Text className="font-mono text-[13px] font-black tracking-[1.2px] text-[#0F172A] dark:text-white">
          {bookingCode}
        </Text>
        <View className="flex-row items-center gap-1 ml-2">
          <MaterialIconsRounded
            name={copied ? "check" : "content-copy"}
            size={13}
            color={copied ? "#0284C7" : "#64748B"}
          />
          <Text
            className={`text-[10px] font-bold ${
              copied ? "text-sky-600 font-black" : "text-zinc-400"
            }`}
          >
            {copied ? "ĐÃ SAO CHÉP" : "SAO CHÉP"}
          </Text>
        </View>
        {offline ? (
          <View className="rounded-full bg-zinc-950 px-2 py-0.5 ml-1">
            <Text className="text-[9px] font-bold text-white">
              {t("bookingDetail.offline", "OFFLINE")}
            </Text>
          </View>
        ) : null}
      </Pressable>

      {/* 3. Watermark Decoration (River Waves & Palm Trees) */}
      <WatermarkDecoration />
    </View>
  );
}

/**
 * 🎫 MAIN E-TICKET (BOARDING PASS) COMPONENT
 * Thiết kế chuẩn vé du lịch Cần Thơ:
 * - Banner sông nước Cần Thơ & Cầu Cần Thơ
 * - Nhãn iPoint Genie & mã vé kết nối gạch đứt
 * - Bảng thông tin 2 cột rõ ràng (Địa điểm, Ngày, Giờ, Số khách, Địa chỉ, Tổng tiền)
 * - Rãnh xé vé thật (Perforated Notches)
 * - Khung mã QR nổi bật kèm mã code chạm để sao chép
 */
export default function BookingTicketCard({
  booking,
  qrCode,
  qrLoading = false,
  qrError = null,
  offline = false,
  variant = "compact",
  onPress,
}) {
  const { t } = useTranslation();
  const ticket = normalizeBookingTicket(booking, t);
  const compact = variant === "compact";
  const statusInfo = getStatusInfo(t, ticket.status);
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={({ pressed }) => [
        styles.ticketContainer,
        onPress && pressed && { transform: [{ scale: 0.992 }], opacity: 0.96 },
      ]}
    >
      {/* ── 1. Hero Pass Header (Can Tho River Thematic Banner) ── */}
      <View style={[styles.heroHeader, { height: compact ? 150 : 218 }]}>
        {/* Background Artwork Cần Thơ */}
        <Image
          source={TICKET_RIVER_BANNER}
          contentFit="cover"
          transition={250}
          cachePolicy="memory-disk"
          style={StyleSheet.absoluteFillObject}
        />

        {/* Soft Ambient Contrast Gradient */}
        <LinearGradient
          colors={["rgba(255,255,255,0.7)", "rgba(255,255,255,0.1)", "rgba(186,230,253,0.3)"]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Header Content Layer */}
        <View className="absolute inset-0 px-5 pt-4 pb-3 justify-between">
          {/* Top Row: Brand Tag */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <MaterialIconsRounded name="auto-awesome" size={15} color="#0284C7" />
              <Text className="text-[14px] font-black tracking-[0.4px] text-[#0A2540]">
                iPoint Genie
              </Text>
            </View>
          </View>

          {/* Middle Row: Status Badge + Dashed Connector + Booking Code */}
          <View className="flex-row items-center justify-between mt-1">
            <View className={`rounded-full px-3 py-1 ${statusInfo.bg} shadow-xs`}>
              <Text className="text-[10px] font-black uppercase tracking-[0.6px] text-white">
                {statusInfo.label}
              </Text>
            </View>

            {/* Dashed connector line */}
            <View style={styles.headerDashedLine} />

            <Text
              numberOfLines={1}
              className="font-mono text-[11px] font-bold text-[#1E3A5F] max-w-[140px]"
            >
              {ticket.bookingCode}
            </Text>
          </View>

          {/* Bottom Row: Service Name & Place vs Date */}
          <View className="flex-row items-end justify-between pt-1">
            <View className="flex-1 pr-3">
              <Text
                numberOfLines={1}
                className="text-[21px] font-black leading-[25px] tracking-tight text-[#0F172A]"
              >
                {ticket.serviceName}
              </Text>
              <Text
                numberOfLines={1}
                className="mt-0.5 text-[14px] font-bold text-[#475569]"
              >
                {ticket.placeName}
              </Text>
            </View>

            <View className="items-end pb-0.5">
              <Text className="text-[9px] font-extrabold uppercase tracking-[1.5px] text-[#64748B]">
                DATE
              </Text>
              <Text className="mt-0.5 text-[12px] font-black text-[#0F172A]">
                {ticket.dateLabel || "--/--/--"}
              </Text>
            </View>
          </View>
        </View>

        {/* River Wave Curve Transition at Bottom of Header */}
        <RiverWaveTransition />
      </View>

      {/* ── 2. Information Bento Grid (Clean 2-Column × 3-Row Data) ── */}
      <View className="px-6 py-5 bg-white dark:bg-zinc-900">
        {/* Row 1: Địa điểm & Ngày */}
        <View className="flex-row items-start justify-between">
          <MetricCell
            label={t("bookingTicket.location", "Địa điểm")}
            value={ticket.placeName}
          />
          <MetricCell
            label={t("bookingTicket.date", "Ngày")}
            value={ticket.dateLabel}
            align="right"
          />
        </View>

        {/* Row 2: Giờ & Số khách */}
        <View className="mt-4 flex-row items-start justify-between">
          <MetricCell
            label={t("bookingTicket.time", "Giờ")}
            value={ticket.timeLabel}
          />
          <MetricCell
            label={t("bookingTicket.quantity", "Số khách")}
            value={ticket.quantityLabel}
            align="right"
          />
        </View>

        {/* Row 3: Địa chỉ & Tổng tiền */}
        <View className="mt-4 flex-row items-start justify-between">
          <MetricCell
            label={t("bookingTicket.address", "Địa chỉ")}
            value={ticket.address}
          />
          <MetricCell
            label={t("bookingTicket.total", "Tổng tiền")}
            value={ticket.totalLabel}
            align="right"
            highlight
          />
        </View>
      </View>

      {/* ── 3. Perforated Tear Line with Semicircle Die-Cut Notches ── */}
      <View style={styles.perforationWrapper}>
        <Notch side="left" />
        <Notch side="right" />
        <View style={styles.perforationDashedLine} />
      </View>

      {/* ── 4. QR Boarding Stub & Check-in Verification ── */}
      <View className="px-6 pt-3 pb-6 bg-white dark:bg-zinc-900">
        <QrPanel
          qrCode={qrCode}
          bookingCode={ticket.bookingCode}
          canShowQr={ticket.canShowQr}
          isLoading={qrLoading}
          error={qrError}
          offline={offline}
          compact={compact}
        />
      </View>
    </Wrapper>
  );
}

/**
 * Compact Ticket Row for Trips & Subscriptions (Giữ nguyên cho ServicesTab.jsx)
 */
export function BookingTicketMiniRow({ booking, onPress }) {
  const { t } = useTranslation();
  const ticket = normalizeBookingTicket(booking, t);
  const statusInfo = getStatusInfo(t, ticket.status);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.miniRowCard,
        pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
      ]}
    >
      <View className="h-[96px] w-[88px] bg-zinc-950 overflow-hidden relative">
        <Image
          source={TICKET_RIVER_BANNER}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          style={{ width: "100%", height: "100%" }}
        />
      </View>
      <View className="flex-1 px-3.5 py-3 justify-between">
        <View>
          <View className="mb-1 flex-row items-center justify-between gap-2">
            <Text className="font-mono text-[10px] font-extrabold text-zinc-400" numberOfLines={1}>
              #{ticket.bookingCode}
            </Text>
            <View className={`rounded-full px-2 py-0.5 ${statusInfo.bg}`}>
              <Text className={`text-[9px] font-extrabold uppercase ${statusInfo.text}`}>
                {statusInfo.label}
              </Text>
            </View>
          </View>
          <Text className="text-[14px] font-extrabold leading-[18px] text-zinc-950 dark:text-white" numberOfLines={1}>
            {ticket.serviceName}
          </Text>
          <Text className="mt-0.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400" numberOfLines={1}>
            {ticket.placeName}
          </Text>
        </View>
        <View className="mt-2 flex-row items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-1.5">
          <Text className="text-[11px] font-bold text-zinc-400" numberOfLines={1}>
            {ticket.dateLabel} • {ticket.timeLabel}
          </Text>
          <Text className="text-[12px] font-extrabold text-emerald-600 dark:text-emerald-400" numberOfLines={1}>
            {ticket.totalLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ticketContainer: {
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  heroHeader: {
    width: "100%",
    backgroundColor: "#F0F9FF",
    position: "relative",
    overflow: "hidden",
  },
  headerDashedLine: {
    flex: 1,
    marginHorizontal: 10,
    borderBottomWidth: 1.2,
    borderColor: "rgba(30, 58, 95, 0.25)",
    borderStyle: "dashed",
  },
  waveContainer: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 32,
    zIndex: 2,
  },
  perforationWrapper: {
    position: "relative",
    height: 28,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  perforationDashedLine: {
    width: "82%",
    borderBottomWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
  },
  notch: {
    position: "absolute",
    top: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F5F5F7",
    zIndex: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  notchLeft: {
    left: -14,
  },
  notchRight: {
    right: -14,
  },
  qrContainer: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  codePill: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  watermarkWrapper: {
    position: "absolute",
    bottom: -10,
    right: -10,
    zIndex: -1,
  },
  miniRowCard: {
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
});
