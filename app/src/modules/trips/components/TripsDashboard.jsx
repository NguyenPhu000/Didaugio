import { memo, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
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
} from "../utils/tripHelpers";

const STAT_ICONS = {
  blue: { bg: "rgba(0,122,255,0.1)", color: "#007AFF" },
  amber: { bg: "rgba(255,159,10,0.1)", color: "#FF9F0A" },
  green: { bg: "rgba(52,199,89,0.1)", color: "#34C759" },
  teal: { bg: "rgba(20,184,166,0.1)", color: "#14B8A6" },
  red: { bg: "rgba(255,59,48,0.1)", color: "#FF3B30" },
};

const StatPill = memo(function StatPill({ icon, value, label, tone }) {
  const theme = STAT_ICONS[tone] || STAT_ICONS.blue;
  return (
    <View style={styles.statPill}>
      <View style={[styles.statIconWrap, { backgroundColor: theme.bg }]}>
        <MaterialIcons name={icon} size={16} color={theme.color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
});

export function TripsDashboard({
  trips,
  filteredCount,
  activeFilter,
  onSelectFilter,
  onOpenHero,
}) {
  const heroTrip = useMemo(() => getHeroTrip(trips), [trips]);
  const summary = useMemo(() => buildSummary(trips), [trips]);

  const heroCover = heroTrip
    ? heroTrip.thumbnail || heroTrip.destinations?.[0]?.place?.thumbnail
    : null;

  const timelineLabel = heroTrip ? getTimelineLabel(heroTrip) : null;

  return (
    <View style={styles.dashboardWrap}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Chuyến đi</Text>
          <Text style={styles.headerSubtitle}>
            {trips.length > 0
              ? `${trips.length} hành trình`
              : "Bắt đầu lập kế hoạch"}
          </Text>
        </View>
      </View>

      {/* ── Hero Trip Card ── */}
      {heroTrip ? (
        <Pressable
          onPress={() => onOpenHero(heroTrip.id)}
          style={({ pressed }) => [
            styles.heroCard,
            pressed && { transform: [{ scale: 0.975 }] },
          ]}
        >
          {heroCover ? (
            <Image
              source={{ uri: heroCover }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
            />
          ) : (
            <LinearGradient
              colors={["#2C2C2E", "#1C1C1E", "#000000"]}
              style={StyleSheet.absoluteFill}
            />
          )}
          <LinearGradient
            colors={[
              "transparent",
              "rgba(0,0,0,0.15)",
              "rgba(0,0,0,0.55)",
              "rgba(0,0,0,0.85)",
            ]}
            locations={[0, 0.3, 0.65, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Top-right arrow */}
          <View style={styles.heroTopRow}>
            <View style={styles.heroArrow}>
              <MaterialIcons
                name="arrow-forward"
                size={16}
                color="rgba(255,255,255,0.9)"
              />
            </View>
          </View>

          {/* Bottom content */}
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <View style={styles.heroDot} />
              <Text style={styles.heroBadgeText}>
                {timelineLabel || "Sắp tới"}
              </Text>
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {heroTrip.title || "Chuyến đi mới"}
            </Text>
            <View style={styles.heroMeta}>
              <MaterialIcons
                name="event"
                size={13}
                color="rgba(255,255,255,0.75)"
              />
              <Text style={styles.heroMetaText}>
                {getDateRangeLabel(heroTrip)}
              </Text>
              <View style={styles.heroMetaDivider} />
              <MaterialIcons
                name="place"
                size={13}
                color="rgba(255,255,255,0.75)"
              />
              <Text style={styles.heroMetaText}>
                {heroTrip.destinations?.length || 0} điểm đến
              </Text>
            </View>
          </View>
        </Pressable>
      ) : (
        <Pressable
          onPress={onCreate}
          style={({ pressed }) => [
            styles.heroEmpty,
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={styles.heroEmptyIcon}>
            <MaterialIcons name="add-location-alt" size={28} color="#1D1D1F" />
          </View>
          <Text style={styles.heroEmptyTitle}>Tạo chuyến đi đầu tiên</Text>
          <Text style={styles.heroEmptyCopy}>
            Lên kế hoạch cho kỳ nghỉ sắp tới của bạn
          </Text>
        </Pressable>
      )}

      {/* ── Stats Strip ── */}
      <View style={styles.statsRow}>
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
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>
          {filteredCount > 0 ? `${filteredCount} chuyến` : "Chuyến đi"}
        </Text>
        <View style={styles.filterGroup}>
          {FILTERS.map((filter) => {
            const active = activeFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                onPress={() => onSelectFilter(filter.key)}
                style={[
                  styles.filterChip,
                  active && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
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
  dashboardWrap: {
    paddingHorizontal: TAB_SCREEN_PADDING,
    paddingTop: 8,
    paddingBottom: 20,
  },

  /* ── Header ── */
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 20,
  },
  headerTitle: {
    color: APPLE_THEME.text,
    fontSize: 32,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    color: APPLE_THEME.textMuted,
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    marginTop: 2,
    letterSpacing: -0.2,
  },

  /* ── Hero Card ── */
  heroCard: {
    height: 220,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 20,
  },
  heroTopRow: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 2,
  },
  heroArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 8,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 6,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34C759",
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: TOKENS.font.heading,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  heroMetaText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
    letterSpacing: -0.1,
  },
  heroMetaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 4,
  },

  /* ── Hero Empty ── */
  heroEmpty: {
    height: 160,
    borderRadius: 24,
    backgroundColor: "#FAFAFA",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.06)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  heroEmptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroEmptyTitle: {
    color: APPLE_THEME.text,
    fontSize: 17,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.3,
  },
  heroEmptyCopy: {
    color: APPLE_THEME.textMuted,
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    letterSpacing: -0.1,
  },

  /* ── Stats Strip ── */
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  statPill: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    color: APPLE_THEME.text,
    fontSize: 20,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.4,
  },
  statLabel: {
    color: APPLE_THEME.textMuted,
    fontSize: 10,
    fontFamily: TOKENS.font.medium,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },

  /* ── Section + Filters ── */
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    color: APPLE_THEME.text,
    fontSize: 18,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.3,
  },
  filterGroup: {
    flexDirection: "row",
    gap: 6,
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  filterChipActive: {
    backgroundColor: "#1D1D1F",
  },
  filterChipText: {
    color: APPLE_THEME.textMuted,
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.1,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
});
