import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { formatPriceLocale, formatBookingDate } from "@/utils/dateFormat";

const formatPrice = (price) => {
  if (price == null) return "—";
  return formatPriceLocale(price);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return formatBookingDate(dateStr) || "—";
};

export function OrderSummary({ service, useDate, useTime, quantity, totalPrice }) {
  const { t } = useTranslation();

  return (
    <View className="bg-white rounded-[20px] p-[18px] border border-[#D2D2D7]">
      {service?.name ? (
        <Text className="text-[#1D1D1F] text-[16px] font-bold mb-[14px]">
          {service.name}
        </Text>
      ) : null}

      <View className="gap-3">
        {useDate ? (
          <View className="flex-row items-center gap-2">
            <MaterialIconsRounded
              name="event"
              size={16}
              color="rgba(0,0,0,0.48)"
            />
            <Text className="text-[rgba(0,0,0,0.48)] text-[13px]">
              {formatDate(useDate)}
              {useTime ? ` • ${useTime}` : ""}
            </Text>
          </View>
        ) : null}

        {quantity != null ? (
          <View className="flex-row items-center gap-2">
            <MaterialIconsRounded
              name="people"
              size={16}
              color="rgba(0,0,0,0.48)"
            />
            <Text className="text-[rgba(0,0,0,0.48)] text-[13px]">
              {t("booking.quantity", { count: quantity })}
            </Text>
          </View>
        ) : null}

        {totalPrice != null ? (
          <View className="flex-row items-center justify-between border-t border-[#D2D2D7] pt-3 mt-1">
            <Text className="text-[rgba(0,0,0,0.48)] text-[14px] font-semibold">
              {t("booking.subtotal")}
            </Text>
            <Text className="text-[#1D1D1F] text-[18px] font-bold">
              {formatPrice(totalPrice)}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
