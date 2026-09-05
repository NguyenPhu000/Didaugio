import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import SettingsSaveBar from "@/components/settings/SettingsSaveBar";
import {
  useSettingsSaveState,
  useBeforeUnloadWarning,
} from "@/components/settings/useSettingsSaveState";
import { businessSettingsApi } from "@/apis/businessSettingsApi";
import BookingRulesTab from "@/components/business/settings/BookingRulesTab";
import BlockedDatesTab from "@/components/business/settings/BlockedDatesTab";
import BusinessNotificationsTab from "@/components/business/settings/BusinessNotificationsTab";

const TABS = [
  { id: "bookingRules", label: "Quy tắc nhận đặt chỗ" },
  { id: "blockedDates", label: "Ngày ngưng phục vụ" },
  { id: "notifications", label: "Thông báo vận hành" },
];

const DEFAULT_SETTINGS = {
  bookingRules: {
    autoApprove: false,
    allowOverbooking: false,
    maxAdvanceDays: 30,
    minLeadMinutes: 0,
    cancellationWindowHours: 24,
    noShowPolicy: "charge_50",
  },
  notifications: {
    newBookingEmail: true,
    newBookingPush: true,
    cancellationEmail: true,
    cancellationPush: true,
    newReviewEmail: true,
    newReviewPush: false,
    payoutEmail: true,
  },
};

const mergeRemote = (prev, data) => {
  if (!data || typeof data !== "object") return prev;
  return {
    bookingRules: { ...prev.bookingRules, ...(data.bookingRules || {}) },
    notifications: { ...prev.notifications, ...(data.notifications || {}) },
  };
};

const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const BusinessSettingsPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("bookingRules");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  const { isDirty, markSaved, getBaseline } = useSettingsSaveState(settings);
  useBeforeUnloadWarning(isDirty);

  useEffect(() => {
    let disposed = false;
    const load = async () => {
      try {
        const response = await businessSettingsApi.getSettings();
        const data = response?.data || {};
        if (!disposed) {
          const merged = mergeRemote(DEFAULT_SETTINGS, data);
          setSettings(merged);
          markSaved(merged);
        }
      } catch (err) {
        if (!disposed) toast.error(err.message || "Không thể tải cấu hình doanh nghiệp.");
      }
    };
    load();
    return () => {
      disposed = true;
    };
  }, [markSaved]);

  const updateSection = useCallback((section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  }, []);

  const persist = useCallback(
    async (currentSettings) => {
      const payload = {
        bookingRules: {
          ...currentSettings.bookingRules,
          maxAdvanceDays: safeNum(currentSettings.bookingRules.maxAdvanceDays, 30),
          minLeadMinutes: safeNum(currentSettings.bookingRules.minLeadMinutes, 0),
          cancellationWindowHours: safeNum(currentSettings.bookingRules.cancellationWindowHours, 24),
        },
        notifications: currentSettings.notifications,
      };
      const response = await businessSettingsApi.updateSettings(payload);
      const merged = response?.data
        ? mergeRemote(currentSettings, response.data)
        : currentSettings;
      setSettings(merged);
      return merged;
    },
    []
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const merged = await persist(settings);
      markSaved(merged);
      toast.success("Đã lưu cài đặt doanh nghiệp thành công.");
    } catch (err) {
      toast.error(err.message || "Không thể lưu cài đặt. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  }, [persist, settings, markSaved]);

  const handleUndo = useCallback(() => {
    setSettings(getBaseline());
  }, [getBaseline]);

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "bookingRules":
        return (
          <BookingRulesTab
            value={settings.bookingRules}
            onChange={(key, value) => updateSection("bookingRules", key, value)}
          />
        );
      case "blockedDates":
        return <BlockedDatesTab />;
      case "notifications":
        return (
          <BusinessNotificationsTab
            value={settings.notifications}
            onChange={(key, value) => updateSection("notifications", key, value)}
          />
        );
      default:
        return null;
    }
  }, [activeTab, settings, updateSection]);

  return (
    <div className={cn("space-y-6 text-slate-900 antialiased max-w-[1560px] mx-auto p-4 sm:p-6 lg:p-8", isDirty && "pb-24")}>
      {/* Header chuẩn Apple Minimalist */}
      <header className="space-y-1 pb-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Cài đặt doanh nghiệp
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-normal">
          Quản lý quy tắc nhận đặt chỗ, lịch ngưng phục vụ và kênh thông báo vận hành của quán
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

export default BusinessSettingsPage;
