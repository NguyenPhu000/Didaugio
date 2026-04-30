import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BOOKING_APPLE_THEME as THEME,
  TOKENS,
} from "../../src/constants/design-tokens";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../../src/modules/notifications/hooks/useNotifications";

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

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = useMemo(() => data?.items || [], [data?.items]);
  const unreadCount = data?.unreadCount ?? 0;

  const handlePressItem = useCallback(
    (item) => {
      const meta = item.metadata || {};
      const bookingId = meta.bookingId;
      const type = String(meta.type || "");

      if (!item.readAt) {
        markRead.mutate(item.id);
      }

      if (bookingId && type.startsWith("booking_")) {
        router.push(`/profile/booking/${bookingId}`);
      }
    },
    [markRead, router],
  );

  const handleMarkAll = useCallback(() => {
    if (!unreadCount) return;
    markAll.mutate();
  }, [markAll, unreadCount]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={22} color={THEME.text} />
        </Pressable>

        <View style={styles.headerBody}>
          <Text style={styles.title}>Thông báo</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0
              ? `${unreadCount} chưa đọc`
              : "Cập nhật từ đặt chỗ và hệ thống"}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 ? (
            <Pressable
              onPress={handleMarkAll}
              disabled={markAll.isPending}
              style={styles.markAllBtn}
            >
              <Text style={styles.markAllText}>
                {markAll.isPending ? "…" : "Đọc hết"}
              </Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => refetch()} style={styles.iconBtn}>
            <MaterialIcons
              name="refresh"
              size={20}
              color={THEME.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={THEME.primary}
              colors={[THEME.primary]}
              progressBackgroundColor={THEME.surface}
            />
          }
        >
          {items.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons
                name="notifications-none"
                size={30}
                color={THEME.textMuted}
              />
              <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
              <Text style={styles.emptySubtitle}>
                Khi booking được xác nhận hoặc có thay đổi trạng thái, bạn sẽ
                thấy ở đây.
              </Text>
            </View>
          ) : (
            items.map((item) => {
              const unread = !item.readAt;
              return (
                <Pressable
                  key={String(item.id)}
                  onPress={() => handlePressItem(item)}
                  style={({ pressed }) => [
                    styles.card,
                    pressed && styles.cardPressed,
                    unread && styles.cardUnread,
                  ]}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.itemTitle} numberOfLines={2}>
                      {item.title || "Thông báo"}
                    </Text>
                    {unread ? <View style={styles.dot} /> : null}
                  </View>
                  <Text style={styles.itemBody} numberOfLines={4}>
                    {item.body || item.message || ""}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {formatTime(item.createdAt)}
                  </Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  headerBody: {
    flex: 1,
  },
  markAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  markAllText: {
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    color: THEME.primary,
  },
  title: {
    fontSize: 19,
    color: THEME.text,
    fontFamily: TOKENS.font.semibold,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: THEME.textSecondary,
    fontFamily: TOKENS.font.regular,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 26,
    gap: 12,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.surface,
    padding: 22,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
    color: THEME.text,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    color: THEME.textSecondary,
    fontFamily: TOKENS.font.regular,
    lineHeight: 18,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.surface,
    padding: 14,
    gap: 6,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardUnread: {
    borderColor: `${THEME.primary}55`,
    backgroundColor: `${THEME.primary}08`,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: THEME.text,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    backgroundColor: THEME.primary,
  },
  itemBody: {
    fontSize: 13,
    lineHeight: 18,
    color: THEME.textSecondary,
    fontFamily: TOKENS.font.regular,
  },
  itemMeta: {
    fontSize: 11,
    color: THEME.textMuted,
    fontFamily: TOKENS.font.regular,
  },
});
