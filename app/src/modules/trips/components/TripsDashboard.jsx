import { useMemo, useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { LinearGradient } from "expo-linear-gradient";
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
  getDaysUntil,
  calcDayCount,
  toValidDate,
} from "../utils/tripHelpers";
import {
  resolveTripCoverUri,
} from "../../../lib/media-url";

const HERO_COVER_WIDTH = 800;

const STAT_ICONS = {
  blue: { bg: "rgba(29,29,31,0.06)", color: "#1D1D1F" },
  amber: { bg: "rgba(255,159,10,0.1)", color: "#FF9F0A" },
  green: { bg: "rgba(52,199,89,0.1)", color: "#34C759" },
  teal: { bg: "rgba(20,184,166,0.1)", color: "#14B8A6" },
  red: { bg: "rgba(255,59,48,0.1)", color: "#FF3B30" },
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
    <View style={{ paddingHorizontal: TAB_SCREEN_PADDING, paddingTop: 8, paddingBottom: 24 }}>
      {/* ── Header ── */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16, marginBottom: 24 }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text
            style={{ fontSize: 34, fontFamily: TOKENS.font.heading, color: APPLE_THEME.text, letterSpacing: -0.5 }}
          >
            {t('tripDashboard.journey')}
          </Text>
          <Text style={{ fontSize: 15, fontFamily: TOKENS.font.body, color: APPLE_THEME.textMuted, marginTop: 4, letterSpacing: -0.2 }}>
            {(trips?.length ?? 0) > 0
              ? t('tripDashboard.yourTrips', { count: trips.length })
              : t('tripDashboard.createMemory')}
          </Text>
        </View>
        <Pressable
          onPress={onCreate}
          accessibilityLabel={t('tripDashboard.createTripAccessibility')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            width: 44, height: 44, borderRadius: 22,
            alignItems: "center", justifyContent: "center",
            backgroundColor: "#1D1D1F",
          }}
          className="active:opacity-[0.85]"
        >
          <MaterialIconsRounded name="add" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* ── Hero Trip Card ── */}
      {heroTrip ? (
        <Pressable
          onPress={() => onOpenHero(heroTrip.id)}
          style={[styles.heroCard, styles.heroShadow]}
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
          <View style={{ position: "absolute", top: 16, right: 16, zIndex: 2 }}>
            <View
              style={{
                width: 38, height: 38, borderRadius: 19,
                alignItems: "center", justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.2)",
                borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
              }}
            >
              <MaterialIconsRounded name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          </View>

          {/* Bottom content */}
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 24, gap: 10 }}>
            <View style={{ alignSelf: "flex-start", borderRadius: 999, overflow: "hidden", marginBottom: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, gap: 6, backgroundColor: "rgba(255,255,255,0.25)" }}>
                <View
                  style={{
                    width: 6, height: 6, borderRadius: 3,
                    backgroundColor: "#34C759",
                    shadowColor: "#34C759",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 4,
                  }}
                />
                <Text style={{ color: "#FFFFFF", fontSize: 12, fontFamily: TOKENS.font.semibold, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {timelineLabel || t('tripDashboard.upcoming')}
                </Text>
              </View>
            </View>

            <Text
              style={{ color: "#FFFFFF", fontSize: 28, fontFamily: TOKENS.font.heading, lineHeight: 34, letterSpacing: -0.5 }}
              numberOfLines={2}
            >
              {heroTrip.title || t('tripDashboard.newTrip')}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <MaterialIconsRounded name="event" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontFamily: TOKENS.font.medium, letterSpacing: -0.2 }}>
                  {getDateRangeLabel(heroTrip)}
                </Text>
              </View>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.4)", marginHorizontal: 4 }} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <MaterialIconsRounded name="place" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontFamily: TOKENS.font.medium, letterSpacing: -0.2 }}>
                  {t('tripDashboard.destinations', { count: heroTrip.destinations?.length || 0 })}
                </Text>
              </View>
            </View>

            {/* Countdown badge for upcoming trips */}
            {(() => {
              const daysUntil = getDaysUntil(heroTrip?.startDate);
              if (daysUntil === null || daysUntil > 30) return null;
              return (
                <View style={{ alignSelf: "flex-start", marginTop: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,122,255,0.25)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
                    <MaterialIconsRounded name="schedule" size={14} color="#FFFFFF" />
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontFamily: TOKENS.font.semibold, letterSpacing: -0.1 }}>
                      {daysUntil === 0
                        ? t('tripDashboard.startToday')
                        : daysUntil === 1
                          ? t('tripDashboard.startTomorrow')
                          : t('tripDashboard.daysUntil', { count: daysUntil })}
                    </Text>
                  </View>
                </View>
              );
            })()}
          </View>
        </Pressable>
      ) : (
        <Pressable
          onPress={onCreate}
          style={[styles.createCard, styles.createShadow]}
          className="active:opacity-[0.95]"
        >
          <LinearGradient
            colors={["#F8F9FA", "#F1F3F5"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ width: 56, height: 56, borderRadius: 20, overflow: "hidden", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
            <LinearGradient
              colors={["#1D1D1F", "#000000"]}
              style={StyleSheet.absoluteFill}
            />
            <MaterialIconsRounded name="add-location-alt" size={28} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontFamily: TOKENS.font.semibold, color: APPLE_THEME.text, letterSpacing: -0.2, marginBottom: 4 }}>
              {t('tripDashboard.createFirst')}
            </Text>
            <Text style={{ fontSize: 14, fontFamily: TOKENS.font.body, color: APPLE_THEME.textMuted, letterSpacing: -0.2 }}>
              {t('tripDashboard.startExploring')}
            </Text>
          </View>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.06)", alignItems: "center", justifyContent: "center", marginLeft: 12 }}>
            <MaterialIconsRounded name="arrow-forward" size={20} color="#1D1D1F" />
          </View>
        </Pressable>
      )}

      {/* ── Stats Summary Row (Compact, Apple Travel Style, individual white pills) ── */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 24 }}>
        {summary.map((item) => {
          const theme = STAT_ICONS[item.tone] || STAT_ICONS.blue;
          return (
            <View
              key={item.key}
              style={{
                flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "rgba(0,0,0,0.05)",
                paddingVertical: 6, paddingHorizontal: 4, borderRadius: 12,
                shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04, shadowRadius: 6, elevation: 1.5,
              }}
            >
              <MaterialIconsRounded name={item.icon} size={14} color={theme.color} />
              <View style={{ alignItems: "flex-start" }}>
                <Text style={{ fontSize: 13, fontFamily: TOKENS.font.semibold, color: "#1D1D1F", lineHeight: 16 }}>
                  {item.value}
                </Text>
                <Text style={{ fontSize: 9, fontFamily: TOKENS.font.body, color: "#9CA3AF", lineHeight: 12 }}>
                  {item.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* ── Section Header + Apple Custom Segmented Filters ── */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <Text style={{ fontSize: 20, fontFamily: TOKENS.font.semibold, color: APPLE_THEME.text, letterSpacing: -0.2 }}>
          {filteredCount > 0 ? t('tripDashboard.listWithCount', { count: filteredCount }) : t('tripDashboard.list')}
        </Text>
        <View style={{ flexDirection: "row", backgroundColor: "rgba(0,0,0,0.05)", padding: 2, borderRadius: 9, alignItems: "center" }}>
          {FILTERS.map((filter) => {
            const active = activeFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                onPress={() => onSelectFilter(filter.key)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 4, borderRadius: 7,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: active ? "#FFFFFF" : "transparent",
                  ...(active ? {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.12,
                    shadowRadius: 1.5,
                    elevation: 1,
                  } : {}),
                }}
              >
                <Text style={{
                  fontSize: 12, fontFamily: TOKENS.font.semibold, letterSpacing: -0.2,
                  color: active ? "#1D1D1F" : "rgba(0,0,0,0.4)",
                }}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    height: 220,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: "#1C1C1E",
    position: "relative",
  },
  heroShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  createCard: {
    height: 120,
    borderRadius: 24,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    position: "relative",
  },
  createShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
});
