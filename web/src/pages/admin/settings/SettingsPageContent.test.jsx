import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPageContent from "./SettingsPageContent";
import * as settingsService from "@/apis/settingsService";

const toastSpy = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

vi.mock("@/apis/settingsService", () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
}));

const mockSettingsPayload = {
  general: {
    siteName: "Đi Đâu Giờ?",
    siteDescription: "Khám phá Cần Thơ",
    logoUrl: "https://cdn/logo.png",
    faviconUrl: "https://cdn/favicon.ico",
    language: "vi",
    timezone: "Asia/Ho_Chi_Minh",
    dateFormat: "DD/MM/YYYY",
    currency: "VND",
    baseUrl: "https://didaugio.vn",
    domain: "didaugio.vn",
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
    render(<SettingsPageContent />);

    await waitFor(() => {
      expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText("1) Cài Đặt Chung")).toBeInTheDocument();
    expect(screen.getByText("Map Default Center / Zoom")).toBeInTheDocument();
    expect(
      screen.getByText("3) Email (SMTP / Notifications)"),
    ).toBeInTheDocument();
    expect(screen.getByText("4) Bảo mật (Security)")).toBeInTheDocument();
    expect(
      screen.getByText("5) Feature & Module Settings"),
    ).toBeInTheDocument();
    expect(screen.getByText("6) Tích hợp & API")).toBeInTheDocument();
    expect(screen.getByText("7) Logs & Monitoring")).toBeInTheDocument();
    expect(screen.getByText("8) Bảo trì & Vận hành")).toBeInTheDocument();
    expect(screen.getByText("9) SEO & Hiển thị")).toBeInTheDocument();
  });

  it("loads data from API into form", async () => {
    render(<SettingsPageContent />);

    expect(await screen.findByDisplayValue("Đi Đâu Giờ?")).toBeInTheDocument();
    expect(screen.getByDisplayValue("didaugio.vn")).toBeInTheDocument();
    expect(screen.getByDisplayValue("smtp.gmail.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("10.0452")).toBeInTheDocument();
  });

  it("updates values and saves transformed payload", async () => {
    const user = userEvent.setup();
    render(<SettingsPageContent />);

    const siteNameInput = await screen.findByDisplayValue("Đi Đâu Giờ?");
    await user.clear(siteNameInput);
    await user.type(siteNameInput, "Di Dau Gio Admin");

    const zoomInput = screen.getByPlaceholderText("Zoom");
    await user.clear(zoomInput);
    await user.type(zoomInput, "15");

    const uploadInput = screen.getByPlaceholderText("Max upload size (MB)");
    await user.clear(uploadInput);
    await user.type(uploadInput, "40");

    const retentionInput = screen.getByPlaceholderText("Retention days");
    await user.clear(retentionInput);
    await user.type(retentionInput, "90");

    const saveBtn = screen.getByRole("button", { name: /lưu cài đặt/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(settingsService.updateSettings).toHaveBeenCalledTimes(1);
    });

    const payload = settingsService.updateSettings.mock.calls[0][0];
    expect(payload.general.siteName).toBe("Di Dau Gio Admin");
    expect(payload.mapDefault.zoom).toBe(15);
    expect(payload.security.sessionTimeoutMinutes).toBe(30);
    expect(payload.modules.maxUploadSizeMb).toBe(40);
    expect(payload.logs.retentionDays).toBe(90);

    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "ĐÃ LƯU CẤU HÌNH",
      }),
    );
  }, 15000);

  it("shows error toast when loading settings fails", async () => {
    settingsService.getSettings.mockRejectedValueOnce(new Error("Load failed"));

    render(<SettingsPageContent />);

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "LỖI TẢI CẤU HÌNH",
        }),
      );
    });
  });
});
