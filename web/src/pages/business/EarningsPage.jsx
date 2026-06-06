import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
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

export default function EarningsPage() {
  const { t } = useTranslation();

  const STATUS_MAP = {
    pending: { label: t("business.earnings.statusPending"), color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
    approved: { label: t("business.earnings.statusApproved"), color: "text-blue-700 bg-blue-50 border-blue-200" },
    transferred: { label: t("business.earnings.statusTransferred"), color: "text-green-700 bg-green-50 border-green-200" },
    rejected: { label: t("business.earnings.statusRejected"), color: "text-red-700 bg-red-50 border-red-200" },
  };

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
      toast.error(t("business.earnings.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequestPayout = async () => {
    if (!form.amount || parseInt(form.amount) <= 0) {
      toast.error(t("business.earnings.invalidAmount"));
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/business/payouts", {
        ...form,
        amount: parseInt(form.amount),
      });
      toast.success(t("business.earnings.requestSent"));
      setPayoutOpen(false);
      setForm({ amount: "", bankName: "", bankAccount: "", bankOwner: "", note: "" });
      fetchData();
    } catch (err) {
      toast.error(err.message || t("business.earnings.requestFailed"));
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
            {t("business.earnings.title")}
          </h2>
          <p className="text-muted-foreground">
            {t("business.earnings.title")}
          </p>
        </div>
        <Button
          onClick={() => setPayoutOpen(true)}
          disabled={!summary?.availableBalance || summary.availableBalance <= 0}
        >
          <IconArrowUpRight className="mr-2 h-4 w-4" />
          {t("business.earnings.title")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("business.revenue.totalRevenue")}
            </CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(summary?.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.completedBookings || 0} {t("business.revenue.completed")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("business.revenue.systemCommission")}
            </CardTitle>
            <IconTrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{formatMoney(summary?.totalCommission)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("business.revenue.systemCommission")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("business.revenue.netRevenue")}
            </CardTitle>
            <IconWallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatMoney(summary?.availableBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("business.earnings.statusApproved")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("business.earnings.statusTransferred")}
            </CardTitle>
            <IconCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(summary?.totalPaidOut)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("business.earnings.statusTransferred")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Earnings */}
      {summary?.monthlyEarnings?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("business.earnings.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("business.revenue.status")}</TableHead>
                  <TableHead>{t("business.revenue.totalRevenue")}</TableHead>
                  <TableHead>{t("business.revenue.systemCommission")}</TableHead>
                  <TableHead>{t("business.revenue.netRevenue")}</TableHead>
                  <TableHead>{t("business.revenue.totalBookings")}</TableHead>
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
          <CardTitle>{t("business.earnings.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <IconWallet className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">{t("business.earnings.loadFailed")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("business.revenue.status")}</TableHead>
                  <TableHead>{t("business.revenue.totalRevenue")}</TableHead>
                  <TableHead>{t("business.revenue.status")}</TableHead>
                  <TableHead>{t("business.revenue.status")}</TableHead>
                  <TableHead>{t("business.revenue.status")}</TableHead>
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
            <DialogTitle>{t("business.earnings.title")}</DialogTitle>
            <DialogDescription>
              {t("business.revenue.netRevenue")}: {formatMoney(summary?.availableBalance)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payout-amount">{t("business.earnings.invalidAmount")} *</Label>
              <Input
                id="payout-amount"
                type="number"
                placeholder={t("business.earnings.invalidAmount")}
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout-bank">{t("business.revenue.status")}</Label>
              <Input
                id="payout-bank"
                placeholder={t("business.revenue.status")}
                value={form.bankName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bankName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout-account">{t("business.revenue.status")}</Label>
              <Input
                id="payout-account"
                placeholder={t("business.revenue.status")}
                value={form.bankAccount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bankAccount: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout-owner">{t("business.revenue.status")}</Label>
              <Input
                id="payout-owner"
                placeholder={t("business.revenue.status")}
                value={form.bankOwner}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bankOwner: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout-note">{t("business.revenue.status")}</Label>
              <Input
                id="payout-note"
                placeholder={t("common.optional")}
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
              {t("common.cancel")}
            </Button>
            <Button onClick={handleRequestPayout} disabled={submitting}>
              {submitting ? t("common.processing") : t("common.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
