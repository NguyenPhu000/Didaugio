import { memo } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { MAP_TEXT } from "../../constants/mapText.constants";

const FilterPickerModal = memo(function FilterPickerModal({
  visible,
  activeFilterGroupLabel,
  options,
  onClose,
  onSelectOption,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: "rgba(2, 6, 23, 0.4)" }}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View
          className="w-full overflow-hidden rounded-2xl border"
          style={{
            maxWidth: 360,
            maxHeight: 360,
            borderColor: "rgba(0, 0, 0, 0.18)",
            backgroundColor: "#FFFFFF",
          }}
        >
          <View
            className="flex-row items-center justify-between border-b px-4 py-3"
            style={{ borderBottomColor: "#E5E7EB" }}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: "#111111" }}
            >
              {MAP_TEXT.filters.pickerTitle(activeFilterGroupLabel)}
            </Text>
            <Pressable
              onPress={onClose}
              className="h-7 w-7 items-center justify-center rounded-full border"
              style={{ backgroundColor: "#FFFFFF", borderColor: "#D1D5DB" }}
            >
              <MaterialIconsRounded name="close" size={16} color="#111111" />
            </Pressable>
          </View>

          <ScrollView
            style={{ maxHeight: 300 }}
            contentContainerStyle={{ paddingVertical: 6 }}
            keyboardShouldPersistTaps="handled"
          >
            {options.map((option) => (
              <Pressable
                key={option.key}
                onPress={() => onSelectOption(option.value)}
                className="flex-row items-center justify-between px-4 py-3"
                style={{
                  backgroundColor: option.active
                    ? "rgba(17, 17, 17, 0.08)"
                    : "transparent",
                }}
              >
                <View className="flex-1 flex-row items-center gap-2">
                  <MaterialIconsRounded
                    name={option.icon}
                    size={16}
                    color={option.active ? "#111111" : "#4B5563"}
                  />
                  <Text
                    className="text-[13px]"
                    style={{ color: "#111111" }}
                    numberOfLines={1}
                  >
                    {option.label}
                  </Text>
                </View>

                {option.active ? (
                  <MaterialIconsRounded name="check" size={18} color="#111111" />
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

export default FilterPickerModal;
