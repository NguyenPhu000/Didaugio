import { memo, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { TOKENS } from "../../../../src/constants/design-tokens";
import { TAB_CARD_RADIUS, TAB_THEME, TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { FILTERS, buildSummary, getSectionCopy, getHeroTrip, getDateRangeLabel } from "../utils/tripHelpers";

const SummaryTile = memo(function SummaryTile({ item }) {
  const toneStyles = {
    blue: [styles.summaryIconBlue, styles.summarySparkBlue],
    amber: [styles.summaryIconAmber, styles.summarySparkAmber],
    green: [styles.summaryIconGreen, styles.summarySparkGreen],
    red: [styles.summaryIconRed, styles.summarySparkRed],
  };
  const [iconStyle, sparkStyle] = toneStyles[item.tone] || toneStyles.blue;

  return (
    <View style={styles.summaryTile}>
      <View style={[styles.summaryIconWrap, iconStyle]}>
        <MaterialIcons name={item.icon} size={20} color="#FFFFFF" />
      </View>
      <View style={{ gap: 2 }}>
        <Text style={styles.summaryValue}>{item.value}</Text>
        <Text style={styles.summaryLabel}>{item.label}</Text>
      </View>
      {/* Thêm nền đốm mờ để tạo glass feel */}
      <View style={[styles.summarySpark, sparkStyle]} />
    </View>
  );
});

const FilterChip = memo(function FilterChip({ item, active, onPress }) {
  if (active) {
    return (
      <Pressable onPress={() => onPress(item.key)}>
        <LinearGradient
          colors={["#3B82F6", "#1D4ED8"]}
          style={styles.filterChipActive}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.filterChipTextActive}>{item.label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={() => onPress(item.key)} style={styles.filterChip}>
      <Text style={styles.filterChipText}>{item.label}</Text>
    </Pressable>
  );
});

export function TripsDashboard({
  trips,
  filteredCount,
  activeFilter,
  onSelectFilter,
  onCreate,
  onOpenHero,
}) {
  const heroTrip = useMemo(() => getHeroTrip(trips), [trips]);
  const summary = useMemo(() => buildSummary(trips), [trips]);

  return (
    <View style={styles.dashboardWrap}>
      {/* Hero Card với Linear Gradient đẹp mắt */}
      <LinearGradient
        colors={["#2563EB", "#1E3A8A"]} // Deep Blue Premium gradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroBackdropA} />
        <View style={styles.heroBackdropB} />

        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <MaterialIcons name="explore" size={14} color="#93C5FD" />
            <Text style={styles.heroBadgeText}>Bảng điều khiển</Text>
          </View>

          <Pressable onPress={onCreate} style={styles.createButton}>
            <MaterialIcons name="add" size={18} color="#1D4ED8" />
            <Text style={styles.createButtonText}>Tạo mới</Text>
          </Pressable>
        </View>

        <Text style={styles.heroTitle}>
          Quản lý hành trình theo cách rõ ràng hơn
        </Text>
        <Text style={styles.heroSubtitle}>
          Nhắc việc, trạng thái và điểm đến quan trọng đều nằm trong cùng một bố cục 
          để theo dõi nhanh.
        </Text>

        {heroTrip ? (
          <Pressable
            onPress={() => onOpenHero(heroTrip.id)}
            style={({ pressed }) => [
              styles.spotlightCard,
              pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
            ]}
          >
            <View style={styles.spotlightTopRow}>
              <View style={styles.spotlightLabelWrap}>
                <Text style={styles.spotlightEyebrow}>Sắp tới nhất</Text>
                <Text style={styles.spotlightTitle} numberOfLines={1}>
                  {heroTrip.title || "Chuyến đi mới"}
                </Text>
              </View>
              <View style={styles.spotlightArrow}>
                <MaterialIcons name="north-east" size={18} color="#2563EB" />
              </View>
            </View>

            <View style={styles.spotlightMetaRow}>
              <View style={styles.spotlightMetaPill}>
                <MaterialIcons name="calendar-today" size={13} color="#475569" />
                <Text style={styles.spotlightMetaText}>
                  {getDateRangeLabel(heroTrip)}
                </Text>
              </View>
              <View style={styles.spotlightMetaPill}>
                <MaterialIcons name="place" size={13} color="#475569" />
                <Text style={styles.spotlightMetaText}>
                  {heroTrip.destinations?.length || 0} điểm đến
                </Text>
              </View>
            </View>
          </Pressable>
        ) : (
          <View style={styles.spotlightEmpty}>
            <Text style={styles.spotlightEmptyTitle}>
              Chưa có hành trình nổi bật
            </Text>
            <Text style={styles.spotlightEmptyCopy}>
              Tạo chuyến đi mới để bắt đầu xây dựng kế hoạch.
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Grid Summary Hiện Đại */}
      <View style={styles.summaryGrid}>
        {summary.map((item) => (
          <SummaryTile key={item.key} item={item} />
        ))}
      </View>

      {/* Tiêu đề Bộ lọc */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionTitle}>Danh sách hành trình</Text>
          <Text style={styles.sectionCopy}>
            {getSectionCopy(activeFilter, filteredCount)}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {FILTERS.map((filter) => (
          <FilterChip
            key={filter.key}
            item={filter}
            active={activeFilter === filter.key}
            onPress={onSelectFilter}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dashboardWrap: {
    paddingHorizontal: TAB_SCREEN_PADDING,
    paddingTop: 16,
    paddingBottom: 18,
  },
  heroCard: {
    overflow: "hidden",
    borderRadius: TAB_CARD_RADIUS + 4, // 28
    padding: 24,
    gap: 18,
    ...TOKENS.shadow.lg,
  },
  heroBackdropA: {
    position: "absolute",
    top: -70,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  heroBackdropB: {
    position: "absolute",
    bottom: -84,
    left: -60,
    width: 250,
    height: 250,
    borderRadius: 999,
    backgroundColor: "rgba(96, 165, 250, 0.05)",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  heroBadgeText: {
    color: "#EFF6FF",
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: TOKENS.radius.full,
    backgroundColor: "#FFFFFF",
    ...TOKENS.shadow.sm,
  },
  createButtonText: {
    color: "#1D4ED8",
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    lineHeight: 33,
    fontFamily: TOKENS.font.heading,
  },
  heroSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14.5,
    lineHeight: 22,
    fontFamily: TOKENS.font.body,
  },
  spotlightCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: "#FFFFFF", // Thẻ trắng nổi bật trên nền xanh
    gap: 14,
    marginTop: 4,
    ...TOKENS.shadow.sm,
  },
  spotlightTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  spotlightLabelWrap: {
    flex: 1,
    gap: 4,
  },
  spotlightEyebrow: {
    color: "#64748B",
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  spotlightTitle: {
    color: "#0F172A",
    fontSize: 19,
    fontFamily: TOKENS.font.heading,
  },
  spotlightArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF", // Xanh nhạt
  },
  spotlightMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  spotlightMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F1F5F9",
  },
  spotlightMetaText: {
    color: "#475569",
    fontSize: 12.5,
    fontFamily: TOKENS.font.medium,
  },
  spotlightEmpty: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    gap: 8,
    marginTop: 4,
  },
  spotlightEmptyTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
  },
  spotlightEmptyCopy: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TOKENS.font.body,
  },

  /* Grid siêu đẹp */
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 20,
  },
  summaryTile: {
    width: "47.5%",
    minHeight: 120,
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    flexDirection: "column",
    justifyContent: "space-between",
    ...TOKENS.shadow.sm,
  },
  summaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  summaryIconBlue: { backgroundColor: "#3B82F6" },
  summaryIconAmber: { backgroundColor: "#F59E0B" },
  summaryIconGreen: { backgroundColor: "#10B981" },
  summaryIconRed: { backgroundColor: "#EF4444" },

  summaryValue: {
    color: "#0F172A",
    fontSize: 26,
    fontFamily: TOKENS.font.heading,
  },
  summaryLabel: {
    color: "#64748B",
    fontSize: 13.5,
    fontFamily: TOKENS.font.medium,
  },
  summarySpark: {
    position: "absolute",
    right: -20,
    top: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  summarySparkBlue: { backgroundColor: "rgba(59, 130, 246, 0.05)" },
  summarySparkAmber: { backgroundColor: "rgba(245, 158, 11, 0.05)" },
  summarySparkGreen: { backgroundColor: "rgba(16, 185, 129, 0.05)" },
  summarySparkRed: { backgroundColor: "rgba(239, 68, 68, 0.05)" },

  /* Tiêu đề section */
  sectionHeader: {
    marginTop: 26,
    marginBottom: 16,
  },
  sectionTitleWrap: {
    gap: 6,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 21,
    fontFamily: TOKENS.font.heading,
  },
  sectionCopy: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TOKENS.font.body,
  },

  /* Tabs / Filters */
  filtersRow: {
    gap: 12,
    paddingRight: 16,
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 0,
  },
  filterChipText: {
    color: "#64748B",
    fontSize: 13.5,
    fontFamily: TOKENS.font.semibold,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontFamily: TOKENS.font.semibold,
  },
});
