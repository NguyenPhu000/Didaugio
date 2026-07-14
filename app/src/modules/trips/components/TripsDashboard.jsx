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

const SUMMARY_TONES = ["#18181B", "#52525B", "#71717A"];

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
    <Box className="px-5 pt-3 pb-7">
      {/* ── Header ── */}
      <Box className="flex-row items-center justify-between mt-1 mb-5">
        <Box className="flex-1 pr-3">
          <Text className="text-[30px] leading-[35px] font-semibold text-ink">
            {t("tripDashboard.journey")}
          </Text>
          <Text className="text-[14px] mt-0.5 text-ink-muted">
            {(trips?.length ?? 0) > 0
              ? t("tripDashboard.yourTrips", { count: trips.length })
              : t("tripDashboard.createMemory")}
          </Text>
        </Box>
        <Pressable
          onPress={onCreate}
          accessibilityLabel={t("tripDashboard.createTripAccessibility")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="w-12 h-12 rounded-full items-center justify-center bg-[#18181B] active:opacity-[0.85]"
        >
          <MaterialIconsRounded name="add" size={26} color="#FFFFFF" />
        </Pressable>
      </Box>

      {/* ── Hero Trip Card ── */}
      {heroTrip ? (
        <Pressable
          onPress={() => onOpenHero(heroTrip.id)}
          className="h-[232px] rounded-[26px] overflow-hidden mb-5 bg-[#173B39] active:opacity-95"
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
          <Box className="absolute inset-0 bg-black/15" pointerEvents="none" />
          <Box className="absolute bottom-0 left-0 right-0 h-[72%] bg-black/55" pointerEvents="none" />

          <Box className="absolute top-4 left-4 rounded-full overflow-hidden">
            <Box className="flex-row items-center px-3 py-1.5 gap-1.5 bg-white/90">
              <Box className="w-1.5 h-1.5 rounded-full bg-success" />
              <Text className="text-[11px] uppercase font-semibold text-ink">
                {timelineLabel || t("tripDashboard.upcoming")}
              </Text>
            </Box>
          </Box>

          <Box className="absolute bottom-0 left-0 right-0 p-5 gap-2">
            <Text
              className="text-white text-[28px] leading-[32px] font-semibold"
              numberOfLines={2}
            >
              {heroTrip.title || t("tripDashboard.newTrip")}
            </Text>

            <Box className="flex-row items-center gap-2">
              <Box className="flex-row flex-1 items-center gap-1.5">
                <MaterialIconsRounded name="event" size={14} color="rgba(255,255,255,0.8)" />
                <Text className="flex-1 text-white text-[13px] font-medium" numberOfLines={1}>
                  {getDateRangeLabel(heroTrip)}
                </Text>
              </Box>
              <Box className="flex-row items-center gap-1.5">
                <MaterialIconsRounded name="place" size={14} color="rgba(255,255,255,0.8)" />
                <Text className="text-white text-[13px] font-medium">
                  {t("tripDashboard.destinations", {
                    count: heroTrip.destinations?.length || 0,
                  })}
                </Text>
              </Box>
            </Box>

            {heroDaysUntil !== null && heroDaysUntil <= 30 ? (
              <Text className="text-[12px] font-semibold text-white/80">
                {heroDaysUntil === 0
                  ? t("tripDashboard.startToday")
                  : heroDaysUntil === 1
                    ? t("tripDashboard.startTomorrow")
                    : t("tripDashboard.daysUntil", { count: heroDaysUntil })}
              </Text>
            ) : null}
          </Box>
        </Pressable>
      ) : (
        <Pressable
          onPress={onCreate}
          className="h-[232px] rounded-[26px] overflow-hidden mb-5 bg-[#18181B] active:opacity-95"
          style={SHADOW.create}
        >
          <Box className="absolute -right-8 -top-10 h-44 w-44 rounded-full bg-white/[0.06]" pointerEvents="none" />
          <Box className="absolute -left-10 -bottom-16 h-40 w-40 rounded-full bg-white/[0.04]" pointerEvents="none" />
          <Box className="flex-1 justify-end p-5">
            <Box className="mb-4 h-11 w-11 items-center justify-center rounded-full bg-white">
              <MaterialIconsRounded name="add-location-alt" size={21} color="#18181B" />
            </Box>
            <Text className="max-w-[260px] text-[28px] leading-[32px] font-semibold text-white">
              {t("tripDashboard.createFirst")}
            </Text>
            <Box className="mt-2 flex-row items-center gap-2">
              <Text className="flex-1 text-[14px] leading-[20px] text-white/70">
                {t("tripDashboard.startExploring")}
              </Text>
              <Box className="h-10 w-10 items-center justify-center rounded-full bg-white">
                <MaterialIconsRounded name="arrow-forward" size={20} color="#18181B" />
              </Box>
            </Box>
          </Box>
        </Pressable>
      )}

      {/* ── Stats Summary Strip (unified card, hairline dividers) ── */}
      <Box
        className="flex-row items-stretch bg-[#F2F2F3] rounded-[18px] py-3.5 mb-7"
        style={SHADOW.stats}
      >
        {summary.slice(0, 3).map((item, idx) => {
          const color = SUMMARY_TONES[idx];
          return (
            <Fragment key={item.key}>
              {idx > 0 ? <Box style={DIVIDER_STYLE} /> : null}
              <Box className="flex-1 items-center justify-center gap-1 px-1">
                <MaterialIconsRounded name={item.icon} size={16} color={color} />
                <Text className="text-[20px] leading-[23px] font-bold text-ink">
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
        <Text className="text-[20px] font-semibold text-ink">
          {filteredCount > 0
            ? t("tripDashboard.listWithCount", { count: filteredCount })
            : t("tripDashboard.list")}
        </Text>
        <Box className="flex-row bg-[#EEF0EF] p-0.5 rounded-[10px] items-center">
          {filters.map((filter) => {
            const active = activeFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                onPress={() => onSelectFilter(filter.key)}
                className={cn(
                  "px-3 py-1 rounded-[7px] items-center justify-center",
                  active ? "bg-white" : "bg-transparent",
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
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 7,
  },
  create: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  stats: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
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
