import { memo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../../constants/design-tokens";

/**
 * Modal chúc mừng hoàn thành chặng cuối trong ngày hoặc kết thúc toàn bộ chuyến đi.
 * Thiết kế mờ kính với tone màu xanh lá / lục tươi (green) mang lại cảm giác tích cực và hoàn thành.
 */
const TripCompleteModal = memo(function TripCompleteModal({
  visible,
  isTripEnd = false,
  dayNumber = 1,
  onDismiss,
  onPrimaryAction,
  primaryActionText,
}) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(2, 6, 23, 0.4)" }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

        <BlurView
          tint="dark"
          intensity={40}
          className="items-center border"
          style={{
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 10,
            paddingBottom: 36,
            borderColor: "rgba(255, 255, 255, 0.12)",
            backgroundColor: "rgba(20, 28, 24, 0.95)",
          }}
        >
          {/* Header indicator */}
          <View
            className="mb-5"
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: "rgba(255, 255, 255, 0.25)",
            }}
          />

          <View className="mb-4">
            <View
              className="h-16 w-16 items-center justify-center rounded-full"
              style={{
                backgroundColor: "#34C759",
                shadowColor: "#34C759",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 18,
                elevation: 8,
              }}
            >
              <MaterialIconsRounded
                name={isTripEnd ? "workspace-premium" : "celebration"}
                size={32}
                color="#FFFFFF"
              />
            </View>
          </View>

          <View className="items-center mb-[26px] px-4">
            <Text
              className="text-2xl text-center"
              style={{
                color: "#FFFFFF",
                fontFamily: TOKENS.font.semibold,
                letterSpacing: -0.4,
              }}
            >
              {isTripEnd
                ? t("map.tripCompleteModal.journeyTitle")
                : t("map.tripCompleteModal.dayTitle", { day: dayNumber })}
            </Text>
            <Text
              className="text-base text-center mt-2 leading-5"
              style={{
                color: "rgba(255, 255, 255, 0.7)",
                fontFamily: TOKENS.font.medium,
              }}
            >
              {isTripEnd
                ? t("map.tripCompleteModal.journeyMessage")
                : t("map.tripCompleteModal.dayMessage", { day: dayNumber })}
            </Text>
          </View>

          <View className="flex-row gap-3 w-full">
            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => [
                {
                  flex: 1,
                  height: 50,
                  borderRadius: 25,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.12)",
                },
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text
                className="text-md font-semibold"
                style={{ color: "rgba(255, 255, 255, 0.8)", fontFamily: TOKENS.font.semibold }}
              >
                {t("map.tripCompleteModal.close")}
              </Text>
            </Pressable>

            {onPrimaryAction ? (
              <Pressable
                onPress={onPrimaryAction}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    height: 50,
                    borderRadius: 25,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#34C759",
                  },
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Text
                  className="text-md font-semibold"
                  style={{ color: "#FFFFFF", fontFamily: TOKENS.font.semibold }}
                >
                  {primaryActionText || (isTripEnd ? t("map.tripCompleteModal.complete") : t("map.tripCompleteModal.pause"))}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </BlurView>
      </View>
    </Modal>
  );
});

export default TripCompleteModal;
