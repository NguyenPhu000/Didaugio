import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const ICON_MAP = {
  sparkles: { Component: Ionicons, name: "sparkles" },
  map: { Component: Ionicons, name: "map" },
  restaurant: { Component: MaterialIcons, name: "restaurant" },
  location: { Component: Ionicons, name: "location" },
  image: { Component: Ionicons, name: "image" },
  code: { Component: Ionicons, name: "code-slash" },
  calculator: { Component: Ionicons, name: "calculator" },
};

export const EmptyChipGrid = ({
  options,
  columns = 2,
  gap = 10,
  containerStyle,
  chipStyle,
  labelStyle,
}) => {
  if (!options?.length) return null;

  const rows = [];
  for (let i = 0; i < options.length; i += columns) {
    rows.push(options.slice(i, i + columns));
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={[styles.row, { marginTop: rowIdx > 0 ? gap : 0 }]}>
          {row.map((item, colIdx) => {
            const iconDef = item.icon ? ICON_MAP[item.icon] : null;
            return (
              <Pressable
                key={`${rowIdx}-${colIdx}`}
                onPress={item.onPress}
                style={({ pressed }) => [
                  styles.chip,
                  chipStyle,
                  { marginLeft: colIdx > 0 ? gap : 0 },
                  pressed && styles.chipPressed,
                ]}
              >
                {iconDef ? (
                  <View style={styles.iconWrapper}>
                    <iconDef.Component name={iconDef.name} size={16} color="#FFFFFF" />
                  </View>
                ) : null}
                <Text style={[styles.label, labelStyle]} numberOfLines={1}>
                  {item.text}
                </Text>
              </Pressable>
            );
          })}
          {row.length < columns &&
            Array.from({ length: columns - row.length }).map((_, i) => (
              <View key={`spacer-${i}`} style={{ flex: 1, marginLeft: gap }} />
            ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  chipPressed: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  iconWrapper: {
    marginRight: 8,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});
