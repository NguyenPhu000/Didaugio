import { ScrollView, TouchableOpacity, StyleSheet, View } from "react-native";
import { Text } from "../../../components/ui/Text";
// import { styled } from "nativewind"; // Disabled for now due to config issues

const CATEGORIES = [
  { id: "all", name: "Tất cả" },
  { id: "coffee", name: "Cà phê" },
  { id: "food", name: "Ăn uống" },
  { id: "attraction", name: "Tham quan" },
  { id: "hotel", name: "Lưu trú" },
  { id: "shopping", name: "Mua sắm" },
];

export const CategoryChips = ({ selected, onSelect }) => {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.chip,
              selected === cat.id && styles.chipSelected
            ]}
            onPress={() => onSelect(cat.id)}
            activeOpacity={0.7}
          >
            <Text 
              style={[
                styles.text, 
                selected === cat.id && styles.textSelected
              ]}
              variant={selected === cat.id ? "semibold" : "medium"}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60, // Below search bar (placeholder)
    left: 0,
    right: 0,
    height: 50,
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  chipSelected: {
    backgroundColor: "#0077b8",
    borderColor: "#0077b8",
  },
  text: {
    color: "#525252",
    fontSize: 14,
  },
  textSelected: {
    color: "#ffffff",
  },
});
