// MAP: BookingDetailPage
// ├── UI: @/components/business/bookings/{BookingStatusHero, BookingCustomerInfo, BookingServiceDetails, BookingAuditTimeline, BookingActionDialogs}
// └── API: @/apis/bookingService

import { memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import { ArrowLeft, Loader2, Copy, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import * as bookingApi from "@/apis/bookingService";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { BOOKING_STATUS } from "@/constants/constants";
import { usePermission } from "@/hooks/usePermission";
import { StatusBadge, PaymentMethodBadge, getTimeOfDay } from "@/components/booking/BookingCard";
import { formatDateTime } from "@/components/business/dashboardWidgetHelpers";
import { cn } from "@/lib/utils";

// Extracted Sub-Components
import BookingCustomerSummaryCard from "@/components/business/booking-detail/BookingCustomerSummaryCard";
import BookingQrCheckInCard from "@/components/business/booking-detail/BookingQrCheckInCard";
import BookingDetailModals from "@/components/business/booking-detail/BookingDetailModals";

const BookingDetailPage = memo(() => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { isStaff, hasPermission } = usePermission();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  // Modals
  const [cancelOpen, setCancelOpen] = useState(false);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [markPaidNote, setMarkPaidNote] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");

  const loadBooking = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await bookingApi.getById(id);
      setBooking(res.data || res);
      try {
        const qrRes = await bookingApi.getQR(id);
        setQrCodeUrl(qrRes.data?.qrCodeUrl || qrRes.qrCodeUrl || null);
      } catch {
        // QR fallback
      }
    } catch {
      toast.error(t("business.bookings.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      await bookingApi.confirm(id);
      toast.success(t("business.bookings.confirmedSuccess"));
      await loadBooking();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.bookings.cannotConfirm"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await bookingApi.complete(id);
      toast.success(t("business.bookings.completedSuccess"));
      await loadBooking();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.bookings.cannotComplete"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoShow = async () => {
    setActionLoading(true);
    try {
      await bookingApi.markNoShow(id);
      toast.success(t("business.bookings.noShowMarked"));
      await loadBooking();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.bookings.cannotMarkNoShow"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await bookingApi.cancel(id, cancelReason);
      toast.success(t("business.bookings.cancelledSuccess"));
      setCancelOpen(false);
      setCancelReason("");
      await loadBooking();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.bookings.cannotCancel"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    setActionLoading(true);
    try {
      await bookingApi.markPaid(id, { note: markPaidNote, paidAt: new Date().toISOString() });
      toast.success("Đã ghi nhận thanh toán tại quầy");
      setMarkPaidOpen(false);
      setMarkPaidNote("");
      await loadBooking();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể ghi nhận thanh toán");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    setActionLoading(true);
    try {
      const idempotencyKey = `booking-refund-${id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await bookingApi.refund(id, {
        refundReason: (refundReason || "").trim() || "Hoàn tiền theo yêu cầu khách hàng",
        refundAmount: Number(refundAmount),
        idempotencyKey,
        refundedAt: new Date().toISOString(),
      });
      toast.success("Đã xử lý hoàn tiền thành công");
      setRefundOpen(false);
      setRefundReason("");
      setRefundAmount("");
      await loadBooking();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể hoàn tiền đơn này");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!booking?.bookingCode) return;
    navigator.clipboard.writeText(booking.bookingCode);
    toast.success("Đã sao chép mã đơn đặt chỗ");
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
        <Skeleton className="h-10 w-48 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-[32px]" />
          <Skeleton className="h-96 rounded-[32px]" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-12 text-center space-y-3">
        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
          {t("business.bookings.notFound")}
        </p>
        <Button
          variant="outline"
          onClick={() => navigate(BUSINESS_ROUTES.BOOKINGS)}
          className="rounded-2xl"
        >
          {t("common.back")}
        </Button>
      </div>
    );
  }

  const isPending = booking.status === BOOKING_STATUS.PENDING;
  const isConfirmed = booking.status === BOOKING_STATUS.CONFIRMED;
  const canConfirm = !isStaff || hasPermission("canConfirmBookings");
  const canCancel = !isStaff || hasPermission("canCancelBookings");
  const canComplete = !isStaff || hasPermission("canCompleteBookings");
  const canMarkPaid = (isPending || isConfirmed) && booking.paymentStatus !== "paid";
  const canRefund = isConfirmed && booking.paymentStatus === "paid";

  const timeOfDay = getTimeOfDay(booking.useTime, booking.useDate || booking.bookingDate);
  const placeName = booking.service?.place?.name || booking.place?.name;

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto font-sans transition-colors duration-200">
      {/* ── Top Navigation & Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(BUSINESS_ROUTES.BOOKINGS)}
            className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-border/80 bg-white dark:bg-card flex items-center justify-center text-slate-600 hover:text-slate-950 transition-colors shadow-xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                #{booking.bookingCode}
              </h1>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-muted text-slate-400 hover:text-slate-700 transition-colors"
                title="Sao chép mã"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <StatusBadge status={booking.status} />

              {timeOfDay && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                    timeOfDay.badgeClass
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", timeOfDay.dotClass)} />
                  {timeOfDay.label}
                </span>
              )}

              {placeName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-muted text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-border/60">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span className="truncate max-w-[150px]">{placeName}</span>
                </span>
              )}

              <PaymentMethodBadge payment={booking.payment} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Thời gian khởi tạo: {formatDateTime(booking.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {isPending && (
            <>
              {canConfirm && (
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  disabled={actionLoading}
                  className="rounded-2xl px-4 text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground shadow-xs"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  {t("business.bookingDetail.confirm")}
                </Button>
              )}
              {canCancel && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setCancelOpen(true)}
                  disabled={actionLoading}
                  className="rounded-2xl px-4 text-xs font-bold bg-rose-600 text-white"
                >
                  {t("business.bookingDetail.cancel")}
                </Button>
              )}
            </>
          )}

          {isConfirmed && (
            <>
              {canComplete && (
                <Button
                  size="sm"
                  onClick={handleComplete}
                  disabled={actionLoading}
                  className="rounded-2xl px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  {t("business.bookingDetail.complete")}
                </Button>
              )}
              {canComplete && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNoShow}
                  disabled={actionLoading}
                  className="rounded-2xl px-3 text-xs font-bold border-slate-200"
                >
                  {t("business.bookingDetail.noShow")}
                </Button>
              )}
            </>
          )}

          {canMarkPaid && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMarkPaidOpen(true)}
              className="rounded-2xl px-3 text-xs font-bold border-slate-200"
            >
              Ghi nhận thanh toán
            </Button>
          )}

          {canRefund && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setRefundAmount(String(booking.finalPrice || ""));
                setRefundOpen(true);
              }}
              className="rounded-2xl px-3 text-xs font-bold text-rose-600 hover:bg-rose-50"
            >
              Hoàn tiền
            </Button>
          )}
        </div>
      </div>

      {/* ── Main 2-Column Bento Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BookingCustomerSummaryCard
            booking={booking}
            timeOfDay={timeOfDay}
            placeName={placeName}
          />
        </div>
        <div>
          <BookingQrCheckInCard booking={booking} qrCodeUrl={qrCodeUrl} />
        </div>
      </div>

      {/* ── Modals ── */}
      <BookingDetailModals
        cancelOpen={cancelOpen}
        setCancelOpen={setCancelOpen}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        onConfirmCancel={handleCancel}
        markPaidOpen={markPaidOpen}
        setMarkPaidOpen={setMarkPaidOpen}
        markPaidNote={markPaidNote}
        setMarkPaidNote={setMarkPaidNote}
        onConfirmMarkPaid={handleMarkPaid}
        refundOpen={refundOpen}
        setRefundOpen={setRefundOpen}
        refundReason={refundReason}
        setRefundReason={setRefundReason}
        refundAmount={refundAmount}
        setRefundAmount={setRefundAmount}
        refundMaxAmount={booking.finalPrice}
        onConfirmRefund={handleRefund}
        actionLoading={actionLoading}
      />
    </div>
  );
});

BookingDetailPage.displayName = "BookingDetailPage";
export default BookingDetailPage;
