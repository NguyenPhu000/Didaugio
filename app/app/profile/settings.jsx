import { useState, useCallback, useEffect, useRef } from "react";
import {
  Animated,
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
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/modules/auth/hooks/useAuth";
import { useAuthStore } from "../../src/stores/authStore";
import { useUIStore } from "../../src/stores/uiStore";
import { useProfile, useUpdateNotificationSettings } from "../../src/modules/profile/hooks/useProfile";
import { useNotifications } from "../../src/modules/notifications/hooks/useNotifications";
import { TOKENS } from "../../src/constants/design-tokens";
import { TAB_BAR_HEIGHT } from "../(tabs)/_layout";
import { useTranslation } from "react-i18next";

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
          <MaterialIconsRounded
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
          <MaterialIconsRounded name="chevron-right" size={24} color="#64748B" />
        ) : null}
      </View>
    </Pressable>
  );
}

function SectionHeader({ text }) {
  return <Text style={styles.sectionHeaderText}>{text}</Text>;
}

function NotificationBadge({ count }) {
  const displayCount = count > 99 ? "99+" : String(count);
  return (
    <View style={styles.notifBadge}>
      <Text style={styles.notifBadgeText}>{displayCount}</Text>
    </View>
  );
}

function LogoutConfirmModal({ visible, onCancel, onConfirm }) {
  const { t } = useTranslation();
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
            <MaterialIconsRounded name="logout" size={28} color={TOKENS.color.error} />
          </View>
          <Text style={styles.modalTitle}>{t("settings.logoutConfirmTitle")}</Text>
          <Text style={styles.modalCopy}>
            {t("settings.logoutConfirmMessage")}
          </Text>

          <View style={styles.modalActions}>
            <Pressable onPress={onCancel} style={styles.modalCancelBtn}>
              <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={styles.modalConfirmBtn}>
              <Text style={styles.modalConfirmText}>{t("settings.logout")}</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

function CustomToast({ message, visible, onHide }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => onHide());
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible, opacity, onHide]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 50,
        left: 24,
        right: 24,
        opacity,
        zIndex: 9999,
        transform: [
          {
            translateY: opacity.interpolate({
              inputRange: [0, 1],
              outputRange: [15, 0],
            }),
          },
        ],
      }}
    >
      <View
        className="flex-row items-center gap-3 rounded-2xl border px-4 py-3 bg-slate-900 border-slate-800"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        <MaterialIconsRounded name="info-outline" size={20} color="#F59E0B" style={{ marginRight: 6 }} />
        <Text
          style={{ fontFamily: TOKENS.font.medium }}
          className="text-white text-[13.5px] flex-1 leading-5"
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

