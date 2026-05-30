import { memo } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>
              {MAP_TEXT.filters.pickerTitle(activeFilterGroupLabel)}
            </Text>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
            >
              <MaterialIcons name="close" size={16} color="#111111" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            {options.map((option) => (
              <Pressable
                key={option.key}
                onPress={() => onSelectOption(option.value)}
                style={[
                  styles.optionRow,
                  option.active ? styles.optionRowActive : styles.optionRowInactive,
                ]}
              >
                <View style={styles.optionRowLeft}>
                  <MaterialIcons
                    name={option.icon}
                    size={16}
                    color={option.active ? "#111111" : "#4B5563"}
                  />
                  <Text
                    style={styles.optionText}
                    numberOfLines={1}
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(2, 6, 23, 0.4)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    maxWidth: 360,
    maxHeight: 360,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.18)",
    backgroundColor: "#FFFFFF",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111111",
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  scrollView: {
    maxHeight: 300,
  },
  scrollContainer: {
    paddingVertical: 6,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionRowActive: {
    backgroundColor: "rgba(17, 17, 17, 0.08)",
  },
  optionRowInactive: {
    backgroundColor: "transparent",
  },
  optionRowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionText: {
    fontSize: 13,
    color: "#111111",
  },
});

export default FilterPickerModal;
