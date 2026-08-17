// MAP: BookingListPage
// ├── UI: @/components/business/bookings/{BookingHeaderFilters, BookingMasterTable, BookingActionDialogs}
// └── API: @/apis/bookingService, @/apis/businessApi

import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as bookingApi from "@/apis/bookingService";
import { getMyPlaces } from "@/apis/businessApi";
import { BOOKING_STATUS } from "@/constants/constants";
import { exportToCsv, fetchAllPages, formatCsvDate, slugifyFilename } from "@/utils/csvExport";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";

import { BookingListProvider, useBookingListContext } from "@/components/booking/BookingListContext";
import { BookingFilterBar } from "@/components/booking/BookingFilterBar";
import { BookingCard, getTimeOfDay } from "@/components/booking/BookingCard";
import { QuickRejectModal, QuickCancelModal, QuickRescheduleModal } from "@/components/booking/BookingActionModals";
import BookingQrScannerDialog from "@/components/business/BookingQrScannerDialog";
import AetherBentoCard from "@/components/business/AetherBentoCard";
import BookingPlacesSection from "@/components/booking/BookingPlacesSection";

const getStatusTabs = (t) => [
  { value: "all", label: t("business.bookings.all") },
  { value: BOOKING_STATUS.PENDING, label: t("business.bookings.pending") },
  { value: BOOKING_STATUS.CONFIRMED, label: t("business.bookings.confirmed") },
  { value: BOOKING_STATUS.COMPLETED, label: t("business.bookings.completed") },
  { value: BOOKING_STATUS.CANCELLED, label: t("business.bookings.cancelled") },
];

const PAGE_SIZE = 20;

function BookingListPageContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canConfirm = hasPermission("bookings.confirm");
  const canCancel = hasPermission("bookings.cancel");
  const canComplete = hasPermission("bookings.complete");

  const {
    activeTab,
    setActiveTab,
    selectedPlace,
    setSelectedPlace,
    selectedTimeSlot,
    setSelectedTimeSlot,
    search,
    selectedBookings,
    setSelectedBookings,
    rescheduleBooking,
    setRescheduleBooking,
    cancelModalBookingId,
    setCancelModalBookingId,
    rejectModalBookingId,
    setRejectModalBookingId,
    qrScannerOpen,
    setQrScannerOpen,
    actionLoading,
    setActionLoading,
  } = useBookingListContext();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [places, setPlaces] = useState([]);
  const [page, setPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await bookingApi.getAll({
        search,
        status: activeTab,
        page,
        limit: PAGE_SIZE,
        ...(selectedPlace !== "all" && { placeId: selectedPlace }),
      });
      setBookings(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch {
      toast.error(t("business.bookings.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [search, activeTab, page, selectedPlace, t]);

  const loadStats = useCallback(async () => {
    try {
      const response = await bookingApi.getStats();
      const rawData = response.data?.data || response.data || {};
      setStats(rawData.byStatus || rawData);
    } catch {
      // Keep UI usable
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    getMyPlaces()
      .then((res) => setPlaces(res.data || []))
      .catch(() => {});
  }, []);

  const refresh = useCallback(() => {
    loadBookings();
    loadStats();
  }, [loadBookings, loadStats]);

  const handleExportCsv = async () => {
    setExportLoading(true);
    try {
      const allData = await fetchAllPages(async (params) => {
        return bookingApi.getAll({
          ...params,
          ...(selectedPlace !== "all" && { placeId: selectedPlace }),
          ...(activeTab !== "all" && { status: activeTab }),
          ...(search && { search }),
        });
      });

      exportToCsv({
        columns: [
          { key: "id", label: t("business.bookings.export.headers.id") },
          { key: (row) => row.guestName || row.user?.fullName || "", label: t("business.bookings.export.headers.guestName") },
          { key: (row) => row.guestPhone || row.user?.phone || "", label: t("business.bookings.export.headers.phone") },
          { key: (row) => row.guestEmail || row.user?.email || "", label: t("business.bookings.export.headers.email") },
          { key: (row) => row.service?.name || "", label: t("business.bookings.export.headers.service") },
          { key: (row) => row.place?.name || row.service?.place?.name || "", label: t("business.bookings.export.headers.place") },
          { key: (row) => row.status || "", label: t("business.bookings.export.headers.status") },
          { key: (row) => formatCsvDate(row.useDate || row.bookingAt), label: t("business.bookings.export.headers.useDate") },
          { key: (row) => row.useTime || "", label: t("business.bookings.export.headers.useTime") },
          { key: (row) => row.finalPrice || 0, label: t("business.bookings.export.headers.finalPrice") },
          { key: (row) => formatCsvDate(row.createdAt), label: t("business.bookings.export.headers.createdAt") },
        ],
        data: allData,
        filename: `danh-sach-dat-cho-${slugifyFilename(activeTab)}`,
      });
      toast.success(t("business.bookings.export.success"));
    } catch (e) {
      toastApiErrorIfNeeded(e, t("business.bookings.export.failed"));
    } finally {
      setExportLoading(false);
    }
  };

  const handleConfirm = async (bookingId) => {
    setActionLoading(`confirm-${bookingId}`);
    try {
      await bookingApi.confirm(bookingId);
      toast.success(t("business.bookings.confirmedSuccess"));
      refresh();
    } catch (e) {
      toastApiErrorIfNeeded(e, t("business.bookings.cannotConfirm"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (bookingId) => {
    setActionLoading(`complete-${bookingId}`);
    try {
      await bookingApi.complete(bookingId);
      toast.success(t("business.bookings.completedSuccess"));
      refresh();
    } catch (e) {
      toastApiErrorIfNeeded(e, t("business.bookings.cannotComplete"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleNoShow = async (bookingId) => {
    setActionLoading(`noshow-${bookingId}`);
    try {
      await bookingApi.markNoShow(bookingId);
      toast.success(t("business.bookings.noShowMarked"));
      refresh();
    } catch (e) {
      toastApiErrorIfNeeded(e, t("business.bookings.cannotMarkNoShow"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirmed = async (reason) => {
    if (!rejectModalBookingId) return;
    setActionLoading(`reject-${rejectModalBookingId}`);
    try {
      await bookingApi.quickReject(rejectModalBookingId, reason);
      toast.success(t("business.bookings.rejectedSuccess"));
      setRejectModalBookingId(null);
      refresh();
    } catch (e) {
      toastApiErrorIfNeeded(e, t("business.bookings.cannotReject"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelConfirmed = async (reason) => {
    if (!cancelModalBookingId) return;
    setActionLoading(`cancel-${cancelModalBookingId}`);
    try {
      await bookingApi.cancel(cancelModalBookingId, reason);
      toast.success(t("business.bookings.cancelledSuccess"));
      setCancelModalBookingId(null);
      refresh();
    } catch (e) {
      toastApiErrorIfNeeded(e, t("business.bookings.cannotCancel"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRescheduleConfirmed = async (newDate, newTime, reason) => {
    if (!rescheduleBooking) return;
    setActionLoading("reschedule");
    try {
      await bookingApi.reschedule(rescheduleBooking.id, {
        useDate: newDate,
        useTime: newTime,
        reason,
      });
      toast.success(t("business.bookings.rescheduledSuccess"));
      setRescheduleBooking(null);
      refresh();
    } catch (e) {
      toastApiErrorIfNeeded(e, t("business.bookings.cannotReschedule"));
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelect = (id) => {
    setSelectedBookings((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredBookings = useMemo(() => {
    if (selectedTimeSlot === "all") return bookings;
    return bookings.filter((b) => {
      const timeOfDay = getTimeOfDay(b.useTime, b.useDate || b.bookingAt);
      return timeOfDay?.key === selectedTimeSlot;
    });
  }, [bookings, selectedTimeSlot]);

  const placeBookingStats = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      const pId = b.place?.id || b.service?.place?.id || b.placeId;
      if (pId) {
        if (!map[pId]) map[pId] = { total: 0, pending: 0 };
        map[pId].total += 1;
        if (b.status === BOOKING_STATUS.PENDING) map[pId].pending += 1;
      }
    });
    return map;
  }, [bookings]);

  const pendingCount =
    stats?.[BOOKING_STATUS.PENDING] ??
    stats?.byStatus?.[BOOKING_STATUS.PENDING] ??
    bookings.filter((b) => b.status === BOOKING_STATUS.PENDING).length;

  const confirmedCount =
    stats?.[BOOKING_STATUS.CONFIRMED] ??
    stats?.byStatus?.[BOOKING_STATUS.CONFIRMED] ??
    bookings.filter((b) => b.status === BOOKING_STATUS.CONFIRMED).length;

  const completedCount =
    stats?.[BOOKING_STATUS.COMPLETED] ??
    stats?.byStatus?.[BOOKING_STATUS.COMPLETED] ??
    bookings.filter((b) => b.status === BOOKING_STATUS.COMPLETED).length;

  const otherCount =
    ((stats?.[BOOKING_STATUS.CANCELLED] ?? stats?.byStatus?.[BOOKING_STATUS.CANCELLED] ?? 0) +
      (stats?.[BOOKING_STATUS.NO_SHOW] ?? stats?.byStatus?.[BOOKING_STATUS.NO_SHOW] ?? 0)) ||
    bookings.filter((b) => b.status === BOOKING_STATUS.CANCELLED || b.status === BOOKING_STATUS.NO_SHOW).length;

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto font-sans transition-colors duration-200">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t("business.bookings.title")}
        </h1>
        <p className="text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
          {t("business.bookings.subtitle")}
        </p>
      </div>

      {/* ── Top Bento Status Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <AetherBentoCard
          title="Chờ xác nhận"
          subtitle="Đơn khách mới cần tiếp nhận"
          value={pendingCount}
          variant="peach"
          onClick={() => setActiveTab(BOOKING_STATUS.PENDING)}
          className={activeTab === BOOKING_STATUS.PENDING ? "ring-2 ring-slate-950 dark:ring-amber-400" : ""}
        />

        <AetherBentoCard
          title="Đã xác nhận"
          subtitle="Đang chờ khách đến phục vụ"
          value={confirmedCount}
          variant="blue"
          onClick={() => setActiveTab(BOOKING_STATUS.CONFIRMED)}
          className={activeTab === BOOKING_STATUS.CONFIRMED ? "ring-2 ring-slate-950 dark:ring-blue-400" : ""}
        />

        <AetherBentoCard
          title="Hoàn tất"
          subtitle="Khách đã trải nghiệm xong"
          value={completedCount}
          variant="mint"
          onClick={() => setActiveTab(BOOKING_STATUS.COMPLETED)}
          className={activeTab === BOOKING_STATUS.COMPLETED ? "ring-2 ring-slate-950 dark:ring-emerald-400" : ""}
        />

        <AetherBentoCard
          title="Đã hủy / Vắng mặt"
          subtitle="Đơn hủy hoặc khách không đến"
          value={otherCount}
          variant="rose"
          onClick={() => setActiveTab(BOOKING_STATUS.CANCELLED)}
          className={activeTab === BOOKING_STATUS.CANCELLED ? "ring-2 ring-slate-950 dark:ring-rose-400" : ""}
        />
      </div>

      {/* ── Section: Hệ Thống Cơ Sở & Lọc Địa Điểm Tương Tác ── */}
      <BookingPlacesSection
        places={places}
        selectedPlace={selectedPlace}
        onSelectPlace={setSelectedPlace}
        placeBookingStats={placeBookingStats}
        totalBookingsCount={bookings.length}
      />

      {/* ── Filter Bar with Place & Time Slot ── */}
      <div className="p-4 rounded-[24px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm">
        <BookingFilterBar
          places={places}
          onExportCsv={handleExportCsv}
          exportLoading={exportLoading}
        />
      </div>

      {/* ── Status Tabs & Time Slot Quick Chips ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="bg-white dark:bg-card p-1 rounded-2xl border border-slate-200/80 dark:border-border/80 shadow-sm flex overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {getStatusTabs(t).map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-xl px-3.5 sm:px-4 py-2 text-xs font-bold uppercase transition-all whitespace-nowrap data-[state=active]:bg-slate-950 data-[state=active]:text-white dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Quick Time of Day Filter Chips */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {[
            { key: "all", label: "Tất cả buổi" },
            { key: "morning", label: "Sáng" },
            { key: "afternoon", label: "Chiều" },
            { key: "evening", label: "Tối" },
          ].map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setSelectedTimeSlot(chip.key)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors",
                selectedTimeSlot === chip.key
                  ? "bg-slate-950 text-white dark:bg-primary dark:text-primary-foreground shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content List ── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-[32px] border border-slate-200/80 dark:border-border/80 bg-white dark:bg-card shadow-sm">
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">
            {t("business.bookings.noBookings")}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Không tìm thấy đơn đặt chỗ nào phù hợp với cơ sở / khung giờ đã chọn.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              selected={selectedBookings.includes(booking.id)}
              onSelect={toggleSelect}
              onConfirm={handleConfirm}
              onCancel={() => setCancelModalBookingId(booking.id)}
              onReject={() => setRejectModalBookingId(booking.id)}
              onReschedule={setRescheduleBooking}
              onComplete={handleComplete}
              onNoShow={handleNoShow}
              onView={(bk) => navigate(`/business/bookings/${bk.id}`)}
              actionLoading={actionLoading}
              canConfirm={canConfirm}
              canCancel={canCancel}
              canComplete={canComplete}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      <QuickRejectModal
        open={!!rejectModalBookingId}
        onConfirm={handleRejectConfirmed}
        onCancel={() => setRejectModalBookingId(null)}
        loading={actionLoading?.startsWith("reject-")}
      />

      <QuickCancelModal
        open={!!cancelModalBookingId}
        onConfirm={handleCancelConfirmed}
        onCancel={() => setCancelModalBookingId(null)}
        loading={actionLoading?.startsWith("cancel-")}
      />

      <QuickRescheduleModal
        open={!!rescheduleBooking}
        booking={rescheduleBooking}
        onConfirm={handleRescheduleConfirmed}
        onCancel={() => setRescheduleBooking(null)}
        loading={actionLoading === "reschedule"}
      />

      {qrScannerOpen && (
        <BookingQrScannerDialog
          open={qrScannerOpen}
          onOpenChange={setQrScannerOpen}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}

export default function BookingListPage() {
  return (
    <BookingListProvider>
      <BookingListPageContent />
    </BookingListProvider>
  );
}
