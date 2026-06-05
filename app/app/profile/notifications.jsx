import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown, Layout } from "react-native-reanimated";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../../src/modules/notifications/hooks/useNotifications";
import { TOKENS } from "../../src/constants/design-tokens";
import { TAB_BAR_HEIGHT } from "../(tabs)/_layout";
import { cn } from "../../src/lib/cn";

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
  booking: {
    name: "event-available",
    color: "#0071E3",
    bg: "rgba(0,113,227,0.08)",
  },
  place: { name: "place", color: "#34C759", bg: "rgba(52,199,89,0.08)" },
  business: {
    name: "storefront",
    color: "#FF9500",
    bg: "rgba(255,149,0,0.08)",
  },
  review: { name: "star", color: "#FFD60A", bg: "rgba(255,214,10,0.08)" },
  document: {
    name: "description",
    color: "#AF52DE",
    bg: "rgba(175,82,222,0.08)",
  },
  default: {
    name: "notifications",
    color: "#8E8E93",
    bg: "rgba(142,142,147,0.08)",
  },
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
  if (
    type.includes("business") ||
    type.includes("document") ||
    meta.businessId
  ) {
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
    <View className="flex-row items-center px-4 py-[14px] bg-[#F5F5F7]">
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onBack}
        className="w-9 h-9 rounded-full bg-white items-center justify-center"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <MaterialIconsRounded name="arrow-back" size={24} color="#1D1D1F" />
      </TouchableOpacity>

      <View className="flex-1 items-center">
        <Text className="text-[18px] font-bold text-[#1D1D1F] tracking-[-0.3px]">
          Thông báo
        </Text>
        {unreadCount > 0 && (
          <Text className="text-[11px] text-[#8E8E93] font-medium mt-[1px]">
            {unreadCount} chưa đọc
          </Text>
        )}
      </View>

      {unreadCount > 0 ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onMarkAll}
          className="px-3 py-[7px] rounded-[14px] bg-[#0071E3] min-w-[36px] items-center"
        >
          <Text className="text-[13px] font-semibold text-white tracking-[-0.1px]">
            Đọc hết
          </Text>
        </TouchableOpacity>
      ) : (
        <View className="w-[70px]" />
      )}
    </View>
  );
}

function TabBar({ active, onChange, unreadCount }) {
  return (
    <View className="flex-row px-4 pb-3 gap-2 bg-[#F5F5F7]">
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onChange("unread")}
        className={cn(
          "flex-row items-center px-4 py-2 rounded-[20px] gap-[6px]",
          active === "unread" ? "bg-[#1D1D1F]" : "",
        )}
      >
        <Text
          className={cn(
            "text-[14px] font-semibold tracking-[-0.2px]",
            active === "unread" ? "text-white" : "text-[#8E8E93]",
          )}
        >
          Chưa đọc
        </Text>
        {unreadCount > 0 && (
          <View
            className={cn(
              "min-w-5 h-5 rounded-full items-center justify-center px-1",
              active === "unread" ? "bg-white/22" : "bg-[#FF3B30]",
            )}
          >
            <Text className="text-[10px] font-bold text-white">
              {unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onChange("all")}
        className={cn(
          "flex-row items-center px-4 py-2 rounded-[20px] gap-[6px]",
          active === "all" ? "bg-[#1D1D1F]" : "",
        )}
      >
        <Text
          className={cn(
            "text-[14px] font-semibold tracking-[-0.2px]",
            active === "all" ? "text-white" : "text-[#8E8E93]",
          )}
        >
          Tất cả
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function NotificationCard({ item, onPress, index }) {
  const unread = !item.readAt;
  const meta = item.metadata || {};
  const iconCfg = getIconConfig(meta.type);
  const relTime = formatRelativeTime(item.createdAt);

  return (
    <AnimatedTouchable
      entering={FadeInDown.delay(index * 40).springify()}
      layout={Layout.springify()}
      activeOpacity={0.7}
      onPress={onPress}
      className={cn(
        "flex-row items-center bg-white rounded-[14px] p-[14px] gap-[13px] mb-2",
        unread && "bg-[#F8F8FF]",
      )}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Icon */}
      <View
        className="w-11 h-11 rounded-xl items-center justify-center shrink-0"
        style={{ backgroundColor: iconCfg.bg }}
      >
        <MaterialIconsRounded
          name={iconCfg.name}
          size={22}
          color={iconCfg.color}
        />
      </View>

      {/* Content */}
      <View className="flex-1 gap-[3px]">
        <View className="flex-row items-start justify-between gap-2">
          <Text
            className={cn(
              "flex-1 text-[15px] font-semibold leading-5 tracking-[-0.2px]",
              unread ? "text-[#1D1D1F] font-bold" : "text-[#3D3D3F]",
            )}
            numberOfLines={2}
          >
            {item.title || "Thông báo"}
          </Text>
          {unread && (
            <View className="w-2 h-2 rounded-full bg-[#0071E3] mt-[5px] shrink-0" />
          )}
        </View>

        <Text
          className="text-[13px] font-sans text-[#8E8E93] leading-[18px] tracking-[-0.1px]"
          numberOfLines={2}
        >
          {item.body || item.message || ""}
        </Text>

        <Text className="text-[11px] font-medium text-[#C7C7CC] mt-0.5 tracking-[-0.05px]">
          {relTime}
        </Text>
      </View>

      {/* Chevron */}
      <MaterialIconsRounded
        name="chevron-right"
        size={20}
        color="#D1D1D6"
        style={{ marginLeft: 2 }}
      />
    </AnimatedTouchable>
  );
}

function EmptyState({ tab }) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="flex-1 items-center justify-center px-10 pb-20"
    >
      <View
        className="w-20 h-20 rounded-full bg-white items-center justify-center mb-5"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <MaterialIconsRounded
          name={tab === "unread" ? "notifications-none" : "notifications-off"}
          size={40}
          color="#D1D1D6"
        />
      </View>
      <Text className="text-[20px] font-bold text-[#1D1D1F] text-center mb-2 tracking-[-0.4px]">
        {tab === "unread" ? "Không có thông báo mới" : "Chưa có thông báo nào"}
      </Text>
      <Text className="text-[14px] font-sans text-[#8E8E93] text-center leading-[21px] tracking-[-0.1px]">
        {tab === "unread"
          ? "Tất cả thông báo đã được đọc."
          : "Thông báo từ booking, địa điểm và hệ thống sẽ xuất hiện ở đây."}
      </Text>
    </Animated.View>
  );
}

function LoadingState() {
  return (
    <View className="flex-1 items-center justify-center">
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

  const unreadCount =
    activeTab === "unread"
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
        setAllItems((prev) =>
          prev.map((n) => ({
            ...n,
            readAt: n.readAt || new Date().toISOString(),
          })),
        );
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
    <View className="flex-1 bg-[#F5F5F7]" style={{ paddingTop: insets.top }}>
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
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: TAB_BAR_HEIGHT + 24,
          }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isLoadingMore ? (
              <View className="py-5 items-center">
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
