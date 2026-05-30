import { memo, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import {
  ALL_AREAS_KEY,
  ALL_COLLECTIONS_KEY,
  buildSavedSummary,
  getHeroEntry,
  getLocationText,
} from "../utils/savedHelpers";

const STAT_TONES = {
  blue: { bg: "rgba(0,122,255,0.1)", color: "#007AFF" },
  amber: { bg: "rgba(255,159,10,0.1)", color: "#FF9F0A" },
  teal: { bg: "rgba(20,184,166,0.1)", color: "#14B8A6" },
  green: { bg: "rgba(52,199,89,0.1)", color: "#34C759" },
};

const StatPill = memo(function StatPill({ icon, value, label, tone }) {
  const theme = STAT_TONES[tone] || STAT_TONES.blue;
  return (
    <View className="w-[48%] flex-row items-center gap-3 py-3.5 px-3.5 rounded-[20px] bg-white shadow-sm elevation-1">
      <View className="w-10 h-10 rounded-[12px] items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <MaterialIcons name={icon} size={20} color={theme.color} />
      </View>
      <View className="flex-1">
        <Text className="text-[#1D1D1F] text-[22px] font-bold tracking-[-0.4px]">{value}</Text>
        <Text className="text-[#54647A] text-xs font-medium mt-0.5">{label}</Text>
      </View>
    </View>
  );
});

const FilterChip = memo(function FilterChip({
  icon,
  label,
  active,
  onPress,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-full ${
        active ? "bg-[#1D1D1F]" : "bg-[#F2F2F7]"
      }`}
    >
      {icon ? (
        <MaterialIcons
          name={icon}
          size={14}
          color={active ? "#FFFFFF" : APPLE_THEME.textMuted}
        />
      ) : null}
      <Text
        numberOfLines={1}
        className={`text-[13px] font-semibold tracking-[-0.1px] ${
          active ? "text-white" : "text-[#1D1D1F]"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
});

function FilterRow({ title, data, activeKey, onChange }) {
  return (
    <View className="gap-2">
      <Text className="text-[#54647A] text-xs font-semibold tracking-[-0.1px] uppercase">{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 8 }}
      >
        {data.map((item) => (
          <FilterChip
            key={item.key}
            icon={item.icon}
            label={item.name}
            active={activeKey === item.key}
            onPress={() => onChange(item.key)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export const SavedDashboard = memo(function SavedDashboard({
  savedData,
  filteredCount,
  collectionOptions,
  areaOptions,
  activeCollection,
  activeArea,
  onChangeCollection,
  onChangeArea,
  onPressHero,
}) {
  const heroEntry = useMemo(() => getHeroEntry(savedData), [savedData]);
  const summary = useMemo(
    () => buildSavedSummary({ savedData, collectionOptions, areaOptions }),
    [savedData, collectionOptions, areaOptions],
  );

  const heroPlace = heroEntry?.place || heroEntry || null;
  const heroCover = heroPlace ? resolvePlaceImageUri(heroPlace) : null;

  const collectionFilterData = useMemo(
    () => [
      {
        key: ALL_COLLECTIONS_KEY,
        icon: "collections-bookmark",
        name: `Tất cả (${savedData.length})`,
      },
      ...collectionOptions.map((option) => ({
        ...option,
        icon: option.icon || "category",
      })),
    ],
    [collectionOptions, savedData.length],
  );

  const areaFilterData = useMemo(
    () => [
      {
        key: ALL_AREAS_KEY,
        icon: "map",
        name: `Mọi khu vực (${savedData.length})`,
      },
      ...areaOptions.map((area) => ({ ...area, icon: "place" })),
    ],
    [areaOptions, savedData.length],
  );

  return (
    <View className="pt-2 pb-5" style={{ paddingHorizontal: TAB_SCREEN_PADDING }}>
      <View className="flex-row items-center justify-between mt-4 mb-6">
        <View>
          <Text className="text-[#1D1D1F] text-[34px] font-bold tracking-[-1px]">Đã lưu</Text>
          <Text className="text-[#54647A] text-[15px] mt-1 tracking-[-0.2px] max-w-[260px]">
            {savedData.length > 0
              ? `${savedData.length} địa điểm trong bộ sưu tập của bạn`
              : "Lưu địa điểm yêu thích để mở lại nhanh"}
          </Text>
        </View>
        <View className="w-11 h-11 rounded-full bg-[#F2F2F7] items-center justify-center">
          <MaterialIcons name="bookmark" size={20} color="#1D1D1F" />
        </View>
      </View>

      {heroEntry ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onPressHero?.(heroPlace?.id)}
          className="h-[220px] rounded-[28px] overflow-hidden mb-6 bg-[#1C1C1E] relative shadow-md elevation-4"
        >
          {heroCover ? (
            <Image
              source={{ uri: heroCover }}
              style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, width: "100%", height: "100%" }}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
            />
          ) : (
            <LinearGradient
              colors={["#2C2C2E", "#1C1C1E", "#000000"]}
              className="absolute inset-0"
            />
          )}
          <LinearGradient
            colors={[
              "rgba(0,0,0,0.05)",
              "rgba(0,0,0,0.3)",
              "rgba(0,0,0,0.75)",
              "rgba(0,0,0,0.92)",
            ]}
            locations={[0, 0.45, 0.78, 1]}
            className="absolute inset-0"
          />

          <View className="absolute top-4 right-4 z-[2]">
            <View className="w-[38px] h-[38px] rounded-full items-center justify-center bg-white/20 border border-white/30">
              <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          </View>

          <View className="absolute bottom-0 left-0 right-0 p-5 gap-2">
            <View className="self-start rounded-full overflow-hidden mb-1">
              <View className="flex-row items-center px-3 py-1.5 gap-1.5 bg-white/25">
                <View className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                <Text className="text-white text-xs font-semibold uppercase tracking-[0.5px]">Vừa lưu</Text>
              </View>
            </View>

            <Text className="text-white text-[26px] font-bold leading-[30px] tracking-[-0.5px]" numberOfLines={2}>
              {heroPlace?.name || "Địa điểm đã lưu"}
            </Text>

            <View className="flex-row items-center gap-2 mt-1 flex-wrap">
              <View className="flex-row items-center gap-1 max-w-[60%]">
                <MaterialIcons
                  name="place"
                  size={14}
                  color="rgba(255,255,255,0.8)"
                />
                <Text className="text-white/90 text-[13px] font-medium tracking-[-0.1px]" numberOfLines={1}>
                  {getLocationText(heroPlace)}
                </Text>
              </View>
              {heroPlace?.category?.name ? (
                <>
                  <View className="w-1 h-1 rounded-full bg-white/40" />
                  <View className="flex-row items-center gap-1 max-w-[60%]">
                    <MaterialIcons
                      name="category"
                      size={14}
                      color="rgba(255,255,255,0.8)"
                    />
                    <Text className="text-white/90 text-[13px] font-medium tracking-[-0.1px]" numberOfLines={1}>
                      {heroPlace.category.name}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <View className="flex-row items-center gap-3.5 px-[18px] py-[18px] rounded-[24px] bg-white mb-6 border border-black/[0.05]">
          <View className="w-[52px] h-[52px] rounded-[18px] items-center justify-center bg-[#007AFF]/10">
            <MaterialIcons name="bookmark-border" size={26} color="#007AFF" />
          </View>
          <View className="flex-1">
            <Text className="text-[#1D1D1F] text-[16px] font-semibold tracking-[-0.3px] mb-0.5">Bắt đầu lưu địa điểm</Text>
            <Text className="text-[#54647A] text-[13px] tracking-[-0.1px] leading-[18px]">
              Khi bạn lưu địa điểm từ Explore, chúng sẽ hiển thị ở đây.
            </Text>
          </View>
        </View>
      )}

      <View className="flex-row flex-wrap justify-between gap-y-3 mb-7">
        {summary.map((item) => (
          <StatPill
            key={item.key}
            icon={item.icon}
            value={item.value}
            label={item.label}
            tone={item.tone}
          />
        ))}
      </View>

      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[#1D1D1F] text-[20px] font-semibold tracking-[-0.4px]">
          {filteredCount > 0
            ? `Danh sách (${filteredCount})`
            : "Danh sách"}
        </Text>
      </View>

      <View className="gap-3">
        <FilterRow
          title="Bộ sưu tập"
          data={collectionFilterData}
          activeKey={activeCollection}
          onChange={onChangeCollection}
        />
        <FilterRow
          title="Khu vực"
          data={areaFilterData}
          activeKey={activeArea}
          onChange={onChangeArea}
        />
      </View>
    </View>
  );
});
