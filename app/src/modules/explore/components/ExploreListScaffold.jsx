import { memo } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

function ExploreListScaffoldInner({ title, subtitle, children, rightAction }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="px-6 pt-2.5 pb-4 border-b border-[#E5E5E5] relative">
        <BlurView
          intensity={Platform.OS === "ios" ? 90 : 100}
          tint="light"
          style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}
        />
        <View className="absolute inset-0 bg-white/85" />

        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            className="w-11 h-11 rounded-full items-center justify-center bg-[#F9FAFB] border border-[#E5E7EB] active:opacity-60"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
          </Pressable>

          {rightAction ? <View className="min-h-[44px] items-end justify-center">{rightAction}</View> : null}
        </View>

        <View className="mt-3.5 gap-1">
          <Text className="text-black text-[28px] tracking-[-0.5px] font-bold">{title}</Text>
          {subtitle ? (
            <Text className="text-[#6B7280] text-sm leading-5 font-normal" numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="flex-1">{children}</View>
    </View>
  );
}

export const ExploreListScaffold = memo(ExploreListScaffoldInner);
