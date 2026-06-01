import { StyleSheet, Text, View, Platform } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";

const AnimatedLoadingCard = () => {
  return (
    <View className="w-[280px] h-[320px] rounded-[18px] bg-white overflow-hidden shadow-md elevation-4">
      <View className="flex-1 bg-neutral-200" />
      <View className="p-4 gap-2">
        <View className="h-5 w-[80%] rounded bg-neutral-200" />
        <View className="h-3.5 w-[60%] rounded bg-neutral-200" />
        <View className="flex-row justify-between items-center mt-2">
          <View className="h-4 w-[60px] rounded bg-neutral-200" />
          <View className="w-7 h-7 rounded-full bg-neutral-200" />
        </View>
      </View>
    </View>
  );
};

export default AnimatedLoadingCard;
