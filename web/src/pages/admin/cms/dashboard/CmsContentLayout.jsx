import { Bar, Doughnut } from "react-chartjs-2";
import { Bell, Calendar, CheckCircle, Compass, Eye, FileText, Globe, Image as ImageIcon, RefreshCw, Star, Zap, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { EventEditModal } from "../events/EventEditModal";
import { EventTabContent } from "../events/EventTabContent";
import { ContentCard } from "../content/ContentCard";
import { EditModal } from "../content/EditModal";
import { CmsFilterBar } from "./CmsFilterBar";
import { CmsPageHeader } from "./CmsPageHeader";
import { CmsTypeTabs } from "./CmsTypeTabs";
import { StatCard } from "../shared/StatCard";
import { TripContentCard as SampleTripContentCard, TripEditModal as SampleTripEditModal } from "../sample-trips";

export function CmsContentLayout(props) {
  const { t, activeTab, loading, items, activeEventCount, featuredBannerCount, totalTrips, totalClones, eventsChartData, tripsChartData, bannersChartData, announcementsChartData, featuredChartData, allowedContentTypes, getContentCount, setActiveTab, setSearch, setStatusFilter, search, selectedType, statusFilter, filteredItems, handleEdit, handleToggle, handleDelete, handleTripDetail, editModal, setEditModal, handleSave, isLoading, fetchItems } = props;
  return (
    <div className="p-6 lg:p-8 min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto space-y-6">
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
                <StatCard title="Tổng sự kiện" value={items.length} icon={Calendar} tone="default" subtitle="Tất cả sự kiện" />
                <StatCard title="Đang hoạt động" value={activeEventCount} icon={CheckCircle} tone="success" subtitle="Sự kiện đang diễn ra" />
                <StatCard title="Banner nổi bật" value={featuredBannerCount} icon={Star} tone="warning" subtitle="Hiển thị trên banner" />
              </div>
            )}
            {activeTab === "trips" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard title="Tổng lịch trình mẫu" value={totalTrips} icon={Compass} tone="default" subtitle="Lịch trình hệ thống" />
                <StatCard title="Tổng số lượt clone" value={totalClones} icon={RefreshCw} tone="success" subtitle="Người dùng lưu lại" />
              </div>
            )}
            {activeTab === "banners" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Tổng banner" value={items.length} icon={ImageIcon} tone="default" subtitle="Tất cả quảng cáo" />
                <StatCard title="Đang hiển thị" value={items.filter((b) => b.isActive || b.active).length} icon={CheckCircle} tone="success" subtitle="Đang hoạt động" />
                <StatCard title="Tổng lượt xem" value={items.reduce((acc, curr) => acc + (curr.views || 0), 0)} icon={Eye} tone="warning" subtitle="Lượt click & xem" />
              </div>
            )}
            {activeTab === "announcements" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard title="Tổng thông báo" value={items.length} icon={Bell} tone="default" subtitle="Tất cả thông báo" />
                <StatCard title="Đang hoạt động" value={items.filter((a) => a.active).length} icon={CheckCircle} tone="success" subtitle="Thông báo khả dụng" />
              </div>
            )}
            {activeTab === "featured" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard title="Tổng nổi bật" value={items.length} icon={Star} tone="default" subtitle="Địa điểm nổi bật" />
                <StatCard title="Đang kích hoạt" value={items.filter((f) => f.active).length} icon={CheckCircle} tone="success" subtitle="Hiển thị trang chủ" />
              </div>
            )}
            {activeTab === "pages" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Tổng trang tĩnh" value={items.length} icon={FileText} tone="default" subtitle="Trang hệ thống" />
                <StatCard title="Đang kích hoạt" value={items.filter((p) => p.active).length} icon={CheckCircle} tone="success" subtitle="Khả dụng công khai" />
                <StatCard title="Tổng lượt xem" value={items.reduce((acc, curr) => acc + (curr.views || 0), 0)} icon={Eye} tone="warning" subtitle="Tổng số lượt đọc" />
              </div>
            )}

            {/* Charts Row */}
            {items.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {activeTab === "events" && eventsChartData && (
                  <Card className="lg:col-span-3">
                    <CardHeader className="pb-4 border-b">
                      <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Zap className="h-4 w-4" /> Thống kê Check-in các sự kiện hàng đầu
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 pt-4">
                      <Bar
                        data={eventsChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
                            x: { grid: { display: false } },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

                {activeTab === "trips" && tripsChartData && (
                  <Card className="lg:col-span-3">
                    <CardHeader className="pb-4 border-b">
                      <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Compass className="h-4 w-4" /> Top lịch trình mẫu được Clone nhiều nhất
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 pt-4">
                      <Bar
                        data={tripsChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
                            x: { grid: { display: false } },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

                {activeTab === "banners" && bannersChartData && (
                  <Card className="lg:col-span-3">
                    <CardHeader className="pb-4 border-b">
                      <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" /> Cơ cấu phân phối Banner quảng cáo theo vị trí
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 pt-4 flex items-center justify-center">
                      <Doughnut
                        data={bannersChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "bottom",
                              labels: { usePointStyle: true, padding: 15 },
                            },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

                {activeTab === "announcements" && announcementsChartData && (
                  <Card className="lg:col-span-3">
                    <CardHeader className="pb-4 border-b">
                      <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Bell className="h-4 w-4" /> Cơ cấu thông báo hệ thống (Có ảnh vs Không ảnh)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 pt-4 flex items-center justify-center">
                      <Doughnut
                        data={announcementsChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "bottom",
                              labels: { usePointStyle: true, padding: 15 },
                            },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

                {(activeTab === "featured" || activeTab === "pages") && featuredChartData && (
                  <Card className="lg:col-span-3">
                    <CardHeader className="pb-4 border-b">
                      <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Eye className="h-4 w-4" /> Top nội dung có lượt xem nhiều nhất
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 pt-4">
                      <Bar
                        data={featuredChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
                            x: { grid: { display: false } },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

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
        <CmsFilterBar
          activeTab={activeTab}
          search={search}
          selectedType={selectedType}
          statusFilter={statusFilter}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
          onClear={() => { setSearch(""); setStatusFilter("all"); }}
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
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-24 h-24 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  {activeTab === "events" ? (
                    <Calendar className="h-8 w-8 text-muted-foreground/50" />
                  ) : activeTab === "trips" ? (
                    <Compass className="h-8 w-8 text-muted-foreground/50" />
                  ) : (
                    <Globe className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                <p className="text-lg font-medium">
                  {search || statusFilter !== "all"
                    ? t("admin.cms.noResults")
                    : t("admin.cms.noContentYet", { type: selectedType?.label?.toLowerCase() || "" })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search || statusFilter !== "all"
                    ? t("admin.cms.noResultsHint")
                    : t("admin.cms.createFirstHint", { type: selectedType?.label?.toLowerCase() || "" })}
                </p>
                {!(search || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    className="mt-4 gap-2"
                    onClick={() => setEditModal({ open: true, item: null })}
                  >
                    <Plus className="h-4 w-4" />
                    {t("admin.cms.createContent")}
                  </Button>
                )}
              </CardContent>
            </Card>
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
                  item={{ ...item, icon: selectedType?.icon, color: selectedType?.color }}
                  onEdit={handleEdit}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              )
            )
          )}
        </div>
        )}
      </div>

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
