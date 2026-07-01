import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import { normalizeBookingTicket } from "../utils/bookingTicket";
import { useTranslation } from "react-i18next";

const STATUS_STYLES = {
  pending: { bg: "bg-zinc-200", text: "text-zinc-900" },
  confirmed: { bg: "bg-zinc-950", text: "text-white" },
  completed: { bg: "bg-emerald-100", text: "text-emerald-800" },
  cancelled: { bg: "bg-zinc-200", text: "text-zinc-500" },
  rejected: { bg: "bg-orange-100", text: "text-orange-800" },
  expired: { bg: "bg-zinc-200", text: "text-zinc-500" },
  no_show: { bg: "bg-zinc-200", text: "text-zinc-500" },
};

const STATUS_I18N_KEYS = {
  no_show: "noShow",
};

function getStatusLabel(t, status) {
  const key = STATUS_I18N_KEYS[status] || status;
  return t(`bookings.status.${key}`, status || t("bookingDetail.status.unknown"));
}

function Notch({ side = "left" }) {
  return (
    <View
      pointerEvents="none"
      className={`absolute top-[-15px] h-[30px] w-[30px] rounded-full bg-[#F5F5F7] ${
        side === "left" ? "left-[-15px]" : "right-[-15px]"
      }`}
    />
  );
}

