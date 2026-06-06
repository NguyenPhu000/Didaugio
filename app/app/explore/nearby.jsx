import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../src/constants/design-tokens";
import { useExplore } from "../../src/modules/explore/hooks/useExplore";
import { useExploreLocation } from "../../src/modules/explore/hooks/useExploreLocation";
import { ExploreListScaffold } from "../../src/modules/explore/components/ExploreListScaffold";
import { ExplorePlaceList } from "../../src/modules/explore/components/ExplorePlaceList";
import { distanceMeters, formatDistance } from "../../src/modules/explore/utils/geo";


export default function ExploreNearbyScreen() {
  const { t } = useTranslation();
  const [watchEnabled, setWatchEnabled] = useState(false);
  const { currentLocation, permission, locateNow } = useExploreLocation({
    watchEnabled,
  });

  const { data, isLoading, refetch } = useExplore({ categoryId: null });

  const places = useMemo(() => {
    const raw = data?.pages.flatMap((p) => p?.data || []) ?? [];
    if (!currentLocation) return raw.slice(0, 60);

    return [...raw]
      .map((p) => {
        const meters = distanceMeters(currentLocation, p);
        return { ...p, __distanceMeters: meters };
      })
      .filter((p) => Number.isFinite(p.__distanceMeters))
      .sort((a, b) => a.__distanceMeters - b.__distanceMeters)
      .slice(0, 60);
  }, [data, currentLocation]);

  const subtitle = currentLocation
    ? t("exploreNearby.sortByDistance")
    : t("exploreNearby.enableLocation");

  return (
    <ExploreListScaffold
      title={t("exploreNearby.nearYou")}
      subtitle={subtitle}
      rightAction={
        <View className="flex-row items-center">
          <Pressable
            onPress={async () => {
              await locateNow();
              setWatchEnabled(true);
            }}
            className="flex-row items-center gap-[6px] h-9 px-3 rounded-full bg-[#1D1D1F]"
            style={({ pressed }) => [
              TOKENS.shadow.sm,
              pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
          >
            <MaterialIconsRounded
              name={permission === "granted" ? "my-location" : "location-off"}
              size={16}
              color={APPLE_THEME.white}
            />
            <Text className="text-white text-[12px] font-semibold tracking-[0.2px]">
              {permission === "granted" ? t("exploreNearby.locate") : t("exploreNearby.enableLocationBtn")}
            </Text>
          </Pressable>
        </View>
      }
    >
      {currentLocation ? (
        <View className="mx-6 mt-3 mb-[-2px] flex-row items-center gap-[6px] px-3 h-8 rounded-full bg-white/70 border border-[rgba(0,0,0,0.08)]">
          <MaterialIconsRounded
            name="near-me"
            size={14}
            color={APPLE_THEME.textSecondary}
          />
          <Text className="text-[rgba(0,0,0,0.8)] text-[12px] font-medium flex-1 min-w-0" numberOfLines={1}>
            {`${t("exploreNearby.currentLocation")} • ${currentLocation.latitude.toFixed(3)}, ${currentLocation.longitude.toFixed(3)}`}
          </Text>
        </View>
      ) : null}

      <ExplorePlaceList
        data={places}
        loading={isLoading}
        emptyTitle={t("exploreNearby.noPlaces")}
        emptyCopy={t("exploreNearby.tryAgain")}
        onEndReached={refetch}
      />
    </ExploreListScaffold>
  );
}
