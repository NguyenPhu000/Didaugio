import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
} from "react-native-reanimated";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../../src/modules/notifications/hooks/useNotifications";
import { TOKENS } from "../../src/constants/design-tokens";
import { TAB_BAR_HEIGHT } from "../(tabs)/_layout";

/* ─── Helpers ─────────────────────────────────────── */
function formatTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(value) {
  if (!value) return "";
  const now = new Date();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const diff = now - d;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút`;
  if (hours < 24) return `${hours} giờ`;
  if (days < 7) return `${days} ngày`;
  return formatTime(value);
}

const TYPE_ICONS = {
  booking: { name: "event-available", color: "#0071E3", bg: "rgba(0,113,227,0.08)" },
  place: { name: "place", color: "#34C759", bg: "rgba(52,199,89,0.08)" },
  business: { name: "storefront", color: "#FF9500", bg: "rgba(255,149,0,0.08)" },
  review: { name: "star", color: "#FFD60A", bg: "rgba(255,214,10,0.08)" },
  document: { name: "description", color: "#AF52DE", bg: "rgba(175,82,222,0.08)" },
  default: { name: "notifications", color: "#8E8E93", bg: "rgba(142,142,147,0.08)" },
};

function getIconConfig(type) {
  const t = String(type || "");
  if (t.includes("booking")) return TYPE_ICONS.booking;
  if (t.includes("place")) return TYPE_ICONS.place;
  if (t.includes("business")) return TYPE_ICONS.business;
  if (t.includes("review")) return TYPE_ICONS.review;
  if (t.includes("document")) return TYPE_ICONS.document;
  return TYPE_ICONS.default;
}

const resolveRoute = (item) => {
  const meta = item.metadata || {};
  const type = String(meta.type || "");

  if ((type.includes("booking") || meta.bookingId) && meta.bookingId) {
    return `/profile/booking/${meta.bookingId}`;
  }
  if (type.includes("booking")) return "/(tabs)";
  if (type.includes("review")) return "/(tabs)";
  if (type.includes("business") || type.includes("document") || meta.businessId) {
    return "/(tabs)";
  }
  if ((type.includes("place") || meta.placeId) && meta.placeId) {
    return "/(tabs)";
  }
  return "/(tabs)";
};

/* ─── Sub-components ─────────────────────────────────── */
function ScreenHeader({ unreadCount, onBack, onMarkAll }) {
  return (
    <View style={styles.screenHeader}>
      <Pressable onPress={onBack} style={styles.headerBackBtn}>
        <MaterialIcons name="arrow-back" size={24} color="#1D1D1F" />
      </Pressable>

      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Thông báo</Text>
        {unreadCount > 0 && (
          <Text style={styles.headerSubtitle}>
            {unreadCount} chưa đọc
          </Text>
        )}
      </View>

      {unreadCount > 0 ? (
        <Pressable onPress={onMarkAll} style={styles.headerActionBtn}>
          <Text style={styles.headerActionText}>Đọc hết</Text>
        </Pressable>
      ) : (
        <View style={styles.headerPlaceholder} />
      )}
    </View>
  );
}

function TabBar({ active, onChange, unreadCount }) {
  return (
    <View style={styles.tabBar}>
      <Pressable
        onPress={() => onChange("unread")}
        style={[styles.tab, active === "unread" && styles.tabActive]}
      >
        <Text
          style={[
            styles.tabText,
            active === "unread" ? styles.tabTextActive : styles.tabTextInactive,
          ]}
        >
          Chưa đọc
        </Text>
        {unreadCount > 0 && (
          <View
            style={[
              styles.tabBadge,
              active === "unread" ? styles.tabBadgeActive : styles.tabBadgeInactive,
            ]}
          >
            <Text
              style={[
                styles.tabBadgeText,
                active === "unread"
                  ? styles.tabBadgeTextActive
                  : styles.tabBadgeTextInactive,
              ]}
            >
              {unreadCount}
            </Text>
          </View>
        )}
      </Pressable>

      <Pressable
        onPress={() => onChange("all")}
        style={[styles.tab, active === "all" && styles.tabActive]}
      >
        <Text
          style={[
            styles.tabText,
            active === "all" ? styles.tabTextActive : styles.tabTextInactive,
          ]}
        >
          Tất cả
        </Text>
      </Pressable>
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function NotificationCard({ item, onPress, index }) {
  const unread = !item.readAt;
  const meta = item.metadata || {};
  const iconCfg = getIconConfig(meta.type);
  const relTime = formatRelativeTime(item.createdAt);

  return (
    <AnimatedPressable
      entering={FadeInDown.delay(index * 40).springify()}
      layout={Layout.springify()}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        unread && styles.cardUnread,
        pressed && styles.cardPressed,
      ]}
    >
      {/* Icon */}
      <View style={[styles.cardIconWrap, { backgroundColor: iconCfg.bg }]}>
        <MaterialIcons
          name={iconCfg.name}
          size={22}
          color={iconCfg.color}
        />
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardTopRow}>
          <Text
            style={[styles.cardTitle, unread && styles.cardTitleUnread]}
            numberOfLines={2}
          >
            {item.title || "Thông báo"}
          </Text>
          {unread && <View style={styles.cardDot} />}
        </View>

        <Text style={styles.cardBody} numberOfLines={2}>
          {item.body || item.message || ""}
        </Text>

        <Text style={styles.cardTime}>{relTime}</Text>
      </View>

      {/* Chevron */}
      <MaterialIcons
        name="chevron-right"
        size={20}
        color="#D1D1D6"
        style={styles.cardChevron}
      />
    </AnimatedPressable>
  );
}

function EmptyState({ tab }) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.emptyWrap}>
      <View style={styles.emptyIconWrap}>
        <MaterialIcons
          name={tab === "unread" ? "notifications-none" : "notifications-off"}
          size={40}
          color="#D1D1D6"
        />
      </View>
      <Text style={styles.emptyTitle}>
        {tab === "unread"
          ? "Không có thông báo mới"
          : "Chưa có thông báo nào"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {tab === "unread"
          ? "Tất cả thông báo đã được đọc."
          : "Thông báo từ booking, địa điểm và hệ thống sẽ xuất hiện ở đây."}
      </Text>
    </Animated.View>
  );
}

function LoadingState() {
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator size="large" color="#0071E3" />
    </View>
  );
}

/* ─── Main Screen ───────────────────────────────────── */
export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("unread");
  const [allItems, setAllItems] = useState([]);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  // Sync server data into local state
  useEffect(() => {
    if (data?.items) {
      const serverItems = data.items;
      setAllItems(serverItems);
      setLocalUnreadCount(data.unreadCount ?? 0);
      setHasMore(serverItems.length >= 40);
    }
  }, [data]);

  const items = useMemo(() => {
    if (activeTab === "unread") return allItems.filter((n) => !n.readAt);
    return allItems;
  }, [allItems, activeTab]);

  const unreadCount = activeTab === "unread"
    ? allItems.filter((n) => !n.readAt).length
    : localUnreadCount;

  const handlePress = useCallback(
    (item) => {
      if (!item.readAt) {
        markRead.mutate(item.id, {
          onSuccess: () => {
            setAllItems((prev) => prev.filter((n) => n.id !== item.id));
          },
        });
      }
      const route = resolveRoute(item);
      router.push(route);
    },
    [markRead, router],
  );

  const handleMarkAll = useCallback(() => {
    markAll.mutate(undefined, {
      onSuccess: () => {
        setAllItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
        setLocalUnreadCount(0);
      },
    });
  }, [markAll]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setPage((prev) => prev + 1);
    // TODO: call next page API when endpoint supports pagination
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <NotificationCard
        item={item}
        onPress={() => handlePress(item)}
        index={index}
      />
    ),
    [handlePress],
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader
        unreadCount={unreadCount}
        onBack={() => router.back()}
        onMarkAll={handleMarkAll}
      />

      <TabBar
        active={activeTab}
        onChange={handleTabChange}
        unreadCount={unreadCount}
      />

      {isLoading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: TAB_BAR_HEIGHT + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#0071E3" />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#0071E3"
            />
          }
        />
      )}
    </View>
  );
}

/* ─── Styles ────────────────────────────────────────── */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },

  /* ── Header ── */
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F5F5F7",
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: TOKENS.font.heading,
    color: "#1D1D1F",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#8E8E93",
    fontFamily: TOKENS.font.medium,
    marginTop: 1,
  },
  headerActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "#0071E3",
    minWidth: 36,
    alignItems: "center",
  },
  headerActionText: {
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    color: "#FFFFFF",
    letterSpacing: -0.1,
  },
  headerPlaceholder: {
    width: 70,
  },

  /* ── Tab Bar ── */
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: "#F5F5F7",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#1D1D1F",
  },
  tabText: {
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.2,
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  tabTextInactive: {
    color: "#8E8E93",
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  tabBadgeInactive: {
    backgroundColor: "#FF3B30",
  },
  tabBadgeText: {
    fontSize: 10,
    fontFamily: TOKENS.font.bold,
  },
  tabBadgeTextActive: {
    color: "#FFFFFF",
  },
  tabBadgeTextInactive: {
    color: "#FFFFFF",
  },

  /* ── List ── */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  separator: {
    height: 0,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },

  /* ── Card ── */
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    gap: 13,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
  },
  cardUnread: {
    backgroundColor: "#F8F8FF",
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shrink: 0,
  },
  cardContent: {
    flex: 1,
    gap: 3,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: "#3D3D3F",
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  cardTitleUnread: {
    color: "#1D1D1F",
    fontWeight: "600",
  },
  cardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0071E3",
    marginTop: 5,
    shrink: 0,
  },
  cardBody: {
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    color: "#8E8E93",
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  cardTime: {
    fontSize: 11,
    fontFamily: TOKENS.font.medium,
    color: "#C7C7CC",
    marginTop: 2,
    letterSpacing: -0.05,
  },
  cardChevron: {
    marginLeft: 2,
    shrink: 0,
  },

  /* ── Empty ── */
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: TOKENS.font.heading,
    color: "#1D1D1F",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 21,
    letterSpacing: -0.1,
  },

  /* ── Loading ── */
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
