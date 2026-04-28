import { memo } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { getGreeting, getUserName } from "../utils/exploreHelpers";
import { resolveMediaUrl } from "../../../lib/media-url";

function ExploreModernHeaderInner({ user, onPressSearch }) {
  const userName = getUserName(user);
  const avatarUri = resolveMediaUrl(
    user?.profile?.avatar || user?.avatar || user?.avatarURL || user?.photoURL,
  );

  return (
    <View style={styles.container}>
      {/* Top Row: User & Notification */}
      <View style={styles.topRow}>
        <View style={styles.userInfo}>
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <MaterialIcons
                name="person"
                size={24}
                color={APPLE_THEME.textSoft}
              />
            )}
          </View>
          <View>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.userNameText}>{userName}</Text>
          </View>
        </View>

        <Pressable style={styles.bellButton}>
          <Ionicons
            name="notifications-outline"
            size={22}
            color={APPLE_THEME.text}
          />
          <View style={styles.notificationDot} />
        </Pressable>
      </View>

      {/* Title */}
      <View style={styles.titleWrap}>
        <Text style={styles.title}>Bạn muốn khám phá gì hôm nay?</Text>
        <Text style={styles.subtitle}>
          Chọn danh mục, xem địa điểm nổi bật và bắt đầu hành trình tại Cần Thơ.
        </Text>
      </View>

      {/* Search Bar - Pill Shape with integrated Location Button */}
      <Pressable onPress={onPressSearch} style={styles.searchBar}>
        <MaterialIcons name="search" size={22} color={APPLE_THEME.textMuted} />
        <Text style={styles.searchText}>Tìm địa điểm, món ăn, hoạt động...</Text>

        {/* Location Button (Orange Style like reference) */}
        <View style={styles.locationButton}>
          <MaterialIcons name="place" size={14} color="#FFF" />
          <Text style={styles.locationButtonText}>Cần Thơ</Text>
        </View>
      </Pressable>
    </View>
  );
}

export const ExploreModernHeader = memo(ExploreModernHeaderInner);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: APPLE_THEME.background,
  },
  /* — Top row — */
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9", // Slate 100
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  greetingText: {
    fontSize: 13,
    color: APPLE_THEME.textMuted,
    fontFamily: TOKENS.font.medium,
  },
  userNameText: {
    fontSize: 16,
    color: APPLE_THEME.text,
    fontFamily: TOKENS.font.semibold,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: APPLE_THEME.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APPLE_THEME.borderSoft || "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  notificationDot: {
    position: "absolute",
    top: 13,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF2D55", // Red dot
    borderWidth: 1.5,
    borderColor: APPLE_THEME.surface,
  },
  /* — Title — */
  titleWrap: {
    marginBottom: 22,
  },
  title: {
    fontSize: 26,
    color: APPLE_THEME.text,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.45,
    lineHeight: 32,
  },
  subtitle: {
    marginTop: 8,
    color: APPLE_THEME.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TOKENS.font.medium,
  },
  /* — Search bar — */
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: APPLE_THEME.surface,
    height: 54,
    borderRadius: 999, // Pill shape
    paddingLeft: 16,
    paddingRight: 6, // Smaller padding on right for the inner button
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APPLE_THEME.borderSoft || "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  searchText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: APPLE_THEME.textMuted,
    fontFamily: TOKENS.font.medium,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000000", // Black accent matching the theme
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 999,
    gap: 4,
  },
  locationButtonText: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },
});
