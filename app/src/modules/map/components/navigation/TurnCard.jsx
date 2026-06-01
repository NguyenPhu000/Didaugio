import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { MAP_TEXT } from "../../constants/mapText.constants";

const TurnCard = memo(function TurnCard({ index, name, onRemove }) {
  return (
    <Pressable
      onPress={onRemove}
      className="flex-row items-center gap-1.5 rounded-[15px] border px-2.5"
      style={{
        height: 30,
        backgroundColor: "#F8FAFC",
        borderColor: "#E2E8F0",
      }}
    >
      <View
        className="h-4 w-4 items-center justify-center rounded-full"
        style={{ backgroundColor: "#0F172A" }}
      >
        <Text
          className="text-[9px] font-semibold"
          style={{ color: "#FFFFFF" }}
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

      <MaterialIconsRounded name="close" size={12} color="#64748B" />
    </Pressable>
  );
});

export default TurnCard;