/* ====================== MAIN SCREEN ====================== */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const storedUser = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);
  const isLoggedIn = !!accessToken && !isGuest;

  const language = useUIStore((s) => s.language || "device");
  const setLanguage = useUIStore((s) => s.setLanguage);
  const getResolvedLanguage = useUIStore((s) => s.getResolvedLanguage);
  const themePreference = useUIStore((s) => s.themePreference || "auto");
  const setTheme = useUIStore((s) => s.setTheme);
  const profileSettings = useUIStore((s) => s.profileSettings);
  const updateProfileSettings = useUIStore((s) => s.updateProfileSettings);

  const { logout } = useAuth();
  const { data: profile, refetch, isRefetching } = useProfile(isLoggedIn);
  const { data: notifData } = useNotifications({ enabled: isLoggedIn });
  const unreadCount = notifData?.unreadCount ?? 0;

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const updateNotifSettingsMutation = useUpdateNotificationSettings();

  // Derived states
  const darkModeEnabled = themePreference === "dark";
  const pushEnabled = isLoggedIn && profile
    ? (profile?.notificationSettings?.push?.bookingConfirmed ?? true)
    : (profileSettings?.pushEnabled ?? true);
  const syncEnabled = profileSettings?.syncEnabled ?? true;
  const hapticEnabled = profileSettings?.hapticEnabled ?? true; // Mới: haptic feedback
  const email = profile?.email || storedUser?.email || t("settings.emailNotSet");

  const isPushPending = updateNotifSettingsMutation.isPending;

  // Handlers
  const handleSoonFeature = useCallback((title) => {
    setToastMessage(t("settings.comingSoon", { feature: title }));
    setToastVisible(true);
  }, [t]);

  const handleToggleTheme = useCallback(
    (enabled) => setTheme(enabled ? "dark" : "light"),
    [setTheme]
  );

  const handleTogglePush = useCallback(
    async (enabled) => {
      // Lưu ở local store trước
      updateProfileSettings?.({ pushEnabled: enabled });

      if (isLoggedIn) {
        try {
          const currentSettings = profile?.notificationSettings || {};
          const payload = {
            ...currentSettings,
            push: {
              bookingConfirmed: enabled,
              bookingCancelled: enabled,
              newReview: enabled,
              systemAlerts: enabled,
            },
            email: {
              bookingConfirmed: enabled,
              bookingCancelled: enabled,
              newReview: enabled,
              systemAlerts: enabled,
            }
          };
          await updateNotifSettingsMutation.mutateAsync(payload);
        } catch (error) {
          console.error("Lỗi đồng bộ cài đặt thông báo:", error);
          // Revert local store if failed
          updateProfileSettings?.({ pushEnabled: !enabled });
          setToastMessage(t("settings.syncError"));
          setToastVisible(true);
        }
      }
    },
    [isLoggedIn, profile, updateProfileSettings, updateNotifSettingsMutation, t]
  );

  const handleToggleSync = useCallback(
    (enabled) => updateProfileSettings?.({ syncEnabled: enabled }),
    [updateProfileSettings]
  );

  const handleToggleHaptic = useCallback(
    (enabled) => updateProfileSettings?.({ hapticEnabled: enabled }),
    [updateProfileSettings]
  );

  const handleCycleLanguage = useCallback(() => {
    const cycle = { device: "en", en: "vi", vi: "device" };
    setLanguage(cycle[language] || "device");
  }, [language, setLanguage]);

  const resolvedLang = getResolvedLanguage();
  const languageLabel = language === "device"
    ? `${t("language.deviceLanguage")} (${resolvedLang === "vi" ? "VI" : "EN"})`
    : language === "en"
      ? "English"
      : "Tiếng Việt";
  const languageBadge = language === "device" ? (resolvedLang === "vi" ? "VI" : "EN") : language === "en" ? "EN" : "VI";

  const handleConfirmLogout = useCallback(() => {
    setLogoutModalVisible(false);
    logout();
  }, [logout]);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      t("settings.clearCacheTitle"),
      t("settings.clearCacheMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.clearCacheConfirm"),
          style: "destructive",
          onPress: () => {
            // Có thể thêm AsyncStorage.clear() hoặc tương tự ở đây nếu cần
            Alert.alert(t("settings.clearCacheSuccess"), t("settings.clearCacheSuccessMessage"));
          },
        },
      ]
    );
  }, [t]);

  const handleOpenPrivacy = useCallback(() => {
    // Demo mở link (bạn có thể thay bằng link thật của app)
    Linking.openURL("https://yourapp.com/privacy").catch(() =>
      handleSoonFeature(t("settings.privacyPolicy"))
    );
  }, [handleSoonFeature, t]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header hiện đại hơn - giống Profile */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIconsRounded name="arrow-back" size={26} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle}>{t("settings.title")}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ==================== ACCOUNT SECTION (nếu đã login) ==================== */}
        {isLoggedIn && (
          <>
            <SectionHeader text={t("settings.account")} />
            <View style={styles.settingsCard}>
              {/* Profile preview hiện đại */}
              <SettingRow
                icon="person"
                iconBg="rgba(16,185,129,0.1)"
                iconColor="#10B981"
                title={t("settings.editProfile")}
                subtitle={t("settings.editProfileSubtitle")}
                onPress={() => router.push("/profile/edit")}
              />
              <View style={styles.divider} />

              <SettingRow
                icon="mail-outline"
                iconBg="rgba(148,163,184,0.1)"
                iconColor="#64748B"
                title={t("settings.loginEmail")}
                subtitle={email}
              />
              <View style={styles.divider} />

              <SettingRow
                icon="security"
                iconBg="rgba(245,158,11,0.1)"
                iconColor="#F59E0B"
                title={t("settings.accountSecurity")}
                subtitle={t("settings.accountSecuritySubtitle")}
                onPress={() => handleSoonFeature(t("settings.accountSecurity"))}
              />
              <View style={styles.divider} />

              <SettingRow
                icon="sync"
                title={t("settings.syncProfile")}
                subtitle={isRefetching ? t("settings.syncing") : t("settings.syncProfileSubtitle")}
                onPress={isRefetching ? undefined : refetch}
              />
            </View>
          </>
        )}

        {/* ==================== PREFERENCES SECTION ==================== */}
        <SectionHeader text={t("settings.preferences")} />
        <View style={styles.settingsCard}>
          {/* Dark mode */}
          <SettingRow
            icon="dark-mode"
            iconBg="rgba(99,102,241,0.1)"
            iconColor="#6366F1"
            title={t("settings.darkMode")}
            subtitle={darkModeEnabled ? t("settings.darkModeOn") : t("settings.darkModeOff")}
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
            title={t("settings.customize.language")}
            subtitle={languageLabel}
            onPress={handleCycleLanguage}
            rightElement={
              <View style={styles.languageBadge}>
                <Text style={styles.languageBadgeText}>
                  {languageBadge}
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
            title={t("settings.notifications")}
            subtitle={(() => {
              const count = unreadCount;
              return count > 0
                ? t("settings.notificationsUnread", { count })
                : t("settings.noNewNotifications");
            })()}
            onPress={() => router.push("/profile/notifications")}
            rightElement={
              unreadCount > 0 ? (
                <NotificationBadge count={unreadCount} />
              ) : (
                <MaterialIconsRounded name="chevron-right" size={24} color="#64748B" />
              )
            }
          />
          <View style={styles.divider} />

          {/* Push Notifications toggle */}
          <SettingRow
            icon="notifications-active"
            iconBg="rgba(0,113,227,0.08)"
            iconColor="#0071E3"
            title={t("settings.pushNotifications")}
            subtitle={pushEnabled ? t("settings.pushOn") : t("settings.pushOff")}
            disabled={isPushPending}
            rightElement={
              <Switch
                value={pushEnabled}
                onValueChange={handleTogglePush}
                disabled={isPushPending}
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
            title={t("settings.hapticFeedback")}
            subtitle={t("settings.hapticSubtitle")}
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
            title={t("settings.autoSync")}
            subtitle={
              syncEnabled
                ? isRefetching
                  ? t("settings.autoSyncing")
                  : t("settings.autoSyncOn")
                : t("settings.autoSyncOff")
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
        <SectionHeader text={t("settings.features")} />
        <View style={styles.settingsCard}>
          <SettingRow
            icon="bookmark"
            title={t("settings.savedPlaces")}
            onPress={() => router.push("/(tabs)/saved")}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="credit-card"
            iconBg="rgba(245,158,11,0.1)"
            iconColor="#F59E0B"
            title={t("settings.paymentMethods")}
            onPress={() => handleSoonFeature(t("settings.paymentMethods"))}
          />
        </View>

        {/* ==================== SUPPORT SECTION (mới - chức năng tiêu chuẩn) ==================== */}
        <SectionHeader text={t("settings.support")} />
        <View style={styles.settingsCard}>
          <SettingRow
            icon="help-outline"
            title={t("settings.helpCenter")}
            subtitle={t("settings.helpCenterSubtitle")}
            onPress={() => handleSoonFeature(t("settings.helpCenter"))}
          />
          <View style={styles.divider} />

          <SettingRow
            icon="feedback"
            title={t("settings.sendFeedback")}
            subtitle={t("settings.sendFeedbackSubtitle")}
            onPress={() => router.push("/feedback")}
          />
          <View style={styles.divider} />

          <SettingRow
            icon="delete-sweep"
            title={t("settings.clearCache")}
            subtitle={t("settings.clearCacheSubtitle")}
            onPress={handleClearCache}
          />
        </View>

        {/* ==================== LEGAL SECTION (mới - chức năng tiêu chuẩn) ==================== */}
        <SectionHeader text={t("settings.legal")} />
        <View style={styles.settingsCard}>
          <SettingRow
            icon="policy"
            title={t("settings.privacyPolicy")}
            onPress={handleOpenPrivacy}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="description"
            title={t("settings.termsOfService")}
            onPress={() => handleSoonFeature(t("settings.termsOfService"))}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="info-outline"
            iconBg="rgba(148,163,184,0.12)"
            iconColor="#64748B"
            title={t("settings.appVersion")}
            subtitle="v1.2.4 (build 2026.04)"
            onPress={() => handleSoonFeature(t("settings.appVersion"))}
          />
        </View>

        {/* Logout - chỉ hiển thị khi đã login */}
        {isLoggedIn && (
          <View style={[styles.settingsCard, { marginTop: 12, marginBottom: 24 }]}>
            <SettingRow
              icon="logout"
              title={t("settings.logout")}
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

      <CustomToast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
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

  /* Notification badge */
  notifBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  notifBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
    fontWeight: "600",
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