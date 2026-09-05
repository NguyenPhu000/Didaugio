import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import SettingsSaveBar from "@/components/settings/SettingsSaveBar";
import {
  useBeforeUnloadWarning,
  useSettingsSaveState,
} from "@/components/settings/useSettingsSaveState";
import {
  useSettings,
  useUpdateSettings,
} from "@/hooks/queries/useSettingsQueries";
import OperationsTabContent from "./components/OperationsTabContent";
import MapGisTabContent from "./components/MapGisTabContent";
import SystemHealthTabContent from "./components/SystemHealthTabContent";

const TABS = [
  { id: "operations", label: "Vận hành & Đặt chỗ" },
  { id: "map", label: "Bản đồ & GIS Cần Thơ" },
  { id: "system", label: "Bảo trì & Giám sát" },
];

const DEFAULT_SETTINGS = {
  operations: {
    defaultCommissionRate: 10,
    paymentTimeoutMinutes: 15,
    minPayoutAmount: 200000,
    autoApprovePlaces: false,
    autoApproveReviews: true,
  },
  map: {
    defaultRadiusKm: 5,
    centerLat: 10.0342,
    centerLng: 105.7876,
    defaultZoom: 13,
    showWardBoundaries: true,
  },
  system: {
    maintenanceMode: false,
    maintenanceMessage: "Hệ thống iPoint Genie đang bảo trì định kỳ để nâng cấp hạ tầng. Quý khách vui lòng quay lại sau.",
  },
};

const mergeRemoteSettings = (prev, data) => {
  if (!data || typeof data !== "object") return prev;
  return {
    operations: { ...prev.operations, ...(data.operations || {}) },
    map: { ...prev.map, ...(data.map || {}) },
    system: { ...prev.system, ...(data.system || {}) },
  };
};

const SettingsPageContent = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("operations");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  const { isDirty, markSaved, getBaseline } = useSettingsSaveState(settings);
  useBeforeUnloadWarning(isDirty);

  const { data: remoteSettings } = useSettings();

  useEffect(() => {
    if (remoteSettings?.data) {
      const merged = mergeRemoteSettings(DEFAULT_SETTINGS, remoteSettings.data);
      setSettings(merged);
      markSaved(merged);
    }
  }, [markSaved, remoteSettings]);

  const updateSettingsMutation = useUpdateSettings();

  const updateSectionField = useCallback((section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateSettingsMutation.mutateAsync(settings);
      markSaved(settings);
      toast.success("Đã lưu cấu hình cài đặt hệ thống.");
    } catch (error) {
      toast.error(error.message || "Không thể lưu cài đặt. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  }, [markSaved, settings, updateSettingsMutation]);

  const handleUndo = useCallback(() => {
    const baseline = getBaseline();
    setSettings(baseline);
  }, [getBaseline]);

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "operations":
        return (
          <OperationsTabContent
            value={settings.operations}
            onChange={(key, value) => updateSectionField("operations", key, value)}
          />
        );
      case "map":
        return (
          <MapGisTabContent
            value={settings.map}
            onChange={(key, value) => updateSectionField("map", key, value)}
          />
        );
      case "system":
        return (
          <SystemHealthTabContent
            value={settings.system}
            onChange={(key, value) => updateSectionField("system", key, value)}
          />
        );
      default:
        return null;
    }
  }, [activeTab, settings, updateSectionField]);

  return (
    <div className={cn("space-y-6 text-slate-900 antialiased max-w-[1560px] mx-auto", isDirty && "pb-24")}>
      {/* Header */}
      <header className="space-y-1 pb-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Cài đặt hệ thống
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-normal">
          Quản lý chính sách vận hành, bản đồ số GIS Cần Thơ và trạng thái bảo trì máy chủ
        </p>
      </header>

      {/* Main Layout */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Apple macOS style Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0">
          <div className="flex flex-row md:flex-col overflow-x-auto pb-2 md:pb-0 gap-1.5 sticky top-6 custom-scrollbar bg-[#F2F2F7]/80 p-1.5 rounded-3xl border border-black/[0.02]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? "page" : undefined}
                className={cn(
                  "flex items-center whitespace-nowrap rounded-2xl px-4 py-3 text-left text-xs sm:text-sm font-medium transition-all shrink-0 w-auto md:w-full cursor-pointer",
                  activeTab === tab.id
                    ? "bg-white text-slate-950 shadow-[0_1px_3px_rgba(0,0,0,0.06)] font-semibold"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
                )}
              >
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area with unified floor height min-h-[580px] */}
        <div className="flex-1 min-w-0 w-full">
          <div className="rounded-3xl border border-black/[0.04] bg-white p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[580px] flex flex-col justify-between">
            {tabContent}
          </div>
        </div>
      </div>

      <SettingsSaveBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onUndo={handleUndo}
        labels={{
          save: t("settings.save", { defaultValue: "Lưu thay đổi" }),
          saving: t("settings.saving", { defaultValue: "Đang lưu..." }),
          undo: t("settings.undo", { defaultValue: "Hoàn tác" }),
          unsaved: t("settings.unsaved", { defaultValue: "Có thay đổi chưa lưu" }),
        }}
      />
    </div>
  );
};

export default SettingsPageContent;
