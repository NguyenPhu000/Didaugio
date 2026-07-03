import { useState, useMemo } from "react";
import { Doughnut, Line } from "react-chartjs-2";
import "@/lib/chartSetup";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
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
      const dateStr = new Date(p.requestedAt || p.createdAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
      groups[dateStr] = (groups[dateStr] || 0) + Number(p.amount);
    });

    const sortedLabels = Object.keys(groups).sort((a, b) => {
      const [ad, am] = a.split("/").map(Number);
      const [bd, bm] = b.split("/").map(Number);
      return am !== bm ? am - bm : ad - bd;
    });

    const data = sortedLabels.map((label) => groups[label]);

    if (sortedLabels.length === 0) {
      return {
        labels: ["Chưa có dữ liệu"],
        datasets: [
          {
            label: "Số tiền rút (VND)",
            data: [0],
            borderColor: "hsl(var(--primary))",
            backgroundColor: "rgba(243, 230, 0, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      };
    }

    return {
      labels: sortedLabels,
      datasets: [
        {
          label: "Số tiền rút (VND)",
          data,
          borderColor: "hsl(var(--primary))",
          backgroundColor: "rgba(243, 230, 0, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [payouts]);

  const doughnutChartData = useMemo(() => {
    const pending = stats.pendingCount || payouts.filter((p) => p.status === "pending").length || 0;
    const approved = payouts.filter((p) => p.status === "approved").length || 0;
    const transferred = payouts.filter((p) => p.status === "transferred").length || 0;
    const rejected = stats.failedCount || payouts.filter((p) => p.status === "rejected").length || 0;

    return {
      labels: ["Chờ duyệt", "Đang xử lý", "Hoàn thành", "Từ chối"],
      datasets: [
        {
          data: [pending, approved, transferred, rejected],
          backgroundColor: ["#f59e0b", "#3b82f6", "#10b981", "#ef4444"],
        },
      ],
    };
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
            Quản lý rút tiền
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Duyệt và xử lý yêu cầu rút tiền từ đối tác
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "pending" && selectedIds.size > 0 && (
            <Button onClick={handleBulkApprove} className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Duyệt ({selectedIds.size})
            </Button>
          )}
          <Button variant="outline" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="relative overflow-hidden rounded-xl border border-zinc-200/80 bg-white p-5 shadow-sm flex items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-32" />
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
          <Card className="lg:col-span-2">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Xu hướng yêu cầu rút tiền theo ngày
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64 pt-4">
              <Line
                data={lineChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
                    x: { grid: { display: false } },
                  },
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> Cơ cấu trạng thái rút tiền
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64 pt-4 flex items-center justify-center">
              <Doughnut
                data={doughnutChartData}
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

      {/* Tabs & Payout Queue */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); setSelectedIds(new Set()); }}>
        <div className="flex items-center justify-between">
          <TabsList className="rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
            {STATUS_TABS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-md px-3 py-1.5 text-xs font-medium gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800"
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
            <Card className="rounded-xl border border-zinc-200/80 bg-white shadow-sm dark:bg-zinc-950 dark:border-zinc-800">
              <CardContent className="p-0">
                {payoutsLoading ? (
                  <div className="space-y-2 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : payouts.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12">
                    <DollarSign className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Không có yêu cầu nào trong mục này
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {activeTab === "pending" && (
                          <TableHead className="w-10">
                            <Checkbox
                              checked={selectedIds.size === payouts.length && payouts.length > 0}
                              onCheckedChange={toggleSelectAll}
                            />
                          </TableHead>
                        )}
                        <TableHead>Đối tác</TableHead>
                        <TableHead className="text-right">Số tiền</TableHead>
                        <TableHead>Ngân hàng</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày yêu cầu</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((p) => {
                        const statusInfo = STATUS_BADGE_MAP[p.status] || STATUS_BADGE_MAP.pending;
                        const isProcessing = reviewPayout.isPending || transferPayout.isPending;
                        return (
                          <TableRow key={p.id}>
                            {activeTab === "pending" && (
                              <TableCell>
                                <Checkbox
                                  checked={selectedIds.has(p.id)}
                                  onCheckedChange={() => toggleSelect(p.id)}
                                />
                              </TableCell>
                            )}
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {p.business?.businessName || "—"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {p.business?.owner?.email || ""}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              {formatVND(p.amount)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">{p.bankName || "—"}</div>
                                <div className="text-xs text-muted-foreground">
                                  {p.bankAccountNumber || p.bankAccount || ""} — {p.bankAccountName || p.bankOwner || ""}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusInfo.className}>
                                {statusInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(p.requestedAt || p.createdAt).toLocaleDateString("vi-VN")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {p.status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                      disabled={isProcessing}
                                      onClick={() => handleApprove(p.id)}
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                      Duyệt
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                                      disabled={isProcessing}
                                      onClick={() =>
                                        setRejectDialog({ open: true, payoutId: p.id })
                                      }
                                    >
                                      <XCircle className="h-3.5 w-3.5 mr-1" />
                                      Từ chối
                                    </Button>
                                  </>
                                )}
                                {p.status === "approved" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                                    disabled={isProcessing}
                                    onClick={() => handleTransfer(p.id)}
                                  >
                                    <Send className="h-3.5 w-3.5 mr-1" />
                                    Xác nhận chuyển
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Trang {pagination.page} / {pagination.totalPages} ({pagination.total} yêu cầu)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sau
                  </Button>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu rút tiền</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối yêu cầu này.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Lý do từ chối</Label>
            <Input
              id="reject-reason"
              placeholder="Nhập lý do từ chối..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog({ open: false, payoutId: null });
                setRejectReason("");
              }}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={reviewPayout.isPending}
            >
              {reviewPayout.isPending ? "Đang xử lý..." : "Từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
