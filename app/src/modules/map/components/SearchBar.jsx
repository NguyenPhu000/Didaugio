import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
// import { Search, MapPin } from "lucide-react-native"; // Placeholder icons
import { Text } from "../../../components/ui/Text";

export const SearchBar = ({ onSearch, onPress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.searchBox} 
        activeOpacity={0.9}
        onPress={onPress}
      >
        <View style={styles.iconPlaceholder} /> 
        {/* <Search size={20} color="#525252" /> */}
        
        <Text style={styles.placeholder}>
          Tìm địa điểm, món ăn...
        </Text>
        
        <View style={styles.gpsButton}>
             {/* <MapPin size={18} color="#0077b8" /> */}
             <Text style={{color: '#0077b8', fontSize: 10, fontWeight: 'bold'}}>GPS</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60 - 50, // Adjust based on SafeArea
    top: 10, // Safe area handled by parent padding usually, but map is absolute
    // Actually MapComponent has padding top 60. Search bar should be at top.
    // Let's place it inside a SafeAreaView wrapper in the Screen, 
    // but Map is usually fullscreen.
    marginTop: 50, // Status bar height approx
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  iconPlaceholder: {
    width: 20,
    height: 20,
    backgroundColor: "#e5e5e5",
    borderRadius: 10,
    marginRight: 12,
  },
  placeholder: {
    flex: 1,
    color: "#737373",
    fontSize: 15,
  },
  gpsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0, 119, 184, 0.1)",
  },
});
