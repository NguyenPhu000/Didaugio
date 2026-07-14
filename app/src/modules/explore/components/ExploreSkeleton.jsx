import { memo } from "react";
import { Dimensions, ScrollView, View } from "react-native";
import { Skeleton } from "../../../components/ui/Skeleton.jsx";
import { TOKENS } from "../../../constants/design-tokens";
import { TAB_BAR_HEIGHT } from "../../../../app/(tabs)/_layout";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";

const SCREEN_W = Dimensions.get("window").width;
const PAD = TAB_SCREEN_PADDING;
const CARD_W = Math.min(264, SCREEN_W - PAD * 2 - 56);
const MEDIA_W = SCREEN_W - PAD * 2;

function ExploreSkeletonInner() {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: PAD,
        paddingTop: 12,
        paddingBottom: TAB_BAR_HEIGHT + 84,
      }}
    >
      <View
        className="rounded-[28px] bg-white px-4 pt-4 pb-5"
        style={TOKENS.shadow.sm}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3 flex-1">
            <Skeleton width={48} height={48} borderRadius={24} />
            <View className="gap-1.5 flex-1">
              <Skeleton width="36%" height={12} borderRadius={999} />
              <Skeleton width="62%" height={18} borderRadius={8} />
            </View>
          </View>
          <Skeleton width={44} height={44} borderRadius={22} />
        </View>

        <Skeleton
          width="100%"
          height={52}
          borderRadius={999}
          className="mt-4"
        />
      </View>

      <View className="flex-row gap-2.5 mt-4">
        <Skeleton width={92} height={40} borderRadius={999} />
        <Skeleton width={116} height={40} borderRadius={999} />
        <Skeleton width={88} height={40} borderRadius={999} />
      </View>

      <View className="mt-5 rounded-[28px] bg-white p-2" style={TOKENS.shadow.sm}>
        <Skeleton width="100%" height={88} borderRadius={22} />
      </View>

      <View className="mt-4">
        <Skeleton width={MEDIA_W} height={178} borderRadius={28} />
        <View className="flex-row justify-center gap-1.5 mt-3">
          <Skeleton width={22} height={6} borderRadius={999} />
          <Skeleton width={6} height={6} borderRadius={999} />
          <Skeleton width={6} height={6} borderRadius={999} />
        </View>
      </View>

      <View className="flex-row justify-between items-center mt-7 mb-3.5">
        <Skeleton width={148} height={22} borderRadius={8} />
        <Skeleton width={56} height={18} borderRadius={999} />
      </View>

      <View className="flex-row gap-3.5">
        <Skeleton width={CARD_W} height={322} borderRadius={28} />
        <Skeleton width={CARD_W} height={322} borderRadius={28} />
      </View>

      <View className="flex-row justify-between items-center mt-8 mb-3.5">
        <Skeleton width={132} height={22} borderRadius={8} />
        <Skeleton width={56} height={18} borderRadius={999} />
      </View>

      <View className="rounded-[28px] bg-white p-2.5" style={TOKENS.shadow.sm}>
        <View className="flex-row gap-2 h-[260px]">
          <Skeleton width="55%" height={260} borderRadius={20} />
          <View className="flex-1 gap-2">
            <Skeleton width="100%" height={126} borderRadius={20} />
            <Skeleton width="100%" height={126} borderRadius={20} />
          </View>
        </View>
      </View>

      {Array.from({ length: 2 }).map((_, index) => (
        <View
          key={`explore-list-skeleton-${index}`}
          className="flex-row gap-3.5 rounded-[28px] bg-white p-2.5 mt-4"
          style={TOKENS.shadow.sm}
        >
          <Skeleton width={108} height={116} borderRadius={22} />
          <View className="flex-1 justify-center gap-2">
            <Skeleton width="34%" height={11} borderRadius={999} />
            <Skeleton width="86%" height={17} borderRadius={8} />
            <Skeleton width="58%" height={13} borderRadius={8} />
            <View className="flex-row gap-2 mt-1">
              <Skeleton width={54} height={18} borderRadius={999} />
              <Skeleton width={70} height={18} borderRadius={999} />
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

export const ExploreSkeleton = memo(ExploreSkeletonInner);
