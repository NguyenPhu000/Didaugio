import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Settings,
  Bell,
  Shield,
  ToggleLeft,
  Globe,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingsSaveBar from "@/components/settings/SettingsSaveBar";
import {
  useBeforeUnloadWarning,
  useSettingsSaveState,
} from "@/components/settings/useSettingsSaveState";
import {
  useSettings,
  useUpdateSettings,
  useUpdateFeatureFlag,
  useSystemHealth,
} from "@/hooks/queries/useSettingsQueries";
import GeneralTabContent from "./components/GeneralTabContent";
import NotificationsTabContent from "./components/NotificationsTabContent";
import SecurityTabContent from "./components/SecurityTabContent";
import FeatureFlagsTabContent from "./components/FeatureFlagsTabContent";
import ApiIntegrationsTabContent from "./components/ApiIntegrationsTabContent";
import LogsTabContent from "./components/LogsTabContent";

const TABS = [
  { id: "general", label: "Chung", icon: Settings },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "security", label: "Bảo mật", icon: Shield },
  { id: "featureFlags", label: "Tính năng", icon: ToggleLeft },
  { id: "apiIntegrations", label: "API & Tích hợp", icon: Globe },
  { id: "logs", label: "Nhật ký", icon: Activity },
];

const DEFAULT_SETTINGS = {
  general: {
    siteName: "",
    siteDescription: "",
    language: "vi",
    timezone: "Asia/Ho_Chi_Minh",
    dateFormat: "DD/MM/YYYY",
    currency: "VND",
    logoUrl: "",
    faviconUrl: "",
  },
  notifications: {
    emailNewBooking: true,
    emailCancellation: true,
    emailNewReview: true,
    emailPayout: true,
    pushEnabled: true,
    pushNewBooking: true,
    pushNewReview: true,
    smsEnabled: false,
    smsNewBooking: false,
  },
  security: {
    require2FA: false,
    sessionTimeoutMinutes: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    lockoutEnabled: true,
    csrfProtection: true,
    xssProtection: true,
  },
  featureFlags: {
    aiAssistant: { enabled: false, percentageRollout: 100 },
    mapModule: { enabled: true, percentageRollout: 100 },
    voucherSystem: { enabled: false, percentageRollout: 50 },
    payoutSystem: { enabled: true, percentageRollout: 100 },
    reviewModeration: { enabled: true, percentageRollout: 100 },
    pushNotifications: { enabled: true, percentageRollout: 100 },
    maintenanceMode: { enabled: false, percentageRollout: 0 },
  },
  integrations: {
    apiKey: "",
    webhookUrl: "",
    googleMaps: { enabled: true, configured: true },
    groqAi: { enabled: false, configured: false },
    cloudinary: { enabled: true, configured: true },
  },
  logs: {
    recentLogs: [],
    errorCount: 0,
    uptime: "99.9%",
  },
};

const mergeRemoteSettings = (prev, data) => {
  if (!data || typeof data !== "object") return prev;
  return {
    general: { ...prev.general, ...(data.general || {}) },
    notifications: { ...prev.notifications, ...(data.notifications || {}) },
    security: { ...prev.security, ...(data.security || {}) },
    featureFlags: { ...prev.featureFlags, ...(data.featureFlags || {}) },
    integrations: { ...prev.integrations, ...(data.integrations || {}) },
    logs: { ...prev.logs, ...(data.logs || {}) },
  };
};

const withoutFeatureFlags = (settings) => {
  const { featureFlags: _featureFlags, ...saveableSettings } = settings;
  return saveableSettings;
};

