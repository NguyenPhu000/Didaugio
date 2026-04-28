import { memo } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
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
        style={{ backgroundColor: "rgba(2,6,23,0.4)" }}
      >
        <Pressable
          style={{ position: "absolute", inset: 0 }}
          onPress={onClose}
        />

        <View
          className="w-full rounded-2xl overflow-hidden"
          style={{
            maxWidth: 360,
            maxHeight: 360,
            borderWidth: 1,
            borderColor: "rgba(15,23,42,0.18)",
            backgroundColor: "#FFFFFF",
          }}
        >
          <View
            className="flex-row items-center justify-between px-4 py-3"
            style={{ borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}
          >
            <Text
              className="text-[14px] font-semibold"
              style={{ color: "#111111" }}
            >
              {MAP_TEXT.filters.pickerTitle(activeFilterGroupLabel)}
            </Text>
            <Pressable
              onPress={onClose}
              className="w-7 h-7 rounded-full items-center justify-center"
              style={{
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#D1D5DB",
              }}
            >
              <MaterialIcons name="close" size={16} color="#111111" />
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
                    ? "rgba(17,17,17,0.08)"
                    : "transparent",
                }}
              >
                <View
                  className="flex-row items-center gap-2"
                  style={{ flex: 1 }}
                >
                  <MaterialIcons
                    name={option.icon}
                    size={16}
                    color={option.active ? "#111111" : "#4B5563"}
                  />
                  <Text
                    className="text-[13px]"
                    numberOfLines={1}
                    style={{ color: "#111111" }}
                  >
                    {option.label}
                  </Text>
                </View>

                {option.active ? (
                  <MaterialIcons name="check" size={18} color="#111111" />
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
