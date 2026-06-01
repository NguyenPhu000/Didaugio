import { memo } from "react";
import { Text, View } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

function HeroSectionInner() {
  return (
    <Animated.View entering={FadeInDown.delay(80).duration(500)}>
      <LinearGradient
        colors={["#2C2C2E", "#1C1C1E", "#000000"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="h-[180px] rounded-6xl overflow-hidden"
      >
        {/* Top-right icon */}
        <View className="absolute top-4 right-4 z-[2]">
          <View className="w-10 h-10 rounded-[20px] bg-white/[0.18] items-center justify-center border-[0.5px] border-white/15">
            <MaterialIconsRounded name="add-location-alt" size={18} color="rgba(255,255,255,0.9)" />
          </View>
        </View>

        {/* Bottom content */}
        <View className="absolute bottom-0 left-0 right-0 p-5 gap-2">
          <View className="flex-row items-center self-start bg-white/15 px-2.5 py-[5px] rounded-full gap-1.5 border-[0.5px] border-white/12">
            <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <Text className="text-white text-[11px] font-semibold uppercase tracking-[0.5px]">MỚI</Text>
          </View>
          <Text className="text-white text-6xl font-heading leading-[30px] tracking-tight">Tạo chuyến đi mới</Text>
          <Text className="text-white/75 text-sm font-body tracking-tight leading-5">
            Lên kế hoạch cho hành trình tuyệt vời của bạn
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

export const HeroSection = memo(HeroSectionInner);
