import { memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import {
  ArrowLeft,
  Check,
  X,
  CheckCircle,
  AlertTriangle,
  QrCode,
  User,
  Ticket,
  DollarSign,
  Tag,
  Wallet,
  RotateCcw,
  Clock3,
  CreditCard,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import * as bookingApi from "@/apis/bookingService";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { BOOKING_STATUS } from "@/constants/constants";
import {
  StatusBadge,
} from "@/components/business/DashboardWidgets";
import {
  BusinessSectionCard,
} from "@/components/business/ui";
import {
  formatDate,
  formatDateTime,
  formatVND,
} from "@/components/business/dashboardWidgetHelpers";

// ─── OnlinePaymentInfo ─────────────────────────────────────────────────────────

const formatPaymentDateTime = (isoString) => {
  if (!isoString) return "—";
  try {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return "—";
  }
};

const getPaymentStatusConfig = (t) => ({
  paid: {
    label: t("business.bookingDetail.paid"),
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  unpaid: {
    label: t("business.bookingDetail.unpaid"),
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
    dot: "bg-yellow-500",
  },
  fully_refunded: {
    label: t("business.bookingDetail.refunded"),
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  partially_refunded: {
    label: t("business.bookingDetail.partialRefundLabel"),
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
});

const OnlinePaymentInfo = memo(({ payment }) => {
  const { t } = useTranslation();
  const status = payment?.status || "unpaid";
  const config = getPaymentStatusConfig(t)[status] || getPaymentStatusConfig(t).unpaid;
  const isPaid = status === "paid";

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-border/60">
        <CreditCard className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">{t("business.bookingDetail.onlinePayment")}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
        <div className="flex items-start justify-between gap-3 py-1.5">
          <span className="text-xs text-muted-foreground shrink-0">{t("business.bookingDetail.paymentMethod")}</span>
          <div className="flex items-center gap-1.5">
            {payment?.paymentMethod === "VNPAY" && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium px-2 py-0.5">
                VNPAY
              </Badge>
            )}
            {payment?.paymentMethod === "MOMO" && (
              <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200 text-xs font-medium px-2 py-0.5">
                MOMO
              </Badge>
            )}
            {!payment?.paymentMethod && (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        </div>

        <div className="flex items-start justify-between gap-3 py-1.5">
          <span className="text-xs text-muted-foreground shrink-0">{t("business.bookingDetail.transactionRef")}</span>
          <span className="text-xs font-mono font-medium text-foreground">
            {payment?.transactionRef || "—"}
          </span>
        </div>

        {isPaid && payment?.transactionId && (
          <div className="flex items-start justify-between gap-3 py-1.5">
            <span className="text-xs text-muted-foreground shrink-0">{t("business.bookingDetail.paymentGatewayCode")}</span>
            <span className="text-xs font-mono text-foreground">
              {payment.transactionId}
            </span>
          </div>
        )}

        {isPaid && payment?.bankCode && (
          <div className="flex items-start justify-between gap-3 py-1.5">
            <span className="text-xs text-muted-foreground shrink-0">{t("business.bookingDetail.bank")}</span>
            <span className="text-xs font-medium text-foreground uppercase">
              {payment.bankCode}
            </span>
          </div>
        )}

        <div className="flex items-start justify-between gap-3 py-1.5">
          <span className="text-xs text-muted-foreground shrink-0">{t("business.bookingDetail.time")}</span>
          <span className="text-xs text-foreground">
            {formatPaymentDateTime(payment?.paidAt)}
          </span>
        </div>

        <div className="flex items-start justify-between gap-3 py-1.5 col-span-2">
          <span className="text-xs text-muted-foreground shrink-0">{t("business.bookingDetail.statusLabel")}</span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
});
OnlinePaymentInfo.displayName = "OnlinePaymentInfo";

const InfoRow = memo(({ label, value, className }) => (
  <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border/50 last:border-0">
    <span className="text-xs text-muted-foreground shrink-0 w-32">{label}</span>
    <span
      className={`text-sm text-right font-medium text-foreground ${className || ""}`}
    >
      {value || "—"}
    </span>
  </div>
));
InfoRow.displayName = "InfoRow";

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const BookingDetailSkeleton = () => (
  <div className="space-y-6 p-6 lg:p-8">
    <div className="flex items-center gap-3">
      <Skeleton className="h-9 w-9 rounded-md" />
      <Skeleton className="h-8 w-60" />
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  </div>
);

// ─── Cancel Dialog ─────────────────────────────────────────────────────────────

const CancelDialog = ({ open, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">{t("business.bookingDetail.confirmDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("business.bookingDetail.confirmDialogDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>{t("business.bookingDetail.cancelReason")}</Label>
          <Textarea
            autoFocus
            placeholder={t("business.bookingDetail.cancelReasonPlaceholder")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("business.bookingDetail.back")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (reason.trim().length < 5) {
                toast.error(t("business.bookingDetail.reasonMinLength"));
                return;
              }
              onConfirm(reason.trim());
            }}
          >
            {t("business.bookingDetail.confirmCancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MarkPaidDialog = ({ open, onClose, onConfirm, loading }) => {
  const { t } = useTranslation();
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setNote(""));
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("business.bookingDetail.confirmPaymentTitle")}</DialogTitle>
          <DialogDescription>
            {t("business.bookingDetail.confirmPaymentDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>{t("business.bookingDetail.paymentNoteLabel")}</Label>
          <Textarea
            placeholder={t("business.bookingDetail.paymentNotePlaceholder")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("business.bookingDetail.back")}
          </Button>
          <Button onClick={() => onConfirm(note.trim())} loading={loading}>
            {t("business.bookingDetail.confirmPaidBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RefundDialog = ({ open, onClose, onConfirm, loading, maxAmount }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState(maxAmount || 0);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => {
        setReason("");
        setAmount(maxAmount || 0);
      });
      return () => cancelAnimationFrame(id);
    }
  }, [open, maxAmount]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">{t("business.bookingDetail.refundTitle")}</DialogTitle>
          <DialogDescription>
            {t("business.bookingDetail.refundDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label>{t("business.bookingDetail.refundAmountLabel")}</Label>
          <input
            type="number"
            min={1}
            max={maxAmount || undefined}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value || 0))}
            className="h-10 w-full rounded-md border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="text-[11px] text-muted-foreground">
            {t("business.bookingDetail.maxAmount")} {formatVND(maxAmount || 0)}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>{t("business.bookingDetail.refundReason")}</Label>
          <Textarea
            placeholder={t("business.bookingDetail.cancelReasonPlaceholder")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[90px]"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("business.bookingDetail.back")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (reason.trim().length < 5) {
                toast.error(t("business.bookingDetail.refundReasonMinLength"));
                return;
              }
              if (!amount || amount <= 0) {
                toast.error(t("business.bookingDetail.refundAmountZero"));
                return;
              }
              if (maxAmount && amount > maxAmount) {
                toast.error(t("business.bookingDetail.refundExceedsPayment"));
                return;
              }
              onConfirm({ reason: reason.trim(), amount });
            }}
            loading={loading}
          >
            {t("business.bookingDetail.confirmRefundBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PaymentTimeline = memo(({ booking }) => {
  const { t } = useTranslation();
  const paymentStatus = String(
    booking?.paymentStatus || "unpaid",
  ).toLowerCase();
  const paidAt = booking?.paidAt || booking?.payment?.paidAt;
  const refundedAt = booking?.refundedAt || booking?.payment?.refundedAt;
  const refundAmount =
    Number(booking?.refundAmount || booking?.payment?.refundAmount || 0) || 0;
  const totalAmount = Number(booking?.finalPrice || 0) || 0;
  const isPartialRefund =
    paymentStatus.includes("partial") ||
    (refundAmount > 0 && totalAmount > 0 && refundAmount < totalAmount);

  const events = [
    {
      key: "created",
      title: t("business.bookingDetail.timeline.created"),
      subtitle: t("business.bookingDetail.timelineSubtitle"),
      at: booking?.createdAt,
    },
  ];

  if (paidAt || paymentStatus === "paid") {
    events.push({
      key: "paid",
      title: t("business.bookingDetail.timeline.paid"),
      subtitle: t("business.bookingDetail.manualConfirmSubtitle"),
      at: paidAt,
    });
  }

  if (refundedAt || paymentStatus.includes("refund") || refundAmount > 0) {
    events.push({
      key: "refund",
      title: isPartialRefund ? t("business.bookingDetail.partialRefundLabel") : t("business.bookingDetail.timeline.refunded"),
      subtitle:
        refundAmount > 0 ? t("business.bookingDetail.refundValue", { amount: formatVND(refundAmount) }) : "",
      at: refundedAt,
    });
  }

  return (
    <div className="space-y-3">
      {events.map((event, index) => (
        <div key={event.key} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1" />
            {index < events.length - 1 && (
              <div className="mt-1 h-7 w-px bg-border" />
            )}
          </div>
          <div className="space-y-0.5 pb-2">
            <p className="text-sm font-medium text-foreground">{event.title}</p>
            {event.subtitle && (
              <p className="text-xs text-muted-foreground">{event.subtitle}</p>
            )}
            <p className="text-xs text-muted-foreground/80">
              {event.at ? formatDateTime(event.at) : t("business.bookingDetail.noTime")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
});
PaymentTimeline.displayName = "PaymentTimeline";

// ─── Main Page ────────────────────────────────────────────────────────────────

const BookingDetailPage = memo(() => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadBooking = useCallback(async () => {
    setLoading(true);
    try {
      const response = await bookingApi.getById(id);
      setBooking(response.data);
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.bookings.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadQR = useCallback(async () => {
    try {
      const response = await bookingApi.getQR(id);
      setQrCode(response.data?.qrCode);
    } catch {
      // QR may be unavailable for some booking states.
    }
  }, [id]);

  useEffect(() => {
    loadBooking();
    loadQR();
  }, [loadBooking, loadQR]);

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      await bookingApi.confirm(id);
      toast.success(t("business.bookings.confirmedSuccess"));
      await Promise.all([loadBooking(), loadQR()]);
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.bookings.cannotConfirm"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (reason) => {
    setActionLoading(true);
    try {
      await bookingApi.cancel(id, reason);
      toast.success(t("business.bookings.cancelledSuccess"));
      setCancelOpen(false);
      await loadBooking();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.bookings.cannotCancel"));
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

  const handleMarkPaid = async (note) => {
    setActionLoading(true);
    try {
      await bookingApi.markPaid(id, {
        note,
        paidAt: new Date().toISOString(),
      });
      toast.success(t("business.bookings.confirmedSuccess"));
      setMarkPaidOpen(false);
      await loadBooking();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.bookings.cannotConfirm"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async ({ reason, amount }) => {
    setActionLoading(true);
    try {
      await bookingApi.refund(id, {
        refundReason: reason,
        refundAmount: amount,
        refundedAt: new Date().toISOString(),
      });
      toast.success(t("business.bookings.completedSuccess"));
      setRefundOpen(false);
      await loadBooking();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.bookings.cannotComplete"));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <BookingDetailSkeleton />;

  if (!booking)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {t("business.bookingDetail.title")}
        </p>
        <Button
          variant="outline"
          onClick={() => navigate(BUSINESS_ROUTES.BOOKINGS)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> {t("common.back")}
        </Button>
      </div>
    );

  const isPending = booking.status === BOOKING_STATUS.PENDING;
  const isConfirmed = booking.status === BOOKING_STATUS.CONFIRMED;
  const paymentStatus = String(
    booking?.paymentStatus || "unpaid",
  ).toLowerCase();
  let paymentStatusLabel = t("business.bookingDetail.unpaid");
  if (paymentStatus === "paid") {
    paymentStatusLabel = t("business.bookingDetail.paid");
  } else if (paymentStatus.includes("refund")) {
    paymentStatusLabel = t("business.bookingDetail.refunded");
  }
  const canMarkPaid =
    paymentStatus !== "paid" && !paymentStatus.includes("refund");
  const canRefund = paymentStatus === "paid";

  return (
    <div className="space-y-4 p-4 md:space-y-6 md:p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => navigate(BUSINESS_ROUTES.BOOKINGS)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">
                #{booking.bookingCode}
              </h1>
              <StatusBadge status={booking.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("business.bookingDetail.createdAt", { time: formatDateTime(booking.createdAt) })}
            </p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0 flex-wrap">
          {isPending && (
            <>
              <Button
                onClick={handleConfirm}
                className="gap-2"
                disabled={actionLoading}
              >
                <Check className="h-4 w-4" />{" "}
                {actionLoading ? t("business.bookingDetail.processing") : t("business.bookingDetail.confirm")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setCancelOpen(true)}
                className="gap-2"
                disabled={actionLoading}
              >
                <X className="h-4 w-4" /> {t("business.bookingDetail.cancel")}
              </Button>
            </>
          )}
          {isConfirmed && (
            <>
              <Button
                onClick={handleComplete}
                className="gap-2"
                disabled={actionLoading}
              >
                <CheckCircle className="h-4 w-4" />{" "}
                {actionLoading ? t("business.bookingDetail.processing") : t("business.bookingDetail.complete")}
              </Button>
              <Button
                variant="outline"
                onClick={handleNoShow}
                className="gap-2"
                disabled={actionLoading}
              >
                <AlertTriangle className="h-4 w-4" /> {t("business.bookingDetail.noShow")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Layout 2 cột */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: info columns */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Info */}
          <BusinessSectionCard title={t("business.bookingDetail.customerInfo")} titleIcon={User}>
            <InfoRow
              label={t("business.bookingDetail.customerName")}
              value={booking.user?.fullName || booking.guestName}
            />
            <InfoRow
              label={t("business.bookingDetail.customerEmail")}
              value={booking.user?.email || booking.guestEmail}
            />
            <InfoRow
              label={t("business.bookingDetail.customerPhone")}
              value={booking.user?.phone || booking.guestPhone}
            />
          </BusinessSectionCard>

          {/* Service & Booking Info */}
          <BusinessSectionCard title={t("business.bookingDetail.bookingDetails")} titleIcon={Ticket}>
            <InfoRow label={t("business.bookingDetail.service")} value={booking.service?.name} />
            <InfoRow label={t("business.bookingDetail.place")} value={booking.service?.place?.name} />
            <InfoRow
              label={t("business.bookingDetail.usageDate")}
              value={formatDate(booking.useDate || booking.bookingDate)}
            />
            <InfoRow label={t("business.bookingDetail.quantity")} value={booking.quantity || 1} />
            {booking.note && <InfoRow label={t("business.bookingDetail.notes")} value={booking.note} />}
          </BusinessSectionCard>

          {/* Payment */}
          {booking.payment ? (
            <OnlinePaymentInfo payment={booking.payment} />
          ) : (
            <BusinessSectionCard title={t("business.bookingDetail.payment")} titleIcon={DollarSign}>
              <InfoRow label={t("business.bookingDetail.originalPrice")} value={formatVND(booking.originalPrice)} />
              {booking.discountAmount > 0 && (
                <InfoRow
                  label={t("business.bookingDetail.discount")}
                  value={`-${formatVND(booking.discountAmount)}`}
                  className="text-emerald-600"
                />
              )}
              <InfoRow
                label={t("business.bookingDetail.finalAmount")}
                value={formatVND(booking.finalPrice)}
                className="text-lg font-bold"
              />
              {booking.commissionAmount > 0 && (
                <InfoRow
                  label={t("business.bookingDetail.systemCommission")}
                  value={`-${formatVND(booking.commissionAmount)}`}
                  className="text-rose-600"
                />
              )}
              {booking.cancelReason && (
                <InfoRow
                  label={t("business.bookingDetail.cancelReasonLabel")}
                  value={booking.cancelReason}
                  className="text-destructive"
                />
              )}
            </BusinessSectionCard>
          )}
        </div>

        {/* Right: Action panel + QR + Voucher */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <BusinessSectionCard title={t("business.bookingDetail.manualPayment")} titleIcon={Wallet}>
            <div className="space-y-3">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  {t("business.bookingDetail.paymentStatus")}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground uppercase">
                  {paymentStatusLabel}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setMarkPaidOpen(true)}
                  disabled={!canMarkPaid || actionLoading}
                >
                  <CheckCircle className="h-4 w-4" />
                  {t("business.bookingDetail.confirmPaymentBtn")}
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1.5"
                  onClick={() => setRefundOpen(true)}
                  disabled={!canRefund || actionLoading}
                >
                  <RotateCcw className="h-4 w-4" />
                  {t("business.bookingDetail.refundBtn")}
                </Button>
              </div>
            </div>
          </BusinessSectionCard>

          <BusinessSectionCard title={t("business.bookingDetail.paymentTimeline")} titleIcon={Clock3}>
            <PaymentTimeline booking={booking} />
          </BusinessSectionCard>

          {/* QR Code */}
          {qrCode && (
            <BusinessSectionCard title={t("business.bookingDetail.qrCode")} titleIcon={QrCode}>
              <div className="flex justify-center p-2">
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="w-44 h-44 rounded-lg"
                />
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                {t("business.bookingDetail.qrCodePresent")}
              </p>
            </BusinessSectionCard>
          )}

          {/* Voucher */}
          {booking.voucher && (
            <BusinessSectionCard title={t("business.bookingDetail.voucherApplied")} titleIcon={Tag}>
              <div className="text-center py-2">
                <span className="font-mono font-bold text-lg tracking-widest bg-muted px-3 py-1 rounded-md">
                  {booking.voucher.code}
                </span>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("business.bookingDetail.voucherDiscount")}{" "}
                  <span className="font-semibold text-emerald-600">
                    {booking.voucher.discountType === "percentage"
                      ? `${booking.voucher.discountValue}%`
                      : formatVND(booking.voucher.discountValue)}
                  </span>
                </p>
              </div>
            </BusinessSectionCard>
          )}
        </div>
      </div>

      <CancelDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
      />

      <MarkPaidDialog
        open={markPaidOpen}
        onClose={() => setMarkPaidOpen(false)}
        onConfirm={handleMarkPaid}
        loading={actionLoading}
      />

      <RefundDialog
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        onConfirm={handleRefund}
        loading={actionLoading}
        maxAmount={Number(booking?.finalPrice || 0)}
      />
    </div>
  );
});

BookingDetailPage.displayName = "BookingDetailPage";

export default BookingDetailPage;
