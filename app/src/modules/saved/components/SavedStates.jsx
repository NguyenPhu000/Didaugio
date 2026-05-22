import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";

export function LoadingState() {
  return (
    <View style={styles.loadingState}>
      <View style={styles.loadingIconWrap}>
        <ActivityIndicator size="small" color="#1D1D1F" />
      </View>
      <Text style={styles.loadingTitle}>Đang tải bộ sưu tập</Text>
      <Text style={styles.loadingText}>
        Đồng bộ địa điểm đã lưu của bạn...
      </Text>
    </View>
  );
}

export function EmptyState({ onExplore, activeFilter }) {
  const isFiltered = Boolean(activeFilter);
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
            name={isFiltered ? "filter-alt-off" : "bookmark-border"}
            size={36}
            color={isFiltered ? APPLE_THEME.textMuted : "#1D1D1F"}
          />
        </View>
        <Text style={styles.centerTitle}>
          {isFiltered ? "Không có địa điểm" : "Chưa có địa điểm nào"}
        </Text>
        <Text style={styles.centerCopy}>
          {isFiltered
            ? "Thử đổi bộ lọc hoặc khu vực để xem các địa điểm khác bạn đã lưu."
            : "Hãy thử khám phá và lưu các địa điểm yêu thích để dễ truy cập."}
        </Text>
        {!isFiltered && onExplore ? (
          <Pressable
            onPress={onExplore}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.primaryBtnPressed,
            ]}
          >
            <MaterialIcons name="explore" size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Khám phá địa điểm</Text>
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
          <MaterialIcons name="cloud-off" size={36} color="#FF3B30" />
        </View>
        <Text style={styles.centerTitle}>Không tải được dữ liệu</Text>
        <Text style={styles.centerCopy}>
          Vui lòng kiểm tra kết nối mạng và thử lại để đồng bộ địa điểm đã lưu.
        </Text>
        {onRetry ? (
          <Pressable
            onPress={onRetry}
            style={({ pressed }) => [
              styles.errorBtn,
              pressed && styles.errorBtnPressed,
            ]}
          >
            <MaterialIcons name="refresh" size={18} color="#FF3B30" />
            <Text style={styles.errorBtnText}>Thử lại</Text>
          </Pressable>
        ) : null}
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
    padding: 32,
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
    marginBottom: 22,
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
    marginBottom: 22,
  },
  centerTitle: {
    color: APPLE_THEME.text,
    fontSize: 21,
    textAlign: "center",
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.4,
  },
  centerCopy: {
    marginTop: 8,
    color: APPLE_THEME.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    fontFamily: TOKENS.font.body,
    maxWidth: 300,
    letterSpacing: -0.1,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 24,
    paddingVertical: 13,
    backgroundColor: "#1D1D1F",
  },
  primaryBtnPressed: {
    backgroundColor: "#000000",
    transform: [{ scale: 0.97 }],
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.2,
  },
  errorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    borderRadius: TOKENS.radius.full,
    paddingHorizontal: 24,
    paddingVertical: 13,
    backgroundColor: "rgba(255, 59, 48, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.15)",
  },
  errorBtnPressed: {
    backgroundColor: "rgba(255, 59, 48, 0.14)",
    transform: [{ scale: 0.97 }],
  },
  errorBtnText: {
    color: "#FF3B30",
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.2,
  },
});
