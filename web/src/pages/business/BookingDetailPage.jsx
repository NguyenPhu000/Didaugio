import { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";
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
  SectionCard,
  StatusBadge,
} from "@/components/business/DashboardWidgets";
import {
  formatDate,
  formatDateTime,
  formatVND,
} from "@/components/business/dashboardWidgetHelpers";

// ─── Info Row ─────────────────────────────────────────────────────────────────

const InfoRow = ({ label, value, className }) => (
  <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border/50 last:border-0">
    <span className="text-xs text-muted-foreground shrink-0 w-32">{label}</span>
    <span
      className={`text-sm text-right font-medium text-foreground ${className || ""}`}
    >
      {value || "—"}
    </span>
  </div>
);

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
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Hủy đặt chỗ</DialogTitle>
          <DialogDescription>
            Vui lòng nhập lý do hủy (ít nhất 5 ký tự).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Lý do hủy</Label>
          <Textarea
            autoFocus
            placeholder="Nhập lý do..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Quay lại
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (reason.trim().length < 5) {
                toast.error("Lý do cần ít nhất 5 ký tự");
                return;
              }
              onConfirm(reason.trim());
            }}
          >
            Xác nhận hủy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MarkPaidDialog = ({ open, onClose, onConfirm, loading }) => {
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
          <DialogTitle>Xác nhận thanh toán</DialogTitle>
          <DialogDescription>
            Đánh dấu booking đã thanh toán thủ công.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Ghi chú (tuỳ chọn)</Label>
          <Textarea
            placeholder="Ví dụ: Khách đã chuyển khoản"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Quay lại
          </Button>
          <Button onClick={() => onConfirm(note.trim())} loading={loading}>
            Xác nhận đã thanh toán
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RefundDialog = ({ open, onClose, onConfirm, loading, maxAmount }) => {
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
          <DialogTitle className="text-destructive">Hoàn tiền</DialogTitle>
          <DialogDescription>
            Nhập số tiền hoàn và lý do để lưu lại lịch sử giao dịch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label>Số tiền hoàn (VND)</Label>
          <input
            type="number"
            min={1}
            max={maxAmount || undefined}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value || 0))}
            className="h-10 w-full rounded-md border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="text-[11px] text-muted-foreground">
            Tối đa: {formatVND(maxAmount || 0)}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Lý do hoàn tiền</Label>
          <Textarea
            placeholder="Nhập lý do..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[90px]"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Quay lại
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (reason.trim().length < 5) {
                toast.error("Lý do hoàn tiền cần ít nhất 5 ký tự");
                return;
              }
              if (!amount || amount <= 0) {
                toast.error("Số tiền hoàn phải lớn hơn 0");
                return;
              }
              if (maxAmount && amount > maxAmount) {
                toast.error("Số tiền hoàn vượt quá giá trị thanh toán");
                return;
              }
              onConfirm({ reason: reason.trim(), amount });
            }}
            loading={loading}
          >
            Xác nhận hoàn tiền
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PaymentTimeline = ({ booking }) => {
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
      title: "Tạo đặt chỗ",
      subtitle: "Booking được khởi tạo",
      at: booking?.createdAt,
    },
  ];

  if (paidAt || paymentStatus === "paid") {
    events.push({
      key: "paid",
      title: "Đã thanh toán",
      subtitle: "Xác nhận thanh toán thủ công",
      at: paidAt,
    });
  }

  if (refundedAt || paymentStatus.includes("refund") || refundAmount > 0) {
    events.push({
      key: "refund",
      title: isPartialRefund ? "Hoàn tiền một phần" : "Đã hoàn tiền",
      subtitle:
        refundAmount > 0 ? `Giá trị hoàn: ${formatVND(refundAmount)}` : "",
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
              {event.at ? formatDateTime(event.at) : "Chưa có thời gian"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const BookingDetailPage = () => {
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
      toastApiErrorIfNeeded(error, "Không thể tải thông tin đặt chỗ");
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
      toast.success("Xác nhận thành công");
      await Promise.all([loadBooking(), loadQR()]);
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể xác nhận");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (reason) => {
    setActionLoading(true);
    try {
      await bookingApi.cancel(id, reason);
      toast.success("Hủy thành công");
      setCancelOpen(false);
      await loadBooking();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể hủy");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await bookingApi.complete(id);
      toast.success("Hoàn thành đặt chỗ");
      await loadBooking();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể hoàn thành");
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoShow = async () => {
    setActionLoading(true);
    try {
      await bookingApi.markNoShow(id);
      toast.success("Đánh dấu không đến");
      await loadBooking();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể đánh dấu");
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
      toast.success("Đã cập nhật trạng thái thanh toán");
      setMarkPaidOpen(false);
      await loadBooking();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể xác nhận thanh toán");
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
      toast.success("Đã xử lý hoàn tiền");
      setRefundOpen(false);
      await loadBooking();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể hoàn tiền");
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
          Đặt chỗ không tồn tại hoặc đã bị xóa
        </p>
        <Button
          variant="outline"
          onClick={() => navigate(BUSINESS_ROUTES.BOOKINGS)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại danh sách
        </Button>
      </div>
    );

  const isPending = booking.status === BOOKING_STATUS.PENDING;
  const isConfirmed = booking.status === BOOKING_STATUS.CONFIRMED;
  const paymentStatus = String(
    booking?.paymentStatus || "unpaid",
  ).toLowerCase();
  let paymentStatusLabel = "Chưa thanh toán";
  if (paymentStatus === "paid") {
    paymentStatusLabel = "Đã thanh toán";
  } else if (paymentStatus.includes("refund")) {
    paymentStatusLabel = "Đã hoàn tiền";
  }
  const canMarkPaid =
    paymentStatus !== "paid" && !paymentStatus.includes("refund");
  const canRefund = paymentStatus === "paid";

  return (
    <div className="space-y-6 p-6 lg:p-8 min-h-screen">
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
              Tạo lúc {formatDateTime(booking.createdAt)}
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
                {actionLoading ? "Đang xử lý..." : "Xác nhận"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setCancelOpen(true)}
                className="gap-2"
                disabled={actionLoading}
              >
                <X className="h-4 w-4" /> Hủy đặt chỗ
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
                {actionLoading ? "Đang xử lý..." : "Hoàn thành"}
              </Button>
              <Button
                variant="outline"
                onClick={handleNoShow}
                className="gap-2"
                disabled={actionLoading}
              >
                <AlertTriangle className="h-4 w-4" /> Không đến
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
          <SectionCard title="Thông tin khách hàng" titleIcon={User}>
            <InfoRow
              label="Họ tên"
              value={booking.user?.fullName || booking.guestName}
            />
            <InfoRow
              label="Email"
              value={booking.user?.email || booking.guestEmail}
            />
            <InfoRow
              label="Số điện thoại"
              value={booking.user?.phone || booking.guestPhone}
            />
          </SectionCard>

          {/* Service & Booking Info */}
          <SectionCard title="Chi tiết đặt chỗ" titleIcon={Ticket}>
            <InfoRow label="Dịch vụ" value={booking.service?.name} />
            <InfoRow label="Địa điểm" value={booking.service?.place?.name} />
            <InfoRow
              label="Ngày sử dụng"
              value={formatDate(booking.useDate || booking.bookingDate)}
            />
            <InfoRow label="Số lượng" value={booking.quantity || 1} />
            {booking.note && <InfoRow label="Ghi chú" value={booking.note} />}
          </SectionCard>

          {/* Payment */}
          <SectionCard title="Thanh toán" titleIcon={DollarSign}>
            <InfoRow label="Giá gốc" value={formatVND(booking.originalPrice)} />
            {booking.discountAmount > 0 && (
              <InfoRow
                label="Giảm giá"
                value={`-${formatVND(booking.discountAmount)}`}
                className="text-emerald-600"
              />
            )}
            <InfoRow
              label="Thành tiền"
              value={formatVND(booking.finalPrice)}
              className="text-lg font-bold"
            />
            {booking.commissionAmount > 0 && (
              <InfoRow
                label="Hoa hồng hệ thống"
                value={`-${formatVND(booking.commissionAmount)}`}
                className="text-rose-600"
              />
            )}
            {booking.cancelReason && (
              <InfoRow
                label="Lý do hủy"
                value={booking.cancelReason}
                className="text-destructive"
              />
            )}
          </SectionCard>
        </div>

        {/* Right: Action panel + QR + Voucher */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <SectionCard title="Thanh toán thủ công" titleIcon={Wallet}>
            <div className="space-y-3">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Trạng thái thanh toán
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
                  Xác nhận thanh toán
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1.5"
                  onClick={() => setRefundOpen(true)}
                  disabled={!canRefund || actionLoading}
                >
                  <RotateCcw className="h-4 w-4" />
                  Hoàn tiền
                </Button>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Timeline thanh toán" titleIcon={Clock3}>
            <PaymentTimeline booking={booking} />
          </SectionCard>

          {/* QR Code */}
          {qrCode && (
            <SectionCard title="Mã QR xác nhận" titleIcon={QrCode}>
              <div className="flex justify-center p-2">
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="w-44 h-44 rounded-lg"
                />
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Khách hàng xuất trình mã này khi đến
              </p>
            </SectionCard>
          )}

          {/* Voucher */}
          {booking.voucher && (
            <SectionCard title="Voucher áp dụng" titleIcon={Tag}>
              <div className="text-center py-2">
                <span className="font-mono font-bold text-lg tracking-widest bg-muted px-3 py-1 rounded-md">
                  {booking.voucher.code}
                </span>
                <p className="text-sm text-muted-foreground mt-2">
                  Giảm{" "}
                  <span className="font-semibold text-emerald-600">
                    {booking.voucher.discountType === "percentage"
                      ? `${booking.voucher.discountValue}%`
                      : formatVND(booking.voucher.discountValue)}
                  </span>
                </p>
              </div>
            </SectionCard>
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
};

export default BookingDetailPage;
