import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui";
import { businessSettingsApi } from "@/apis/businessSettingsApi";
import BusinessGeneralCard from "./settings/BusinessGeneralCard";
import BookingRulesCard from "./settings/BookingRulesCard";
import BusinessNotificationCard from "./settings/BusinessNotificationCard";
import BlockedDatesCard from "./settings/BlockedDatesCard";

const DEFAULT_SETTINGS = {
  general: { displayName: "", description: "", logoUrl: "" },
  bookingRules: {
    maxAdvanceDays: 30,
    minLeadMinutes: 0,
    allowOverbooking: false,
    autoApprove: false,
  },
  notifications: {
    newBookingEmail: true,
    newBookingPush: true,
    newReviewEmail: true,
    newReviewPush: false,
    bookingCancelledEmail: true,
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    let disposed = false;
    const load = async () => {
      setLoading(true);
      try {
        const response = await businessSettingsApi.getSettings();
        const data = response?.data || {};
        if (!disposed) setSettings((prev) => mergeRemote(prev, data));
      } catch {
        if (!disposed) toast.error("Không thể tải cài đặt doanh nghiệp");
      } finally {
        if (!disposed) setLoading(false);
      }
    };
    load();
    return () => { disposed = true; };
  }, []);

  const updateSection = (section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        general: {
          ...settings.general,
          ...(settings.general.logoUrl === "" && { logoUrl: undefined }),
        },
        bookingRules: {
          ...settings.bookingRules,
          maxAdvanceDays: safeNum(settings.bookingRules.maxAdvanceDays, 30),
          minLeadMinutes: safeNum(settings.bookingRules.minLeadMinutes, 0),
        },
        notifications: settings.notifications,
      };
      const response = await businessSettingsApi.updateSettings(payload);
      if (response?.data) {
        setSettings((prev) => mergeRemote(prev, response.data));
      }
      toast.success("Cập nhật cài đặt thành công!");
    } catch {
      toast.error("Cập nhật cài đặt thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-10 bg-[#F3E600]"></div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              <Settings className="h-6 w-6" />
              CÀI ĐẶT DOANH NGHIỆP
            </h1>
            <p className="text-xs text-gray-500 uppercase font-mono">
              QUẢN LÝ CẤU HÌNH & QUY TẮC ĐẶT LỊCH
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="rounded-none border-2 border-black bg-[#F3E600] text-black hover:bg-black hover:text-[#F3E600] h-10 px-6 uppercase font-black text-xs transition-all"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          LƯU CÀI ĐẶT
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <BusinessGeneralCard
            value={settings.general}
            onChange={(key, val) => updateSection("general", key, val)}
          />
          <BookingRulesCard
            value={settings.bookingRules}
            onChange={(key, val) => updateSection("bookingRules", key, val)}
          />
          <BusinessNotificationCard
            value={settings.notifications}
            onChange={(key, val) => updateSection("notifications", key, val)}
          />
          <BlockedDatesCard />
        </div>
      )}
    </div>
  );
};

export default BusinessSettingsPage;
