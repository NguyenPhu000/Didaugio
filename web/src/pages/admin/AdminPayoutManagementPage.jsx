import { useState, useMemo } from "react";
import {
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  RefreshCw,
  Building2,
  CreditCard,
  AlertTriangle,
  Send,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useAdminPayouts,
  useReviewPayout,
  usePayoutStats,
  useTransferPayout,
} from "@/hooks/queries/usePayoutQueries";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formatVND = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

const STATUS_TABS = [
  { value: "pending", label: "Chờ duyệt", icon: Clock },
  { value: "approved", label: "Đang xử lý", icon: ArrowUpRight },
  { value: "transferred", label: "Hoàn thành", icon: CheckCircle2 },
  { value: "rejected", label: "Từ chối", icon: XCircle },
];

const STATUS_BADGE_MAP = {
  pending: {
    label: "Chờ duyệt",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  approved: {
    label: "Đã duyệt",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  transferred: {
    label: "Đã chuyển",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Từ chối",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

const StatCard = ({ title, value, icon: Icon, tone = "default", subtitle }) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] transition-all duration-300 relative group overflow-hidden">
      <div className="h-0.5 w-0 group-hover:w-full bg-[#F3E600] absolute top-0 left-0 transition-all duration-300" />
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">{title}</p>
          <p className="text-2xl font-black tracking-tight text-slate-950 font-mono tabular-nums">{value ?? 0}</p>
          {subtitle && (
            <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-black/[0.04] text-slate-800 shrink-0 group-hover:bg-[#FFFDE6] group-hover:text-slate-950 transition-colors">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
};

export default function AdminPayoutManagementPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [rejectDialog, setRejectDialog] = useState({ open: false, payoutId: null });
  const [rejectReason, setRejectReason] = useState("");

  const { data: statsRes, isLoading: statsLoading } = usePayoutStats();
  const { data: payoutsRes, isLoading: payoutsLoading, refetch } = useAdminPayouts({
    status: activeTab,
    page,
    limit: 20,
  });
  const reviewPayout = useReviewPayout();
  const transferPayout = useTransferPayout();

  const stats = useMemo(() => statsRes?.data || {}, [statsRes?.data]);
  const payouts = payoutsRes?.data?.payouts || [];
  const pagination = payoutsRes?.data?.pagination || { page: 1, totalPages: 1, total: 0 };

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
    try {
      await transferPayout.mutateAsync({ id });
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
        p.requestedAt || p.createdAt || Date.now(),
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

  const statCards = [
    {
      title: "Tổng chờ duyệt",
      value: formatVND(stats.totalPendingAmount),
      icon: Clock,
      tone: "warning",
      subtitle: `${stats.pendingCount || 0} yêu cầu`,
    },
    {
      title: "Đã xử lý hôm nay",
      value: formatVND(stats.processedTodayAmount),
      icon: CheckCircle2,
      tone: "success",
      subtitle: `${stats.processedTodayCount || 0} yêu cầu`,
    },
    {
      title: "Thời gian xử lý TB",
      value: stats.avgProcessingTime || "—",
      icon: Clock,
      tone: "default",
      subtitle: "Thời gian trung bình",
    },
    {
      title: "Thất bại",
      value: String(stats.failedCount || 0),
      icon: AlertTriangle,
      tone: "danger",
      subtitle: "Yêu cầu lỗi/từ chối",
    },
  ];

  return (
    <div className="space-y-6 text-slate-900 antialiased selection:bg-[#F3E600] selection:text-slate-950 max-w-[1560px] mx-auto">
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#F3E600] shadow-[0_0_6px_#F3E600]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tài chính & Thanh toán Đối tác
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            Quản lý Rút tiền (Payout)
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Phê duyệt và giải ngân doanh thu cho các đối tác kinh doanh du lịch.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {activeTab === "pending" && selectedIds.size > 0 && (
            <button
              type="button"
              onClick={handleBulkApprove}
              disabled={reviewPayout.isPending}
              className="h-10 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4 text-white" />
              Duyệt ({selectedIds.size})
            </button>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            className="h-10 w-10 rounded-full bg-white text-slate-900 hover:bg-[#F4F2EC] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] transition-all flex items-center justify-center shrink-0 active:scale-95"
            title="Làm mới"
          >
            <RefreshCw className={`h-4 w-4 text-slate-800 ${payoutsLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-black/[0.04] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <Skeleton className="h-3 w-24 rounded-lg" />
                  <Skeleton className="h-8 w-32 rounded-lg" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
            ))
          : statCards.map((card) => (
              <StatCard
                key={card.title}
                title={card.title}
                value={card.value}
                icon={card.icon}
                tone={card.tone}
                subtitle={card.subtitle}
              />
            ))}
      </div>

      {/* Charts Row */}
      {!statsLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl bg-white border border-black/[0.04] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <div className="pb-4 border-b border-black/[0.04] flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[#F3E600]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Xu hướng yêu cầu rút tiền theo ngày
              </h3>
            </div>
            <div className="h-64 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={lineChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickFormatter={(val) =>
                      val >= 1000000
                        ? `${(val / 1000000).toFixed(1)}M`
                        : val >= 1000
                          ? `${(val / 1000).toFixed(0)}k`
                          : val
                    }
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                    formatter={(value) => [
                      `${Number(value).toLocaleString("vi-VN")} đ`,
                      "Số tiền",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#0f172a"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: "#0f172a" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-black/[0.04] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <div className="pb-4 border-b border-black/[0.04] flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-800" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Cơ cấu trạng thái rút tiền
              </h3>
            </div>
            <div className="h-64 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Payout Queue */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); setSelectedIds(new Set()); }}>
        <div className="flex items-center justify-between">
          <TabsList className="rounded-full bg-white border border-black/[0.04] p-1 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            {STATUS_TABS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-full px-4 py-1.5 text-xs font-bold gap-1.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white transition-all"
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {STATUS_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            <div className="rounded-3xl border border-black/[0.04] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
              {payoutsLoading ? (
                <div className="py-24 text-center space-y-3">
                  <div className="w-9 h-9 border-3 border-slate-950 border-t-[#F3E600] rounded-full animate-spin mx-auto" />
                  <span className="text-xs font-semibold text-slate-500">Đang tải danh sách rút tiền...</span>
                </div>
              ) : payouts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
                  <DollarSign className="h-10 w-10 text-slate-300 stroke-[1.5]" />
                  <p className="font-bold text-slate-800">
                    Không có yêu cầu nào trong mục này
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#FAF9F5] text-slate-500 font-semibold border-b border-black/[0.04]">
                        {activeTab === "pending" && (
                          <th className="p-4 w-10">
                            <Checkbox
                              checked={selectedIds.size === payouts.length && payouts.length > 0}
                              onCheckedChange={toggleSelectAll}
                              className="rounded-md"
                            />
                          </th>
                        )}
                        <th className="p-4">Đối tác</th>
                        <th className="p-4 text-right">Số tiền</th>
                        <th className="p-4">Ngân hàng</th>
                        <th className="p-4">Trạng thái</th>
                        <th className="p-4">Ngày yêu cầu</th>
                        <th className="p-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.03]">
                      {payouts.map((p) => {
                        const statusInfo = STATUS_BADGE_MAP[p.status] || STATUS_BADGE_MAP.pending;
                        const isProcessing = reviewPayout.isPending || transferPayout.isPending;
                        return (
                          <tr key={p.id} className="hover:bg-[#FAF9F5] transition-colors">
                            {activeTab === "pending" && (
                              <td className="p-4">
                                <Checkbox
                                  checked={selectedIds.has(p.id)}
                                  onCheckedChange={() => toggleSelect(p.id)}
                                  className="rounded-md"
                                />
                              </td>
                            )}
                            <td className="p-4">
                              <div>
                                <div className="font-bold text-slate-950">
                                  {p.business?.businessName || "—"}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  {p.business?.owner?.email || ""}
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-right font-mono font-bold text-slate-950 tabular-nums">
                              {formatVND(p.amount)}
                            </td>
                            <td className="p-4">
                              <div className="text-xs">
                                <div className="font-semibold text-slate-900">{p.bankName || "—"}</div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  {p.bankAccountNumber || p.bankAccount || ""} — {p.bankAccountName || p.bankOwner || ""}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border", statusInfo.className)}>
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="p-4 text-slate-400 font-mono text-[11px]">
                              {new Date(p.requestedAt || p.createdAt).toLocaleDateString("vi-VN")}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {p.status === "pending" && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={isProcessing}
                                      onClick={() => handleApprove(p.id)}
                                      className="h-8 px-3 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all flex items-center gap-1 active:scale-95"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-0.5" />
                                      Duyệt
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isProcessing}
                                      onClick={() =>
                                        setRejectDialog({ open: true, payoutId: p.id })
                                      }
                                      className="h-8 px-3 rounded-full text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all flex items-center gap-1 active:scale-95"
                                    >
                                      <XCircle className="h-3.5 w-3.5 mr-0.5" />
                                      Từ chối
                                    </button>
                                  </>
                                )}
                                {p.status === "approved" && (
                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => handleTransfer(p.id)}
                                    className="h-8 px-3 rounded-full text-xs font-semibold bg-slate-950 hover:bg-black text-white transition-all flex items-center gap-1 active:scale-95"
                                  >
                                    <Send className="h-3.5 w-3.5 mr-0.5 text-[#F3E600]" />
                                    Xác nhận chuyển
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 bg-[#FAF9F5] rounded-2xl mt-4 border border-black/[0.04] text-xs">
                <p className="text-slate-500 font-medium">
                  Trang <span className="font-bold text-slate-900 font-mono tabular-nums">{pagination.page}</span> / <span className="font-mono tabular-nums">{pagination.totalPages}</span> ({pagination.total} yêu cầu)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    variant="outline"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-full text-xs font-semibold h-8 px-3.5 bg-white border border-black/[0.05] shadow-2xs hover:bg-[#F5F4F0] disabled:opacity-40 transition-all text-slate-900"
                  >
                    ← Trước
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-full text-xs font-semibold h-8 px-3.5 bg-white border border-black/[0.05] shadow-2xs hover:bg-[#F5F4F0] disabled:opacity-40 transition-all text-slate-900"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialog({ open: false, payoutId: null });
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Từ chối yêu cầu rút tiền
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Vui lòng nhập lý do từ chối để thông báo cho đối tác.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-3">
            <Label htmlFor="reject-reason" className="text-xs font-bold text-slate-700">Lý do từ chối</Label>
            <Input
              id="reject-reason"
              placeholder="VD: Thông tin tài khoản ngân hàng không chính xác..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="rounded-xl border border-black/[0.06] bg-[#F8F7F3] text-xs h-10"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-black/[0.04]">
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog({ open: false, payoutId: null });
                setRejectReason("");
              }}
              className="rounded-full text-xs font-semibold h-9 px-4"
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={reviewPayout.isPending}
              className="rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 px-5 shadow-sm"
            >
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
