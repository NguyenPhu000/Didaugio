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
} from "../../src/constants/design-tokens";
import { useMyBookings } from "../../src/modules/booking/hooks/useBooking";
import BookingTicketCard from "../../src/modules/booking/components/BookingTicketCard";
import { NotificationBell } from "../../src/components/composed/NotificationBell";
import { useTranslation } from "react-i18next";

export default function MyBookingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { data, isLoading, refetch, isRefetching } = useMyBookings();

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
            bookings.map((booking) => (
              <BookingTicketCard
                key={booking.id}
                booking={booking}
                variant="compact"
                onPress={() => router.push(`/profile/booking/${booking.id}`)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
