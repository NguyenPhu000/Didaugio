import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Building2, CalendarClock, Bell, Lock, Menu, X, Save, Loader2, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUSINESS_TOKENS } from "@/components/business/tokens/businessTokens";
import { BusinessPageHeader } from "@/components/business/ui/BusinessPageHeader";
import SettingsSaveBar from "@/components/settings/SettingsSaveBar";
import {
  useSettingsSaveState,
  useBeforeUnloadWarning,
} from "@/components/settings/useSettingsSaveState";
import { businessSettingsApi } from "@/apis/businessSettingsApi";
import BusinessGeneralTab from "@/components/business/settings/BusinessGeneralTab";
import BookingRulesTab from "@/components/business/settings/BookingRulesTab";
import BusinessNotificationsTab from "@/components/business/settings/BusinessNotificationsTab";
import BlockedDatesTab from "@/components/business/settings/BlockedDatesTab";

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
  const [isSaving, setIsSaving] = useState(false);

  const { isDirty, markSaved, getBaseline } = useSettingsSaveState(settings);
  useBeforeUnloadWarning(isDirty);

  useEffect(() => {
    let disposed = false;
    const load = async () => {
      setLoading(true);
      try {
        const response = await businessSettingsApi.getSettings();
        const data = response?.data || {};
        if (!disposed) {
          const merged = mergeRemote(DEFAULT_SETTINGS, data);
          setSettings(merged);
          markSaved(merged);
        }
      } catch (err) {
        if (!disposed) toast.error(err.message || t("business.settingsPage.loadFailed"));
      } finally {
        if (!disposed) setLoading(false);
      }
    };
    load();
    return () => {
      disposed = true;
    };
  }, [t, markSaved]);

  const updateSection = useCallback((section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  }, []);

  const persist = useCallback(
    async (currentSettings) => {
      const payload = {
        general: {
          ...currentSettings.general,
          logoUrl: currentSettings.general.logoUrl || "",
        },
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
      toast.success(t("business.settingsPage.updateSuccess"));
    } catch (err) {
      toast.error(err.message || t("business.settingsPage.updateFailed"));
    } finally {
      setIsSaving(false);
    }
  }, [persist, settings, markSaved, t]);

  const handleUndo = useCallback(() => {
    setSettings(getBaseline());
  }, [getBaseline]);

  const handleTabClick = useCallback((tabId) => {
    setActiveTab(tabId);
    setMobileSidebarOpen(false);
  }, []);

  const saveLabels = {
    save: t("business.settings.actions.save"),
    saving: t("business.settings.actions.saving"),
    undo: t("business.settings.actions.undo"),
    unsaved: t("business.settings.actions.unsaved"),
  };

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
            onChange={(key, value) => updateSection("bookingRules", key, value)}
          />
        );
      case "notifications":
        return (
          <BusinessNotificationsTab
            value={settings.notifications}
            onChange={(key, value) => updateSection("notifications", key, value)}
          />
        );
      case "blockedDates":
        return <BlockedDatesTab />;
      default:
        return null;
    }
  }, [activeTab, settings, updateSection]);

  return (
    <div className={cn("space-y-4 md:space-y-6 p-4 md:p-6 lg:p-8", isDirty && "pb-24")}>
      <BusinessPageHeader
        title={t("business.settingsPage.title")}
        description={t("business.settingsPage.subtitle", {
          defaultValue: t("business.settingsPage.title"),
        })}
        badge={isDirty ? saveLabels.unsaved : undefined}
        badgeClassName={isDirty ? BUSINESS_TOKENS.badgeWarning : undefined}
        secondaryActions={
          isDirty ? (
            <button
              type="button"
              onClick={handleUndo}
              disabled={isSaving}
              className={cn(BUSINESS_TOKENS.buttonSecondary, "inline-flex items-center gap-2 disabled:opacity-50")}
            >
              <Undo2 className="h-4 w-4" />
              {saveLabels.undo}
            </button>
          ) : null
        }
        action={
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={cn(BUSINESS_TOKENS.buttonPrimary, "inline-flex items-center gap-2 disabled:opacity-50")}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? saveLabels.saving : saveLabels.save}
          </button>
        }
      />

      {/* Mobile tab toggle */}
      <div className="flex items-center justify-between lg:hidden">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("business.settings.editing")}{" "}
          <strong className="text-zinc-900 dark:text-zinc-100">
            {TABS.find((tab) => tab.id === activeTab)?.label}
          </strong>
        </p>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen((v) => !v)}
          className={cn(BUSINESS_TOKENS.buttonSecondary, "h-9 w-9 p-0 inline-flex items-center justify-center")}
          aria-label={t("business.settingsPage.toggleMenu", { defaultValue: "Menu" })}
        >
          {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Sidebar */}
        <div className={cn("lg:w-56 lg:shrink-0", mobileSidebarOpen ? "block" : "hidden lg:block")}>
          <div className="space-y-1 lg:sticky lg:top-6">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[44px] w-full items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    active
                      ? "bg-zinc-950 text-white dark:bg-zinc-800"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
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
        <div className="min-w-0 flex-1">{tabContent}</div>
      </div>

      <SettingsSaveBar
        variant="business"
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onUndo={handleUndo}
        labels={saveLabels}
      />
    </div>
  );
};

export default BusinessSettingsPage;
