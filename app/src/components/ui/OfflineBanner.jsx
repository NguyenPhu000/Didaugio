import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TOKENS } from "../../constants/design-tokens";

export function OfflineBanner({ onNetworkChange } = {}) {
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
    <View style={[styles.banner, { paddingTop: insets.top + 4 }]}>
      <MaterialIcons name="wifi-off" size={16} color="#FFFFFF" />
      <Text style={styles.text}>Bạn đang offline — Hiển thị dữ liệu đã lưu</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#F59E0B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
  },
});
