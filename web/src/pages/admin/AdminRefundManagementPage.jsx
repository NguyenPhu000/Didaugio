import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Doughnut } from "react-chartjs-2";
import "@/lib/chartSetup";
import {
  IconCheck,
  IconClock,
  IconEye,
  IconLoader2,
  IconRefresh,
  IconSearch,
  IconWallet,
} from "@tabler/icons-react";
import paymentService from "@/apis/paymentService";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/animate-ui/primitives/radix/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN").format(Number(amount) || 0) + "đ";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const GATEWAY_CONFIG = {
  VNPAY: { label: "VNPAY", color: "bg-blue-100 text-blue-700 border-blue-200" },
  MOMO: { label: "MoMo", color: "bg-pink-100 text-pink-700 border-pink-200" },
  manual: {
    label: "Thủ công",
    color: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

const STATUS_CONFIG = {
  paid: {
    label: "Chờ xử lý",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  partially_refunded: {
    label: "Hoàn một phần",
    className: "bg-sky-100 text-sky-800 border-sky-200",
  },
  fully_refunded: {
    label: "Đã hoàn tiền",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  rejected: {
    label: "Đã từ chối",
    className: "bg-rose-100 text-rose-800 border-rose-200",
  },
};

function getPaymentStatus(payment) {
  if (payment?.refundReason?.startsWith("REJECTED:")) return "rejected";
  return payment?.status || "paid";
}

function getGatewayBadge(paymentMethod) {
  return (
    GATEWAY_CONFIG[paymentMethod] || {
      label: paymentMethod || "-",
      color: "bg-gray-100 text-gray-700 border-gray-200",
    }
  );
}

function buildTimeline(payment) {
  const rejectedReason = payment?.refundReason?.startsWith("REJECTED:")
    ? payment.refundReason.replace(/^REJECTED:/, "").trim()
    : null;

  const items = [
    {
      key: "created",
      title: "Tạo giao dịch",
      date: payment?.createdAt,
      tone: "bg-slate-400",
      description: payment?.transactionRef || "Khởi tạo thanh toán",
    },
  ];

  if (payment?.paidAt) {
    items.push({
      key: "paid",
      title: "Thanh toán thành công",
      date: payment.paidAt,
      tone: "bg-emerald-500",
      description: `${formatCurrency(payment.amount)} qua ${payment.paymentMethod || "cổng thanh toán"}`,
    });
  }

  if (rejectedReason) {
    items.push({
      key: "rejected",
      title: "Từ chối hoàn tiền",
      date: payment.updatedAt,
      tone: "bg-rose-500",
      description: rejectedReason,
    });
  }

  if (payment?.refundedAt) {
    items.push({
      key: "refunded",
      title:
        payment.status === "partially_refunded"
          ? "Hoàn tiền một phần"
          : "Hoàn tiền toàn phần",
      date: payment.refundedAt,
      tone: "bg-blue-500",
      description: `${formatCurrency(payment.refundAmount)}${payment.refundReason ? ` - ${payment.refundReason}` : ""}`,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ title, value, icon: Icon, tone = "default", subtitle }) {
  const toneMap = {
    danger: { iconBg: "bg-rose-50 dark:bg-rose-950/30 text-rose-500" },
    warning: { iconBg: "bg-amber-50 dark:bg-amber-950/30 text-amber-500" },
    success: { iconBg: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500" },
    default: { iconBg: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400" },
  };
  const config = toneMap[tone] || toneMap.default;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className={cn("p-3 rounded-xl shrink-0", config.iconBg)}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RefundActionDialog({
  open,
  onOpenChange,
  selectedPayment,
  dialogTab,
  setDialogTab,
  refundAmount,
  setRefundAmount,
  refundReason,
  setRefundReason,
  actionLoading,
  onApprove,
  onReject,
}) {
  const paymentAmount = selectedPayment?.amount || 0;
  const alreadyRefunded = selectedPayment?.refundAmount || 0;
  const refundableAmount = Math.max(paymentAmount - alreadyRefunded, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Xử lý yêu cầu hoàn tiền</DialogTitle>
          <DialogDescription>
            Duyệt hoàn tiền toàn phần/một phần hoặc từ chối yêu cầu hoàn tiền.
          </DialogDescription>
        </DialogHeader>

        {selectedPayment ? (
          <div className="space-y-5">
            <div className="grid gap-3 rounded-xl border bg-muted/40 p-4 text-sm md:grid-cols-2">
              <div>
                <div className="text-muted-foreground">Mã đơn</div>
                <div className="font-mono font-semibold">
                  #{selectedPayment.booking?.bookingCode || "-"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Khách hàng</div>
                <div className="font-medium">
                  {selectedPayment.booking?.user?.profile?.fullName ||
                    selectedPayment.booking?.guestName ||
                    "-"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Tổng thanh toán</div>
                <div className="font-semibold text-foreground">
                  {formatCurrency(paymentAmount)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Còn có thể hoàn</div>
                <div className="font-semibold text-emerald-600">
                  {formatCurrency(refundableAmount)}
                </div>
              </div>
            </div>

            {/* Sub-tabs: Approve / Reject */}
            <div className="inline-flex rounded-lg border bg-muted p-1">
              <button
                type="button"
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition",
                  dialogTab === "approve"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setDialogTab("approve")}
              >
                Duyệt Hoàn Tiền
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition",
                  dialogTab === "reject"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setDialogTab("reject")}
              >
                Từ Chối
              </button>
            </div>

            {dialogTab === "approve" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="refund-amount">Số tiền hoàn</Label>
                  <Input
                    id="refund-amount"
                    type="number"
                    min={1}
                    max={refundableAmount || paymentAmount}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="Nhập số tiền cần hoàn"
                  />
                  <p className="text-xs text-muted-foreground">
                    Để trống sẽ hoàn toàn bộ phần còn lại. Đã hoàn trước đó:{" "}
                    {formatCurrency(alreadyRefunded)}.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refund-reason">Lý do hoàn tiền</Label>
                  <Textarea
                    id="refund-reason"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Nhập lý do hoàn tiền"
                    className="min-h-[110px]"
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={actionLoading}
                  >
                    Đóng
                  </Button>
                  <Button onClick={onApprove} disabled={actionLoading}>
                    {actionLoading ? (
                      <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Xác nhận hoàn tiền
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  Khi từ chối, hệ thống sẽ lưu lý do để hiển thị trong lịch sử
                  xử lý hoàn tiền.
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reject-reason">Lý do từ chối</Label>
                  <Textarea
                    id="reject-reason"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Nhập lý do từ chối hoàn tiền"
                    className="min-h-[110px]"
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={actionLoading}
                  >
                    Đóng
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={onReject}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Từ chối yêu cầu
                  </Button>
                </DialogFooter>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PaymentDetailDrawer({ open, onOpenChange, payment }) {
  const timeline = useMemo(() => buildTimeline(payment), [payment]);

  if (!open || !payment?.id) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="z-[60] bg-black/40"
        style={{ width: "min(100vw, 500px)" }}
      >
        <div className="flex h-full flex-col bg-background shadow-2xl">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>Chi tiết giao dịch</SheetTitle>
            <SheetDescription>
              Theo dõi thông tin booking, thanh toán và lịch sử xử lý hoàn tiền.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {/* Booking info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thông tin booking</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Mã booking</div>
                  <div className="font-mono font-semibold">
                    #{payment?.booking?.bookingCode || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Khách hàng</div>
                  <div className="font-medium">
                    {payment?.booking?.user?.profile?.fullName ||
                      payment?.booking?.guestName ||
                      "-"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Dịch vụ</div>
                  <div className="font-medium">
                    {payment?.booking?.service?.name || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Doanh nghiệp</div>
                  <div className="font-medium">
                    {payment?.booking?.service?.place?.business?.businessName ||
                      payment?.booking?.service?.place?.business?.name ||
                      "-"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Ngày sử dụng</div>
                  <div>
                    {formatDate(
                      payment?.booking?.bookingDate ||
                        payment?.booking?.useDate,
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Thông tin thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Phương thức</span>
                  <Badge
                    variant="outline"
                    className={getGatewayBadge(payment?.paymentMethod).color}
                  >
                    {getGatewayBadge(payment?.paymentMethod).label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Số tiền</span>
                  <span className="font-semibold">
                    {formatCurrency(payment?.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Đã hoàn</span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(payment?.refundAmount)}
                  </span>
                </div>
                <div>
                  <div className="text-muted-foreground">Mã giao dịch</div>
                  <div className="font-mono text-xs">
                    {payment?.transactionRef || payment?.transactionId || "-"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dòng thời gian</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeline.map((item, index) => (
                    <div key={item.key} className="relative flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={cn("mt-1 h-3 w-3 rounded-full", item.tone)}
                        />
                        {index < timeline.length - 1 ? (
                          <span className="mt-1 h-full w-px bg-border" />
                        ) : null}
                      </div>
                      <div className="pb-4">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(item.date)}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminRefundManagementPage() {
  // -- data state --
  const [activeTab, setActiveTab] = useState("pending");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  // -- filter state --
  const [gateway, setGateway] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // -- dialog / drawer state --
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [dialogTab, setDialogTab] = useState("approve");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPayment, setDrawerPayment] = useState(null);

  // -- debounce search --
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // -- fetch --
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);

      const isPending = activeTab === "pending";
      const params = {
        page: 1,
        limit: 100,
        status: isPending
          ? "paid"
          : "fully_refunded,partially_refunded,rejected",
        gateway: gateway !== "all" ? gateway : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      // Smart search: exact bookingCode if starts with DDG_BKG_
      const trimmedSearch = debouncedSearch.trim();
      if (trimmedSearch) {
        if (trimmedSearch.toUpperCase().startsWith("DDG_BKG_")) {
          params.bookingCode = trimmedSearch;
        } else {
          params.search = trimmedSearch;
        }
      }

      const response = await paymentService.getAdminPayments(params);
      const allPayments = response?.data?.data || [];

      // Frontend filter for pending tab: exclude REJECTED: prefix
      const normalized = isPending
        ? allPayments.filter((p) => getPaymentStatus(p) === "paid")
        : allPayments;

      setPayments(normalized);
    } catch (error) {
      setPayments([]);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể tải danh sách thanh toán",
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, gateway, debouncedSearch, startDate, endDate]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // -- stats derived from current tab's list --
  const stats = useMemo(() => {
    let pendingCount = 0;
    let processedCount = 0;
    let pendingAmount = 0;
    let refundedAmount = 0;

    if (activeTab === "pending") {
      pendingCount = payments.length;
      payments.forEach((p) => {
        pendingAmount += Number(p.amount) || 0;
      });
    } else {
      processedCount = payments.length;
      payments.forEach((p) => {
        refundedAmount += Number(p.refundAmount) || 0;
      });
    }

    return {
      pending: pendingCount,
      refunded: processedCount,
      pendingAmount,
      refundedAmount,
    };
  }, [payments, activeTab]);

  const gatewayChartData = useMemo(() => {
    const counts = { VNPAY: 0, MOMO: 0, manual: 0 };
    payments.forEach((p) => {
      const method = p.paymentMethod || "manual";
      if (counts[method] !== undefined) {
        counts[method]++;
      } else {
        counts.manual++;
      }
    });

    return {
      labels: ["VNPAY", "MoMo", "Thủ công"],
      datasets: [
        {
          data: [counts.VNPAY, counts.MOMO, counts.manual],
          backgroundColor: ["#3b82f6", "#ec4899", "#6b7280"],
        },
      ],
    };
  }, [payments]);

  const statusChartData = useMemo(() => {
    const counts = { paid: 0, partially_refunded: 0, fully_refunded: 0, rejected: 0 };
    payments.forEach((p) => {
      const status = getPaymentStatus(p);
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });

    return {
      labels: ["Chờ xử lý", "Hoàn một phần", "Đã hoàn tiền", "Đã từ chối"],
      datasets: [
        {
          data: [counts.paid, counts.partially_refunded, counts.fully_refunded, counts.rejected],
          backgroundColor: ["#f59e0b", "#0ea5e9", "#10b981", "#f43f5e"],
        },
      ],
    };
  }, [payments]);

  // -- reset refundReason when dialogTab changes --
  useEffect(() => {
    setRefundReason("");
  }, [dialogTab]);

  // -- dialog handlers --
  const openActionDialog = useCallback((payment, nextTab = "approve") => {
    setSelectedPayment(payment);
    setDialogTab(nextTab);
    setRefundAmount(
      String(
        Math.max((payment?.amount || 0) - (payment?.refundAmount || 0), 0) ||
          "",
      ),
    );
    setRefundReason("");
    setDialogOpen(true);
  }, []);

  const openDrawer = useCallback(async (payment) => {
    try {
      setDrawerPayment(payment);
      setDrawerOpen(true);
      const response = await paymentService.getById(payment.id);
      setDrawerPayment(response?.data?.data || payment);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể tải chi tiết giao dịch",
      );
    }
  }, []);

  const handleApproveRefund = useCallback(async () => {
    if (!selectedPayment?.id) return;

    const amount = Number(refundAmount);
    const paymentAmount = selectedPayment?.amount || 0;
    const alreadyRefunded = selectedPayment?.refundAmount || 0;
    const refundableAmount = Math.max(paymentAmount - alreadyRefunded, 0);

    if (refundAmount && (Number.isNaN(amount) || amount <= 0)) {
      toast.error("Số tiền hoàn phải lớn hơn 0");
      return;
    }
    if (refundAmount && amount > refundableAmount) {
      toast.error(
        `Số tiền hoàn không được vượt quá ${formatCurrency(refundableAmount)}`,
      );
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        amount: refundAmount ? Number(refundAmount) : undefined,
        reason: refundReason.trim() || undefined,
      };
      await paymentService.refund(selectedPayment.id, payload);
      toast.success("Hoàn tiền thành công");
      setDialogOpen(false);
      await fetchPayments();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể hoàn tiền",
      );
    } finally {
      setActionLoading(false);
    }
  }, [fetchPayments, refundAmount, refundReason, selectedPayment]);

  const handleRejectRefund = useCallback(async () => {
    if (!selectedPayment?.id) return;
    if (refundReason.trim().length < 5) {
      toast.error("Lý do từ chối phải có ít nhất 5 ký tự");
      return;
    }
    try {
      setActionLoading(true);
      await paymentService.rejectRefund(selectedPayment.id, {
        reason: refundReason.trim(),
      });
      toast.success("Từ chối yêu cầu hoàn tiền thành công");
      setDialogOpen(false);
      await fetchPayments();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể từ chối yêu cầu hoàn tiền",
      );
    } finally {
      setActionLoading(false);
    }
  }, [fetchPayments, refundReason, selectedPayment]);

  // -- render helpers --
  const renderTable = (isPendingTab) => {
    if (loading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      );
    }

    if (payments.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <IconWallet className="h-10 w-10 text-muted-foreground" />
          <div>
            <div className="font-medium">Không có dữ liệu phù hợp</div>
            <div className="text-sm text-muted-foreground">
              {isPendingTab
                ? "Hiện không có giao dịch nào đang chờ xử lý hoàn tiền."
                : "Chưa có giao dịch nào trong nhật ký đối soát."}
            </div>
          </div>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã đơn</TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Doanh nghiệp</TableHead>
            <TableHead>Số tiền</TableHead>
            <TableHead>Cổng</TableHead>
            <TableHead>Ngày hủy</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => {
            const gatewayBadge = getGatewayBadge(payment.paymentMethod);
            const derivedStatus = getPaymentStatus(payment);
            const statusConfig =
              STATUS_CONFIG[derivedStatus] || STATUS_CONFIG.paid;

            return (
              <TableRow key={payment.id}>
                <TableCell>
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => openDrawer(payment)}
                  >
                    <div className="font-mono font-semibold text-primary">
                      #{payment.booking?.bookingCode || "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {payment.transactionRef ||
                        payment.transactionId ||
                        "Không có mã GD"}
                    </div>
                  </button>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {payment.booking?.user?.profile?.fullName ||
                      payment.booking?.guestName ||
                      "-"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {payment.booking?.user?.profile?.phone ||
                      payment.booking?.user?.email ||
                      "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {payment.booking?.service?.place?.business?.businessName ||
                      payment.booking?.service?.place?.business?.name ||
                      "-"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {payment.booking?.service?.place?.name || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold">
                    {formatCurrency(payment.amount)}
                  </div>
                  {payment.refundAmount ? (
                    <div className="text-xs text-blue-600">
                      Đã hoàn: {formatCurrency(payment.refundAmount)}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={gatewayBadge.color}>
                    {gatewayBadge.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatDate(
                    payment.cancelledAt || payment.updatedAt || payment.createdAt,
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusConfig.className}>
                    {statusConfig.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {isPendingTab ? (
                    <Button
                      size="sm"
                      onClick={() => openActionDialog(payment, "approve")}
                    >
                      Xử lý
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDrawer(payment)}
                    >
                      <IconEye className="mr-1 h-4 w-4" />
                      Xem
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  // -- JSX --
  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Quản lý hoàn tiền
          </h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi yêu cầu hoàn tiền, duyệt/từ chối và xem nhật ký đối soát.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={fetchPayments}
          disabled={loading}
        >
          {loading ? (
            <IconLoader2 className="h-4 w-4 animate-spin" />
          ) : (
            <IconRefresh className="h-4 w-4" />
          )}
          Tải lại
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Đơn chờ xử lý"
          value={stats.pending}
          icon={IconClock}
          tone="warning"
          subtitle="Yêu cầu chờ hoàn"
        />
        <StatCard
          title="Đã xử lý (hoàn/từ chối)"
          value={stats.refunded}
          icon={IconCheck}
          tone="success"
          subtitle="Đơn đã đối soát"
        />
        <StatCard
          title="Tổng tiền chờ hoàn"
          value={formatCurrency(stats.pendingAmount)}
          icon={IconWallet}
          tone="warning"
          subtitle="Số tiền cần hoàn"
        />
        <StatCard
          title="Tổng tiền đã hoàn"
          value={formatCurrency(stats.refundedAmount)}
          icon={IconCheck}
          tone="success"
          subtitle="Số tiền đã hoàn"
        />
      </div>

      {/* Charts Row */}
      {!loading && payments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <IconWallet className="h-4 w-4" /> Tỷ lệ cổng thanh toán sử dụng
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64 pt-4 flex items-center justify-center">
              <Doughnut
                data={gatewayChartData}
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

          <Card>
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <IconClock className="h-4 w-4" /> Cơ cấu trạng thái hoàn tiền
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64 pt-4 flex items-center justify-center">
              <Doughnut
                data={statusChartData}
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
        </div>
      )}

      {/* Tabs + Filters + Table */}
      <Card>
        <CardHeader className="gap-4">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v);
              setPayments([]);
            }}
          >
            <TabsList>
              <TabsTrigger value="pending">Yêu cầu chờ xử lý</TabsTrigger>
              <TabsTrigger value="history">Nhật ký đối soát</TabsTrigger>
            </TabsList>

            {/* Filters bar */}
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="relative xl:col-span-2">
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm theo mã đơn, khách hàng, doanh nghiệp..."
                  className="pl-9"
                />
              </div>

              <Select value={gateway} onValueChange={setGateway}>
                <SelectTrigger>
                  <SelectValue placeholder="Cổng thanh toán" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="VNPAY">VNPAY</SelectItem>
                  <SelectItem value="MOMO">MOMO</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Từ ngày"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Đến ngày"
              />
            </div>

            {/* Tab contents */}
            <TabsContent value="pending">
              <CardContent className="px-0 pt-4">
                {renderTable(true)}
              </CardContent>
            </TabsContent>

            <TabsContent value="history">
              <CardContent className="px-0 pt-4">
                {renderTable(false)}
              </CardContent>
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Dialog */}
      <RefundActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedPayment={selectedPayment}
        dialogTab={dialogTab}
        setDialogTab={setDialogTab}
        refundAmount={refundAmount}
        setRefundAmount={setRefundAmount}
        refundReason={refundReason}
        setRefundReason={setRefundReason}
        actionLoading={actionLoading}
        onApprove={handleApproveRefund}
        onReject={handleRejectRefund}
      />

      {/* Drawer */}
      <PaymentDetailDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setDrawerPayment(null);
        }}
        payment={drawerPayment}
      />
    </div>
  );
}
