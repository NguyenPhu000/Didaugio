import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import NetInfo from "@react-native-community/netinfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export function OfflineBanner({ onNetworkChange } = {}) {
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);
      if (onNetworkChange) {
        onNetworkChange(connected);
      }
    });

    return () => unsubscribe();
  }, [onNetworkChange]);

  if (isConnected) return null;

  return (
    <View
      className="bg-amber-500 flex-row items-center justify-center gap-2 py-2 px-4"
      style={{ paddingTop: insets.top + 4 }}
    >
      <MaterialIconsRounded name="wifi-off" size={16} color="#FFFFFF" />
      <Text className="text-white font-medium text-[13px]">{t("common.offline")}</Text>
    </View>
  );
}
