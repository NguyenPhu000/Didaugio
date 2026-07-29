import { memo } from "react";
import { Dimensions, ScrollView, View } from "react-native";
import { Skeleton } from "../../../components/ui/Skeleton.jsx";
import { TOKENS } from "../../../constants/design-tokens";
import { TAB_BAR_HEIGHT } from "../../../../app/(tabs)/_layout";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { getFeaturedCardWidth } from "./FeaturedCard";
import { CATEGORY_CARD_H, CATEGORY_CARD_W } from "./CategoryPlacesSection";
import { POSTER_RADIUS } from "./cinematic";

const SCREEN_W = Dimensions.get("window").width;
const PAD = TAB_SCREEN_PADDING;
/* Bám sát hình học thật của các card để lúc data về không bị nhảy layout. */
const FEATURED_W = getFeaturedCardWidth(SCREEN_W);
const FEATURED_H = 424;
const BENTO_H = 344;
const MEDIA_W = SCREEN_W - PAD * 2;
/** Poster 4:3 của ExplorePlaceList, cộng 2 lớp inset 6px của khung trắng. */
const ROW_MEDIA_H = Math.round((MEDIA_W - 12) * (3 / 4));

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

      <View className="flex-row justify-between items-center mt-[26px] mb-3.5">
        <Skeleton width={140} height={22} borderRadius={8} />
      </View>

      <View className="flex-row gap-3">
        <Skeleton
          width={FEATURED_W}
          height={FEATURED_H}
          borderRadius={POSTER_RADIUS}
        />
        <Skeleton
          width={FEATURED_W}
          height={FEATURED_H}
          borderRadius={POSTER_RADIUS}
        />
      </View>

      <View className="flex-row gap-[5px] mt-3.5">
        <Skeleton width={26} height={3} borderRadius={999} />
        <Skeleton width={7} height={3} borderRadius={999} />
        <Skeleton width={7} height={3} borderRadius={999} />
      </View>

      <View className="flex-row justify-between items-center mt-[34px] mb-3.5">
        <Skeleton width={148} height={22} borderRadius={8} />
        <Skeleton width={56} height={18} borderRadius={999} />
      </View>

      <View className="flex-row gap-3">
        <Skeleton
          width={CATEGORY_CARD_W}
          height={CATEGORY_CARD_H}
          borderRadius={POSTER_RADIUS}
        />
        <Skeleton
          width={CATEGORY_CARD_W}
          height={CATEGORY_CARD_H}
          borderRadius={POSTER_RADIUS}
        />
      </View>

      <View className="flex-row justify-between items-center mt-[34px] mb-3.5">
        <Skeleton width={132} height={22} borderRadius={8} />
      </View>

      {/* Bento không còn khung trắng bọc ngoài — các ô ăn thẳng ra mép. */}
      <View className="flex-row gap-2.5" style={{ height: BENTO_H }}>
        <Skeleton width="55%" height={BENTO_H} borderRadius={26} />
        <View className="flex-1 gap-2.5">
          <Skeleton width="100%" height={(BENTO_H - 10) / 2} borderRadius={26} />
          <Skeleton width="100%" height={(BENTO_H - 10) / 2} borderRadius={26} />
        </View>
      </View>

      {Array.from({ length: 2 }).map((_, index) => (
        <View
          key={`explore-list-skeleton-${index}`}
          className="rounded-[28px] bg-white p-1.5 mt-3.5"
          style={TOKENS.shadow.sm}
        >
          <Skeleton width="100%" height={ROW_MEDIA_H} borderRadius={22} />
        </View>
      ))}
    </ScrollView>
  );
}

export const ExploreSkeleton = memo(ExploreSkeletonInner);
