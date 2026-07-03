import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Settings,
  Building2,
  CalendarClock,
  Bell,
  Lock,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import SettingsAutoSave from "@/components/settings/SettingsAutoSave";
import SettingsSection from "@/components/settings/SettingsSection";
import { businessSettingsApi } from "@/apis/businessSettingsApi";
import BusinessGeneralTab from "./settings/BusinessGeneralTab";
import BookingRulesTab from "./settings/BookingRulesTab";
import BusinessNotificationsTab from "./settings/BusinessNotificationsTab";
import BlockedDatesTab from "./settings/BlockedDatesTab";

const DEFAULT_SETTINGS = {
  general: {
    displayName: "",
    description: "",
    logoUrl: "",
    contactPhone: "",
    contactEmail: "",
    address: "",
    operatingHours: {
      monday: { open: "08:00", close: "22:00", closed: false },
      tuesday: { open: "08:00", close: "22:00", closed: false },
      wednesday: { open: "08:00", close: "22:00", closed: false },
      thursday: { open: "08:00", close: "22:00", closed: false },
      friday: { open: "08:00", close: "22:00", closed: false },
      saturday: { open: "08:00", close: "22:00", closed: false },
      sunday: { open: "08:00", close: "22:00", closed: false },
    },
  },
  bookingRules: {
    autoApprove: false,
    cancellationWindowHours: 24,
    maxAdvanceDays: 30,
    minLeadMinutes: 0,
    noShowPolicy: "charge_50",
    allowOverbooking: false,
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
    general: { ...prev.general, ...(data.general || {}) },
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

  const TABS = [
    { id: "general", label: t("business.settings.tabs.general"), icon: Building2 },
    { id: "bookingRules", label: t("business.settings.tabs.bookingRules"), icon: CalendarClock },
    { id: "notifications", label: t("business.settings.tabs.notifications"), icon: Bell },
    { id: "blockedDates", label: t("business.settings.tabs.blockedDates"), icon: Lock },
  ];

  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    let disposed = false;
    const load = async () => {
      setLoading(true);
      try {
        const response = await businessSettingsApi.getSettings();
        const data = response?.data || {};
        if (!disposed) setSettings((prev) => mergeRemote(prev, data));
      } catch (err) {
        if (!disposed) {
          toast.error(
            err.message || t("business.settingsPage.loadFailed")
          );
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    };
    load();
    return () => {
      disposed = true;
    };
  }, [t]);

  const updateSection = useCallback((section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  }, []);

  const handleSave = useCallback(
    async (currentSettings) => {
      try {
        const payload = {
          general: {
            ...currentSettings.general,
            ...(currentSettings.general.logoUrl === "" && {
              logoUrl: undefined,
            }),
          },
          bookingRules: {
            ...currentSettings.bookingRules,
            maxAdvanceDays: safeNum(
              currentSettings.bookingRules.maxAdvanceDays,
              30
            ),
            minLeadMinutes: safeNum(
              currentSettings.bookingRules.minLeadMinutes,
              0
            ),
            cancellationWindowHours: safeNum(
              currentSettings.bookingRules.cancellationWindowHours,
              24
            ),
          },
          notifications: currentSettings.notifications,
        };
        const response = await businessSettingsApi.updateSettings(payload);
        if (response?.data) {
          setSettings((prev) => mergeRemote(prev, response.data));
        }
        toast.success(t("business.settingsPage.updateSuccess"));
      } catch (err) {
        toast.error(
          err.message || t("business.settingsPage.updateFailed")
        );
        throw err;
      }
    },
    [t]
  );

  const handleTabClick = useCallback((tabId) => {
    setActiveTab(tabId);
    setMobileSidebarOpen(false);
  }, []);

  const activeTabLabel = useMemo(
    () => TABS.find((tab) => tab.id === activeTab)?.label || "",
    [activeTab]
  );

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "general":
        return (
          <BusinessGeneralTab
            value={settings.general}
            onChange={(key, value) => updateSection("general", key, value)}
          />
        );
      case "bookingRules":
        return (
          <BookingRulesTab
            value={settings.bookingRules}
            onChange={(key, value) =>
              updateSection("bookingRules", key, value)
            }
          />
        );
      case "notifications":
        return (
          <BusinessNotificationsTab
            value={settings.notifications}
            onChange={(key, value) =>
              updateSection("notifications", key, value)
            }
          />
        );
      case "blockedDates":
        return <BlockedDatesTab />;
      default:
        return null;
    }
  }, [activeTab, settings, updateSection]);

  return (
    <SettingsAutoSave data={settings} onSave={handleSave} enabled={!loading}>
      <div className="space-y-4 md:space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-yellow-400" />
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                <Settings className="h-5 w-5 md:h-6 md:w-6" />
                {t("business.settingsPage.title")}
              </h1>
              <p className="text-[10px] md:text-xs text-gray-500 font-mono">
                {t("business.settingsPage.subtitle", { defaultValue: t("business.settingsPage.title") })}
              </p>
            </div>
          </div>
          {/* Mobile tab toggle */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen((v) => !v)}
            className="lg:hidden h-10 w-10 flex items-center justify-center border border-black"
            aria-label={t("business.settingsPage.toggleMenu", { defaultValue: "Bật/tắt menu cài đặt" })}
          >
            {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Sidebar - mobile dropdown / desktop sticky */}
          <div
            className={cn(
              "lg:w-56 lg:shrink-0",
              mobileSidebarOpen ? "block" : "hidden lg:block"
            )}
          >
            <div className="lg:sticky lg:top-6 space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left font-mono text-xs uppercase tracking-wider transition-all border min-h-[44px]",
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

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile: show active tab label */}
            <div className="lg:hidden mb-3">
              <p className="font-mono text-xs text-muted-foreground uppercase">
                {t("business.settings.editing")} <strong className="text-foreground">{activeTabLabel}</strong>
              </p>
            </div>
            <div className="border border-black bg-white p-4 md:p-6">
              {tabContent}
            </div>
          </div>
        </div>
      </div>
    </SettingsAutoSave>
  );
};

export default BusinessSettingsPage;
