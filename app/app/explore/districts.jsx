import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useRouter } from "expo-router";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../src/constants/design-tokens";
import { useBoundaryData } from "../../src/modules/map/hooks/useBoundaryData";
import { ExploreListScaffold } from "../../src/modules/explore/components/ExploreListScaffold";


function pickDistricts(geojson) {
  const features = Array.isArray(geojson?.features) ? geojson.features : [];
  return features
    .map((f) => ({
      id:
        f?.properties?.id ??
        f?.properties?.districtId ??
        f?.properties?.gid ??
        f?.id ??
        null,
      name:
        f?.properties?.name ||
        f?.properties?.district ||
        f?.properties?.ten ||
        "Khu vực",
    }))
    .filter((d) => d.id != null)
    .sort((a, b) => String(a.name).localeCompare(String(b.name), "vi"));
}

export default function ExploreDistrictsScreen() {
  const router = useRouter();
  const { districts, isLoading } = useBoundaryData();

  const items = useMemo(() => pickDistricts(districts), [districts]);

  return (
    <ExploreListScaffold
      title="Theo quận"
      subtitle="Chọn khu vực để xem các địa điểm nổi bật."
    >
      <View className="px-6 pt-4 pb-6 gap-[10px]">
        {isLoading ? (
          <Text className="text-[rgba(0,0,0,0.8)] text-[14px] font-sans py-5 text-center">
            Đang tải...
          </Text>
        ) : (
          items.map((item) => (
            <Pressable
              key={String(item.id)}
              onPress={() =>
                router.push({
                  pathname: "/explore/district/[id]",
                  params: { id: String(item.id), name: item.name },
                })
              }
              className="flex-row items-center gap-3 p-[14px] rounded-[32px] bg-white border border-[rgba(0,0,0,0.08)]"
              style={({ pressed }) => [
                TOKENS.shadow.sm,
                pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
              ]}
            >
              <View className="w-[42px] h-[42px] rounded-[14px] items-center justify-center bg-[#FAFAFC] border border-[#D2D2D7]">
                <MaterialIconsRounded name="map" size={20} color={APPLE_THEME.primary} />
              </View>
              <View className="flex-1 min-w-0 gap-0.5">
                <Text className="text-[#1D1D1F] text-[15.5px] font-semibold" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-[rgba(0,0,0,0.8)] text-[12.5px] font-sans" numberOfLines={1}>
                  Xem địa điểm theo khu vực
                </Text>
              </View>
              <MaterialIconsRounded
                name="chevron-right"
                size={20}
                color={APPLE_THEME.textMuted}
              />
            </Pressable>
          ))
        )}
      </View>
    </ExploreListScaffold>
  );
}
