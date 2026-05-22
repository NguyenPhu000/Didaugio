import { memo, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import {
  ALL_AREAS_KEY,
  ALL_COLLECTIONS_KEY,
  buildSavedSummary,
  getHeroEntry,
  getLocationText,
} from "../utils/savedHelpers";

const STAT_TONES = {
  blue: { bg: "rgba(0,122,255,0.1)", color: "#007AFF" },
  amber: { bg: "rgba(255,159,10,0.1)", color: "#FF9F0A" },
  teal: { bg: "rgba(20,184,166,0.1)", color: "#14B8A6" },
  green: { bg: "rgba(52,199,89,0.1)", color: "#34C759" },
};

const StatPill = memo(function StatPill({ icon, value, label, tone }) {
  const theme = STAT_TONES[tone] || STAT_TONES.blue;
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

const FilterChip = memo(function FilterChip({
  icon,
  label,
  active,
  onPress,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.filterChip, active && styles.filterChipActive]}
    >
      {icon ? (
        <MaterialIcons
          name={icon}
          size={14}
          color={active ? "#FFFFFF" : APPLE_THEME.textMuted}
        />
      ) : null}
      <Text
        numberOfLines={1}
        style={[styles.filterChipText, active && styles.filterChipTextActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
});

function FilterRow({ title, data, activeKey, onChange }) {
  return (
    <View style={styles.filterRow}>
      <Text style={styles.filterRowTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        {data.map((item) => (
          <FilterChip
            key={item.key}
            icon={item.icon}
            label={item.name}
            active={activeKey === item.key}
            onPress={() => onChange(item.key)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export const SavedDashboard = memo(function SavedDashboard({
  savedData,
  filteredCount,
  collectionOptions,
  areaOptions,
  activeCollection,
  activeArea,
  onChangeCollection,
  onChangeArea,
  onPressHero,
}) {
  const heroEntry = useMemo(() => getHeroEntry(savedData), [savedData]);
  const summary = useMemo(
    () => buildSavedSummary({ savedData, collectionOptions, areaOptions }),
    [savedData, collectionOptions, areaOptions],
  );

  const heroPlace = heroEntry?.place || heroEntry || null;
  const heroCover = heroPlace ? resolvePlaceImageUri(heroPlace) : null;

  const collectionFilterData = useMemo(
    () => [
      {
        key: ALL_COLLECTIONS_KEY,
        icon: "collections-bookmark",
        name: `Tất cả (${savedData.length})`,
      },
      ...collectionOptions.map((option) => ({
        ...option,
        icon: option.icon || "category",
      })),
    ],
    [collectionOptions, savedData.length],
  );

  const areaFilterData = useMemo(
    () => [
      {
        key: ALL_AREAS_KEY,
        icon: "map",
        name: `Mọi khu vực (${savedData.length})`,
      },
      ...areaOptions.map((area) => ({ ...area, icon: "place" })),
    ],
    [areaOptions, savedData.length],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Đã lưu</Text>
          <Text style={styles.subtitle}>
            {savedData.length > 0
              ? `${savedData.length} địa điểm trong bộ sưu tập của bạn`
              : "Lưu địa điểm yêu thích để mở lại nhanh"}
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <MaterialIcons name="bookmark" size={20} color="#1D1D1F" />
        </View>
      </View>

      {heroEntry ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onPressHero?.(heroPlace?.id)}
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
              "rgba(0,0,0,0.05)",
              "rgba(0,0,0,0.3)",
              "rgba(0,0,0,0.75)",
              "rgba(0,0,0,0.92)",
            ]}
            locations={[0, 0.45, 0.78, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.heroTopRow}>
            <View style={styles.heroArrow}>
              <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroBadgeWrap}>
              <View style={styles.heroBadge}>
                <View style={styles.heroDot} />
                <Text style={styles.heroBadgeText}>Vừa lưu</Text>
              </View>
            </View>

            <Text style={styles.heroTitle} numberOfLines={2}>
              {heroPlace?.name || "Địa điểm đã lưu"}
            </Text>

            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <MaterialIcons
                  name="place"
                  size={14}
                  color="rgba(255,255,255,0.8)"
                />
                <Text style={styles.heroMetaText} numberOfLines={1}>
                  {getLocationText(heroPlace)}
                </Text>
              </View>
              {heroPlace?.category?.name ? (
                <>
                  <View style={styles.heroMetaDivider} />
                  <View style={styles.heroMetaItem}>
                    <MaterialIcons
                      name="category"
                      size={14}
                      color="rgba(255,255,255,0.8)"
                    />
                    <Text style={styles.heroMetaText} numberOfLines={1}>
                      {heroPlace.category.name}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.heroEmpty}>
          <View style={styles.heroEmptyIcon}>
            <MaterialIcons name="bookmark-border" size={26} color="#007AFF" />
          </View>
          <View style={styles.heroEmptyText}>
            <Text style={styles.heroEmptyTitle}>Bắt đầu lưu địa điểm</Text>
            <Text style={styles.heroEmptyCopy}>
              Khi bạn lưu địa điểm từ Explore, chúng sẽ hiển thị ở đây.
            </Text>
          </View>
        </View>
      )}

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

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>
          {filteredCount > 0
            ? `Danh sách (${filteredCount})`
            : "Danh sách"}
        </Text>
      </View>

      <View style={styles.filtersStack}>
        <FilterRow
          title="Bộ sưu tập"
          data={collectionFilterData}
          activeKey={activeCollection}
          onChange={onChangeCollection}
        />
        <FilterRow
          title="Khu vực"
          data={areaFilterData}
          activeKey={activeArea}
          onChange={onChangeArea}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: TAB_SCREEN_PADDING,
    paddingTop: 8,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    color: APPLE_THEME.text,
    fontSize: 34,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -1,
  },
  subtitle: {
    color: APPLE_THEME.textMuted,
    fontSize: 15,
    fontFamily: TOKENS.font.body,
    marginTop: 4,
    letterSpacing: -0.2,
    maxWidth: 260,
  },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    height: 220,
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
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.3)",
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 8,
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
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontFamily: TOKENS.font.heading,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    flexWrap: "wrap",
  },
  heroMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "60%",
  },
  heroMetaText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
    letterSpacing: -0.1,
  },
  heroMetaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  heroEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  heroEmptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,122,255,0.1)",
  },
  heroEmptyText: {
    flex: 1,
  },
  heroEmptyTitle: {
    color: APPLE_THEME.text,
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  heroEmptyCopy: {
    color: APPLE_THEME.textMuted,
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    letterSpacing: -0.1,
    lineHeight: 18,
  },
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
    paddingVertical: 14,
    paddingHorizontal: 14,
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
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: APPLE_THEME.text,
    fontSize: 20,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.4,
  },
  filtersStack: {
    gap: 12,
  },
  filterRow: {
    gap: 8,
  },
  filterRowTitle: {
    color: APPLE_THEME.textMuted,
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.1,
    textTransform: "uppercase",
  },
  filterScrollContent: {
    gap: 8,
    paddingRight: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F2F2F7",
  },
  filterChipActive: {
    backgroundColor: "#1D1D1F",
  },
  filterChipText: {
    color: APPLE_THEME.text,
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.1,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
});
