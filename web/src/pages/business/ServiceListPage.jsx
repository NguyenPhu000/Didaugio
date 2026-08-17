// MAP: ServiceListPage
// ├── UI: @/components/business/services/{ServiceBentoCard, InteractivePlaceCard, ServiceFormModal, ServiceConfirmDeleteModal}
// └── API: @/apis/businessOfferingApi, @/apis/businessApi

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMyPlaces } from "@/apis/businessApi";
import * as businessOfferingApi from "@/apis/businessOfferingApi";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import { cn } from "@/lib/utils";

// Extracted Sub-Components
import ServiceFormModal from "@/components/business/services/ServiceFormModal";
import ServiceConfirmDeleteModal from "@/components/business/services/ServiceConfirmDeleteModal";
import ServiceBentoCard from "@/components/business/services/ServiceBentoCard";
import InteractivePlaceCard from "@/components/business/services/InteractivePlaceCard";

const PAGE_SIZE = 12;

const ServiceListPage = memo(() => {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editService, setEditService] = useState(null);
  const [draftPlaceId, setDraftPlaceId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await businessOfferingApi.getAll({
        search,
        page,
        limit: PAGE_SIZE,
        ...(selectedPlaceId !== "all" && { placeId: selectedPlaceId }),
      });
      setServices(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || 0);
    } catch {
      toast.error(t("business.services.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [search, page, selectedPlaceId, t]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    getMyPlaces()
      .then((res) => setPlaces(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, selectedPlaceId]);

  // Aggregate stats per place from services
  const placeStatsMap = useMemo(() => {
    const map = {};
    services.forEach((svc) => {
      const pId = svc.place?.id || svc.placeId;
      if (pId) {
        if (!map[pId]) {
          map[pId] = { total: 0, active: 0, bookings: 0 };
        }
        map[pId].total += 1;
        if (svc.isActive) map[pId].active += 1;
        map[pId].bookings += svc._count?.bookings || 0;
      }
    });
    return map;
  }, [services]);

  const handleCreate = useCallback(
    async (data) => {
      await businessOfferingApi.create(data);
      toast.success(t("business.services.createSuccess"));
      loadServices();
    },
    [t, loadServices]
  );

  const handleUpdate = useCallback(
    async (data) => {
      if (!editService?.id) return;
      await businessOfferingApi.update(editService.id, data);
      toast.success(t("business.services.updateSuccess"));
      setEditService(null);
      loadServices();
    },
    [editService, t, loadServices]
  );

  const handleDeleteConfirmed = useCallback(async () => {
    const { id } = confirmDelete;
    setConfirmDelete(null);
    try {
      await businessOfferingApi.remove(id);
      toast.success(t("business.services.deleteSuccess"));
      if (services.length === 1 && page > 1) setPage((p) => p - 1);
      else loadServices();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("common.operationFailed"));
    }
  }, [confirmDelete, services.length, page, t, loadServices]);

  const openCreate = useCallback((placeId = "") => {
    setEditService(null);
    setDraftPlaceId(placeId ? String(placeId) : "");
    setShowForm(true);
  }, []);

  const openEdit = useCallback((svc) => {
    setEditService(svc);
    setDraftPlaceId("");
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditService(null);
    setDraftPlaceId("");
  }, []);

  const activeCount = services.filter((s) => s.isActive).length;
  const discountedCount = services.filter((s) => s.discountPrice).length;

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto font-sans transition-colors duration-200">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t("business.services.title")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
            Quản lý danh mục dịch vụ, bảng giá và phân bổ theo từng cơ sở kinh doanh
          </p>
        </div>

        <Button
          onClick={() => openCreate(selectedPlaceId !== "all" ? selectedPlaceId : "")}
          className="w-full sm:w-auto justify-center rounded-2xl h-10 px-5 text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground shadow-sm gap-2"
        >
          <Plus className="h-4 w-4" />
          Tạo dịch vụ mới
        </Button>
      </div>

      {/* ── Top Bento Summary Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="p-5 rounded-[24px] bg-[#FEE8D3] dark:bg-amber-950/30 border border-[#FCD4AF] dark:border-amber-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-amber-200">Tổng dịch vụ</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <p className="text-3xl font-black text-slate-950 dark:text-white mt-3">{total}</p>
        </div>

        <div className="p-5 rounded-[24px] bg-[#DCFCE7] dark:bg-emerald-950/30 border border-[#BBF7D0] dark:border-emerald-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-emerald-200">Đang mở bán</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-3xl font-black text-slate-950 dark:text-white mt-3">{activeCount}</p>
        </div>

        <div className="p-5 rounded-[24px] bg-[#D7E5FF] dark:bg-blue-950/30 border border-[#BED6FF] dark:border-blue-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-blue-200">Đang ưu đãi</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <p className="text-3xl font-black text-slate-950 dark:text-white mt-3">{discountedCount}</p>
        </div>

        <div className="p-5 rounded-[24px] bg-[#F1F2F4] dark:bg-slate-900/60 border border-slate-200/80 dark:border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Tổng số cơ sở</span>
            <span className="w-2 h-2 rounded-full bg-slate-400" />
          </div>
          <p className="text-3xl font-black text-slate-950 dark:text-white mt-3">{places.length}</p>
        </div>
      </div>

      {/* ── Section: Hệ Thống Cơ Sở & Địa Điểm (Interactive Place Cards) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Hệ Thống Cơ Sở & Địa Điểm
            </h2>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              Nhấp vào từng cơ sở để lọc nhanh danh sách dịch vụ tương ứng
            </p>
          </div>

          {selectedPlaceId !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedPlaceId("all")}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 underline"
            >
              Xem tất cả cơ sở
            </button>
          )}
        </div>

        {/* Place Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* All Places Card */}
          <div
            onClick={() => setSelectedPlaceId("all")}
            className={cn(
              "p-5 rounded-[28px] border transition-all duration-300 cursor-pointer select-none text-left flex flex-col justify-between min-h-[140px]",
              selectedPlaceId === "all"
                ? "bg-slate-950 text-white dark:bg-primary dark:text-primary-foreground shadow-md ring-2 ring-slate-950/20"
                : "bg-white dark:bg-card border-slate-200/80 dark:border-border/80 hover:shadow-md"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
                Toàn bộ hệ thống
              </span>
              {selectedPlaceId === "all" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20">
                  Đang xem
                </span>
              )}
            </div>

            <div className="my-2">
              <h3 className="font-black text-lg tracking-tight">Tất Cả Cơ Sở</h3>
              <p className="text-xs opacity-70 mt-0.5">{places.length} địa điểm đang quản lý</p>
            </div>

            <div className="pt-2 border-t border-white/10 text-xs font-bold opacity-80">
              Tổng cộng {total} dịch vụ
            </div>
          </div>

          {/* Individual Place Cards */}
          {places.map((place) => {
            const stats = placeStatsMap[place.id] || { total: 0, active: 0, bookings: 0 };
            return (
              <InteractivePlaceCard
                key={place.id}
                place={place}
                totalServices={stats.total}
                activeServices={stats.active}
                totalBookings={stats.bookings}
                isSelected={selectedPlaceId === String(place.id)}
                onClick={() => setSelectedPlaceId(String(place.id))}
                onAddService={openCreate}
              />
            );
          })}
        </div>
      </div>

      {/* ── Toolbar: Search & Fast Filter ── */}
      <div className="p-4 rounded-[24px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm dịch vụ theo tên, loại hình..."
            className="pl-9 bg-slate-50 dark:bg-muted/50 border-slate-200 dark:border-border/80 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedPlaceId} onValueChange={setSelectedPlaceId}>
            <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-muted/50 border-slate-200 dark:border-border/80 w-44 font-medium">
              <SelectValue placeholder="Chọn địa điểm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả địa điểm</SelectItem>
              {places.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Services Content List ── */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-3xl" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-[32px] border border-slate-200/80 dark:border-border/80 bg-white dark:bg-card shadow-sm text-center">
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">
              Không tìm thấy dịch vụ nào
            </p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Chưa có dịch vụ nào trong cơ sở này hoặc từ khóa tìm kiếm không khớp.
            </p>
            <Button
              onClick={() => openCreate(selectedPlaceId !== "all" ? selectedPlaceId : "")}
              className="rounded-xl text-xs font-bold bg-slate-950 text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Thêm dịch vụ đầu tiên
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((svc) => (
              <ServiceBentoCard
                key={svc.id}
                svc={svc}
                onEdit={openEdit}
                onDelete={(s) => setConfirmDelete({ id: s.id, name: s.name })}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <ServiceFormModal
        open={showForm}
        service={editService}
        places={places}
        onSave={editService ? handleUpdate : handleCreate}
        onClose={closeForm}
      />

      <ServiceConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.name}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
});

ServiceListPage.displayName = "ServiceListPage";
export default ServiceListPage;
