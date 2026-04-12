import { memo, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../../src/constants/design-tokens";
import {
  TAB_CARD_RADIUS,
  TAB_SCREEN_PADDING,
} from "../../../../app/(tabs)/tabTheme";
import {
  FILTERS,
  buildSummary,
  getSectionCopy,
  getHeroTrip,
  getDateRangeLabel,
} from "../utils/tripHelpers";

const SummaryTile = memo(function SummaryTile({ item }) {
  const toneStyles = {
    blue: [styles.summaryIconPrimary, styles.summarySparkPrimary],
    amber: [styles.summaryIconMuted, styles.summarySparkMuted],
    green: [styles.summaryIconMuted, styles.summarySparkMuted],
    red: [styles.summaryIconMuted, styles.summarySparkMuted],
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
      <Pressable
        onPress={() => onPress(item.key)}
        style={styles.filterChipActive}
      >
        <Text style={styles.filterChipTextActive}>{item.label}</Text>
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
      <View style={styles.heroCard}>
        <View style={styles.heroAccent} />

        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <MaterialIcons
              name="explore"
              size={14}
              color={APPLE_THEME.primary}
            />
            <Text style={styles.heroBadgeText}>Bảng điều khiển</Text>
          </View>

          <Pressable onPress={onCreate} style={styles.createButton}>
            <MaterialIcons name="add" size={18} color={APPLE_THEME.white} />
            <Text style={styles.createButtonText}>Tạo mới</Text>
          </Pressable>
        </View>

        <Text style={styles.heroTitle}>
          Quản lý hành trình theo cách rõ ràng hơn
        </Text>
        <Text style={styles.heroSubtitle}>
          Nhắc việc, trạng thái và điểm đến quan trọng đều nằm trong cùng một bố
          cục để theo dõi nhanh.
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
                <MaterialIcons
                  name="north-east"
                  size={18}
                  color={APPLE_THEME.primary}
                />
              </View>
            </View>

            <View style={styles.spotlightMetaRow}>
              <View style={styles.spotlightMetaPill}>
                <MaterialIcons
                  name="calendar-today"
                  size={13}
                  color={APPLE_THEME.textSecondary}
                />
                <Text style={styles.spotlightMetaText}>
                  {getDateRangeLabel(heroTrip)}
                </Text>
              </View>
              <View style={styles.spotlightMetaPill}>
                <MaterialIcons
                  name="place"
                  size={13}
                  color={APPLE_THEME.textSecondary}
                />
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
      </View>

      <View style={styles.summaryGrid}>
        {summary.map((item) => (
          <SummaryTile key={item.key} item={item} />
        ))}
      </View>

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
    borderRadius: TAB_CARD_RADIUS,
    padding: 24,
    gap: 18,
    backgroundColor: APPLE_THEME.surface,
    borderWidth: 1,
    borderColor: APPLE_THEME.borderSoft,
    overflow: "hidden",
    ...TOKENS.shadow.sm,
  },
  heroAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: APPLE_THEME.primary,
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
    backgroundColor: APPLE_THEME.primaryTint,
  },
  heroBadgeText: {
    color: APPLE_THEME.primary,
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
    backgroundColor: APPLE_THEME.primary,
  },
  createButtonText: {
    color: APPLE_THEME.white,
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },
  heroTitle: {
    color: APPLE_THEME.text,
    fontSize: 25,
    lineHeight: 31,
    fontFamily: TOKENS.font.heading,
  },
  heroSubtitle: {
    color: APPLE_THEME.textSecondary,
    fontSize: 14.5,
    lineHeight: 22,
    fontFamily: TOKENS.font.body,
  },
  spotlightCard: {
    borderRadius: TOKENS.radius.xl,
    padding: 16,
    backgroundColor: APPLE_THEME.surfaceElevated,
    borderWidth: 1,
    borderColor: APPLE_THEME.border,
    gap: 14,
    marginTop: 4,
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
    color: APPLE_THEME.textMuted,
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  spotlightTitle: {
    color: APPLE_THEME.text,
    fontSize: 19,
    fontFamily: TOKENS.font.heading,
  },
  spotlightArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_THEME.primaryTint,
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
    backgroundColor: APPLE_THEME.surface,
    borderWidth: 1,
    borderColor: APPLE_THEME.border,
  },
  spotlightMetaText: {
    color: APPLE_THEME.textSecondary,
    fontSize: 12.5,
    fontFamily: TOKENS.font.medium,
  },
  spotlightEmpty: {
    borderRadius: TOKENS.radius.xl,
    padding: 18,
    backgroundColor: APPLE_THEME.surfaceElevated,
    borderWidth: 1,
    borderColor: APPLE_THEME.border,
    gap: 8,
    marginTop: 4,
  },
  spotlightEmptyTitle: {
    color: APPLE_THEME.text,
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
  },
  spotlightEmptyCopy: {
    color: APPLE_THEME.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TOKENS.font.body,
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 20,
  },
  summaryTile: {
    width: "47.5%",
    minHeight: 112,
    borderRadius: TOKENS.radius.xl,
    padding: 16,
    backgroundColor: APPLE_THEME.surface,
    overflow: "hidden",
    flexDirection: "column",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: APPLE_THEME.borderSoft,
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
  summaryIconPrimary: { backgroundColor: APPLE_THEME.primary },
  summaryIconMuted: { backgroundColor: "#2F2F31" },

  summaryValue: {
    color: APPLE_THEME.text,
    fontSize: 26,
    fontFamily: TOKENS.font.heading,
  },
  summaryLabel: {
    color: APPLE_THEME.textMuted,
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
  summarySparkPrimary: { backgroundColor: "rgba(0, 0, 0, 0.05)" },
  summarySparkMuted: { backgroundColor: "rgba(0, 0, 0, 0.035)" },

  sectionHeader: {
    marginTop: 26,
    marginBottom: 16,
  },
  sectionTitleWrap: {
    gap: 6,
  },
  sectionTitle: {
    color: APPLE_THEME.text,
    fontSize: 21,
    fontFamily: TOKENS.font.heading,
  },
  sectionCopy: {
    color: APPLE_THEME.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TOKENS.font.body,
  },

  filtersRow: {
    gap: 12,
    paddingRight: 16,
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: APPLE_THEME.surface,
    borderWidth: 1,
    borderColor: APPLE_THEME.border,
  },
  filterChipActive: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: APPLE_THEME.primary,
    borderWidth: 1,
    borderColor: APPLE_THEME.primary,
  },
  filterChipText: {
    color: APPLE_THEME.textSecondary,
    fontSize: 13.5,
    fontFamily: TOKENS.font.semibold,
  },
  filterChipTextActive: {
    color: APPLE_THEME.white,
    fontSize: 13.5,
    fontFamily: TOKENS.font.semibold,
  },
});
