import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Clock,
  CheckCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserX,
  Loader2,
  Check,
  Download,
  QrCode,
} from "lucide-react";
import * as bookingApi from "@/apis/bookingService";
import { getMyPlaces } from "@/apis/businessApi";
import { BOOKING_STATUS } from "@/constants/constants";
import { exportToCsv, fetchAllPages, formatCsvDate, slugifyFilename } from "@/utils/csvExport";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermission } from "@/hooks/usePermission";

import { BookingListProvider, useBookingListContext } from "@/components/booking/BookingListContext";
import { BookingFilterBar } from "@/components/booking/BookingFilterBar";
import { BookingCard } from "@/components/booking/BookingCard";
import { QuickRejectModal, QuickCancelModal, QuickRescheduleModal } from "@/components/booking/BookingActionModals";
import BookingQrScannerDialog from "@/components/business/BookingQrScannerDialog";

const getStatCardsConfig = (t) => [
  { key: BOOKING_STATUS.PENDING, label: t("business.bookings.pending"), icon: Clock, color: "amber" },
  { key: BOOKING_STATUS.CONFIRMED, label: t("business.bookings.confirmed"), icon: CheckCheck, color: "blue" },
  { key: BOOKING_STATUS.COMPLETED, label: t("business.bookings.completed"), icon: CheckCircle2, color: "emerald" },
  { key: BOOKING_STATUS.CANCELLED, label: t("business.bookings.cancelled"), icon: XCircle, color: "slate" },
  { key: BOOKING_STATUS.REJECTED, label: t("business.bookings.rejected"), icon: XCircle, color: "rose" },
  { key: BOOKING_STATUS.EXPIRED, label: t("business.bookings.expired"), icon: AlertTriangle, color: "orange" },
  { key: BOOKING_STATUS.NO_SHOW, label: t("business.bookings.noShow"), icon: UserX, color: "purple" },
];

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
  const [totalPages, setTotalPages] = useState(1);
  const [bulkLoading, setBulkLoading] = useState(false);
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
      setStats(response.data);
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
          { key: (row) => row.service?.name || "", label: t("business.bookings.export.headers.service") },
          { key: (row) => row.status, label: t("business.bookings.export.headers.status") },
          { key: (row) => row.finalPrice || 0, label: t("business.bookings.export.headers.price") },
          { key: (row) => formatCsvDate(row.createdAt), label: t("business.bookings.export.headers.createdAt") },
        ],
        data: allData,
        filename: slugifyFilename(t("business.bookings.export.filename")),
      });
      toast.success(t("common.savedSuccessfully"));
    } catch {
      toast.error(t("common.operationFailed"));
    } finally {
      setExportLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    setActionLoading(`confirm-${id}`);
    try {
      await bookingApi.confirm(id);
      toast.success(t("business.bookings.confirmedSuccess"));
      refresh();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.bookings.cannotConfirm"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id) => {
    setActionLoading(`complete-${id}`);
    try {
      await bookingApi.complete(id);
      toast.success(t("business.bookings.completedSuccess"));
      refresh();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.bookings.cannotComplete"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleNoShow = async (id) => {
    setActionLoading(`noshow-${id}`);
    try {
      await bookingApi.markNoShow(id);
      toast.success(t("business.bookings.noShowMarked"));
      refresh();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.bookings.cannotMarkNoShow"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirmed = async (reason, businessNote) => {
    if (!rejectModalBookingId) return;
    setActionLoading(`reject-${rejectModalBookingId}`);
    try {
      await bookingApi.quickReject(rejectModalBookingId, reason, { businessNote });
      toast.success(t("business.bookings.rejectedSuccess"));
      setRejectModalBookingId(null);
      refresh();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.bookings.cannotReject"));
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
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.bookings.cannotCancel"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRescheduleConfirmed = async (bookingTime, businessNote) => {
    if (!rescheduleBooking?.id) return;
    setActionLoading("reschedule");
    try {
      await bookingApi.reschedule(rescheduleBooking.id, bookingTime, { businessNote });
      toast.success(t("business.bookings.confirmedSuccess"));
      setRescheduleBooking(null);
      refresh();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.bookings.cannotComplete"));
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelect = (id) => {
    setSelectedBookings((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
          {t("business.bookings.title")}
        </h1>
        <p className="text-sm text-zinc-500 mt-1 dark:text-zinc-400">
          {t("business.bookings.subtitle")}
        </p>
      </div>

      {/* Filter Bar */}
      <BookingFilterBar
        places={places}
        onExportCsv={handleExportCsv}
        exportLoading={exportLoading}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
          {getStatusTabs(t).map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-lg px-4 py-2 text-xs font-semibold tracking-wide uppercase transition-all"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Content List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border rounded-xl bg-white dark:bg-zinc-950">
          <Clock className="h-10 w-10 text-zinc-400 mb-2" />
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {t("business.bookings.noBookings")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
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

      {/* Modals */}
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
