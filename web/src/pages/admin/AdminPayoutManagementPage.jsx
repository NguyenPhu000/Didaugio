// MAP: AdminPayoutManagementPage
// ├── UI: @/components/admin/payouts/{PayoutStatsAndCharts, PayoutQueueTable, PayoutRejectDialog}
// └── API: @/hooks/queries/usePayoutQueries

import { useState, useMemo } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminPayouts,
  useReviewPayout,
  usePayoutStats,
  useTransferPayout,
} from "@/hooks/queries/usePayoutQueries";

// Extracted Sub-Components
import PayoutStatsAndCharts from "@/components/admin/payouts/PayoutStatsAndCharts";
import PayoutQueueTable from "@/components/admin/payouts/PayoutQueueTable";
import PayoutRejectDialog from "@/components/admin/payouts/PayoutRejectDialog";

export default function AdminPayoutManagementPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [rejectDialog, setRejectDialog] = useState({
    open: false,
    payoutId: null,
  });
  const [rejectReason, setRejectReason] = useState("");

  const { data: statsRes, isLoading: statsLoading } = usePayoutStats();
  const {
    data: payoutsRes,
    isLoading: payoutsLoading,
    refetch,
  } = useAdminPayouts({
    status: activeTab,
    page,
    limit: 20,
  });
  const reviewPayout = useReviewPayout();
  const transferPayout = useTransferPayout();

  const stats = useMemo(() => statsRes?.data || {}, [statsRes?.data]);
  const payouts = payoutsRes?.data?.payouts || [];
  const pagination = payoutsRes?.data?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
  };

  const handleApprove = async (id) => {
    try {
      await reviewPayout.mutateAsync({ id, action: "approve" });
      toast.success("Đã duyệt yêu cầu rút tiền");
    } catch {
      toast.error("Duyệt yêu cầu thất bại");
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.payoutId) return;
    try {
      await reviewPayout.mutateAsync({
        id: rejectDialog.payoutId,
        action: "reject",
        reason: rejectReason,
      });
      toast.success("Đã từ chối yêu cầu rút tiền");
      setRejectDialog({ open: false, payoutId: null });
      setRejectReason("");
    } catch {
      toast.error("Từ chối yêu cầu thất bại");
    }
  };

  const handleTransfer = async (id) => {
    const transferRef = window.prompt(
      "Nhập mã tham chiếu giao dịch từ ngân hàng sau khi đã chuyển tiền",
    )?.trim();
    if (!transferRef) return;

    try {
      await transferPayout.mutateAsync({ id, transferRef });
      toast.success("Đã xác nhận chuyển khoản");
    } catch {
      toast.error("Xác nhận chuyển khoản thất bại");
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) {
      toast.error("Vui lòng chọn ít nhất một yêu cầu");
      return;
    }
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          reviewPayout.mutateAsync({ id, action: "approve" })
        )
      );
      toast.success(`Đã duyệt ${selectedIds.size} yêu cầu`);
      setSelectedIds(new Set());
    } catch {
      toast.error("Duyệt hàng loạt thất bại");
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === payouts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(payouts.map((p) => p.id)));
    }
  };

  const lineChartData = useMemo(() => {
    const groups = {};
    payouts.forEach((p) => {
      const dateStr = new Date(
        p.requestedAt || p.createdAt || Date.now()
      ).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
      groups[dateStr] = (groups[dateStr] || 0) + Number(p.amount || 0);
    });

    const sortedLabels = Object.keys(groups).sort((a, b) => {
      const [ad, am] = a.split("/").map(Number);
      const [bd, bm] = b.split("/").map(Number);
      return am !== bm ? am - bm : ad - bd;
    });

    if (sortedLabels.length === 0) {
      return [{ date: "Hôm nay", amount: 0 }];
    }

    return sortedLabels.map((date) => ({
      date,
      amount: groups[date],
    }));
  }, [payouts]);

  const statusDistributionData = useMemo(() => {
    const pending =
      stats.pendingCount ||
      payouts.filter((p) => p.status === "pending").length ||
      0;
    const approved =
      payouts.filter((p) => p.status === "approved").length || 0;
    const transferred =
      payouts.filter((p) => p.status === "transferred").length || 0;
    const rejected =
      stats.failedCount ||
      payouts.filter((p) => p.status === "rejected").length ||
      0;

    return [
      { name: "Chờ duyệt", value: pending, color: "#f59e0b" },
      { name: "Đang xử lý", value: approved, color: "#3b82f6" },
      { name: "Hoàn thành", value: transferred, color: "#10b981" },
      { name: "Từ chối", value: rejected, color: "#ef4444" },
    ];
  }, [stats, payouts]);

  return (
    <div className="space-y-6 text-slate-900 antialiased max-w-[1560px] mx-auto">
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tài chính & Thanh toán Đối tác
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            Quản lý Rút tiền (Payout)
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Phê duyệt và giải ngân doanh thu cho các đối tác kinh doanh du lịch.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-wrap">
          {activeTab === "pending" && selectedIds.size > 0 && (
            <button
              type="button"
              onClick={handleBulkApprove}
              disabled={reviewPayout.isPending}
              className="flex-1 sm:flex-initial justify-center h-10 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4 text-white" />
              Duyệt ({selectedIds.size})
            </button>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            className="h-10 w-10 rounded-full bg-white text-slate-900 hover:bg-[#F4F2EC] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] transition-all flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw
              className={`h-4 w-4 text-slate-800 ${payoutsLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </header>

      {/* Stats & Charts */}
      <PayoutStatsAndCharts
        stats={stats}
        statsLoading={statsLoading}
        lineChartData={lineChartData}
        statusDistributionData={statusDistributionData}
      />

      {/* Tabs & Payout Queue */}
      <PayoutQueueTable
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        page={page}
        setPage={setPage}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        toggleSelect={toggleSelect}
        toggleSelectAll={toggleSelectAll}
        payouts={payouts}
        payoutsLoading={payoutsLoading}
        pagination={pagination}
        handleApprove={handleApprove}
        handleTransfer={handleTransfer}
        setRejectDialog={setRejectDialog}
        reviewPending={reviewPayout.isPending}
        transferPending={transferPayout.isPending}
      />

      {/* Reject Dialog */}
      <PayoutRejectDialog
        rejectDialog={rejectDialog}
        setRejectDialog={setRejectDialog}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        handleReject={handleReject}
        isPending={reviewPayout.isPending}
      />
    </div>
  );
}
