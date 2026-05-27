import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../../src/constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";

export function LoadingState() {
  return (
    <View style={styles.loadingState}>
      <View style={styles.loadingIconWrap}>
        <ActivityIndicator size="small" color="#1D1D1F" />
      </View>
      <Text style={styles.loadingTitle}>
        Chuẩn bị hành trình
      </Text>
      <Text style={styles.loadingText}>
        Đang đồng bộ dữ liệu chuyến đi...
      </Text>
    </View>
  );
}

export function EmptyTrips({ onCreate, activeFilter, onClearFilter }) {
  const isFiltered = activeFilter !== "all";

  return (
    <View style={styles.centerCardWrap}>
      <View style={styles.centerCard}>
        <View
          style={[
            styles.centerIconBlock,
            isFiltered && styles.centerIconFiltered,
          ]}
        >
          <MaterialIcons
            name={isFiltered ? "filter-alt-off" : "explore"}
            size={36}
            color={isFiltered ? APPLE_THEME.textMuted : "#1D1D1F"}
          />
        </View>

        <Text style={styles.centerTitle}>
          {isFiltered
            ? "Không có kết quả"
            : "Khám phá thế giới"}
        </Text>
        <Text style={styles.centerCopy}>
          {isFiltered
            ? "Thử đổi bộ lọc để xem lại các hành trình khác trong tài khoản của bạn."
            : "Tạo hành trình đầu tiên để gom điểm đến, lịch trình và ghi chú vào cùng một nơi gọn gàng."}
        </Text>

        {!isFiltered ? (
          <Pressable
            onPress={() => onCreate?.()}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <MaterialIcons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Tạo chuyến đi mới</Text>
          </Pressable>
        ) : null}

        {isFiltered && onClearFilter ? (
          <Pressable
            onPress={() => onClearFilter?.()}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <MaterialIcons name="filter-alt-off" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Xóa bộ lọc</Text>
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
        <View style={styles.errorIconBlock}>
          <MaterialIcons
            name="cloud-off"
            size={36}
            color="#FF3B30"
          />
        </View>
        <Text style={styles.centerTitle}>Không tải được dữ liệu</Text>
        <Text style={styles.centerCopy}>
          Vui lòng kiểm tra lại kết nối mạng và thử lại để đồng bộ hành trình.
        </Text>
        <Pressable
          onPress={() => onRetry?.()}
          style={({ pressed }) => [
            styles.errorButton,
            pressed && styles.errorButtonPressed,
          ]}
        >
          <MaterialIcons name="refresh" size={18} color="#FF3B30" />
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
    paddingHorizontal: 40,
    paddingTop: 56,
    paddingBottom: 40,
    gap: 10,
  },
  loadingIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  loadingTitle: {
    color: APPLE_THEME.text,
    fontSize: 17,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.3,
  },
  loadingText: {
    color: APPLE_THEME.textMuted,
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    letterSpacing: -0.1,
  },

  centerCardWrap: {
    paddingHorizontal: TAB_SCREEN_PADDING,
    paddingTop: 16,
  },
  centerCard: {
    borderRadius: 28,
    padding: 36,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  centerIconBlock: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
    marginBottom: 24,
  },
  centerIconFiltered: {
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  errorIconBlock: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 59, 48, 0.08)",
    marginBottom: 24,
  },
  centerTitle: {
    color: APPLE_THEME.text,
    fontSize: 22,
    textAlign: "center",
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.4,
  },
  centerCopy: {
    marginTop: 10,
    color: APPLE_THEME.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    fontFamily: TOKENS.font.body,
    maxWidth: 300,
    letterSpacing: -0.1,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 28,
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "#1D1D1F",
  },
  primaryButtonPressed: {
    backgroundColor: "#000000",
    transform: [{ scale: 0.97 }],
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.2,
  },
  errorButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 28,
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "rgba(255, 59, 48, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.15)",
  },
  errorButtonPressed: {
    backgroundColor: "rgba(255, 59, 48, 0.12)",
    transform: [{ scale: 0.97 }],
  },
  errorButtonText: {
    color: "#FF3B30",
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.2,
  },
});
