import { memo, useMemo, useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { LinearGradient } from "expo-linear-gradient";
import { cn } from "../../../lib/cn";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../../src/constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import {
  FILTERS,
  buildSummary,
  getHeroTrip,
  getDateRangeLabel,
  getTimelineLabel,
} from "../utils/tripHelpers";
import { resolveMediaUrl, resolvePlaceImageUri } from "../../../lib/media-url";

const STAT_ICONS = {
  blue: { bg: "rgba(29,29,31,0.06)", color: "#1D1D1F" },
  amber: { bg: "rgba(255,159,10,0.1)", color: "#FF9F0A" },
  green: { bg: "rgba(52,199,89,0.1)", color: "#34C759" },
  teal: { bg: "rgba(20,184,166,0.1)", color: "#14B8A6" },
  red: { bg: "rgba(255,59,48,0.1)", color: "#FF3B30" },
};

const StatPill = memo(function StatPill({ icon, value, label, tone }) {
  const theme = STAT_ICONS[tone] || STAT_ICONS.blue;
  return (
    <View
      className="w-[48%] flex-row items-center gap-3 py-4 px-4 rounded-[20px] bg-white"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center"
        style={{ backgroundColor: theme.bg }}
      >
        <MaterialIconsRounded name={icon} size={20} color={theme.color} />
      </View>
      <View className="flex-1">
        <Text
          className="text-[22px] font-heading tracking-tight"
          style={{ color: APPLE_THEME.text }}
        >
          {value}
        </Text>
        <Text className="text-xs font-medium mt-0.5" style={{ color: APPLE_THEME.textMuted }}>
          {label}
        </Text>
      </View>
    </View>
  );
});

export function TripsDashboard({
  trips,
  filteredCount,
  activeFilter,
  onSelectFilter,
  onOpenHero,
  onCreate,
}) {
  const heroTrip = useMemo(() => getHeroTrip(trips), [trips]);
  const summary = useMemo(() => buildSummary(trips), [trips]);

  const heroCover = heroTrip
    ? (heroTrip.thumbnail
      ? resolveMediaUrl(heroTrip.thumbnail)
      : resolvePlaceImageUri(heroTrip.destinations?.[0]?.place))
    : null;

  const fallbackCover = "https://picsum.photos/id/408/600/400";
  const [imgSrc, setImgSrc] = useState(heroCover ? { uri: heroCover } : { uri: fallbackCover });

  useEffect(() => {
    setImgSrc(heroCover ? { uri: heroCover } : { uri: fallbackCover });
  }, [heroCover]);

  const timelineLabel = heroTrip ? getTimelineLabel(heroTrip) : null;

  return (
    <View style={{ paddingHorizontal: TAB_SCREEN_PADDING }} className="pt-2 pb-6">
      {/* ── Header ── */}
      <View className="flex-row items-center justify-between mt-4 mb-6">
        <View>
          <Text
            className="text-[34px] font-heading tracking-tight"
            style={{ color: APPLE_THEME.text }}
          >
            Hành trình
          </Text>
          <Text className="text-[15px] font-body mt-1 tracking-tight" style={{ color: APPLE_THEME.textMuted }}>
            {(trips?.length ?? 0) > 0
              ? `${trips.length} chuyến đi của bạn`
              : "Khởi tạo kỷ niệm mới"}
          </Text>
        </View>
      </View>

      {/* ── Hero Trip Card ── */}
      {heroTrip ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onOpenHero(heroTrip.id)}
          className="h-[280px] rounded-3xl overflow-hidden mb-6 bg-[#1C1C1E] relative"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          {heroCover ? (
            <Image
              source={imgSrc}
              style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
              onError={() => setImgSrc({ uri: fallbackCover })}
            />
          ) : (
            <LinearGradient
              colors={["#2C2C2E", "#1C1C1E", "#000000"]}
              style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
            />
          )}
          <LinearGradient
            colors={[
              "rgba(0,0,0,0.1)",
              "rgba(0,0,0,0.3)",
              "rgba(0,0,0,0.7)",
              "rgba(0,0,0,0.9)",
            ]}
            locations={[0, 0.4, 0.7, 1]}
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
          />

          {/* Top-right arrow */}
          <View className="absolute top-4 right-4 z-[2]">
            <View
              className="w-[38px] h-[38px] rounded-[19px] items-center justify-center overflow-hidden bg-white/20 border border-white/30"
            >
              <MaterialIconsRounded name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          </View>

          {/* Bottom content */}
          <View className="absolute bottom-0 left-0 right-0 p-6 gap-2.5">
            <View className="self-start rounded-full overflow-hidden mb-1">
              <View className="flex-row items-center px-3 py-1.5 gap-1.5 bg-white/25">
                <View
                  className="w-1.5 h-1.5 rounded-full bg-green-500"
                  style={{
                    shadowColor: "#34C759",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 4,
                  }}
                />
                <Text className="text-white text-xs font-bold uppercase tracking-[0.5px]">
                  {timelineLabel || "Sắp tới"}
                </Text>
              </View>
            </View>

            <Text className="text-white text-[28px] font-heading leading-[34px] tracking-tight" numberOfLines={2}>
              {heroTrip.title || "Chuyến đi mới"}
            </Text>

            <View className="flex-row items-center gap-2 mt-1">
              <View className="flex-row items-center gap-1">
                <MaterialIconsRounded name="event" size={14} color="rgba(255,255,255,0.8)" />
                <Text className="text-white/90 text-sm font-medium tracking-tight">
                  {getDateRangeLabel(heroTrip)}
                </Text>
              </View>
              <View className="w-1 h-1 rounded-full bg-white/40 mx-1" />
              <View className="flex-row items-center gap-1">
                <MaterialIconsRounded name="place" size={14} color="rgba(255,255,255,0.8)" />
                <Text className="text-white/90 text-sm font-medium tracking-tight">
                  {heroTrip.destinations?.length || 0} điểm đến
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onCreate}
          className="h-[120px] rounded-[24px] overflow-hidden flex-row items-center px-5 mb-6 border border-black/5"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <LinearGradient
            colors={["#F8F9FA", "#F1F3F5"]}
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
          />
          <View className="w-14 h-14 rounded-[20px] overflow-hidden items-center justify-center mr-4">
            <LinearGradient
              colors={["#1D1D1F", "#000000"]}
              style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
            />
            <MaterialIconsRounded name="add-location-alt" size={28} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-[17px] font-semibold tracking-tight mb-1" style={{ color: APPLE_THEME.text }}>
              Tạo chuyến đi đầu tiên
            </Text>
            <Text className="text-sm font-body tracking-tight" style={{ color: APPLE_THEME.textMuted }}>
              Bắt đầu hành trình khám phá thế giới của bạn
            </Text>
          </View>
          <View className="w-8 h-8 rounded-[16px] bg-black/[0.06] items-center justify-center ml-3">
            <MaterialIconsRounded name="arrow-forward" size={20} color="#1D1D1F" />
          </View>
        </TouchableOpacity>
      )}

      {/* ── Stats Strip (Grid) ── */}
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

      {/* ── Section Header + Filters ── */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-xl font-semibold tracking-tight" style={{ color: APPLE_THEME.text }}>
          {filteredCount > 0 ? `Danh sách (${filteredCount})` : "Danh sách"}
        </Text>
        <View className="flex-row gap-2">
          {FILTERS.map((filter) => {
            const active = activeFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                activeOpacity={0.7}
                onPress={() => onSelectFilter(filter.key)}
                className={cn(
                  "rounded-full px-4 py-2",
                  active ? "bg-[#1D1D1F]" : "bg-gray-100",
                )}
              >
                <Text
                  className={cn(
                    "text-[13px] font-semibold tracking-tight",
                    active ? "text-white" : "",
                  )}
                  style={!active ? { color: APPLE_THEME.textMuted } : undefined}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
