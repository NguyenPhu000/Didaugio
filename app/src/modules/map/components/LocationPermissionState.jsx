import { Modal, Pressable, Text, View } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TOKENS } from "@/constants/design-tokens";

export function LocationPermissionState({
  visible,
  onDismiss,
  onOpenSettings,
  t,
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View
        className="flex-1 justify-center bg-black/50 px-5"
        style={{
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        <View className="rounded-[28px] bg-white p-6 shadow-2xl">
          <View className="mb-5 h-16 w-16 items-center justify-center rounded-[22px] bg-sky-50">
            <MaterialIconsRounded
              name="location-on"
              size={30}
              color={TOKENS.color.semantic.info}
            />
          </View>
          <Text className="text-[22px] font-bold leading-7 text-slate-950">
            {t("mapScreen.locationPermissionCardTitle")}
          </Text>
          <Text className="mt-2 text-[14px] leading-5 text-slate-600">
            {t("mapScreen.locationPermissionCardMessage")}
          </Text>

          <Pressable
            onPress={onOpenSettings}
            accessibilityRole="button"
            accessibilityLabel={t("mapScreen.locationPermissionOpenSettings")}
            className="mt-6 h-12 flex-row items-center justify-center gap-2 rounded-[16px] bg-slate-950 active:opacity-85"
          >
            <MaterialIconsRounded
              name="settings"
              size={18}
              color={TOKENS.color.surface.light}
            />
            <Text className="text-[14px] font-bold text-white">
              {t("mapScreen.locationPermissionOpenSettings")}
            </Text>
          </Pressable>

          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel={t("mapScreen.locationPermissionLater")}
            className="mt-2 h-11 items-center justify-center rounded-[16px] bg-slate-100 active:bg-slate-200"
          >
            <Text className="text-[14px] font-semibold text-slate-700">
              {t("mapScreen.locationPermissionLater")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
