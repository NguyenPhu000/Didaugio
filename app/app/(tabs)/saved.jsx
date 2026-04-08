import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { PlaceCard } from "../../src/components/composed/PlaceCard";
import { PlaceCardSkeleton } from "../../src/components/ui/Skeleton";
import { GuestGate } from "../../src/components/ui/GuestGate";
import {
  useSavedPlaces,
  useUnsavePlace,
} from "../../src/modules/saved/hooks/useSaved";
import { useAuthStore } from "../../src/stores/authStore";
import { TOKENS } from "../../src/constants/design-tokens";
import { TAB_BAR_HEIGHT } from "./_layout";
import { TAB_CARD_RADIUS, TAB_SCREEN_PADDING, TAB_THEME } from "./tabTheme";

function buildSummary(count) {
  return [
    {
      key: "saved",
      icon: "bookmark",
      value: String(count),
      label: "Đã lưu",
      tone: "blue",
    },
    {
      key: "sync",
      icon: "cloud-done",
      value: "Đã bật",
      label: "Đồng bộ",
      tone: "amber",
    },
    {
      key: "revisit",
      icon: "history",
      value: count > 0 ? "Sẵn sàng" : "Trống",
      label: "Quay lại nhanh",
      tone: "green",
    },
    {
      key: "collection",
      icon: "auto-awesome",
      value: count > 9 ? "Phong phú" : "Gọn gàng",
      label: "Bộ sưu tập",
      tone: "red",
    },
  ];
}

function SummaryTile({ item }) {
  const toneStyles = {
    blue: [styles.summaryIconBlue, styles.summaryGlowBlue],
    amber: [styles.summaryIconAmber, styles.summaryGlowAmber],
    green: [styles.summaryIconGreen, styles.summaryGlowGreen],
    red: [styles.summaryIconRed, styles.summaryGlowRed],
  };
  const [iconStyle, glowStyle] = toneStyles[item.tone] || toneStyles.blue;

  return (
    <View style={styles.summaryTile}>
      <View style={[styles.summaryIcon, iconStyle]}>
        <MaterialIcons name={item.icon} size={18} color="#FFFFFF" />
      </View>
      <Text style={styles.summaryValue}>{item.value}</Text>
      <Text style={styles.summaryLabel}>{item.label}</Text>
      <View style={[styles.summaryGlow, glowStyle]} />
    </View>
  );
}

