// MAP: AdminRefundManagementPage
// ├── UI: @/components/admin/refunds/{RefundMetricsSummary, RefundQueueTable, RefundReviewModal, RefundAuditInspector}
// └── API: @/apis/paymentService

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import paymentService from "@/apis/paymentService";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { formatMoney } from "@/utils/formatters";

// Extracted Sub-Components & Constants
import { getPaymentStatus } from "@/components/admin/refunds/refundConstants";
import RefundStatCards from "@/components/admin/refunds/RefundStatCards";
import RefundChartsSection from "@/components/admin/refunds/RefundChartsSection";
import RefundTableSection from "@/components/admin/refunds/RefundTableSection";
import RefundActionDialog from "@/components/admin/refunds/RefundActionDialog";
import PaymentDetailDrawer from "@/components/admin/refunds/PaymentDetailDrawer";

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

      const trimmedSearch = debouncedSearch.trim();
      if (trimmedSearch) {
        if (trimmedSearch.toUpperCase().startsWith("DDG_BKG_")) {
          params.bookingCode = trimmedSearch;
        } else {
          params.search = trimmedSearch;
        }
      }

      const response = await paymentService.getAdminPayments(params);
      const allPayments = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.items)
          ? response.data.items
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : Array.isArray(response)
              ? response
              : [];

      const normalized = isPending
        ? allPayments.filter((p) => getPaymentStatus(p) === "paid")
        : allPayments;

      setPayments(normalized);
    } catch (error) {
      setPayments([]);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể tải danh sách thanh toán"
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, gateway, debouncedSearch, startDate, endDate]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const stats = useMemo(() => {
    let pendingCount = 0;
    let partiallyCount = 0;
    let fullyCount = 0;
    let rejectedCount = 0;
    let pendingAmount = 0;
    let partiallyAmount = 0;
    let fullyAmount = 0;
    let rejectedAmount = 0;

    payments.forEach((p) => {
      const status = getPaymentStatus(p);
      const amt = Number(p.amount) || 0;
      const refAmt = Number(p.refundAmount) || 0;

      if (status === "paid") {
        pendingCount += 1;
        pendingAmount += amt;
      } else if (status === "partially_refunded") {
        partiallyCount += 1;
        partiallyAmount += refAmt;
      } else if (status === "fully_refunded") {
        fullyCount += 1;
        fullyAmount += refAmt;
      } else if (status === "rejected") {
        rejectedCount += 1;
        rejectedAmount += amt;
      }
    });

    return {
      pendingCount,
      pendingAmount,
      partiallyCount,
      partiallyAmount,
      fullyCount,
      fullyAmount,
      rejectedCount,
      rejectedAmount,
    };
  }, [payments]);

  const gatewayChartData = useMemo(() => {
    const counts = { VNPAY: 0, MOMO: 0, SEPAY: 0, manual: 0 };
    payments.forEach((p) => {
      const method = p.paymentMethod || "manual";
      if (counts[method] !== undefined) {
        counts[method]++;
      } else {
        counts.manual++;
      }
    });

    const data = [
      { name: "VNPAY", value: counts.VNPAY, color: "#3b82f6" },
      { name: "MoMo", value: counts.MOMO, color: "#ec4899" },
      { name: "SePay", value: counts.SEPAY, color: "#6366f1" },
      { name: "Thủ công", value: counts.manual, color: "#6b7280" },
    ];
    return data.some((d) => d.value > 0) ? data : [{ name: "Chưa có", value: 1, color: "#e2e8f0" }];
  }, [payments]);

  const statusChartData = useMemo(() => {
    const counts = { paid: 0, partially_refunded: 0, fully_refunded: 0, rejected: 0 };
    payments.forEach((p) => {
      const status = getPaymentStatus(p);
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });

    const data = [
      { name: "Chờ xử lý", value: counts.paid, color: "#f59e0b" },
      { name: "Hoàn một phần", value: counts.partially_refunded, color: "#0ea5e9" },
      { name: "Đã hoàn tiền", value: counts.fully_refunded, color: "#10b981" },
      { name: "Đã từ chối", value: counts.rejected, color: "#f43f5e" },
    ];
    return data.some((d) => d.value > 0) ? data : [{ name: "Chưa có", value: 1, color: "#e2e8f0" }];
  }, [payments]);

  useEffect(() => {
    setRefundReason("");
  }, [dialogTab]);

  const openActionDialog = useCallback((payment, nextTab = "approve") => {
    setSelectedPayment(payment);
    setDialogTab(nextTab);
    setRefundAmount(
      String(
        Math.max((payment?.amount || 0) - (payment?.refundAmount || 0), 0) || ""
      )
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
          "Không thể tải chi tiết giao dịch"
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
        `Số tiền hoàn không được vượt quá ${formatMoney(refundableAmount)}`
      );
      return;
    }

    try {
      setActionLoading(true);
      const idempotencyKey = `refund-${selectedPayment.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const payload = {
        amount: refundAmount ? Number(refundAmount) : undefined,
        reason: refundReason.trim() || "Hoàn tiền theo yêu cầu quản trị viên",
        idempotencyKey,
      };
      await paymentService.refund(selectedPayment.id, payload);
      toast.success("Hoàn tiền thành công");
      setDialogOpen(false);
      await fetchPayments();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể hoàn tiền"
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
          "Không thể từ chối yêu cầu hoàn tiền"
      );
    } finally {
      setActionLoading(false);
    }
  }, [fetchPayments, refundReason, selectedPayment]);

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-black/[0.04]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            Quản lý hoàn tiền
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Theo dõi yêu cầu hoàn tiền, duyệt/từ chối và xem nhật ký đối soát.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full sm:w-auto justify-center gap-2 rounded-full h-10 px-4 text-xs font-semibold"
          onClick={fetchPayments}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Tải lại
        </Button>
      </div>

      {/* Stats Cards */}
      <RefundStatCards stats={stats} />

      {/* Charts Row */}
      {!loading && payments.length > 0 && (
        <RefundChartsSection
          gatewayChartData={gatewayChartData}
          statusChartData={statusChartData}
        />
      )}

      {/* Table Section */}
      <RefundTableSection
        activeTab={activeTab}
        setActiveTab={(v) => {
          setActiveTab(v);
          setPayments([]);
        }}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        gateway={gateway}
        setGateway={setGateway}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        loading={loading}
        payments={payments}
        onOpenActionDialog={openActionDialog}
        onOpenDrawer={openDrawer}
      />

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
