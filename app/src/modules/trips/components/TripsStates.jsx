import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../../../src/constants/design-tokens";
import { TAB_THEME, TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";

// Lottie hoặc skeleton sẽ đẹp hơn, nhưng tạm thời fallback ActivityIndicator
export function LoadingState() {
  return (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color={TAB_THEME.primary} />
      <Text style={styles.loadingText}>Đang chuẩn bị dữ liệu hành trình...</Text>
    </View>
  );
}

export function EmptyTrips({ onCreate, activeFilter }) {
  const isFiltered = activeFilter !== "all";

  return (
    <View style={styles.centerCardWrap}>
      <View style={styles.centerCard}>
        <View style={styles.centerIconBlock}>
          <View style={styles.centerIconPulse} />
          <MaterialIcons
            name={isFiltered ? "filter-alt-off" : "explore"}
            size={42}
            color={TAB_THEME.primary}
          />
        </View>

        <Text style={styles.centerTitle}>
          {isFiltered ? "Không có kết quả phù hợp" : "Bắt đầu khám phá thế giới"}
        </Text>
        <Text style={styles.centerCopy}>
          {isFiltered
            ? "Thử đổi bộ lọc để xem lại các hành trình khác trong tài khoản của bạn."
            : "Tạo hành trình đầu tiên để gom điểm đến, lịch trình và ghi chú vào cùng một nơi thật gọn gàng."}
        </Text>

        {!isFiltered ? (
          <Pressable onPress={onCreate} style={styles.primaryButton}>
            <MaterialIcons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Tạo chuyến đi mới</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function ErrorState({ onRetry }) {
  return (
    <View style={styles.centerCardWrap}>
      <View style={styles.centerCard}>
        <View style={[styles.centerIconBlock, styles.errorIconBlock]}>
          <MaterialIcons name="cloud-off" size={42} color={TOKENS.color.error} />
        </View>
        <Text style={styles.centerTitle}>Không tải được dữ liệu</Text>
        <Text style={styles.centerCopy}>
          Vui lòng kiểm tra lại kết nối mạng và thử lại để đồng bộ hành trình.
        </Text>
        <Pressable onPress={onRetry} style={styles.errorButton}>
          <MaterialIcons name="refresh" size={18} color={TOKENS.color.error} />
          <Text style={styles.errorButtonText}>Thử lại</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 36,
    gap: 16,
  },
  loadingText: {
    color: "#475569",
    fontSize: 15,
    fontFamily: TOKENS.font.medium,
  },
  centerCardWrap: {
    paddingHorizontal: TAB_SCREEN_PADDING,
    paddingTop: 12,
  },
  centerCard: {
    borderRadius: 28,
    padding: 32,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.1)",
    ...TOKENS.shadow.md,
  },
  centerIconBlock: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    marginBottom: 20,
    overflow: "hidden",
  },
  centerIconPulse: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(59, 130, 246, 0.08)",
  },
  errorIconBlock: {
    backgroundColor: "#FEF2F2",
  },
  centerTitle: {
    color: "#0F172A",
    fontSize: 22,
    textAlign: "center",
    fontFamily: TOKENS.font.heading,
  },
  centerCopy: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    fontFamily: TOKENS.font.body,
    maxWidth: 320,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: TAB_THEME.primary,
    ...TOKENS.shadow.accent,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
  },
  errorButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#FECDD3",
  },
  errorButtonText: {
    color: TOKENS.color.error,
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
  },
});
