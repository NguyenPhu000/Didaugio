import { memo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  Building2,
  Copy,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useEarnings,
  usePayoutHistory,
  useCreatePayout,
  useCancelPayout,
} from "@/hooks/queries/usePayoutQueries";
import {
  BusinessPageHeader,
  BusinessSectionCard,
  BusinessSectionCardSkeleton,
} from "@/components/business/ui";
import { formatVND } from "@/components/business/dashboardWidgetHelpers";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MIN_WITHDRAWAL_AMOUNT = 50000;

const EarningsPage = memo(function EarningsPage() {
  const { t } = useTranslation();

  const STATUS_MAP = {
    pending: {
      label: t("business.earnings.statusPending"),
      className: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Clock,
    },
    approved: {
      label: t("business.earnings.statusApproved"),
      className: "bg-blue-50 text-blue-700 border-blue-200",
      icon: CheckCircle2,
    },
    transferred: {
      label: t("business.earnings.statusTransferred"),
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
    },
    rejected: {
      label: t("business.earnings.statusRejected"),
      className: "bg-rose-50 text-rose-700 border-rose-200",
      icon: XCircle,
    },
    cancelled: {
      label: t("business.earnings.statusCancelled"),
      className: "bg-zinc-50 text-zinc-700 border-zinc-200",
      icon: XCircle,
    },
  };

  const STEPS = [
    { id: 1, title: t("business.earnings.stepAmount"), description: t("business.earnings.stepAmountDesc") },
    { id: 2, title: t("business.earnings.stepBankInfo"), description: t("business.earnings.stepBankInfoDesc") },
    { id: 3, title: t("business.earnings.stepConfirm"), description: t("business.earnings.stepConfirmDesc") },
    { id: 4, title: t("business.earnings.stepComplete"), description: t("business.earnings.stepCompleteDesc") },
  ];
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    amount: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
    note: "",
  });

  const { data: earningsRes, isLoading: earningsLoading } = useEarnings();
  const { data: historyRes, isLoading: historyLoading } = usePayoutHistory({ page: 1, limit: 20 });
  const createPayout = useCreatePayout();
  const cancelPayout = useCancelPayout();

  const earnings = earningsRes?.data || {};
  const payouts = historyRes?.data?.payouts || [];

  const resetForm = useCallback(() => {
    setForm({
      amount: "",
      bankName: "",
      bankAccountNumber: "",
      bankAccountName: "",
      note: "",
    });
    setStep(1);
  }, [setForm, setStep]);

  const handleOpenDialog = useCallback(() => {
    resetForm();
    setPayoutOpen(true);
  }, [resetForm]);

  const handleCloseDialog = useCallback(() => {
    setPayoutOpen(false);
    setTimeout(resetForm, 200);
  }, [resetForm]);

  const handleQuickAmount = useCallback((percentage) => {
    const available = earnings.availableBalance || 0;
    const amount = Math.floor((available * percentage) / 100);
    setForm((f) => ({ ...f, amount: String(amount) }));
  }, [earnings.availableBalance, setForm]);

  const handleNext = () => {
    if (step === 1) {
      const amount = parseInt(form.amount, 10);
      if (!amount || amount <= 0) {
        toast.error(t("business.earnings.toastInvalidAmount"));
        return;
      }
      if (amount > (earnings.availableBalance || 0)) {
        toast.error(t("business.earnings.toastExceedBalance"));
        return;
      }
      if (amount < MIN_WITHDRAWAL_AMOUNT) {
        toast.error(t("business.earnings.toastMinAmount"));
        return;
      }
    }
    if (step === 2) {
      if (!form.bankName.trim()) {
        toast.error(t("business.earnings.toastBankNameRequired"));
        return;
      }
      if (!form.bankAccountNumber.trim()) {
        toast.error(t("business.earnings.toastAccountNumberRequired"));
        return;
      }
      if (!form.bankAccountName.trim()) {
        toast.error(t("business.earnings.toastAccountNameRequired"));
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    try {
      await createPayout.mutateAsync({
        amount: parseInt(form.amount, 10),
        bankName: form.bankName,
        bankAccountNumber: form.bankAccountNumber,
        bankAccountName: form.bankAccountName,
        note: form.note,
      });
      setStep(4);
      toast.success(t("business.earnings.toastRequestSuccess"));
    } catch {
      toast.error(t("business.earnings.toastRequestFailed"));
    }
  };

  const handleCancelPayout = async (id) => {
    try {
      await cancelPayout.mutateAsync(id);
      toast.success(t("business.earnings.toastCancelSuccess"));
    } catch {
      toast.error(t("business.earnings.toastCancelFailed"));
    }
  };

  if (earningsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <BusinessSectionCardSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:space-y-6 md:p-6 lg:p-8">
      {/* Header */}
      <BusinessPageHeader
        title={t("business.earnings.headerTitle")}
        description={t("business.earnings.headerDesc")}
        action={
          <Button
            onClick={handleOpenDialog}
            disabled={!earnings.availableBalance || earnings.availableBalance <= 0}
            className="gap-1.5"
          >
            <ArrowUpRight className="h-4 w-4" />
            {t("business.earnings.requestWithdrawal")}
          </Button>
        }
      />

      {/* Balance Card */}
      <Card className="rounded-xl border border-zinc-200/80 bg-gradient-to-br from-zinc-950 to-zinc-900 text-white shadow-sm dark:from-zinc-950 dark:to-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-white/10 p-3">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t("business.earnings.totalBalance")}</p>
              <p className="text-3xl font-bold tracking-tight">
                {formatVND(
                  (earnings.availableBalance || 0) +
                    (earnings.pendingBalance || 0)
                )}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4 pt-4 border-t border-white/10">
            <div>
              <p className="text-xs text-zinc-400">{t("business.earnings.available")}</p>
              <p className="text-lg font-semibold text-emerald-400">
                {formatVND(earnings.availableBalance)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">{t("business.earnings.pendingBalance")}</p>
              <p className="text-lg font-semibold text-amber-400">
                {formatVND(earnings.pendingBalance)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">{t("business.earnings.withdrawn")}</p>
              <p className="text-lg font-semibold text-zinc-300">
                {formatVND(earnings.totalPaidOut)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout History */}
      <BusinessSectionCard title={t("business.earnings.payoutHistory")} titleIcon={Clock}>
        {historyLoading ? (
          <BusinessSectionCardSkeleton rows={5} />
        ) : payouts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <Wallet className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("business.earnings.noPayoutHistory")}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("business.earnings.tableDate")}</TableHead>
                    <TableHead className="text-right">{t("business.earnings.tableAmount")}</TableHead>
                    <TableHead>{t("business.earnings.tableBank")}</TableHead>
                    <TableHead>{t("business.earnings.tableStatus")}</TableHead>
                    <TableHead className="text-right">{t("business.earnings.tableAction")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((p) => {
                    const statusInfo = STATUS_MAP[p.status] || STATUS_MAP.pending;
                    const StatusIcon = statusInfo.icon;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(p.requestedAt || p.createdAt).toLocaleDateString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatVND(p.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{p.bankName || "—"}</div>
                            <div className="text-xs text-muted-foreground">
                              {p.bankAccountNumber || p.bankAccount || ""}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("gap-1", statusInfo.className)}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {p.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => handleCancelPayout(p.id)}
                              disabled={cancelPayout.isPending}
                            >
                              {t("business.earnings.cancel")}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-border/50">
              {payouts.map((p) => {
                const statusInfo = STATUS_MAP[p.status] || STATUS_MAP.pending;
                const StatusIcon = statusInfo.icon;
                return (
                  <div key={p.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {new Date(p.requestedAt || p.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                      <Badge variant="outline" className={cn("gap-1", statusInfo.className)}>
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-lg font-semibold font-mono">{formatVND(p.amount)}</p>
                    <div className="text-sm">
                      <span className="font-medium">{p.bankName || "—"}</span>
                      {p.bankAccountNumber && (
                        <span className="text-muted-foreground ml-2">({p.bankAccountNumber})</span>
                      )}
                    </div>
                    {p.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 w-full"
                        onClick={() => handleCancelPayout(p.id)}
                        disabled={cancelPayout.isPending}
                      >
                        {t("business.earnings.cancelRequest")}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </BusinessSectionCard>

      {/* Payout Request Dialog */}
      <Dialog open={payoutOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{t("business.earnings.dialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("business.earnings.availableBalance")}: {formatVND(earnings.availableBalance)}
            </DialogDescription>
          </DialogHeader>

          {/* Stepper */}
          <div className="flex items-center gap-1 py-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                    step >= s.id
                      ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  )}
                >
                  {step > s.id ? "✓" : s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-8 mx-1",
                      step > s.id ? "bg-zinc-950 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[200px]">
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payout-amount">{t("business.earnings.amountToWithdraw")}</Label>
                  <Input
                    id="payout-amount"
                    type="number"
                    placeholder={t("business.earnings.enterAmount")}
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="text-lg font-mono"
                  />
                  {form.amount && (
                    <p className="text-sm text-muted-foreground">
                      {formatVND(parseInt(form.amount, 10) || 0)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(50)}
                    className="flex-1"
                  >
                    50%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(100)}
                    className="flex-1"
                  >
                    100%
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("business.earnings.minAmountNote")}
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bank-name">{t("business.earnings.bankName")}</Label>
                  <Input
                    id="bank-name"
                    placeholder={t("business.earnings.bankNamePlaceholder")}
                    value={form.bankName}
                    onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-account">{t("business.earnings.accountNumber")}</Label>
                  <Input
                    id="bank-account"
                    placeholder={t("business.earnings.enterAccountNumber")}
                    value={form.bankAccountNumber}
                    onChange={(e) => setForm((f) => ({ ...f, bankAccountNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-owner">{t("business.earnings.accountHolder")}</Label>
                  <Input
                    id="bank-owner"
                    placeholder={t("business.earnings.enterAccountHolder")}
                    value={form.bankAccountName}
                    onChange={(e) => setForm((f) => ({ ...f, bankAccountName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payout-note">{t("business.earnings.noteOptional")}</Label>
                  <Input
                    id="payout-note"
                    placeholder={t("business.earnings.notePlaceholder")}
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("business.earnings.confirmAmount")}</span>
                      <span className="font-mono font-semibold">
                        {formatVND(parseInt(form.amount, 10) || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("business.earnings.confirmBank")}</span>
                      <span className="font-medium">{form.bankName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("business.earnings.confirmAccountNumber")}</span>
                      <span className="font-mono">{form.bankAccountNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("business.earnings.confirmAccountHolder")}</span>
                      <span className="font-medium">{form.bankAccountName}</span>
                    </div>
                    {form.note && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t("business.earnings.confirmNote")}</span>
                        <span className="text-sm">{form.note}</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("business.earnings.confirmHint")}
                </p>
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-col items-center justify-center gap-3 py-6">
                <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold">{t("business.earnings.requestSentTitle")}</h3>
                <p className="text-sm text-muted-foreground text-center">
                  {t("business.earnings.requestSentDesc", { amount: formatVND(parseInt(form.amount, 10) || 0) })}
                </p>
              </div>
            )}
          </div>

          {/* Dialog Footer */}
          {step < 4 ? (
            <DialogFooter>
              {step > 1 && (
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t("business.earnings.back")}
                </Button>
              )}
              {step < 3 ? (
                <Button onClick={handleNext}>
                  {t("business.earnings.next")}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={createPayout.isPending}
                >
                  {createPayout.isPending ? t("business.earnings.processing") : t("business.earnings.confirmWithdrawal")}
                </Button>
              )}
            </DialogFooter>
          ) : (
            <DialogFooter>
              <Button onClick={handleCloseDialog}>{t("business.earnings.close")}</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});

EarningsPage.displayName = "EarningsPage";

export default EarningsPage;
