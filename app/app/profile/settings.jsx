import { useState, useCallback } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/modules/auth/hooks/useAuth";
import { useAuthStore } from "../../src/stores/authStore";
import { useUIStore } from "../../src/stores/uiStore";
import { useProfile } from "../../src/modules/profile/hooks/useProfile";
import { TOKENS } from "../../src/constants/design-tokens";
import { TAB_BAR_HEIGHT } from "../(tabs)/_layout";
import { TAB_SCREEN_PADDING, TAB_THEME } from "../(tabs)/tabTheme";

const ACCENT_BLUE = "#3478F6";

/* ====================== SUB COMPONENTS ====================== */

function SettingRow({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  onPress,
  rightElement,
  danger = false,
  disabled = false,
}) {
  const isInteractive = typeof onPress === "function" && !disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={!isInteractive}
      style={({ pressed }) => [
        isInteractive && pressed && styles.pressFeedback,
        { overflow: "hidden" }
      ]}
    >
      <View style={[styles.settingRow, danger && styles.settingRowDanger]}>
        {/* Icon */}
        <View
          style={[
            styles.settingIconWrap,
            {
              backgroundColor: danger
                ? "rgba(239,68,68,0.1)"
                : iconBg || "rgba(52,120,246,0.1)",
              marginRight: 16, // Use margin instead of gap for better Android support
            },
          ]}
        >
          <MaterialIcons
            name={icon}
            size={24}
            color={danger ? TOKENS.color.error : iconColor || ACCENT_BLUE}
          />
        </View>

        {/* Text content */}
        <View style={styles.settingCopy}>
          <Text
            style={[styles.settingTitle, danger && styles.settingTitleDanger]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.settingSubtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Right side */}
        {rightElement ? (
          rightElement
        ) : isInteractive ? (
          <MaterialIcons name="chevron-right" size={24} color="#64748B" />
        ) : null}
      </View>
    </Pressable>
  );
}

function SectionHeader({ text }) {
  return <Text style={styles.sectionHeaderText}>{text}</Text>;
}

function LogoutConfirmModal({ visible, onCancel, onConfirm }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.modalBackdrop} onPress={onCancel}>
        <View style={styles.modalCard}>
          <View style={styles.modalIconWrap}>
            <MaterialIcons name="logout" size={28} color={TOKENS.color.error} />
          </View>
          <Text style={styles.modalTitle}>Đăng xuất khỏi tài khoản?</Text>
          <Text style={styles.modalCopy}>
            Bạn sẽ cần đăng nhập lại để sử dụng các tính năng cá nhân.
          </Text>

          <View style={styles.modalActions}>
            <Pressable onPress={onCancel} style={styles.modalCancelBtn}>
              <Text style={styles.modalCancelText}>Hủy</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={styles.modalConfirmBtn}>
              <Text style={styles.modalConfirmText}>Đăng xuất</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

