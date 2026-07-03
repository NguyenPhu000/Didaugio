import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";

export function PaymentMethodSelector({ selectedMethod, onSelect }) {
  const { t } = useTranslation();

  const METHODS = [
    {
      id: "SEPAY",
      name: t("bookingDetail.payment.bankTransfer"),
      desc: t("bookingDetail.payment.bankTransferDesc"),
      color: "#0066FF",
      bg: "#EBF1FF",
      border: "#B3D1FF",
      icon: "qr-code-scanner",
    },
  ];

  return (
    <View className="gap-[10px]">
      <Text className="text-[rgba(0,0,0,0.48)] text-[13px] font-medium">
        {t("bookingDetail.payment.methodTitle")}
      </Text>

      {METHODS.map((method) => {
        const isSelected = selectedMethod === method.id;
        return (
          <Pressable
            key={method.id}
            onPress={() => onSelect(method.id)}
            style={{
              borderWidth: 2,
              borderColor: isSelected ? method.color : "#D2D2D7",
              backgroundColor: isSelected ? method.bg : "#FFFFFF",
              borderRadius: 14,
              padding: 14,
            }}
          >
            <View className="flex-row items-center">
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: isSelected ? method.color : "#D2D2D7",
                  backgroundColor: isSelected ? method.color : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                {isSelected ? (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                ) : null}
              </View>

              <MaterialIconsRounded
                name={method.icon}
                size={24}
                color={method.color}
                className="mr-3"
              />

              <View className="flex-1">
                <Text
                  className="text-[14px] font-bold"
                  style={{ color: isSelected ? method.color : "#1D1D1F" }}
                >
                  {method.name}
                </Text>
                <Text className="text-[rgba(0,0,0,0.48)] text-[12px] mt-0.5">
                  {method.desc}
                </Text>
              </View>

              {isSelected ? (
                <MaterialIconsRounded
                  name="check-circle"
                  size={20}
                  color={method.color}
                />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
