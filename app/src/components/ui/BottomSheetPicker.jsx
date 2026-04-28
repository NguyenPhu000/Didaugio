import React, { forwardRef, useCallback, useMemo } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../constants/design-tokens";

const APPLE_COLORS = {
  background: "#FFFFFF",
  text: "#111111",
  mutedText: "#6B7280",
  border: "#F3F4F6",
  accent: "#111111",
};

/**
 * BottomSheetPicker
 * @prop {Array} data - Array of options [{ label, value }, ...]
 * @prop {String|Number} selectedValue - Currently selected value
 * @prop {Function} onSelect - Callback when an option is selected
 * @prop {String} title - Header title for the bottom sheet
 * @prop {Array} snapPoints - Snap points for the bottom sheet (e.g., ["50%", "90%"])
 */
export const BottomSheetPicker = forwardRef(
  ({ data, selectedValue, onSelect, title, snapPoints = ["50%"] }, ref) => {
    // Backdrop configuration
    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.3}
        />
      ),
      []
    );

    // List Item render
    const renderItem = useCallback(
      ({ item }) => {
        const isSelected = item.value === selectedValue;
        return (
          <Pressable
            style={({ pressed }) => [
              styles.itemRow,
              pressed && styles.itemRowPressed,
            ]}
            onPress={() => {
              onSelect(item.value);
              ref.current?.dismiss();
            }}
          >
            <Text
              style={[
                styles.itemText,
                isSelected && styles.itemTextSelected,
              ]}
            >
              {item.label}
            </Text>
            {isSelected && (
              <MaterialIcons name="check" size={20} color={APPLE_COLORS.accent} />
            )}
          </Pressable>
        );
      },
      [selectedValue, onSelect, ref]
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.bottomSheetBackground}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>

        <BottomSheetFlatList
          data={data}
          keyExtractor={(i) => String(i.value)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: APPLE_COLORS.background,
    borderRadius: 24,
  },
  handleIndicator: {
    backgroundColor: "#E5E7EB",
    width: 40,
    height: 5,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: APPLE_COLORS.border,
    alignItems: "center",
  },
  title: {
    fontFamily: TOKENS.font.heading,
    fontSize: 18,
    color: APPLE_COLORS.text,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#F9FAFB",
    marginBottom: 8,
    borderRadius: 16,
  },
  itemRowPressed: {
    backgroundColor: "#F3F4F6",
    transform: [{ scale: 0.98 }],
  },
  itemText: {
    fontFamily: TOKENS.font.body,
    fontSize: 16,
    color: APPLE_COLORS.text,
  },
  itemTextSelected: {
    fontFamily: TOKENS.font.bold,
  },
});
