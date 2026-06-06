import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BOOKING_APPLE_THEME as THEME,
  TOKENS,
} from "../../src/constants/design-tokens";
import { useMyBookings } from "../../src/modules/booking/hooks/useBooking";
import { NotificationBell } from "../../src/components/composed/NotificationBell";
import { useTranslation } from "react-i18next";



const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("vi-VN")}đ`;
};

const formatDate = (value) => {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function MyBookingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { data, isLoading, refetch, isRefetching } = useMyBookings();

  const statusMeta = useMemo(
    () => ({
      pending: { label: t("bookings.status.pending"), color: "#1D1D1F", bg: "#EDEDF2" },
      confirmed: { label: t("bookings.status.confirmed"), color: "#FFFFFF", bg: "#1D1D1F" },
      completed: { label: t("bookings.status.completed"), color: "#1D1D1F", bg: "#DFDFE4" },
      cancelled: { label: t("bookings.status.cancelled"), color: "#5A5A5E", bg: "#ECECEF" },
      rejected: { label: t("bookings.status.rejected"), color: "#5A5A5E", bg: "#F2E8DF" },
      expired: { label: t("bookings.status.expired"), color: "#5A5A5E", bg: "#ECECEF" },
      no_show: { label: t("bookings.status.noShow"), color: "#5A5A5E", bg: "#ECECEF" },
    }),
    [t],
  );

  const bookings = useMemo(() => data?.data || [], [data?.data]);
  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter(
      (item) => item?.status === "confirmed",
    ).length;
    const pending = bookings.filter(
      (item) => item?.status === "pending",
    ).length;
    return { total, confirmed, pending };
  }, [bookings]);

  return (
    <View className="flex-1 bg-[#F5F5F7]" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-[10px] px-4 py-[14px] border-b border-b-[#D2D2D7]">
        <Pressable onPress={() => router.back()} className="w-[38px] h-[38px] rounded-xl items-center justify-center bg-white border border-[#D2D2D7]">
          <MaterialIconsRounded name="arrow-back" size={22} color={THEME.text} />
        </Pressable>

        <View className="flex-1">
          <Text className="text-[19px] text-[#1D1D1F] font-semibold">{t("bookings.title")}</Text>
          <Text className="mt-0.5 text-[12px] text-[rgba(0,0,0,0.8)] font-sans">
            {t("bookings.subtitle")}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <NotificationBell size={40} />
          <Pressable onPress={refetch} className="w-[38px] h-[38px] rounded-xl items-center justify-center bg-white border border-[#D2D2D7]">
            <MaterialIconsRounded name="refresh" size={20} color={THEME.textSecondary} />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 26, gap: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={THEME.primary}
              colors={[THEME.primary]}
              progressBackgroundColor={THEME.surface}
            />
          }
        >
          <View className="flex-row gap-2">
            <View className="flex-1 rounded-[14px] border border-[#D2D2D7] bg-white px-[10px] py-[10px] gap-1">
              <Text className="text-[rgba(0,0,0,0.48)] text-[11px] font-medium">{t("bookings.stats.total")}</Text>
              <Text className="text-[#1D1D1F] text-[17px] font-semibold">{stats.total}</Text>
            </View>
            <View className="flex-1 rounded-[14px] border border-[#D2D2D7] bg-white px-[10px] py-[10px] gap-1">
              <Text className="text-[rgba(0,0,0,0.48)] text-[11px] font-medium">{t("bookings.stats.confirmed")}</Text>
              <Text className="text-[#1D1D1F] text-[17px] font-semibold">{stats.confirmed}</Text>
            </View>
            <View className="flex-1 rounded-[14px] border border-[#D2D2D7] bg-white px-[10px] py-[10px] gap-1">
              <Text className="text-[rgba(0,0,0,0.48)] text-[11px] font-medium">{t("bookings.stats.pending")}</Text>
              <Text className="text-[#1D1D1F] text-[17px] font-semibold">{stats.pending}</Text>
            </View>
          </View>

          {bookings.length === 0 ? (
            <View className="mt-9 bg-white rounded-[20px] border border-[#D2D2D7] p-5 items-center">
              <MaterialIconsRounded
                name="confirmation-number"
                size={30}
                color={THEME.textMuted}
              />
              <Text className="mt-2 text-[17px] text-[#1D1D1F] font-semibold">{t("bookings.empty.noBookings")}</Text>
              <Text className="mt-[6px] text-[13px] leading-5 text-[rgba(0,0,0,0.8)] text-center font-sans">
                {t("bookings.empty.description")}
              </Text>
              <Pressable
                onPress={() => router.push("/(tabs)/map")}
                className="mt-4 bg-[#1D1D1F] rounded-full px-5 py-[11px]"
              >
                <Text className="text-white text-[14px] font-semibold">{t("bookings.empty.explore")}</Text>
              </Pressable>
            </View>
          ) : (
            bookings.map((booking) => {
              const status = statusMeta[booking?.status] || {
                label: booking?.status || t("bookings.status.unknown"),
                color: THEME.text,
                bg: "#ECECEF",
              };

              return (
                <Pressable
                  key={booking.id}
                  className="bg-white rounded-[20px] border border-[#D2D2D7] p-[15px] gap-[6px]"
                  style={({ pressed }) => [
                    pressed && { opacity: 0.92, backgroundColor: "#FAFAFC" },
                  ]}
                  onPress={() => router.push(`/profile/booking/${booking.id}`)}
                >
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="text-[rgba(0,0,0,0.48)] text-[12px] font-medium">
                      {booking.bookingCode}
                    </Text>
                    <View
                      className="rounded-full px-[10px] py-1 border border-[rgba(0,0,0,0.08)]"
                      style={{ backgroundColor: status.bg }}
                    >
                      <Text className="text-[11px] font-semibold" style={{ color: status.color }}>
                        {status.label}
                      </Text>
                    </View>
                  </View>

                  <Text className="mt-0.5 text-[16px] text-[#1D1D1F] font-semibold">
                    {booking?.service?.name || t("bookings.defaultService")}
                  </Text>
                  <Text className="text-[13px] text-[rgba(0,0,0,0.8)] font-medium">
                    {booking?.service?.place?.name || t("bookings.defaultPlace")}
                  </Text>

                  <View className="mt-[6px] flex-row flex-wrap gap-[10px]">
                    <View className="flex-row items-center gap-1">
                      <MaterialIconsRounded
                        name="event"
                        size={14}
                        color={THEME.textMuted}
                      />
                      <Text className="text-[12px] text-[rgba(0,0,0,0.48)] font-sans">
                        {formatDate(booking?.useDate)}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <MaterialIconsRounded
                        name="schedule"
                        size={14}
                        color={THEME.textMuted}
                      />
                      <Text className="text-[12px] text-[rgba(0,0,0,0.48)] font-sans">
                        {booking?.useTime || "--:--"}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <MaterialIconsRounded
                        name="payments"
                        size={14}
                        color={THEME.textMuted}
                      />
                      <Text className="text-[12px] text-[rgba(0,0,0,0.48)] font-sans">
                        {formatCurrency(booking?.finalPrice)}
                      </Text>
                    </View>
                  </View>

                  {booking?.status === "confirmed" ? (
                    <Text className="mt-[6px] text-[12px] text-[#34C759] font-medium">
                      {t("bookings.qrReady")}
                    </Text>
                  ) : null}

                  {booking?.linkedTrip?.id ? (
                    <Text className="mt-1 text-[12px] text-[#0071E3] font-medium">
                      {t("bookings.linkedTrip")}:{" "}
                      {booking.linkedTrip.title || `#${booking.linkedTrip.id}`}{" "}
                      ({t("bookings.linkedTripDay", { day: booking.linkedTrip.dayNumber || 1 })})
                    </Text>
                  ) : null}

                  <View className="mt-2 pt-[10px] border-t border-t-[#D2D2D7] flex-row items-center justify-between">
                    <Text className="text-[rgba(0,0,0,0.8)] text-[12px] font-medium">
                      {t("bookings.viewDetail")}
                    </Text>
                    <MaterialIconsRounded
                      name="arrow-forward-ios"
                      size={14}
                      color={THEME.textSecondary}
                    />
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
