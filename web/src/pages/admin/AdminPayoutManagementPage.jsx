import { useState, useEffect, useCallback } from "react";
import api from "@/constants/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IconWallet,
  IconCheck,
  IconX,
  IconClock,
  IconArrowUpRight,
  IconRefresh,
  IconSend,
} from "@tabler/icons-react";
import { toast } from "sonner";

const STATUS_MAP = {
  pending: { label: "Chờ duyệt", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  approved: { label: "Đã duyệt", color: "text-blue-700 bg-blue-50 border-blue-200" },
  transferred: { label: "Đã chuyển", color: "text-green-700 bg-green-50 border-green-200" },
  rejected: { label: "Từ chối", color: "text-red-700 bg-red-50 border-red-200" },
};

export default function AdminPayoutManagementPage() {
  const [payouts, setPayouts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectDialog, setRejectDialog] = useState({ open: false, payoutId: null });
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing] = useState(null);

  const fetchPayouts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await api.get("/admin/payouts", { params });
      const data = res.data;
      setPayouts(data?.payouts || []);
      setPagination(
        data?.pagination || { page: 1, totalPages: 1, total: 0 },
      );
    } catch (err) {
      console.error("Failed to load payouts:", err);
      toast.error("Không thể tải danh sách rút tiền");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPayouts(1);
  }, [fetchPayouts]);

  const handleAction = async (id, action, body = {}) => {
    try {
      setActing(id);
      await api.post(`/admin/payouts/${id}/${action}`, body);
      const messages = {
        approve: "Đã duyệt yêu cầu rút tiền",
        transfer: "Đã xác nhận chuyển khoản",
        reject: "Đã từ chối yêu cầu rút tiền",
      };
      toast.success(messages[action]);
      fetchPayouts(pagination.page);
    } catch (err) {
      toast.error(err.message || "Thao tác thất bại");
    } finally {
      setActing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.payoutId) return;
    await handleAction(rejectDialog.payoutId, "reject", { reason: rejectReason });
    setRejectDialog({ open: false, payoutId: null });
    setRejectReason("");
  };

  const formatMoney = (v) => (v || 0).toLocaleString("vi-VN") + "đ";

  const stats = {
    pending: payouts.filter((p) => p.status === "pending").length,
    approved: payouts.filter((p) => p.status === "approved").length,
    total: pagination.total,
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Quản lý rút tiền
          </h2>
          <p className="text-muted-foreground">
            Duyệt và xử lý yêu cầu rút tiền từ đối tác
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchPayouts(pagination.page)}>
          <IconRefresh className="mr-2 h-4 w-4" />
          Làm mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
            <IconClock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đã duyệt chờ chuyển</CardTitle>
            <IconArrowUpRight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng yêu cầu</CardTitle>
            <IconWallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
            <SelectItem value="transferred">Đã chuyển</SelectItem>
            <SelectItem value="rejected">Từ chối</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : payouts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <IconWallet className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">Không có yêu cầu rút tiền nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Đối tác</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Ngân hàng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày yêu cầu</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((p) => {
                  const badge = STATUS_MAP[p.status] || STATUS_MAP.pending;
                  const isActing = acting === p.id;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">
                          {p.business?.businessName || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.business?.owner?.email || ""}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatMoney(p.amount)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.bankName ? (
                          <>
                            <div>{p.bankName}</div>
                            <div className="text-xs text-muted-foreground">
                              {p.bankAccount} — {p.bankOwner}
                            </div>
                          </>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={badge.color}>
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(p.requestedAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                        {p.rejectReason || p.note || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                disabled={isActing}
                                onClick={() => handleAction(p.id, "approve")}
                              >
                                <IconCheck className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                disabled={isActing}
                                onClick={() =>
                                  setRejectDialog({ open: true, payoutId: p.id })
                                }
                              >
                                <IconX className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {p.status === "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              disabled={isActing}
                              onClick={() => handleAction(p.id, "transfer")}
                            >
                              <IconSend className="h-3.5 w-3.5 mr-1" />
                              Đã chuyển
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Trang {pagination.page} / {pagination.totalPages} ({pagination.total} yêu cầu)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchPayouts(pagination.page - 1)}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchPayouts(pagination.page + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

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
              Vui lòng nhập lý do từ chối để đối tác được biết.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Lý do từ chối</Label>
            <Input
              id="reject-reason"
              placeholder="Nhập lý do..."
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
              disabled={acting === rejectDialog.payoutId}
            >
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
