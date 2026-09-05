import { useTranslation } from "react-i18next";
import { Plus, RefreshCw } from "lucide-react";

export function CmsPageHeader({ activeTab, isRefreshing, onCreate, onRefresh }) {
  const { t } = useTranslation();
  const createLabel =
    activeTab === "events"
      ? t("admin.cms.createEventBtn")
      : activeTab === "trips"
        ? t("admin.cms.createSampleTrip")
        : t("common.create");

  const tabTitles = {
    events: {
      title: "Sự kiện & Lễ hội Du lịch",
      subtitle: "Quản lý các sự kiện văn hóa, lễ hội và hoạt động du lịch tại Cần Thơ.",
    },
    trips: {
      title: "Lịch trình Mẫu (Curated Trips)",
      subtitle: "Bộ sưu tập lịch trình gợi ý chuẩn xác giúp du khách khám phá dễ dàng.",
    },
    banners: {
      title: "Banner & Quảng cáo Nổi bật",
      subtitle: "Quản lý vị trí hiển thị banner trên trang chủ và các phân mục.",
    },
    announcements: {
      title: "Thông báo Hệ thống",
      subtitle: "Gửi tin tức, cập nhật và thông báo quan trọng đến người dùng.",
    },
    featured: {
      title: "Địa điểm & Dịch vụ Nổi bật",
      subtitle: "Lựa chọn các điểm đến tiêu biểu được ghim tại trang chủ.",
    },
    pages: {
      title: "Trang Tĩnh & Chính sách",
      subtitle: "Quản lý điều khoản, giới thiệu và thông tin hướng dẫn sử dụng.",
    },
  };

  const currentMeta = tabTitles[activeTab] || {
    title: t("admin.cms.events"),
    subtitle: t("admin.cms.eventsDesc"),
  };

  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-black/[0.04]">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Quản trị Nội dung CMS
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
          {currentMeta.title}
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          {currentMeta.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-wrap">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-10 w-10 rounded-full bg-white text-slate-900 hover:bg-[#F4F2EC] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] transition-all flex items-center justify-center shrink-0 active:scale-95"
          title={t("common.refresh")}
        >
          <RefreshCw className={`h-4 w-4 text-slate-800 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>

        <button
          type="button"
          onClick={onCreate}
          className="flex-1 sm:flex-initial justify-center h-10 px-5 rounded-full bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus className="h-4 w-4 text-[#F3E600]" />
          <span>{createLabel}</span>
        </button>
      </div>
    </header>
  );
}
