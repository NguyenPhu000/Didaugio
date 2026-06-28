import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, FontAwesome, AntDesign } from "@expo/vector-icons";

export function ChatHeader({ title = "AI Assistant", onBack, onNewChat, onMenu }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        <View style={styles.leftSection}>
          {onBack ? (
            <Pressable onPress={onBack} style={styles.iconBtn} hitSlop={8}>
              <MaterialIcons name="arrow-back" size={22} color="#fff" />
            </Pressable>
          ) : (
            <Pressable onPress={onMenu} style={styles.iconBtn} hitSlop={8}>
              <MaterialIcons name="menu" size={22} color="#fff" />
            </Pressable>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.rightSection}>
          {onNewChat && (
            <Pressable onPress={onNewChat} style={styles.iconBtn} hitSlop={8}>
              <FontAwesome name="pencil-square-o" size={18} color="#fff" />
            </Pressable>
          )}
          <Pressable style={styles.iconBtn} hitSlop={8}>
            <AntDesign name="ellipsis" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000000",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  iconBtn: {
    padding: 4,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
});