function SavedHeader({ count }) {
  const summary = buildSummary(count);

  return (
    <View style={styles.headerWrap}>
      <View style={styles.heroCard}>
        <View style={styles.heroBackdropA} />
        <View style={styles.heroBackdropB} />

        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <MaterialIcons
              name="bookmark"
              size={14}
              color={TAB_THEME.primary}
            />
            <Text style={styles.heroBadgeText}>Bộ sưu tập đã lưu</Text>
          </View>
          <View style={styles.counterPill}>
            <Text style={styles.counterText}>{count} địa điểm</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Những nơi bạn muốn quay lại</Text>
        <Text style={styles.heroSubtitle}>
          Lưu lại quán ăn, điểm tham quan và trải nghiệm yêu thích để mở nhanh
          hơn ở mỗi lần dùng app.
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <MaterialIcons
              name="cloud-done"
              size={14}
              color={TAB_THEME.primary}
            />
            <Text style={styles.metaText}>Đồng bộ theo tài khoản</Text>
          </View>
          <View style={styles.metaPill}>
            <MaterialIcons name="bolt" size={14} color={TAB_THEME.primary} />
            <Text style={styles.metaText}>Mở lại chi tiết nhanh</Text>
          </View>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        {summary.map((item) => (
          <SummaryTile key={item.key} item={item} />
        ))}
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Danh sách địa điểm</Text>
        <Text style={styles.sectionCopy}>
          Mọi địa điểm yêu thích đều được gom lại để bạn xem lại, bỏ lưu hoặc mở
          chi tiết chỉ trong một chạm.
        </Text>
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.centerCardWrap}>
      <View style={styles.centerCard}>
        <View style={styles.centerIconBlock}>
          <View style={styles.centerIconPulse} />
          <MaterialIcons
            name="bookmark-border"
            size={38}
            color={TAB_THEME.primary}
          />
        </View>
        <Text style={styles.centerTitle}>Chưa có địa điểm nào</Text>
        <Text style={styles.centerCopy}>
          Khi bạn lưu một địa điểm từ Explore, địa điểm đó sẽ xuất hiện tại đây
          để quay lại bất cứ lúc nào.
        </Text>
      </View>
    </View>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <View style={styles.centerCardWrap}>
      <View style={styles.centerCard}>
        <View style={[styles.centerIconBlock, styles.errorIconBlock]}>
          <MaterialIcons
            name="error-outline"
            size={38}
            color={TOKENS.color.error}
          />
        </View>
        <Text style={styles.centerTitle}>Không tải được danh sách</Text>
        <Text style={styles.centerCopy}>
          {message ||
            "Đã có lỗi khi tải danh sách đã lưu. Thử lại sau ít phút."}
        </Text>
        <Pressable onPress={onRetry} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Thử lại</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.skeletonWrap}>
      <PlaceCardSkeleton />
      <PlaceCardSkeleton />
      <PlaceCardSkeleton />
    </View>
  );
}

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);
  const isLoggedIn = !!accessToken && !isGuest;

  const {
    data: savedData = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useSavedPlaces(isLoggedIn);
  const unsaveMutation = useUnsavePlace();

  if (!isLoggedIn) {
    return (
      <GuestGate
        icon="bookmark-border"
        title="Đăng nhập để lưu bộ sưu tập"
        description="Danh sách đã lưu sẽ được đồng bộ với tài khoản của bạn trên mọi thiết bị."
      />
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FlatList
        data={!isLoading && !isError ? savedData : []}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={TAB_THEME.primary}
            colors={[TAB_THEME.primary]}
          />
        }
        ListHeaderComponent={<SavedHeader count={savedData.length} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState message={error?.message} onRetry={refetch} />
          ) : (
            <EmptyState />
          )
        }
        renderItem={({ item }) => {
          const place = item?.place || item;
          return (
            <View style={styles.cardWrap}>
              <PlaceCard
                place={place}
                onSave={() => unsaveMutation.mutate(place.id)}
                isSaved
                style={styles.placeCardStyle}
              />
            </View>
          );
        }}
        ListFooterComponent={<View style={styles.footerSpace} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6FAFF",
  },
  listContent: {
    paddingBottom: TAB_BAR_HEIGHT + 24,
  },
  headerWrap: {
    paddingHorizontal: TAB_SCREEN_PADDING,
    paddingTop: 16,
    paddingBottom: 18,
  },
  heroCard: {
    overflow: "hidden",
    borderRadius: TAB_CARD_RADIUS,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    gap: 12,
    ...TOKENS.shadow.lg,
  },
  heroBackdropA: {
    position: "absolute",
    top: -70,
    right: -36,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(59, 130, 246, 0.12)",
  },
  heroBackdropB: {
    position: "absolute",
    bottom: -88,
    left: -54,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(14, 165, 233, 0.08)",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(59, 130, 246, 0.12)",
  },
  heroBadgeText: {
    color: TAB_THEME.primary,
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },
  counterPill: {
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F8FBFF",
  },
  counterText: {
    color: TAB_THEME.text,
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
  },
  heroTitle: {
    color: TAB_THEME.text,
    fontSize: 30,
    lineHeight: 34,
    fontFamily: TOKENS.font.heading,
  },
  heroSubtitle: {
    color: TAB_THEME.textMuted,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: TOKENS.font.body,
    maxWidth: "94%",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F8FBFF",
  },
  metaText: {
    color: TAB_THEME.textMuted,
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  summaryTile: {
    width: "47.5%",
    minHeight: 112,
    borderRadius: 24,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    overflow: "hidden",
    ...TOKENS.shadow.sm,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  summaryIconBlue: {
    backgroundColor: "#2563EB",
  },
  summaryIconAmber: {
    backgroundColor: "#F59E0B",
  },
  summaryIconGreen: {
    backgroundColor: "#10B981",
  },
  summaryIconRed: {
    backgroundColor: "#EF4444",
  },
  summaryValue: {
    color: TAB_THEME.text,
    fontSize: 22,
    fontFamily: TOKENS.font.heading,
  },
  summaryLabel: {
    marginTop: 4,
    color: TAB_THEME.textMuted,
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
  },
  summaryGlow: {
    position: "absolute",
    right: -18,
    bottom: -24,
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  summaryGlowBlue: {
    backgroundColor: "rgba(37, 99, 235, 0.08)",
  },
  summaryGlowAmber: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  summaryGlowGreen: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  summaryGlowRed: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  sectionHead: {
    marginTop: 18,
    gap: 4,
  },
  sectionTitle: {
    color: TAB_THEME.text,
    fontSize: 20,
    fontFamily: TOKENS.font.heading,
  },
  sectionCopy: {
    color: TAB_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TOKENS.font.body,
  },
  skeletonWrap: {
    paddingHorizontal: TAB_SCREEN_PADDING,
    gap: 16,
  },
  separator: {
    height: 14,
  },
  cardWrap: {
    paddingHorizontal: TAB_SCREEN_PADDING,
  },
  placeCardStyle: {
    marginBottom: 0,
  },
  centerCardWrap: {
    paddingHorizontal: TAB_SCREEN_PADDING,
    paddingTop: 12,
  },
  centerCard: {
    alignItems: "center",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    ...TOKENS.shadow.md,
  },
  centerIconBlock: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF3FF",
    overflow: "hidden",
  },
  centerIconPulse: {
    position: "absolute",
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(59, 130, 246, 0.12)",
  },
  errorIconBlock: {
    backgroundColor: "#FEF2F2",
  },
  centerTitle: {
    marginTop: 18,
    color: TAB_THEME.text,
    fontSize: 24,
    lineHeight: 30,
    textAlign: "center",
    fontFamily: TOKENS.font.heading,
  },
  centerCopy: {
    marginTop: 10,
    color: TAB_THEME.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    fontFamily: TOKENS.font.body,
  },
  primaryButton: {
    marginTop: 18,
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: TAB_THEME.primary,
    ...TOKENS.shadow.accent,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
  footerSpace: {
    height: 8,
  },
});
