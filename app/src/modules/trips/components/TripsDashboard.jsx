import { Fragment, useMemo, useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { Box, Text, Pressable } from "@/components/primitives";
import { cn } from "@/lib/cn";
import { LinearGradient } from "expo-linear-gradient";
import {
  FILTERS,
  buildSummary,
  getHeroTrip,
  getDateRangeLabel,
  getTimelineLabel,
  getDaysUntil,
  calcDayCount,
  toValidDate,
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

  const heroCoverUri = useMemo(
    () => (heroTrip ? resolveTripCoverUri(heroTrip, HERO_COVER_WIDTH) : null),
    [heroTrip],
  );

  const [imgSrc, setImgSrc] = useState({ uri: heroCoverUri });

  useEffect(() => {
    setImgSrc({ uri: heroCoverUri });
  }, [heroCoverUri]);

  const timelineLabel = heroTrip ? getTimelineLabel(heroTrip) : null;

  return (
    <Box className="px-6 pt-2 pb-6">
      {/* ── Header ── */}
      <Box className="flex-row items-center justify-between mt-2.5 mb-[18px]">
        <Box className="flex-1 pr-3">
          <Text className="text-[34px] font-bold text-ink tracking-[-0.5px]">
            {t("tripDashboard.journey")}
          </Text>
          <Text className="text-[15px] mt-1 tracking-[-0.2px] text-ink-muted">
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
          className="h-[224px] rounded-3xl overflow-hidden mb-5 bg-[#1C1C1E]"
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
          <LinearGradient
            colors={[
              "rgba(0,0,0,0.05)",
              "rgba(0,0,0,0.2)",
              "rgba(0,0,0,0.6)",
              "rgba(0,0,0,0.85)",
            ]}
            locations={[0, 0.35, 0.65, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Top-right arrow */}
          <Box className="absolute top-4 right-4 z-[2]">
            <Box className="w-[38px] h-[38px] rounded-full items-center justify-center bg-white/20 border border-white/30">
              <MaterialIconsRounded name="arrow-forward" size={18} color="#FFFFFF" />
            </Box>
          </Box>

          {/* Bottom content */}
          <Box className="absolute bottom-0 left-0 right-0 p-6 gap-2.5">
            <Box className="self-start rounded-full overflow-hidden mb-1">
              <Box className="flex-row items-center px-3 py-1.5 gap-1.5 bg-white/25">
                <Box className="w-1.5 h-1.5 rounded-full bg-success" style={SHADOW.greenGlow} />
                <Text className="text-white text-xs uppercase tracking-[0.5px] font-semibold">
                  {timelineLabel || t("tripDashboard.upcoming")}
                </Text>
              </Box>
            </Box>

            <Text
              className="text-white text-[28px] leading-[34px] tracking-[-0.5px] font-bold"
              numberOfLines={2}
            >
              {heroTrip.title || t("tripDashboard.newTrip")}
            </Text>

            <Box className="flex-row items-center gap-2 mt-1">
              <Box className="flex-row items-center gap-1">
                <MaterialIconsRounded name="event" size={14} color="rgba(255,255,255,0.8)" />
                <Text className="text-white/90 text-sm tracking-[-0.2px] font-medium">
                  {getDateRangeLabel(heroTrip)}
                </Text>
              </Box>
              <Box className="w-1 h-1 rounded-full bg-white/40 mx-1" />
              <Box className="flex-row items-center gap-1">
                <MaterialIconsRounded name="place" size={14} color="rgba(255,255,255,0.8)" />
                <Text className="text-white/90 text-sm tracking-[-0.2px] font-medium">
                  {t("tripDashboard.destinations", {
                    count: heroTrip.destinations?.length || 0,
                  })}
                </Text>
              </Box>
            </Box>

            {/* Countdown badge for upcoming trips */}
            {(() => {
              const daysUntil = getDaysUntil(heroTrip?.startDate);
              if (daysUntil === null || daysUntil > 30) return null;
              return (
                <Box className="self-start mt-1">
                  <Box className="flex-row items-center gap-1.5 bg-blue-500/25 rounded-full px-3 py-[5px]">
                    <MaterialIconsRounded name="schedule" size={14} color="#FFFFFF" />
                    <Text className="text-white text-[13px] tracking-[-0.1px] font-semibold">
                      {daysUntil === 0
                        ? t("tripDashboard.startToday")
                        : daysUntil === 1
                          ? t("tripDashboard.startTomorrow")
                          : t("tripDashboard.daysUntil", { count: daysUntil })}
                    </Text>
                  </Box>
                </Box>
              );
            })()}
          </Box>
        </Pressable>
      ) : (
        <Pressable
          onPress={onCreate}
          className="h-[120px] rounded-3xl overflow-hidden flex-row items-center px-5 mb-6 border border-black/5 relative active:opacity-[0.95]"
          style={SHADOW.create}
        >
          <LinearGradient
            colors={["#F8F9FA", "#F1F3F5"]}
            style={StyleSheet.absoluteFill}
          />
          <Box className="w-14 h-14 rounded-[20px] overflow-hidden items-center justify-center mr-4">
            <LinearGradient
              colors={["#1D1D1F", "#000000"]}
              style={StyleSheet.absoluteFill}
            />
            <MaterialIconsRounded name="add-location-alt" size={28} color="#FFFFFF" />
          </Box>
          <Box className="flex-1">
            <Text className="text-[17px] tracking-[-0.2px] mb-1 font-semibold text-ink">
              {t("tripDashboard.createFirst")}
            </Text>
            <Text className="text-sm tracking-[-0.2px] text-ink-muted">
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
                <Text className="text-[19px] leading-[23px] tracking-[-0.3px] font-bold text-ink">
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
        <Text className="text-xl tracking-[-0.2px] font-semibold text-ink">
          {filteredCount > 0
            ? t("tripDashboard.listWithCount", { count: filteredCount })
            : t("tripDashboard.list")}
        </Text>
        <Box className="flex-row bg-black/5 p-0.5 rounded-[9px] items-center">
          {FILTERS.map((filter) => {
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
                    "text-xs tracking-[-0.2px] font-semibold",
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
  greenGlow: {
    shadowColor: "#34C759",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
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
