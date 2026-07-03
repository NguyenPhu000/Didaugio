import { memo } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { BookingTicketMiniRow } from "@/modules/booking/components/BookingTicketCard";
import { T, ALPHA, STYLES } from "../../utils/tripDetailTokens";

export const ServicesTab = memo(function ServicesTab({
  groupedBookings,
  isLoading,
  onOpenBooking,
}) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View className={STYLES.centeredState}>
        <View className="h-12 w-12 items-center justify-center rounded-full bg-black/[0.04]">
          <ActivityIndicator size="small" color={T.ink} />
        </View>
        <Text className={STYLES.centeredBody}>{t("trip.services.loading")}</Text>
      </View>
    );
  }

  if (!groupedBookings || groupedBookings.length === 0) {
    return (
      <View className={STYLES.centeredState}>
        <View className="mb-2 h-14 w-14 items-center justify-center rounded-[20px] bg-black/[0.04]">
          <MaterialIconsRounded name="receipt-long" size={28} color={ALPHA.iconFaint} />
        </View>
        <Text className={STYLES.emptyTitle}>{t("trip.services.noBookings")}</Text>
        <Text className={STYLES.emptyBody}>
          {t("trip.services.noBookingsDesc")}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 120,
        gap: 20,
      }}
    >
      {groupedBookings.map((group) => (
        <View key={`group-${group.dayNumber}-${group.label}`} className="gap-2.5">
          <View className="flex-row items-center gap-2">
            <Text className="text-[12px] font-semibold uppercase tracking-widest text-black/40">
              {group.label}
            </Text>
            <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-black/[0.06] px-1.5">
              <Text className="text-[10px] font-semibold text-black/40">
                {group.items.length}
              </Text>
            </View>
          </View>

          {group.items.map((booking) => (
            <BookingTicketMiniRow
              key={booking.id}
              booking={booking}
              onPress={() => onOpenBooking(booking.id)}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
});
