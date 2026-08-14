import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Bell,
  Calendar,
  CheckCircle,
  Compass,
  Eye,
  FileText,
  Globe,
  Image as ImageIcon,
  RefreshCw,
  Star,
  Zap,
  Plus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EventEditModal } from "../events/EventEditModal";
import { EventTabContent } from "../events/EventTabContent";
import { ContentCard } from "../content/ContentCard";
import { EditModal } from "../content/EditModal";
import { CmsFilterBar } from "./CmsFilterBar";
import { CmsPageHeader } from "./CmsPageHeader";
import { CmsTypeTabs } from "./CmsTypeTabs";
import { StatCard } from "../shared/StatCard";
import {
  TripContentCard as SampleTripContentCard,
  TripEditModal as SampleTripEditModal,
} from "../sample-trips";

export function CmsContentLayout(props) {
  const {
    t,
    activeTab,
    loading,
    items,
    activeEventCount,
    featuredBannerCount,
    totalTrips,
    totalClones,
    eventsChartData,
    tripsChartData,
    bannersChartData,
    announcementsChartData,
    featuredChartData,
    allowedContentTypes,
    getContentCount,
    setActiveTab,
    setSearch,
    setStatusFilter,
    search,
    selectedType,
    statusFilter,
    filteredItems,
    handleEdit,
    handleToggle,
    handleDelete,
    handleTripDetail,
    editModal,
    setEditModal,
    handleSave,
    isLoading,
    fetchItems,
  } = props;

  return (
    <div className="space-y-6 text-slate-900 antialiased selection:bg-[#F3E600] selection:text-slate-950 max-w-[1560px] mx-auto">
      <CmsPageHeader
        activeTab={activeTab}
        isRefreshing={loading}
        onCreate={() => setEditModal({ open: true, item: null })}
        onRefresh={fetchItems}
      />

      {/* Dynamic Analytics (Stats & Charts) */}
      {!loading && (
        <div className="space-y-6">
          {/* Stats Row */}
          {activeTab === "events" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Tổng sự kiện"
                value={items.length}
                icon={Calendar}
                tone="default"
                subtitle="Tất cả sự kiện"
              />
              <StatCard
                title="Đang hoạt động"
                value={activeEventCount}
                icon={CheckCircle}
                tone="success"
                subtitle="Sự kiện đang diễn ra"
              />
              <StatCard
                title="Banner nổi bật"
                value={featuredBannerCount}
                icon={Star}
                tone="warning"
                subtitle="Hiển thị trên banner"
              />
            </div>
          )}
          {activeTab === "trips" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                title="Tổng lịch trình mẫu"
                value={totalTrips}
                icon={Compass}
                tone="default"
                subtitle="Lịch trình hệ thống"
              />
              <StatCard
                title="Tổng số lượt clone"
                value={totalClones}
                icon={RefreshCw}
                tone="success"
                subtitle="Người dùng lưu lại"
              />
            </div>
          )}
          {activeTab === "banners" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Tổng banner"
                value={items.length}
                icon={ImageIcon}
                tone="default"
                subtitle="Tất cả quảng cáo"
              />
              <StatCard
                title="Đang hiển thị"
                value={items.filter((b) => b.isActive || b.active).length}
                icon={CheckCircle}
                tone="success"
                subtitle="Đang hoạt động"
              />
              <StatCard
                title="Tổng lượt xem"
                value={items.reduce((acc, curr) => acc + (curr.views || 0), 0)}
                icon={Eye}
                tone="warning"
                subtitle="Lượt click & xem"
              />
            </div>
          )}
          {activeTab === "announcements" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                title="Tổng thông báo"
                value={items.length}
                icon={Bell}
                tone="default"
                subtitle="Tất cả thông báo"
              />
              <StatCard
                title="Đang hoạt động"
                value={items.filter((a) => a.active).length}
                icon={CheckCircle}
                tone="success"
                subtitle="Thông báo khả dụng"
              />
            </div>
          )}
          {activeTab === "featured" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                title="Tổng nổi bật"
                value={items.length}
                icon={Star}
                tone="default"
                subtitle="Địa điểm nổi bật"
              />
              <StatCard
                title="Đang kích hoạt"
                value={items.filter((f) => f.active).length}
                icon={CheckCircle}
                tone="success"
                subtitle="Hiển thị trang chủ"
              />
            </div>
          )}
          {activeTab === "pages" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Tổng trang tĩnh"
                value={items.length}
                icon={FileText}
                tone="default"
                subtitle="Trang hệ thống"
              />
              <StatCard
                title="Đang kích hoạt"
                value={items.filter((p) => p.active).length}
                icon={CheckCircle}
                tone="success"
                subtitle="Khả dụng công khai"
              />
              <StatCard
                title="Tổng lượt xem"
                value={items.reduce((acc, curr) => acc + (curr.views || 0), 0)}
                icon={Eye}
                tone="warning"
                subtitle="Tổng số lượt đọc"
              />
            </div>
          )}

          {/* Charts Row */}
          {items.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {activeTab === "events" && eventsChartData && (
                <div className="lg:col-span-3 rounded-3xl bg-white border border-black/[0.04] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
                  <div className="pb-4 border-b border-black/[0.04] flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#F3E600]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Thống kê Check-in các sự kiện hàng đầu
                    </h3>
                  </div>
                  <div className="h-64 pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={eventsChartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f1f5f9"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid rgba(0,0,0,0.05)",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                          }}
                        />
                        <Bar
                          dataKey="value"
                          name="Lượt check-in"
                          fill="#0f172a"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeTab === "trips" && tripsChartData && (
                <div className="lg:col-span-3 rounded-3xl bg-white border border-black/[0.04] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
                  <div className="pb-4 border-b border-black/[0.04] flex items-center gap-2">
                    <Compass className="h-4 w-4 text-purple-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Top lịch trình mẫu được Clone nhiều nhất
                    </h3>
                  </div>
                  <div className="h-64 pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={tripsChartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f1f5f9"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid rgba(0,0,0,0.05)",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                          }}
                        />
                        <Bar
                          dataKey="value"
                          name="Lượt clone"
                          fill="#a855f7"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeTab === "banners" && bannersChartData && (
                <div className="lg:col-span-3 rounded-3xl bg-white border border-black/[0.04] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
                  <div className="pb-4 border-b border-black/[0.04] flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-slate-800" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Cơ cấu phân phối Banner quảng cáo theo vị trí
                    </h3>
                  </div>
                  <div className="h-64 pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={bannersChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {bannersChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid rgba(0,0,0,0.05)",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeTab === "announcements" && announcementsChartData && (
                <div className="lg:col-span-3 rounded-3xl bg-white border border-black/[0.04] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
                  <div className="pb-4 border-b border-black/[0.04] flex items-center gap-2">
                    <Bell className="h-4 w-4 text-slate-800" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Cơ cấu thông báo hệ thống (Có ảnh vs Không ảnh)
                    </h3>
                  </div>
                  <div className="h-64 pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={announcementsChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {announcementsChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid rgba(0,0,0,0.05)",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {(activeTab === "featured" || activeTab === "pages") &&
                featuredChartData && (
                  <div className="lg:col-span-3 rounded-3xl bg-white border border-black/[0.04] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
                    <div className="pb-4 border-b border-black/[0.04] flex items-center gap-2">
                      <Eye className="h-4 w-4 text-slate-800" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Top nội dung có lượt xem nhiều nhất
                      </h3>
                    </div>
                    <div className="h-64 pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={featuredChartData}
                          margin={{
                            top: 10,
                            right: 10,
                            left: -20,
                            bottom: 20,
                          }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f1f5f9"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "12px",
                              border: "1px solid rgba(0,0,0,0.05)",
                            }}
                          />
                          <Bar
                            dataKey="value"
                            name="Lượt xem"
                            fill="#10b981"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      {/* Tabs list */}
      <CmsTypeTabs
        activeTab={activeTab}
        contentTypes={allowedContentTypes}
        getContentCount={getContentCount}
        onChange={(tabId) => {
          setActiveTab(tabId);
          setSearch("");
          setStatusFilter("all");
        }}
      />

      {/* Search and Filters */}
      <CmsFilterBar
        activeTab={activeTab}
        search={search}
        selectedType={selectedType}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onClear={() => {
          setSearch("");
          setStatusFilter("all");
        }}
      />

      {/* Content List */}
      {activeTab === "events" ? (
        <EventTabContent
          items={items}
          isLoading={loading}
          search={search}
          statusFilter={statusFilter}
          onCreate={() => setEditModal({ open: true, item: null })}
          onEdit={handleEdit}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      ) : (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white border border-black/[0.04] p-5 shadow-2xs space-y-3"
              >
                <div className="flex items-start gap-4">
                  <Skeleton className="w-24 h-24 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48 rounded-lg" />
                    <Skeleton className="h-4 w-32 rounded-lg" />
                    <Skeleton className="h-4 w-full rounded-lg" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredItems.length === 0 ? (
            <div className="rounded-3xl bg-white border border-black/[0.04] p-16 text-center text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF9F5] border border-black/[0.04] flex items-center justify-center mx-auto mb-3 text-slate-400">
                {activeTab === "events" ? (
                  <Calendar className="h-7 w-7 stroke-[1.5]" />
                ) : activeTab === "trips" ? (
                  <Compass className="h-7 w-7 stroke-[1.5]" />
                ) : (
                  <Globe className="h-7 w-7 stroke-[1.5]" />
                )}
              </div>
              <p className="text-base font-bold text-slate-800">
                {search || statusFilter !== "all"
                  ? t("admin.cms.noResults")
                  : t("admin.cms.noContentYet", {
                      type: selectedType?.label?.toLowerCase() || "",
                    })}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {search || statusFilter !== "all"
                  ? t("admin.cms.noResultsHint")
                  : t("admin.cms.createFirstHint", {
                      type: selectedType?.label?.toLowerCase() || "",
                    })}
              </p>
              {!(search || statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => setEditModal({ open: true, item: null })}
                  className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-full bg-slate-950 text-white font-bold text-xs hover:bg-black shadow-sm"
                >
                  <Plus className="h-4 w-4 text-[#F3E600]" />
                  <span>{t("admin.cms.createContent")}</span>
                </button>
              )}
            </div>
          ) : (
            filteredItems.map((item) =>
              activeTab === "trips" ? (
                <SampleTripContentCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onManageDestinations={handleTripDetail}
                  onDelete={handleDelete}
                />
              ) : (
                <ContentCard
                  key={item.id}
                  item={{
                    ...item,
                    icon: selectedType?.icon,
                    color: selectedType?.color,
                  }}
                  onEdit={handleEdit}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              )
            )
          )}
        </div>
      )}

      {/* Event Modal */}
      {activeTab === "events" && (
        <EventEditModal
          open={editModal.open}
          onClose={() => setEditModal({ open: false, item: null })}
          item={editModal.item}
          onSave={handleSave}
          loading={isLoading}
        />
      )}

      {/* Trip Modal */}
      {activeTab === "trips" && (
        <SampleTripEditModal
          open={editModal.open}
          onClose={() => setEditModal({ open: false, item: null })}
          item={editModal.item}
          onSave={handleSave}
          loading={isLoading}
        />
      )}

      {/* Generic Modal */}
      {activeTab !== "events" && activeTab !== "trips" && (
        <EditModal
          open={editModal.open}
          onClose={() => setEditModal({ open: false, item: null })}
          item={editModal.item}
          onSave={handleSave}
          type={selectedType}
          loading={isLoading}
        />
      )}
    </div>
  );
}
