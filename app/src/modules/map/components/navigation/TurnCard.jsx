import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { MAP_TEXT } from "../../constants/mapText.constants";

const TurnCard = memo(function TurnCard({ index, name, onRemove }) {
  return (
    <Pressable
      onPress={onRemove}
      className="flex-row items-center"
      style={{
        gap: 6,
        borderRadius: 999,
        height: 30,
        paddingHorizontal: 10,
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#E2E8F0",
      }}
    >
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0F172A",
        }}
      >
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 9,
            fontWeight: "600",
          }}
        >
          {index + 1}
        </Text>
      </View>

      <Text
        className="text-[11px]"
        style={{ color: "#0F172A", maxWidth: 122 }}
        numberOfLines={1}
      >
        {name || MAP_TEXT.routeBuilder.stopFallbackName(index)}
      </Text>

      <MaterialIcons name="close" size={12} color="#64748B" />
    </Pressable>
  );
});

export default TurnCard;
