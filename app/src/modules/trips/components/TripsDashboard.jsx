import { memo, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
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
        <MaterialIcons name={icon} size={20} color={theme.color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
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
    ? heroTrip.thumbnail || heroTrip.destinations?.[0]?.place?.thumbnail
    : null;

  const timelineLabel = heroTrip ? getTimelineLabel(heroTrip) : null;

  return (
    <View style={styles.dashboardWrap}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Hành trình</Text>
          <Text style={styles.headerSubtitle}>
            {(trips?.length ?? 0) > 0
              ? `${trips.length} chuyến đi của bạn`
              : "Khởi tạo kỷ niệm mới"}
          </Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={onCreate} style={styles.headerIconWrap}>
          <MaterialIcons name="add" size={28} color="#1D1D1F" />
        </TouchableOpacity>
      </View>

      {/* ── Hero Trip Card ── */}
      {heroTrip ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onOpenHero(heroTrip.id)}
          style={styles.heroCard}
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
              "rgba(0,0,0,0.1)",
              "rgba(0,0,0,0.3)",
              "rgba(0,0,0,0.7)",
              "rgba(0,0,0,0.9)",
            ]}
            locations={[0, 0.4, 0.7, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Top-right arrow */}
          <View style={styles.heroTopRow}>
            <View style={styles.heroArrow}>
              <MaterialIcons
                name="arrow-forward"
                size={18}
                color="#FFFFFF"
              />
            </View>
          </View>

          {/* Bottom content */}
          <View style={styles.heroContent}>
            <View style={styles.heroBadgeWrap}>
              <View style={styles.heroBadge}>
                <View style={styles.heroDot} />
                <Text style={styles.heroBadgeText}>
                  {timelineLabel || "Sắp tới"}
                </Text>
              </View>
            </View>
            
            <Text style={styles.heroTitle} numberOfLines={2}>
              {heroTrip.title || "Chuyến đi mới"}
            </Text>
            
            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <MaterialIcons
                  name="event"
                  size={14}
                  color="rgba(255,255,255,0.8)"
                />
                <Text style={styles.heroMetaText}>
                  {getDateRangeLabel(heroTrip)}
                </Text>
              </View>
              <View style={styles.heroMetaDivider} />
              <View style={styles.heroMetaItem}>
                <MaterialIcons
                  name="place"
                  size={14}
                  color="rgba(255,255,255,0.8)"
                />
                <Text style={styles.heroMetaText}>
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
          style={styles.heroEmpty}
        >
          <LinearGradient
            colors={["#F8F9FA", "#F1F3F5"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroEmptyIconWrap}>
            <LinearGradient
              colors={["#007AFF", "#0056b3"]}
              style={StyleSheet.absoluteFill}
            />
            <MaterialIcons name="add-location-alt" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.heroEmptyTextWrap}>
            <Text style={styles.heroEmptyTitle}>Tạo chuyến đi đầu tiên</Text>
            <Text style={styles.heroEmptyCopy}>
              Bắt đầu hành trình khám phá thế giới của bạn
            </Text>
          </View>
          <View style={styles.heroEmptyArrow}>
             <MaterialIcons name="arrow-forward" size={20} color="#007AFF" />
          </View>
        </TouchableOpacity>
      )}

      {/* ── Stats Strip (Grid) ── */}
      <View style={styles.statsGrid}>
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
          {filteredCount > 0 ? `Danh sách (${filteredCount})` : "Danh sách"}
        </Text>
        <View style={styles.filterGroup}>
          {FILTERS.map((filter) => {
            const active = activeFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                activeOpacity={0.7}
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
              </TouchableOpacity>
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
    paddingBottom: 24,
  },

  /* ── Header ── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 24,
  },
  headerTitle: {
    color: APPLE_THEME.text,
    fontSize: 34,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -1,
  },
  headerSubtitle: {
    color: APPLE_THEME.textMuted,
    fontSize: 15,
    fontFamily: TOKENS.font.body,
    marginTop: 4,
    letterSpacing: -0.2,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Hero Card ── */
  heroCard: {
    height: 280,
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: "#1C1C1E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    position: "relative",
  },
  heroTopRow: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 2,
  },
  heroArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.3)",
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    gap: 10,
  },
  heroBadgeWrap: {
    alignSelf: "flex-start",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 4,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34C759",
    shadowColor: "#34C759",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: TOKENS.font.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontFamily: TOKENS.font.heading,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  heroMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroMetaText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontFamily: TOKENS.font.medium,
    letterSpacing: -0.1,
  },
  heroMetaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 4,
  },

  /* ── Hero Empty ── */
  heroEmpty: {
    height: 120,
    borderRadius: 24,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroEmptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  heroEmptyTextWrap: {
    flex: 1,
  },
  heroEmptyTitle: {
    color: APPLE_THEME.text,
    fontSize: 17,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroEmptyCopy: {
    color: APPLE_THEME.textMuted,
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    letterSpacing: -0.1,
  },
  heroEmptyArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,122,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },

  /* ── Stats Strip (Grid) ── */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 28,
  },
  statPill: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    color: APPLE_THEME.text,
    fontSize: 22,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.4,
  },
  statLabel: {
    color: APPLE_THEME.textMuted,
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
    marginTop: 2,
  },

  /* ── Section + Filters ── */
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    color: APPLE_THEME.text,
    fontSize: 20,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.4,
  },
  filterGroup: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F2F2F7",
  },
  filterChipActive: {
    backgroundColor: "#1D1D1F",
  },
  filterChipText: {
    color: APPLE_THEME.textMuted,
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.1,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
});