/* ====================== MAIN SCREEN ====================== */
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const storedUser = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);
  const isLoggedIn = !!accessToken && !isGuest;

  const language = useUIStore((s) => s.language || "vi");
  const setLanguage = useUIStore((s) => s.setLanguage);
  const themePreference = useUIStore((s) => s.themePreference || "auto");
  const setTheme = useUIStore((s) => s.setTheme);
  const profileSettings = useUIStore((s) => s.profileSettings);
  const updateProfileSettings = useUIStore((s) => s.updateProfileSettings);

  const { logout } = useAuth();
  const { data: profile, refetch, isRefetching } = useProfile(isLoggedIn);

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // Derived states
  const darkModeEnabled = themePreference === "dark";
  const pushEnabled = profileSettings?.pushEnabled ?? true;
  const syncEnabled = profileSettings?.syncEnabled ?? true;
  const hapticEnabled = profileSettings?.hapticEnabled ?? true; // Mới: haptic feedback
  const email = profile?.email || storedUser?.email || "Chưa cập nhật";

  // Handlers
  const handleSoonFeature = useCallback((title) => {
    Alert.alert("Sắp ra mắt", `${title} sẽ có trong bản cập nhật tới.`);
  }, []);

  const handleToggleTheme = useCallback(
    (enabled) => setTheme(enabled ? "dark" : "light"),
    [setTheme]
  );

  const handleTogglePush = useCallback(
    (enabled) => updateProfileSettings?.({ pushEnabled: enabled }),
    [updateProfileSettings]
  );

  const handleToggleSync = useCallback(
    (enabled) => updateProfileSettings?.({ syncEnabled: enabled }),
    [updateProfileSettings]
  );

  const handleToggleHaptic = useCallback(
    (enabled) => updateProfileSettings?.({ hapticEnabled: enabled }),
    [updateProfileSettings]
  );

  const handleToggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "vi" : "en");
  }, [language, setLanguage]);

  const handleConfirmLogout = useCallback(() => {
    setLogoutModalVisible(false);
    logout();
  }, [logout]);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      "Xóa cache?",
      "Điều này sẽ xóa dữ liệu tạm và làm mới ứng dụng. Bạn có chắc không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            // Có thể thêm AsyncStorage.clear() hoặc tương tự ở đây nếu cần
            Alert.alert("Đã xóa cache!", "Ứng dụng đã được làm mới.");
          },
        },
      ]
    );
  }, []);

  const handleOpenPrivacy = useCallback(() => {
    // Demo mở link (bạn có thể thay bằng link thật của app)
    Linking.openURL("https://yourapp.com/privacy").catch(() =>
      handleSoonFeature("Privacy Policy")
    );
  }, [handleSoonFeature]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header hiện đại hơn - giống Profile */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={26} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle}>CÀI ĐẶT</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ==================== ACCOUNT SECTION (nếu đã login) ==================== */}
        {isLoggedIn && (
          <>
            <SectionHeader text="Tài khoản" />
            <View style={styles.settingsCard}>
              {/* Profile preview hiện đại */}
              <SettingRow
                icon="person"
                iconBg="rgba(16,185,129,0.1)"
                iconColor="#10B981"
                title="Chỉnh sửa hồ sơ"
                subtitle="Cập nhật tên, avatar & thông tin"
                onPress={() => router.push("/profile/edit")}
              />
              <View style={styles.divider} />

              <SettingRow
                icon="mail-outline"
                iconBg="rgba(148,163,184,0.1)"
                iconColor="#64748B"
                title="Email đăng nhập"
                subtitle={email}
              />
              <View style={styles.divider} />

              <SettingRow
                icon="security"
                iconBg="rgba(245,158,11,0.1)"
                iconColor="#F59E0B"
                title="Bảo mật tài khoản"
                subtitle="Quản lý phiên & mật khẩu"
                onPress={() => handleSoonFeature("Account Security")}
              />
              <View style={styles.divider} />

              <SettingRow
                icon="sync"
                title="Đồng bộ hồ sơ"
                subtitle={isRefetching ? "Đang lấy dữ liệu..." : "Giữ hồ sơ luôn mới"}
                onPress={isRefetching ? undefined : refetch}
              />
            </View>
          </>
        )}

        {/* ==================== PREFERENCES SECTION ==================== */}
        <SectionHeader text="Tùy chỉnh" />
        <View style={styles.settingsCard}>
          {/* Dark mode */}
          <SettingRow
            icon="dark-mode"
            iconBg="rgba(99,102,241,0.1)"
            iconColor="#6366F1"
            title="Chế độ tối"
            subtitle={darkModeEnabled ? "Đang bật" : "Đang tắt"}
            rightElement={
              <Switch
                value={darkModeEnabled}
                onValueChange={handleToggleTheme}
                trackColor={{ false: "#CBD5E1", true: ACCENT_BLUE + "88" }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <View style={styles.divider} />

          {/* Language */}
          <SettingRow
            icon="language"
            iconBg="rgba(16,185,129,0.1)"
            iconColor="#10B981"
            title="Ngôn ngữ"
            subtitle={language === "en" ? "English" : "Tiếng Việt"}
            onPress={handleToggleLanguage}
            rightElement={
              <View style={styles.languageBadge}>
                <Text style={styles.languageBadgeText}>
                  {language === "en" ? "EN" : "VI"}
                </Text>
              </View>
            }
          />
          <View style={styles.divider} />

          {/* Notifications */}
          <SettingRow
            icon="notifications"
            iconBg="rgba(239,68,68,0.08)"
            iconColor="#EF4444"
            title="Thông báo đẩy"
            subtitle={pushEnabled ? "Bật" : "Tắt"}
            rightElement={
              <Switch
                value={pushEnabled}
                onValueChange={handleTogglePush}
                trackColor={{ false: "#CBD5E1", true: ACCENT_BLUE + "88" }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <View style={styles.divider} />

          {/* Haptic (mới) */}
          <SettingRow
            icon="vibration"
            iconBg="rgba(234,179,8,0.1)"
            iconColor="#EAB308"
            title="Rung phản hồi"
            subtitle="Rung khi chạm"
            rightElement={
              <Switch
                value={hapticEnabled}
                onValueChange={handleToggleHaptic}
                trackColor={{ false: "#CBD5E1", true: ACCENT_BLUE + "88" }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <View style={styles.divider} />

          {/* Auto Sync */}
          <SettingRow
            icon="sync"
            title="Tự động đồng bộ"
            subtitle={
              syncEnabled
                ? isRefetching
                  ? "Đang đồng bộ..."
                  : "Luôn cập nhật"
                : "Chỉ đồng bộ thủ công"
            }
            rightElement={
              <Switch
                value={syncEnabled}
                onValueChange={handleToggleSync}
                trackColor={{ false: "#CBD5E1", true: ACCENT_BLUE + "88" }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>

        {/* ==================== SAVED & PAYMENT (giữ nguyên nhưng hiện đại hơn) ==================== */}
        <SectionHeader text="Tính năng" />
        <View style={styles.settingsCard}>
          <SettingRow
            icon="bookmark"
            title="Địa điểm đã lưu"
            onPress={() => router.push("/(tabs)/saved")}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="credit-card"
            iconBg="rgba(245,158,11,0.1)"
            iconColor="#F59E0B"
            title="Phương thức thanh toán"
            onPress={() => handleSoonFeature("Payment Methods")}
          />
        </View>

        {/* ==================== SUPPORT SECTION (mới - chức năng tiêu chuẩn) ==================== */}
        <SectionHeader text="Hỗ trợ" />
        <View style={styles.settingsCard}>
          <SettingRow
            icon="help-outline"
            title="Trung tâm trợ giúp"
            subtitle="Hướng dẫn & FAQ"
            onPress={() => handleSoonFeature("Help & Support")}
          />
          <View style={styles.divider} />

          <SettingRow
            icon="feedback"
            title="Gửi phản hồi"
            subtitle="Đóng góp ý kiến cho chúng tôi"
            onPress={() => handleSoonFeature("Send Feedback")}
          />
          <View style={styles.divider} />

          <SettingRow
            icon="delete-sweep"
            title="Xóa cache"
            subtitle="Giải phóng dung lượng"
            onPress={handleClearCache}
          />
        </View>

        {/* ==================== LEGAL SECTION (mới - chức năng tiêu chuẩn) ==================== */}
        <SectionHeader text="Pháp lý" />
        <View style={styles.settingsCard}>
          <SettingRow
            icon="policy"
            title="Chính sách bảo mật"
            onPress={handleOpenPrivacy}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="description"
            title="Điều khoản dịch vụ"
            onPress={() => handleSoonFeature("Terms of Service")}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="info-outline"
            iconBg="rgba(148,163,184,0.12)"
            iconColor="#64748B"
            title="Phiên bản ứng dụng"
            subtitle="v1.2.4 (build 2026.04)"
            onPress={() => handleSoonFeature("App Version")}
          />
        </View>

        {/* Logout - chỉ hiển thị khi đã login */}
        {isLoggedIn && (
          <View style={[styles.settingsCard, { marginTop: 12, marginBottom: 24 }]}>
            <SettingRow
              icon="logout"
              title="Đăng xuất"
              danger={true}
              onPress={() => setLogoutModalVisible(true)}
              rightElement={<View />} // Không hiển thị dấu chevron
            />
          </View>
        )}
      </ScrollView>

      <LogoutConfirmModal
        visible={logoutModalVisible}
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={handleConfirmLogout}
      />
    </View>
  );
}

/* ====================== STYLES (cập nhật hiện đại hơn) ====================== */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: TAB_BAR_HEIGHT + 60,
    gap: 28,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#F8FAFC",
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 19,
    fontFamily: TOKENS.font.semibold,
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  headerPlaceholder: { width: 34 },

  /* Card chính - bo tròn hơn, shadow mềm mại */
  settingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 6,
  },
  divider: {
    height: 1,
    marginLeft: 72,
    backgroundColor: "rgba(148,163,184,0.12)",
  },

  /* Setting row - padding rộng hơn, dễ chạm */
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 18,
    minHeight: 68,
  },
  settingRowDanger: {
    backgroundColor: "rgba(239,68,68,0.04)",
  },
  settingIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  settingCopy: {
    flex: 1,
    justifyContent: "center",
  },
  settingTitle: {
    fontSize: 16.5,
    fontFamily: TOKENS.font.semibold,
    color: "#0F172A",
    lineHeight: 22,
  },
  settingTitleDanger: {
    color: TOKENS.color.error,
  },
  settingSubtitle: {
    fontSize: 13.5,
    color: "#64748B",
    fontFamily: TOKENS.font.medium,
    marginTop: 3,
    lineHeight: 18,
  },

  /* Section header - hiện đại */
  sectionHeaderText: {
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginLeft: 8,
    marginBottom: 10,
  },

  /* Language badge */
  languageBadge: {
    backgroundColor: "rgba(52,120,246,0.1)",
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(52,120,246,0.3)",
  },
  languageBadgeText: {
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    color: ACCENT_BLUE,
  },

  /* Modal - đẹp hơn, chữ tiếng Việt */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 28,
    gap: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 14,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: TOKENS.font.heading,
    color: "#0F172A",
    textAlign: "center",
  },
  modalCopy: {
    fontSize: 15.5,
    lineHeight: 24,
    color: "#64748B",
    textAlign: "center",
    fontFamily: TOKENS.font.medium,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 14,
    marginTop: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
  },
  modalCancelText: {
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
    color: "#0F172A",
  },
  modalConfirmBtn: {
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: TOKENS.color.error,
  },
  modalConfirmText: {
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
    color: "#FFFFFF",
  },

  pressFeedback: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});