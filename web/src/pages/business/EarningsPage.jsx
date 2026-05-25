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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IconWallet,
  IconTrendingUp,
  IconTrendingDown,
  IconClock,
  IconCheck,
  IconX,
  IconArrowUpRight,
} from "@tabler/icons-react";
import { toast } from "sonner";

const STATUS_MAP = {
  pending: { label: "Chờ duyệt", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  approved: { label: "Đã duyệt", color: "text-blue-700 bg-blue-50 border-blue-200" },
  transferred: { label: "Đã chuyển", color: "text-green-700 bg-green-50 border-green-200" },
  rejected: { label: "Từ chối", color: "text-red-700 bg-red-50 border-red-200" },
};

export default function EarningsPage() {
  const [summary, setSummary] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    bankName: "",
    bankAccount: "",
    bankOwner: "",
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [earningsRes, payoutsRes] = await Promise.all([
        api.get("/business/earnings"),
        api.get("/business/payouts"),
      ]);
      if (earningsRes?.data) setSummary(earningsRes.data);
      if (payoutsRes?.data?.payouts) setPayouts(payoutsRes.data.payouts);
    } catch (err) {
      console.error("Failed to load earnings:", err);
      toast.error("Không thể tải thông tin thu nhập");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequestPayout = async () => {
    if (!form.amount || parseInt(form.amount) <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/business/payouts", {
        ...form,
        amount: parseInt(form.amount),
      });
      toast.success("Yêu cầu rút tiền đã được gửi");
      setPayoutOpen(false);
      setForm({ amount: "", bankName: "", bankAccount: "", bankOwner: "", note: "" });
      fetchData();
    } catch (err) {
      toast.error(err.message || "Lỗi gửi yêu cầu rút tiền");
    } finally {
      setSubmitting(false);
    }
  };

  const formatMoney = (v) => (v || 0).toLocaleString("vi-VN") + "đ";

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Thu nhập & Rút tiền
          </h2>
          <p className="text-muted-foreground">
            Theo dõi thu nhập và yêu cầu rút tiền
          </p>
        </div>
        <Button
          onClick={() => setPayoutOpen(true)}
          disabled={!summary?.availableBalance || summary.availableBalance <= 0}
        >
          <IconArrowUpRight className="mr-2 h-4 w-4" />
          Yêu cầu rút tiền
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng doanh thu
            </CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(summary?.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.completedBookings || 0} booking hoàn thành
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Hoa hồng hệ thống
            </CardTitle>
            <IconTrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{formatMoney(summary?.totalCommission)}
            </div>
            <p className="text-xs text-muted-foreground">
              Phí dịch vụ nền tảng
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Số dư khả dụng
            </CardTitle>
            <IconWallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatMoney(summary?.availableBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Có thể rút ngay
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Đã rút
            </CardTitle>
            <IconCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(summary?.totalPaidOut)}
            </div>
            <p className="text-xs text-muted-foreground">
              Tổng đã chuyển khoản
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Earnings */}
      {summary?.monthlyEarnings?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Thu nhập theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tháng</TableHead>
                  <TableHead>Doanh thu</TableHead>
                  <TableHead>Hoa hồng</TableHead>
                  <TableHead>Thực nhận</TableHead>
                  <TableHead>Booking</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.monthlyEarnings.map((m) => (
                  <TableRow key={m.month}>
                    <TableCell className="font-medium">{m.month}</TableCell>
                    <TableCell>{formatMoney(m.revenue)}</TableCell>
                    <TableCell className="text-red-600">
                      -{formatMoney(m.commission)}
                    </TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {formatMoney(m.net)}
                    </TableCell>
                    <TableCell>{m.bookings}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử rút tiền</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <IconWallet className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">Chưa có yêu cầu rút tiền</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày yêu cầu</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngân hàng</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((p) => {
                  const badge = STATUS_MAP[p.status] || STATUS_MAP.pending;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">
                        {new Date(p.requestedAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatMoney(p.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={badge.color}>
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.bankName
                          ? `${p.bankName} - ${p.bankAccount || ""}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {p.rejectReason || p.note || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Request Payout Dialog */}
      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yêu cầu rút tiền</DialogTitle>
            <DialogDescription>
              Số dư khả dụng: {formatMoney(summary?.availableBalance)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payout-amount">Số tiền muốn rút *</Label>
              <Input
                id="payout-amount"
                type="number"
                placeholder="Nhập số tiền"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout-bank">Ngân hàng</Label>
              <Input
                id="payout-bank"
                placeholder="VD: Vietcombank, Techcombank..."
                value={form.bankName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bankName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout-account">Số tài khoản</Label>
              <Input
                id="payout-account"
                placeholder="Số tài khoản ngân hàng"
                value={form.bankAccount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bankAccount: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout-owner">Chủ tài khoản</Label>
              <Input
                id="payout-owner"
                placeholder="Tên chủ tài khoản"
                value={form.bankOwner}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bankOwner: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout-note">Ghi chú</Label>
              <Input
                id="payout-note"
                placeholder="Ghi chú (tùy chọn)"
                value={form.note}
                onChange={(e) =>
                  setForm((f) => ({ ...f, note: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayoutOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button onClick={handleRequestPayout} disabled={submitting}>
              {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