function Field({ label, value, align = "left" }) {
  return (
    <View className={`flex-1 ${align === "right" ? "items-end" : ""}`}>
      <Text className="text-[11px] font-medium text-black/40">{label}</Text>
      <Text
        numberOfLines={2}
        className={`mt-1 text-[13px] font-semibold leading-[16px] text-zinc-950 ${
          align === "right" ? "text-right" : ""
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

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

  if (compact) {
    return (
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <MaterialIconsRounded
            name={canShowQr ? "qr-code-2" : "lock"}
            size={18}
            color={canShowQr ? "#0F766E" : "rgba(0,0,0,0.38)"}
          />
          <Text className={`text-[12px] font-semibold ${canShowQr ? "text-teal-700" : "text-black/45"}`}>
            {canShowQr
              ? t("bookings.qrReady")
              : t("bookingTicket.qrPending", "QR unlocks after confirmation")}
          </Text>
        </View>
        <Text className="text-[11px] font-semibold text-black/45">{bookingCode}</Text>
      </View>
    );
  }

  if (!canShowQr) {
    return (
      <View className="items-center rounded-[18px] bg-zinc-100 px-5 py-6">
        <MaterialIconsRounded name="lock" size={30} color="rgba(0,0,0,0.38)" />
        <Text className="mt-2 text-center text-[13px] font-semibold text-black/50">
          {t("bookingTicket.qrPending", "QR unlocks after confirmation")}
        </Text>
      </View>
    );
  }

  if (isLoading && !qrCode) {
    return (
      <View className="h-[190px] items-center justify-center rounded-[18px] bg-zinc-100">
        <ActivityIndicator color="#111827" />
        <Text className="mt-3 text-[13px] font-medium text-black/45">
          {t("bookingDetail.loadingQR")}
        </Text>
      </View>
    );
  }

  if (!qrCode) {
    return (
      <View className="items-center rounded-[18px] bg-zinc-100 px-5 py-6">
        <MaterialIconsRounded name="qr-code" size={30} color="rgba(0,0,0,0.38)" />
        <Text className="mt-2 text-center text-[13px] font-semibold text-black/50">
          {error?.message || t("bookingDetail.qrLoadFailed")}
        </Text>
      </View>
    );
  }

  return (
    <View className="items-center">
      <View className="rounded-[22px] border border-black/10 bg-white p-3">
        <Image
          source={{ uri: qrCode }}
          contentFit="contain"
          transition={150}
          style={{ width: 176, height: 176 }}
        />
      </View>
      <View className="mt-3 flex-row items-center gap-2">
        <Text className="font-mono text-[13px] font-bold tracking-[1px] text-zinc-950">
          {bookingCode}
        </Text>
        {offline ? (
          <View className="rounded-full bg-zinc-950 px-2 py-0.5">
            <Text className="text-[10px] font-semibold text-white">
              {t("bookingDetail.offline")}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function BookingTicketMiniRow({ booking, onPress }) {
  const { t } = useTranslation();
  const ticket = normalizeBookingTicket(booking, t);
  const statusStyle = STATUS_STYLES[ticket.status] || {
    bg: "bg-zinc-200",
    text: "text-zinc-700",
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { opacity: 0.82 }]}
      className="flex-row items-center overflow-hidden rounded-[18px] border border-black/[0.06] bg-white"
    >
      <View className="h-[92px] w-[84px] bg-zinc-900">
        {ticket.heroImage ? (
          <Image
            source={{ uri: ticket.heroImage }}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <MaterialIconsRounded name="confirmation-number" size={28} color="rgba(255,255,255,0.72)" />
          </View>
        )}
      </View>
      <View className="flex-1 px-3 py-3">
        <View className="mb-1 flex-row items-center justify-between gap-2">
          <Text className="font-mono text-[10px] font-bold text-black/45" numberOfLines={1}>
            {ticket.bookingCode}
          </Text>
          <View className={`rounded-full px-2 py-0.5 ${statusStyle.bg}`}>
            <Text className={`text-[9px] font-bold uppercase ${statusStyle.text}`}>
              {getStatusLabel(t, ticket.status)}
            </Text>
          </View>
        </View>
        <Text className="text-[14px] font-bold leading-[18px] text-zinc-950" numberOfLines={1}>
          {ticket.serviceName}
        </Text>
        <Text className="mt-0.5 text-[12px] font-medium text-black/55" numberOfLines={1}>
          {ticket.placeName}
        </Text>
        <View className="mt-2 flex-row items-center justify-between gap-2">
          <Text className="text-[11px] font-semibold text-black/45" numberOfLines={1}>
            {ticket.dateLabel} • {ticket.timeLabel}
          </Text>
          <Text className="text-[12px] font-bold text-zinc-950" numberOfLines={1}>
            {ticket.totalLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

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
  const statusStyle = STATUS_STYLES[ticket.status] || {
    bg: "bg-zinc-200",
    text: "text-zinc-700",
  };
  const Wrapper = onPress ? Pressable : View;
  const shadowStyle = {
    shadowColor: "#000",
    shadowOpacity: compact ? 0.08 : 0.12,
    shadowRadius: compact ? 14 : 22,
    shadowOffset: { width: 0, height: compact ? 8 : 14 },
    elevation: compact ? 3 : 6,
  };

  return (
    <Wrapper
      onPress={onPress}
      className="overflow-hidden rounded-[24px] bg-white"
      style={
        onPress
          ? ({ pressed }) => [
              shadowStyle,
              pressed && { transform: [{ scale: 0.992 }], opacity: 0.96 },
            ]
          : shadowStyle
      }
    >
      <View className={compact ? "h-[142px] bg-zinc-900" : "h-[190px] bg-zinc-900"}>
        {ticket.heroImage ? (
          <Image
            source={{ uri: ticket.heroImage }}
            contentFit="cover"
            transition={250}
            cachePolicy="memory-disk"
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-zinc-900">
            <MaterialIconsRounded name="confirmation-number" size={42} color="rgba(255,255,255,0.72)" />
          </View>
        )}
        <View className="absolute inset-0 bg-black/25" />
        <View className="absolute bottom-0 left-0 right-0 px-5 pb-4">
          <View className="mb-2 flex-row items-center justify-between gap-3">
            <View className={`rounded-full px-3 py-1 ${statusStyle.bg}`}>
              <Text className={`text-[11px] font-bold uppercase ${statusStyle.text}`}>
                {getStatusLabel(t, ticket.status)}
              </Text>
            </View>
            <Text className="font-mono text-[11px] font-bold text-white/85">
              {ticket.bookingCode}
            </Text>
          </View>
          <Text numberOfLines={2} className="text-[24px] font-bold leading-[28px] text-white">
            {ticket.serviceName}
          </Text>
          <Text numberOfLines={1} className="mt-1 text-[13px] font-medium text-white/80">
            {ticket.placeName}
          </Text>
        </View>
      </View>

      <View className="px-5 py-5">
        <View className="flex-row gap-5">
          <Field label={t("bookingTicket.location", "Location")} value={ticket.placeName} />
          <Field label={t("bookingTicket.date", "Date")} value={ticket.dateLabel} align="right" />
        </View>
        <View className="mt-5 flex-row gap-5">
          <Field label={t("bookingTicket.time", "Time")} value={ticket.timeLabel} />
          <Field label={t("bookingTicket.quantity", "Guests")} value={ticket.quantityLabel} align="right" />
        </View>
        {!compact ? (
          <View className="mt-5 flex-row gap-5">
            <Field label={t("bookingTicket.address", "Address")} value={ticket.address} />
            <Field label={t("bookingTicket.total", "Total")} value={ticket.totalLabel} align="right" />
          </View>
        ) : null}
      </View>

      <View className="relative px-5 pb-5">
        <Notch side="left" />
        <Notch side="right" />
        <View className="mb-5 border-t border-dashed border-zinc-200" />
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
