// @vitest-environment jsdom
import { describe, beforeEach, it, expect, vi } from "vitest";
globalThis.expect = expect;
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPageContent from "./SettingsPageContent";
import * as settingsService from "@/apis/settingsService";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import i18n from "@/i18n";
import "@testing-library/jest-dom";

const renderWithClient = (ui) => {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  );
};

const toastSpy = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

vi.mock("@/apis/settingsService", () => {
  const getSettings = vi.fn();
  const updateSettings = vi.fn();
  return {
    getSettings,
    updateSettings,
    default: {
      getSettings,
      updateSettings,
    },
  };
});

const mockSettingsPayload = {
  general: {
    siteName: "iPoint Genie",
    siteDescription: "Khám phá Cần Thơ",
    logoUrl: "https://cdn/logo.png",
    faviconUrl: "https://cdn/favicon.ico",
    language: "vi",
    timezone: "Asia/Ho_Chi_Minh",
    dateFormat: "DD/MM/YYYY",
    currency: "VND",
    baseUrl: "https://iPointGenie.vn",
    domain: "iPointGenie.vn",
    maintenanceMode: false,
  },
  mapDefault: {
    latitude: "10.0452",
    longitude: "105.7469",
    zoom: "13",
  },
  email: {
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    defaultFromEmail: "noreply@didaugio.vn",
    useTLS: true,
    useSSL: false,
    notificationsEnabled: true,
  },
  security: {
    require2FA: false,
    lockoutEnabled: true,
    sessionTimeoutMinutes: "30",
    csrfProtection: true,
    xssProtection: true,
    secureApiLogin: true,
  },
  modules: {
    placeApproval: true,
    routing: true,
    aiPlanner: true,
    notifications: true,
    newsModule: false,
    reportsModule: true,
    cacheEnabled: true,
    maxUploadSizeMb: "20",
    allowedFileTypes: "jpg,png",
  },
  integrations: {
    googleApiKey: "gk_123",
    facebookAppId: "fb_123",
    webhookEndpoint: "https://hook.site/abc",
    paymentProvider: "none",
    analyticsProvider: "ga4",
  },
  logs: {
    auditLogEnabled: true,
    errorLogEnabled: true,
    retentionDays: "30",
    allowLogAccess: true,
  },
  operations: {
    backupEnabled: true,
    backupFrequency: "daily",
    offlinePageMessage: "Maintenance",
  },
  seo: {
    metaTitleDefault: "meta title",
    metaDescriptionDefault: "meta desc",
    robotsPolicy: "index,follow",
    sitemapEnabled: true,
    headerCustomCode: "",
    footerCustomCode: "",
  },
};

describe("SettingsPageContent", () => {
  beforeEach(() => {
    i18n.changeLanguage("vi");
    vi.clearAllMocks();
    settingsService.getSettings.mockResolvedValue({
      data: mockSettingsPayload,
    });
    settingsService.updateSettings.mockResolvedValue({
      success: true,
      data: {},
    });
  });

  it("renders all settings sections", async () => {
    renderWithClient(<SettingsPageContent />);

    await waitFor(() => {
      expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText("1) Cài Đặt Chung")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /chung/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /thông báo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bảo mật/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tính năng/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /api & tích hợp/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /nhật ký/i })).toBeInTheDocument();
  });

  it("loads data from API into form", async () => {
    renderWithClient(<SettingsPageContent />);

    expect(await screen.findByDisplayValue("iPoint Genie")).toBeInTheDocument();
  });

  it("updates values and saves transformed payload", async () => {
    const user = userEvent.setup();
    renderWithClient(<SettingsPageContent />);

    const siteNameInput = await screen.findByDisplayValue("iPoint Genie");
    await user.clear(siteNameInput);
    await user.type(siteNameInput, "iPoint Genie Admin");

    // Đợi autosave tự động trigger sau 1500ms
    await waitFor(() => {
      expect(settingsService.updateSettings).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    const payload = settingsService.updateSettings.mock.calls[0][0];
    expect(payload.general.siteName).toBe("iPoint Genie Admin");
  }, 15000);

  it.skip("shows error toast when loading settings fails", async () => {
    settingsService.getSettings.mockRejectedValueOnce(new Error("Load failed"));

    renderWithClient(<SettingsPageContent />);

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "LỖI TẢI CẤU HÌNH",
        }),
      );
    });
  });
});
