import { Fragment, useMemo, useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import { Box, Text, Pressable } from "../../../components/primitives";
import { cn } from "../../../lib/cn";
import {
  buildSummary,
  getHeroTrip,
  getDateRangeLabel,
  getTimelineLabel,
  getDaysUntil,
  getTripFilters,
} from "../utils/tripHelpers";
import { resolveTripCoverUri } from "../../../lib/media-url";

const HERO_COVER_WIDTH = 800;

const STAT_ICON_THEME = {
  blue: { color: "#1D1D1F" },
  amber: { color: "#FF9F0A" },
  green: { color: "#34C759" },
  teal: { color: "#14B8A6" },
  red: { color: "#FF3B30" },
};

export function TripsDashboard({
  trips,
  filteredCount,
  activeFilter,
  onSelectFilter,
  onOpenHero,
  onCreate,
}) {
  const { t } = useTranslation();
  const heroTrip = useMemo(() => getHeroTrip(trips), [trips]);
  const summary = useMemo(() => buildSummary(trips), [trips]);
  const filters = getTripFilters();

  const heroCoverUri = useMemo(
    () => (heroTrip ? resolveTripCoverUri(heroTrip, HERO_COVER_WIDTH) : null),
    [heroTrip],
  );

  const [imgSrc, setImgSrc] = useState({ uri: heroCoverUri });

  useEffect(() => {
    setImgSrc((current) => {
      if (current?.uri === heroCoverUri) return current;
      return { uri: heroCoverUri };
    });
  }, [heroCoverUri, heroTrip?.id]);

  const timelineLabel = heroTrip ? getTimelineLabel(heroTrip) : null;
  const heroDaysUntil = useMemo(
    () => getDaysUntil(heroTrip?.startDate),
    [heroTrip?.startDate],
  );

  return (
    <Box className="px-6 pt-2 pb-6">
      {/* ── Header ── */}
      <Box className="flex-row items-center justify-between mt-2.5 mb-4">
        <Box className="flex-1 pr-3">
          <Text className="text-[28px] font-semibold text-ink">
            {t("tripDashboard.journey")}
          </Text>
          <Text className="text-[14px] mt-1 text-ink-muted">
            {(trips?.length ?? 0) > 0
              ? t("tripDashboard.yourTrips", { count: trips.length })
              : t("tripDashboard.createMemory")}
          </Text>
        </Box>
        <Pressable
          onPress={onCreate}
          accessibilityLabel={t("tripDashboard.createTripAccessibility")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="w-11 h-11 rounded-full items-center justify-center bg-ink active:opacity-[0.85]"
        >
          <MaterialIconsRounded name="add" size={26} color="#FFFFFF" />
        </Pressable>
      </Box>

      {/* ── Hero Trip Card ── */}
      {heroTrip ? (
        <Pressable
          onPress={() => onOpenHero(heroTrip.id)}
          className="h-[176px] rounded-2xl overflow-hidden mb-4 bg-[#1C1C1E]"
          style={SHADOW.hero}
        >
          {imgSrc?.uri ? (
            <Image
              source={imgSrc}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
              onError={() => setImgSrc({ uri: null })}
            />
          ) : null}
          <Box className="absolute inset-0 bg-black/35" pointerEvents="none" />

          <Box className="absolute top-3 left-3 rounded-full overflow-hidden">
            <Box className="flex-row items-center px-3 py-1.5 gap-1.5 bg-white/90">
              <Box className="w-1.5 h-1.5 rounded-full bg-success" />
              <Text className="text-[11px] uppercase font-semibold text-ink">
                {timelineLabel || t("tripDashboard.upcoming")}
              </Text>
            </Box>
          </Box>

          <Box className="absolute bottom-0 left-0 right-0 p-4 gap-2.5">
            <Text
              className="text-white text-[22px] leading-[27px] font-semibold"
              numberOfLines={2}
            >
              {heroTrip.title || t("tripDashboard.newTrip")}
            </Text>

            <Box className="flex-row items-center flex-wrap gap-2">
              <Box className="flex-row items-center gap-1.5 bg-white/20 px-2.5 py-1.5 rounded-full">
                <MaterialIconsRounded name="event" size={14} color="rgba(255,255,255,0.8)" />
                <Text className="text-white text-xs font-medium">
                  {getDateRangeLabel(heroTrip)}
                </Text>
              </Box>
              <Box className="flex-row items-center gap-1.5 bg-white/20 px-2.5 py-1.5 rounded-full">
                <MaterialIconsRounded name="place" size={14} color="rgba(255,255,255,0.8)" />
                <Text className="text-white text-xs font-medium">
                  {t("tripDashboard.destinations", {
                    count: heroTrip.destinations?.length || 0,
                  })}
                </Text>
              </Box>
            </Box>

            {heroDaysUntil !== null && heroDaysUntil <= 30 ? (
              <Box className="self-start">
                <Box className="flex-row items-center gap-1.5 bg-white/90 rounded-full px-3 py-[5px]">
                  <MaterialIconsRounded name="schedule" size={14} color="#1D1D1F" />
                  <Text className="text-ink text-[12px] font-semibold">
                    {heroDaysUntil === 0
                      ? t("tripDashboard.startToday")
                      : heroDaysUntil === 1
                        ? t("tripDashboard.startTomorrow")
                        : t("tripDashboard.daysUntil", { count: heroDaysUntil })}
                  </Text>
                </Box>
              </Box>
            ) : null}
          </Box>
        </Pressable>
      ) : (
        <Pressable
          onPress={onCreate}
          className="h-[116px] rounded-2xl overflow-hidden flex-row items-center px-5 mb-5 border border-black/5 bg-white relative active:opacity-[0.95]"
          style={SHADOW.create}
        >
          <Box className="w-14 h-14 rounded-[18px] bg-ink items-center justify-center mr-4">
            <MaterialIconsRounded name="add-location-alt" size={28} color="#FFFFFF" />
          </Box>
          <Box className="flex-1">
            <Text className="text-[17px] mb-1 font-semibold text-ink">
              {t("tripDashboard.createFirst")}
            </Text>
            <Text className="text-sm text-ink-muted">
              {t("tripDashboard.startExploring")}
            </Text>
          </Box>
          <Box className="w-8 h-8 rounded-full bg-black/[0.06] items-center justify-center ml-3">
            <MaterialIconsRounded name="arrow-forward" size={20} color="#1D1D1F" />
          </Box>
        </Pressable>
      )}

      {/* ── Stats Summary Strip (unified card, hairline dividers) ── */}
      <Box
        className="flex-row items-stretch bg-white rounded-lg border border-black/5 py-3.5 mb-6"
        style={SHADOW.stats}
      >
        {summary.map((item, idx) => {
          const theme = STAT_ICON_THEME[item.tone] || STAT_ICON_THEME.blue;
          return (
            <Fragment key={item.key}>
              {idx > 0 ? <Box style={DIVIDER_STYLE} /> : null}
              <Box className="flex-1 items-center justify-center gap-1 px-1">
                <MaterialIconsRounded name={item.icon} size={16} color={theme.color} />
                <Text className="text-[19px] leading-[23px] font-bold text-ink">
                  {item.value}
                </Text>
                <Text
                  className="text-xs leading-[14px] text-ink-muted"
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </Box>
            </Fragment>
          );
        })}
      </Box>

      {/* ── Section Header + Apple Custom Segmented Filters ── */}
      <Box className="flex-row items-center justify-between mb-4">
        <Text className="text-xl font-semibold text-ink">
          {filteredCount > 0
            ? t("tripDashboard.listWithCount", { count: filteredCount })
            : t("tripDashboard.list")}
        </Text>
        <Box className="flex-row bg-white border border-black/5 p-0.5 rounded-[9px] items-center">
          {filters.map((filter) => {
            const active = activeFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                onPress={() => onSelectFilter(filter.key)}
                className={cn(
                  "px-3 py-1 rounded-[7px] items-center justify-center",
                  active ? "bg-black/[0.06]" : "bg-transparent",
                )}
                style={active ? SHADOW.filter : undefined}
              >
                <Text
                  className={cn(
                    "text-xs font-semibold",
                    active ? "text-ink" : "text-ink-muted",
                  )}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

/* Shadow styles — kept in StyleSheet (complex multi-property shadows not expressible in className) */
const SHADOW = {
  hero: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 8,
  },
  create: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  stats: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  filter: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1.5,
    elevation: 1,
  },
};

const DIVIDER_STYLE = {
  width: StyleSheet.hairlineWidth,
  alignSelf: "stretch",
  marginVertical: 4,
  backgroundColor: "rgba(0,0,0,0.08)",
};
