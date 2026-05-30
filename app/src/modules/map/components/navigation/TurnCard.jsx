import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { MAP_TEXT } from "../../constants/mapText.constants";

const TurnCard = memo(function TurnCard({ index, name, onRemove }) {
  return (
    <Pressable
      onPress={onRemove}
      style={styles.container}
    >
      <View style={styles.indexCircle}>
        <Text style={styles.indexText}>
          {index + 1}
        </Text>
      </View>

      <Text
        style={styles.nameText}
        numberOfLines={1}
      >
        {name || MAP_TEXT.routeBuilder.stopFallbackName(index)}
      </Text>

      <MaterialIcons name="close" size={12} color="#64748B" />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 15,
    height: 30,
    paddingHorizontal: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  indexCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F172A",
  },
  indexText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "600",
  },
  nameText: {
    fontSize: 11,
    color: "#0F172A",
    maxWidth: 122,
  },
});

export default TurnCard;
