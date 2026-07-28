import { Fragment, useMemo, useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import { Box, Text, Pressable } from "../../../components/primitives";
import { cn } from "../../../lib/cn";
import {
  buildSummary,
  getHeroTrip,
  getHeroTrips,
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
  const heroTrips = useMemo(() => getHeroTrips(trips), [trips]);
  const summary = useMemo(() => buildSummary(trips), [trips]);
  const filters = getTripFilters();

  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-advance slide every 10 seconds (10,000 ms)
  useEffect(() => {
    if (heroTrips.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroTrips.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [heroTrips.length]);

  // Keep activeIndex within bounds if trips change
  const safeIndex = activeIndex >= heroTrips.length ? 0 : activeIndex;
  const currentHeroTrip = heroTrips[safeIndex] || null;

  const heroCoverUri = useMemo(
    () => (currentHeroTrip ? resolveTripCoverUri(currentHeroTrip, HERO_COVER_WIDTH) : null),
    [currentHeroTrip],
  );

  const [imgSrc, setImgSrc] = useState({ uri: heroCoverUri });

  useEffect(() => {
    setImgSrc((current) => {
      if (current?.uri === heroCoverUri) return current;
      return { uri: heroCoverUri };
    });
  }, [heroCoverUri, currentHeroTrip?.id]);

  const timelineLabel = currentHeroTrip ? getTimelineLabel(currentHeroTrip) : null;
  const heroDaysUntil = useMemo(
    () => getDaysUntil(currentHeroTrip?.startDate),
    [currentHeroTrip?.startDate],
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

      {/* ── Hero Trip Carousel Card (Awwwards-Tier Auto-Sliding 10s) ── */}
      {currentHeroTrip ? (
        <Box className="-mx-2 p-1.5 rounded-[32px] bg-white/10 border border-white/20 mb-6 shadow-2xl">
          <Pressable
            onPress={() => onOpenHero(currentHeroTrip.id)}
            className="h-[310px] rounded-[26px] overflow-hidden bg-[#08090C] border border-white/20 active:opacity-95"
            style={SHADOW.hero}
          >
            {imgSrc?.uri ? (
              <Image
                source={imgSrc}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={350}
                cachePolicy="memory-disk"
                onError={() => setImgSrc({ uri: null })}
              />
            ) : (
              <Box className="absolute inset-0 bg-[#0D0E12]" />
            )}

            {/* 3-Stop Cinematic Gradient Overlay */}
            <LinearGradient
              colors={["transparent", "rgba(8, 9, 12, 0.4)", "rgba(8, 9, 12, 0.96)"]}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />

            {/* Top Header: Floating Status Pill (Left), Pagination Dots (Center), Arrow (Right) */}
            <Box className="absolute top-4 left-4 right-4 flex-row items-center justify-between z-10">
              <Box className="flex-row items-center px-3.5 py-1.5 gap-2 bg-black/60 border border-white/30 rounded-full">
                <Box className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
                <Text className="text-[11px] uppercase font-bold text-white tracking-[0.12em]">
                  {timelineLabel || t("tripDashboard.upcoming")}
                </Text>
              </Box>

              {/* Carousel Pagination Dots (when multiple active/upcoming trips) */}
              {heroTrips.length > 1 ? (
                <Box className="flex-row items-center gap-1.5 px-3 py-1.5 bg-black/60 border border-white/30 rounded-full">
                  {heroTrips.map((tItem, idx) => (
                    <Pressable
                      key={tItem.id || idx}
                      onPress={(e) => {
                        e.stopPropagation();
                        setActiveIndex(idx);
                      }}
                      hitSlop={6}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        idx === safeIndex ? "w-4 bg-white" : "w-1.5 bg-white/40",
                      )}
                    />
                  ))}
                </Box>
              ) : null}

              {/* Button-in-Button Trailing Action Icon */}
              <Box className="w-9 h-9 rounded-full bg-black/60 border border-white/30 items-center justify-center">
                <MaterialIconsRounded name="arrow-forward" size={17} color="#FFFFFF" />
              </Box>
            </Box>

            {/* Bottom Content Area: Expanded Breathing Room & Premium Typography */}
            <Box className="absolute bottom-0 left-0 right-0 p-6 gap-3 z-20">
              <Text
                className="text-white text-[26px] leading-[31px] font-extrabold tracking-[-0.6px]"
                numberOfLines={2}
              >
                {currentHeroTrip.title || t("tripDashboard.newTrip")}
              </Text>

              <Box className="flex-row flex-wrap items-center justify-between gap-y-2 pt-3 border-t border-white/25">
                <Box className="flex-row items-center gap-2 shrink-0">
                  <MaterialIconsRounded name="event" size={15} color="#FFFFFF" />
                  <Text className="text-white text-[13.5px] font-bold" style={{ fontVariant: ["tabular-nums"] }} numberOfLines={1}>
                    {getDateRangeLabel(currentHeroTrip)}
                  </Text>
                </Box>

                <Box className="flex-row items-center gap-3 shrink-0">
                  <Box className="flex-row items-center gap-1.5">
                    <MaterialIconsRounded name="place" size={15} color="#FFFFFF" />
                    <Text className="text-white text-[13.5px] font-bold" style={{ fontVariant: ["tabular-nums"] }}>
                      {t("tripDashboard.destinations", {
                        count: currentHeroTrip.destinations?.length || 0,
                      })}
                    </Text>
                  </Box>

                  {heroDaysUntil !== null && heroDaysUntil >= 0 && heroDaysUntil <= 30 ? (
                    <Box className="px-2.5 py-1 rounded-full bg-white/20 border border-white/30">
                      <Text className="text-[11px] font-extrabold text-white tracking-wide" style={{ fontVariant: ["tabular-nums"] }}>
                        {heroDaysUntil === 0
                          ? t("tripDashboard.startToday")
                          : heroDaysUntil === 1
                            ? t("tripDashboard.startTomorrow")
                            : t("tripDashboard.daysUntil", { count: heroDaysUntil })}
                      </Text>
                    </Box>
                  ) : null}
                </Box>
              </Box>
            </Box>
          </Pressable>
        </Box>
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

      {/* ── Apple Custom Segmented Filters ── */}
      <Box className="flex-row items-center justify-end mb-3">
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
