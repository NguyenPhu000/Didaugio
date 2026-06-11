import { memo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Skeleton } from "../../../components/ui/Skeleton.jsx";
import { TOKENS } from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";

const SCREEN_W = Dimensions.get("window").width;
const PAD = TAB_SCREEN_PADDING;
const CARD_W = Math.min(260, SCREEN_W - PAD * 2 - 60);

function ExploreSkeletonInner() {
  return (
    <View className="pt-2" style={{ paddingHorizontal: PAD }}>
      {/* Header skeleton — avatar + greeting */}
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <View className="flex-row items-center gap-3">
            <Skeleton width={48} height={48} borderRadius={24} />
            <View className="gap-0.5">
              <Skeleton width="40%" height={13} borderRadius={6} />
              <Skeleton
                width="55%"
                height={16}
                borderRadius={6}
                className="mt-1"
              />
            </View>
          </View>
        </View>
        <Skeleton width={44} height={44} borderRadius={22} />
      </View>

      {/* Title skeleton */}
      <Skeleton
        width="80%"
        height={26}
        borderRadius={8}
        className="mt-5"
      />
      <Skeleton
        width="60%"
        height={14}
        borderRadius={6}
        className="mt-2"
      />

      {/* Search bar skeleton */}
      <Skeleton
        width="100%"
        height={54}
        borderRadius={999}
        className="mt-[22px]"
      />

      {/* Category pills skeleton */}
      <View className="flex-row gap-2.5 mt-2">
        <Skeleton width={80} height={42} borderRadius={999} />
        <Skeleton width={90} height={42} borderRadius={999} />
        <Skeleton width={75} height={42} borderRadius={999} />
        <Skeleton width={85} height={42} borderRadius={999} />
      </View>

      {/* Quick Actions skeleton — 2 rows of 4 */}
      <View className="flex-row flex-wrap mt-5 mb-2.5 px-0 gap-y-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`qa-${i}`} className="w-[25%] items-center">
            <Skeleton width={64} height={64} borderRadius={22} />
            <Skeleton
              width={48}
              height={11}
              borderRadius={6}
              className="mt-2"
            />
          </View>
        ))}
      </View>

      {/* Featured section header skeleton */}
      <View className="flex-row justify-between items-center mt-7 mb-3.5">
        <Skeleton width={140} height={22} borderRadius={8} />
        <Skeleton width={70} height={13} borderRadius={6} />
      </View>

      {/* Featured cards skeleton */}
      <View className="flex-row gap-3.5">
        <Skeleton width={CARD_W} height={380} borderRadius={28} />
        <Skeleton width={CARD_W} height={380} borderRadius={28} />
      </View>

      {/* Bento section header skeleton */}
      <View className="flex-row justify-between items-center mt-7 mb-3.5">
        <Skeleton width={130} height={22} borderRadius={8} />
      </View>

      {/* Bento grid skeleton */}
      <View className="rounded-[28px] p-2.5 bg-white">
        <View className="flex-row gap-2 h-[280px]">
          <Skeleton width="55%" height={280} borderRadius={20} />
          <View className="flex-1 gap-2">
            <Skeleton width="100%" height={136} borderRadius={20} />
            <Skeleton width="100%" height={136} borderRadius={20} />
          </View>
        </View>
      </View>

      {/* Popular section header skeleton */}
      <View className="flex-row justify-between items-center mt-7 mb-3.5">
        <Skeleton width={150} height={22} borderRadius={8} />
      </View>

      {/* Popular list skeleton — horizontal card style */}
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={`pop-${i}`} className="flex-row gap-3.5 p-2.5 rounded-[28px] bg-white mb-3">
          <Skeleton
            width={108}
            height={120}
            borderRadius={22}
          />
          <View className="flex-1 gap-0.75 justify-center">
            <Skeleton width="35%" height={11} borderRadius={6} />
            <Skeleton
              width="85%"
              height={16}
              borderRadius={6}
              className="mt-1"
            />
            <Skeleton
              width="55%"
              height={12}
              borderRadius={6}
              className="mt-1"
            />
            <View className="flex-row items-center justify-between mt-1.25">
              <Skeleton width={60} height={15} borderRadius={6} />
              <Skeleton width={60} height={32} borderRadius={999} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export const ExploreSkeleton = memo(ExploreSkeletonInner);
