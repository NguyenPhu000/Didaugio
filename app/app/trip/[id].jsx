import { memo, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import {
  useTripDetail,
  useRemoveDestination,
} from "../../src/modules/trips/hooks/useTripDetail";
import { TOKENS } from "../../src/constants/design-tokens";
import { TAB_THEME, TAB_CARD_RADIUS } from "../(tabs)/tabTheme";

const TABS = [
  { key: "itinerary", label: "Lịch trình", icon: "route" },
  { key: "services", label: "Dịch vụ", icon: "room-service" },
  { key: "budget", label: "Ngân sách", icon: "account-balance-wallet" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Tính số ngày thực từ startDate–endDate (ưu tiên).
 * Fallback về totalDays nếu không có date range.
 */
function calcDayCount(trip) {
  if (trip.startDate && trip.endDate) {
    const ms = new Date(trip.endDate) - new Date(trip.startDate);
    const days = Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : trip.totalDays || 1;
  }
  return trip.totalDays || 1;
}

/**
 * Lấy nhãn ngày hiển thị trong itinerary day-chip.
 * Nếu có startDate → hiện ngày cụ thể (VD: "T2, 01/04")
 * Không có → hiện "Ngày 1", "Ngày 2" …
 */
function getDayLabel(trip, dayIndex) {
  if (trip.startDate) {
    const d = new Date(trip.startDate);
    d.setDate(d.getDate() + dayIndex);
    return d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });
  }
  return `Ngày ${dayIndex + 1}`;
}

// ── Sub-components ──────────────────────────────────────────────────────────

const DestinationCard = memo(function DestinationCard({ dest, onRemove }) {
  const place = dest.place;
  const imgUri = place?.thumbnail || null;

  return (
    <View style={styles.destCard}>
      <View style={styles.destImageWrap}>
        {imgUri ? (
          <Image
            source={{ uri: imgUri }}
            style={styles.destImage}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.destImageFallback}>
            <MaterialIcons name="place" size={20} color={TAB_THEME.primary} />
          </View>
        )}
      </View>

      <View style={styles.destBody}>
        <Text style={styles.destName} numberOfLines={1}>
          {place?.name || "Địa điểm"}
        </Text>
        {place?.address ? (
          <Text style={styles.destAddress} numberOfLines={1}>
            {place.address}
          </Text>
        ) : null}
        {dest.note ? (
          <Text style={styles.destNote} numberOfLines={1}>
            {dest.note}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => onRemove(dest.id)}
        hitSlop={8}
        style={styles.destRemoveBtn}
      >
        <MaterialIcons name="remove-circle-outline" size={18} color={TOKENS.color.error} />
      </Pressable>
    </View>
  );
});

function ItineraryTab({ trip, onRemove }) {
  const dayCount = useMemo(() => calcDayCount(trip), [trip]);
  const days = useMemo(
    () => Array.from({ length: dayCount }, (_, i) => i),
    [dayCount],
  );

  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // dayNumber trong DB bắt đầu từ 1
  const dayDestinations = useMemo(
    () =>
      (trip.destinations || []).filter((d) => d.dayNumber === activeDayIndex + 1),
    [trip.destinations, activeDayIndex],
  );

  return (
    <View style={styles.itineraryWrap}>
      {/* Day chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayChipsRow}
      >
        {days.map((idx) => {
          const isActive = activeDayIndex === idx;
          return (
            <Pressable
              key={idx}
              onPress={() => setActiveDayIndex(idx)}
              style={[styles.dayChip, isActive && styles.dayChipActive]}
            >
              <Text style={[styles.dayChipText, isActive && styles.dayChipTextActive]}>
                {getDayLabel(trip, idx)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Destinations for selected day */}
      {dayDestinations.length === 0 ? (
        <View style={styles.dayEmptyState}>
          <View style={styles.dayEmptyIcon}>
            <MaterialIcons name="add-location-alt" size={28} color={TAB_THEME.primary} />
          </View>
          <Text style={styles.dayEmptyTitle}>Chưa có địa điểm</Text>
          <Text style={styles.dayEmptyCopy}>
            Thêm địa điểm từ trang Khám phá để xây dựng lịch trình ngày này.
          </Text>
        </View>
      ) : (
        <FlatList
          data={dayDestinations}
          renderItem={({ item }) => (
            <DestinationCard dest={item} onRemove={onRemove} />
          )}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.destList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function ComingSoonTab({ icon, label }) {
  return (
    <View style={styles.comingSoonWrap}>
      <View style={styles.comingSoonIcon}>
        <MaterialIcons name={icon} size={32} color={TAB_THEME.primary} />
      </View>
      <Text style={styles.comingSoonTitle}>{label}</Text>
      <Text style={styles.comingSoonCopy}>Tính năng này sẽ sớm ra mắt.</Text>
    </View>
  );
}

// ── Main screen ─────────────────────────────────────────────────────────────

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("itinerary");

  const { data: trip, isLoading, isError } = useTripDetail(id);
  const removeMutation = useRemoveDestination(id ? parseInt(id) : null);

  const handleRemoveDestination = useCallback(
    (destId) => removeMutation.mutate(destId),
    [removeMutation],
  );

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={TAB_THEME.primary} />
        <Text style={styles.loadingText}>Đang tải chuyến đi...</Text>
      </View>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError || !trip) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top }]}>
        <View style={styles.errorIcon}>
          <MaterialIcons name="error-outline" size={32} color={TOKENS.color.error} />
        </View>
        <Text style={styles.errorTitle}>Không tìm thấy chuyến đi</Text>
        <Pressable onPress={() => router.back()} style={styles.errorBack}>
          <Text style={styles.errorBackText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const dateRange =
    trip.startDate && trip.endDate
      ? `${formatDate(trip.startDate)} → ${formatDate(trip.endDate)}`
      : trip.startDate
        ? `Từ ${formatDate(trip.startDate)}`
        : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={20} color={TAB_THEME.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {trip.title}
          </Text>
          {dateRange ? (
            <Text style={styles.headerSubtitle}>{dateRange}</Text>
          ) : null}
        </View>

        <Pressable
          onPress={() => router.push("/explore")}
          style={styles.addBtn}
        >
          <MaterialIcons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Thêm</Text>
        </Pressable>
      </View>

      {/* ── Tab bar ── */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
            >
              <MaterialIcons
                name={tab.icon}
                size={14}
                color={isActive ? "#FFFFFF" : TAB_THEME.textMuted}
              />
              <Text
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Tab content ── */}
      {activeTab === "itinerary" ? (
        <ItineraryTab trip={trip} onRemove={handleRemoveDestination} />
      ) : activeTab === "services" ? (
        <ComingSoonTab icon="room-service" label="Dịch vụ" />
      ) : (
        <ComingSoonTab icon="account-balance-wallet" label="Quản lý ngân sách" />
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6FAFF",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },

  /* ── Header ── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.16)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: TOKENS.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  headerCenter: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: TOKENS.font.heading,
    color: TAB_THEME.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
    color: TAB_THEME.textMuted,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: TOKENS.radius.full,
    backgroundColor: TAB_THEME.primary,
    ...TOKENS.shadow.accent,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },

  /* ── Tab bar ── */
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.12)",
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: TOKENS.radius.lg,
    backgroundColor: "#F1F5F9",
  },
  tabItemActive: {
    backgroundColor: TAB_THEME.primary,
    ...TOKENS.shadow.accent,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    color: TAB_THEME.textMuted,
  },
  tabLabelActive: {
    color: "#FFFFFF",
  },

  /* ── Itinerary ── */
  itineraryWrap: {
    flex: 1,
  },
  dayChipsRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: TOKENS.radius.full,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.2)",
  },
  dayChipActive: {
    backgroundColor: TAB_THEME.primary,
    borderColor: TAB_THEME.primary,
    ...TOKENS.shadow.accent,
  },
  dayChipText: {
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    color: TAB_THEME.textMuted,
  },
  dayChipTextActive: {
    color: "#FFFFFF",
  },

  /* ── Day empty ── */
  dayEmptyState: {
    flex: 1,
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 40,
    gap: 10,
  },
  dayEmptyIcon: {
    width: 72,
    height: 72,
    borderRadius: TAB_CARD_RADIUS,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,102,230,0.08)",
    marginBottom: 6,
  },
  dayEmptyTitle: {
    fontSize: 18,
    fontFamily: TOKENS.font.heading,
    color: TAB_THEME.text,
  },
  dayEmptyCopy: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TOKENS.font.body,
    color: TAB_THEME.textMuted,
    textAlign: "center",
  },

  /* ── Destination card ── */
  destList: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    gap: 10,
  },
  destCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: TOKENS.radius.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.16)",
    ...TOKENS.shadow.sm,
  },
  destImageWrap: {
    width: 52,
    height: 52,
    borderRadius: TOKENS.radius.md,
    overflow: "hidden",
    backgroundColor: "#EAF3FF",
  },
  destImage: {
    flex: 1,
  },
  destImageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  destBody: {
    flex: 1,
    gap: 3,
  },
  destName: {
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
    color: TAB_THEME.text,
  },
  destAddress: {
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: TAB_THEME.textMuted,
  },
  destNote: {
    fontSize: 11,
    fontFamily: TOKENS.font.body,
    color: TAB_THEME.textSoft,
    fontStyle: "italic",
  },
  destRemoveBtn: {
    width: 34,
    height: 34,
    borderRadius: TOKENS.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TOKENS.color.error + "12",
  },

  /* ── Coming soon ── */
  comingSoonWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  comingSoonIcon: {
    width: 80,
    height: 80,
    borderRadius: TAB_CARD_RADIUS,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,102,230,0.08)",
    marginBottom: 4,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontFamily: TOKENS.font.heading,
    color: TAB_THEME.text,
  },
  comingSoonCopy: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TOKENS.font.body,
    color: TAB_THEME.textMuted,
    textAlign: "center",
  },

  /* ── Loading / Error ── */
  loadingText: {
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    color: TAB_THEME.textMuted,
  },
  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: TAB_CARD_RADIUS,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TOKENS.color.error + "12",
    marginBottom: 4,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: TOKENS.font.heading,
    color: TAB_THEME.text,
    textAlign: "center",
  },
  errorBack: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: TOKENS.radius.full,
    backgroundColor: TAB_THEME.primary,
    marginTop: 4,
  },
  errorBackText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
});
