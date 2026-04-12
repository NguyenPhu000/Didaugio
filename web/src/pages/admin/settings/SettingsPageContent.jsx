import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import * as settingsService from "@/apis/settingsService";
import { DEFAULT_SETTINGS } from "./defaultSettings";
import GeneralSettingsCard from "./components/GeneralSettingsCard";
import MapSettingsCard from "./components/MapSettingsCard";
import EmailSettingsCard from "./components/EmailSettingsCard";
import SecuritySettingsCard from "./components/SecuritySettingsCard";
import FeatureModulesCard from "./components/FeatureModulesCard";
import IntegrationsCard from "./components/IntegrationsCard";
import LogsMonitoringCard from "./components/LogsMonitoringCard";
import OperationsCard from "./components/OperationsCard";
import SeoDisplayCard from "./components/SeoDisplayCard";

/** Map từ API có thể là number — input controlled cần string */
const normalizeMapDefault = (input) => {
  if (!input || typeof input !== "object") return input;
  return {
    ...input,
    latitude:
      input.latitude != null && input.latitude !== ""
        ? String(input.latitude)
        : "",
    longitude:
      input.longitude != null && input.longitude !== ""
        ? String(input.longitude)
        : "",
    zoom: input.zoom != null && input.zoom !== "" ? String(input.zoom) : "",
  };
};

const mergeRemoteSettings = (prev, data) => {
  if (!data || typeof data !== "object") return prev;
  return {
    ...prev,
    ...data,
    general: { ...prev.general, ...(data.general || {}) },
    mapDefault: normalizeMapDefault({
      ...prev.mapDefault,
      ...(data.mapDefault || {}),
    }),
    email: { ...prev.email, ...(data.email || {}) },
    security: { ...prev.security, ...(data.security || {}) },
    modules: { ...prev.modules, ...(data.modules || {}) },
    integrations: { ...prev.integrations, ...(data.integrations || {}) },
    logs: { ...prev.logs, ...(data.logs || {}) },
    operations: { ...prev.operations, ...(data.operations || {}) },
    seo: { ...prev.seo, ...(data.seo || {}) },
  };
};

const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const SettingsPageContent = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    let disposed = false;

    const loadSettings = async () => {
      setLoading(true);
      try {
        const response = await settingsService.getSettings();
        const data = response?.data || {};
        if (disposed) return;

        setSettings((prev) => mergeRemoteSettings(prev, data));
      } catch (error) {
        if (!disposed) {
          toast({
            variant: "destructive",
            title: "LỖI TẢI CẤU HÌNH",
            description: error.message || "Không thể tải cài đặt hệ thống.",
          });
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    loadSettings();
    return () => {
      disposed = true;
    };
  }, [toast]);

  const updateSectionField = (section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...settings,
        mapDefault: {
          latitude: safeNum(settings.mapDefault?.latitude, 10.0452),
          longitude: safeNum(settings.mapDefault?.longitude, 105.7469),
          zoom: safeNum(settings.mapDefault?.zoom, 13),
        },
        security: {
          ...settings.security,
          sessionTimeoutMinutes: safeNum(
            settings.security?.sessionTimeoutMinutes,
            30,
          ),
        },
        modules: {
          ...settings.modules,
          maxUploadSizeMb: safeNum(settings.modules?.maxUploadSizeMb, 20),
        },
        logs: {
          ...settings.logs,
          retentionDays: safeNum(settings.logs?.retentionDays, 30),
        },
      };

      const res = await settingsService.updateSettings(payload);
      const saved = res?.data;
      if (saved) {
        setSettings((prev) => mergeRemoteSettings(prev, saved));
      }

      toast({
        title: "ĐÃ LƯU CẤU HÌNH",
        description: "Cài đặt hệ thống đã được cập nhật.",
        className: "bg-black text-white border border-primary font-mono",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "LỖI LƯU CẤU HÌNH",
        description:
          error.message ||
          error?.data?.message ||
          "Không thể lưu cài đặt. Kiểm tra quyền đăng nhập (Super Admin / Admin).",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-[#F4F4F4] relative font-sans">
      <div className="absolute inset-0 bg-grid-pattern bg-grid-20 opacity-30 pointer-events-none" />

      <div className="relative z-10 space-y-6 max-w-[1550px] mx-auto">
        <div className="flex items-end justify-between border-b-2 border-black pb-6">
          <div className="flex items-center gap-6">
            <div className="accent-bar h-16" />
            <div>
              <h1 className="tim-title">CÀI ĐẶT HỆ THỐNG</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1">
                  HỆ THỐNG // CẤU HÌNH
                </span>
                <p className="tim-meta">
                  Chung, bản đồ, email, bảo mật, module, tích hợp, nhật ký, vận
                  hành, SEO
                </p>
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className="h-11 rounded-none border border-black bg-black text-white hover:bg-[#F3E600] hover:text-black font-bold uppercase px-6"
          >
            {saving ? "ĐANG LƯU..." : "LƯU CÀI ĐẶT"}
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <GeneralSettingsCard
            value={settings.general}
            onChange={(key, value) => updateSectionField("general", key, value)}
          />

          <MapSettingsCard
            value={settings.mapDefault}
            onChange={(key, value) =>
              updateSectionField("mapDefault", key, value)
            }
          />

          <EmailSettingsCard
            value={settings.email}
            onChange={(key, value) => updateSectionField("email", key, value)}
          />

          <SecuritySettingsCard
            value={settings.security}
            onChange={(key, value) =>
              updateSectionField("security", key, value)
            }
          />

          <FeatureModulesCard
            value={settings.modules}
            onChange={(key, value) => updateSectionField("modules", key, value)}
          />

          <IntegrationsCard
            value={settings.integrations}
            onChange={(key, value) =>
              updateSectionField("integrations", key, value)
            }
          />

          <LogsMonitoringCard
            value={settings.logs}
            onChange={(key, value) => updateSectionField("logs", key, value)}
          />

          <OperationsCard
            value={settings.operations}
            onChange={(key, value) =>
              updateSectionField("operations", key, value)
            }
          />

          <SeoDisplayCard
            value={settings.seo}
            onChange={(key, value) => updateSectionField("seo", key, value)}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPageContent;
