import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Settings,
  Bell,
  Shield,
  ToggleLeft,
  Globe,
  Server,
  Activity,
  Map,
  Mail,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui";
import { ScrollArea } from "@/components/ui/scroll-area";
import SettingsAutoSave from "@/components/settings/SettingsAutoSave";
import SettingsSection from "@/components/settings/SettingsSection";
import FeatureFlagToggle from "@/components/settings/FeatureFlagToggle";
import {
  useSettings,
  useUpdateSettings,
  useFeatureFlags,
  useUpdateFeatureFlag,
  useSystemLogs,
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

const SettingsPageContent = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const { isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();
  const { data: featureFlagsData } = useFeatureFlags();
  const updateFeatureFlagMutation = useUpdateFeatureFlag();
  const { data: logsData } = useSystemLogs();
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

  const handleSave = useCallback(
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
    <SettingsAutoSave data={settings} onSave={handleSave}>
      <div className="min-h-screen p-8 bg-[#F4F4F4] relative font-sans">
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
                  <p className="tim-meta">
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
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-left font-mono text-xs uppercase tracking-wider transition-all border shrink-0 w-auto md:w-full",
                        activeTab === tab.id
                          ? "bg-black text-white border-black"
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
              <div className="border border-black bg-white p-6">
                {tabContent}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingsAutoSave>
  );
};

export default SettingsPageContent;