const SettingsPageContent = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const { isDirty, markSaved, getBaseline } = useSettingsSaveState(
    withoutFeatureFlags(settings)
  );
  useBeforeUnloadWarning(isDirty);

  const { data: remoteSettings } = useSettings();

  useEffect(() => {
    if (remoteSettings?.data) {
      const merged = mergeRemoteSettings(DEFAULT_SETTINGS, remoteSettings.data);
      setSettings(merged);
      markSaved(withoutFeatureFlags(merged));
    }
  }, [markSaved, remoteSettings]);
  const updateSettingsMutation = useUpdateSettings();
  const updateFeatureFlagMutation = useUpdateFeatureFlag();
  const { data: healthData } = useSystemHealth();

  const updateSectionField = useCallback((section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  }, []);

  const handleSettingsMutation = useCallback(
    async (currentSettings) => {
      try {
        await updateSettingsMutation.mutateAsync(currentSettings);
        toast.success("Đã lưu cài đặt");
      } catch (error) {
        toast.error(
          error.message || "Không thể lưu cài đặt. Kiểm tra quyền truy cập."
        );
        throw error;
      }
    },
    [updateSettingsMutation]
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await handleSettingsMutation(settings);
      markSaved(withoutFeatureFlags(settings));
    } catch {
      // The mutation handler already surfaced the API error toast.
    } finally {
      setIsSaving(false);
    }
  }, [handleSettingsMutation, markSaved, settings]);

  const handleUndo = useCallback(() => {
    const baseline = getBaseline();
    setSettings((current) => ({
      ...baseline,
      featureFlags: current.featureFlags,
    }));
  }, [getBaseline]);

  const handleFeatureFlagToggle = useCallback(
    (key, enabled) => {
      setSettings((prev) => ({
        ...prev,
        featureFlags: {
          ...prev.featureFlags,
          [key]: { ...prev.featureFlags[key], enabled },
        },
      }));
      updateFeatureFlagMutation.mutate({ key, enabled });
    },
    [updateFeatureFlagMutation]
  );

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "general":
        return (
          <GeneralTabContent
            value={settings.general}
            onChange={(key, value) =>
              updateSectionField("general", key, value)
            }
          />
        );
      case "notifications":
        return (
          <NotificationsTabContent
            value={settings.notifications}
            onChange={(key, value) =>
              updateSectionField("notifications", key, value)
            }
          />
        );
      case "security":
        return (
          <SecurityTabContent
            value={settings.security}
            onChange={(key, value) =>
              updateSectionField("security", key, value)
            }
          />
        );
      case "featureFlags":
        return (
          <FeatureFlagsTabContent
            flags={settings.featureFlags}
            onToggle={handleFeatureFlagToggle}
            loading={updateFeatureFlagMutation.isLoading}
          />
        );
      case "apiIntegrations":
        return (
          <ApiIntegrationsTabContent
            value={settings.integrations}
            onChange={(key, value) =>
              updateSectionField("integrations", key, value)
            }
          />
        );
      case "logs":
        return (
          <LogsTabContent
            logs={settings.logs}
            healthData={healthData}
          />
        );
      default:
        return null;
    }
  }, [
    activeTab,
    settings,
    updateSectionField,
    handleFeatureFlagToggle,
    updateFeatureFlagMutation.isLoading,
    healthData,
  ]);

  return (
      <div className={cn("min-h-screen p-4 sm:p-6 lg:p-8 bg-[#F4F4F4] relative font-sans", isDirty && "pb-28")}>
        <div className="absolute inset-0 bg-grid-pattern bg-grid-20 opacity-30 pointer-events-none" />

        <div className="relative z-10 max-w-[1550px] mx-auto">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b-2 border-black pb-6 mb-6">
            <div className="flex items-center gap-6">
              <div className="accent-bar h-16" />
              <div>
                <h1 className="tim-title">CÀI ĐẶT HỆ THỐNG</h1>
                <div className="flex items-center gap-4 mt-2">
                  <span className="tim-system bg-black text-white px-2 py-1">
                    HỆ THỐNG // CẤU HÌNH
                  </span>
                  <p className="tim-meta hidden sm:block">
                    Chung, thông báo, bảo mật, tính năng, tích hợp, nhật ký
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-56 shrink-0">
              <div className="flex flex-row md:flex-col overflow-x-auto pb-2 md:pb-0 gap-1 sticky top-6 custom-scrollbar">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      aria-current={activeTab === tab.id ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 whitespace-nowrap rounded-xl px-4 py-3 text-left font-mono text-sm uppercase tracking-wide transition-all border shrink-0 w-auto md:w-full",
                        activeTab === tab.id
                          ? "bg-black text-white border-black shadow-sm"
                          : "bg-white text-black border-gray-200 hover:border-black hover:bg-gray-50"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="rounded-2xl border border-black/80 bg-white p-4 shadow-[4px_4px_0_rgba(0,0,0,0.12)] sm:p-6">
                {tabContent}
              </div>
            </div>
          </div>
        </div>

        <SettingsSaveBar
          variant="admin"
          isDirty={isDirty}
          isSaving={isSaving}
          onSave={handleSave}
          onUndo={handleUndo}
          labels={{
            save: t("settings.save"),
            saving: t("settings.saving"),
            undo: t("settings.undo"),
            unsaved: t("settings.unsaved"),
          }}
        />
      </div>
  );
};

export default SettingsPageContent;
