// MAP: EarningsPage
// ├── UI: @/components/business/earnings/{EarningsKpiGrid, EarningsPayoutHistory, EarningsBankCard, RequestPayoutModal}
// └── API: @/hooks/queries/usePayoutQueries

import { memo, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useEarnings,
  usePayoutHistory,
  useCreatePayout,
  useCancelPayout,
} from "@/hooks/queries/usePayoutQueries";
import FinancialSubNav from "@/components/business/FinancialSubNav";
import { formatMoney } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Extracted Sub-Components
import EarningsMetricsGrid from "@/components/business/earnings/EarningsMetricsGrid";
import EarningsWithdrawalWizardModal from "@/components/business/earnings/EarningsWithdrawalWizardModal";
import EarningsPayoutHistoryTable from "@/components/business/earnings/EarningsPayoutHistoryTable";

const MIN_WITHDRAWAL_AMOUNT = 50000;

const EarningsPage = memo(() => {
  const { t } = useTranslation();

  const [payoutOpen, setPayoutOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    amount: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
    note: "",
  });

  const [payoutFilter, setPayoutFilter] = useState({
    status: "all",
    search: "",
  });

  const { data: earningsRes, isLoading: earningsLoading } = useEarnings();
  const { data: historyRes, isLoading: historyLoading } = usePayoutHistory({ page: 1, limit: 50 });
  const createPayout = useCreatePayout();
  const cancelPayout = useCancelPayout();

  const earnings = earningsRes?.data || {};
  const payouts = historyRes?.data?.payouts || [];

  const filteredPayouts = useMemo(() => {
    return payouts.filter((p) => {
      const matchesStatus = payoutFilter.status === "all" || p.status === payoutFilter.status;
      const matchesSearch =
        !payoutFilter.search.trim() ||
        p.bankName?.toLowerCase().includes(payoutFilter.search.toLowerCase()) ||
        p.bankAccount?.toLowerCase().includes(payoutFilter.search.toLowerCase()) ||
        p.bankAccountNumber?.toLowerCase().includes(payoutFilter.search.toLowerCase()) ||
        p.note?.toLowerCase().includes(payoutFilter.search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [payouts, payoutFilter]);

  const resetForm = useCallback(() => {
    setForm({
      amount: "",
      bankName: "",
      bankAccountNumber: "",
      bankAccountName: "",
      note: "",
    });
    setStep(1);
  }, []);

  const handleOpenDialog = useCallback(() => {
    resetForm();
    setPayoutOpen(true);
  }, [resetForm]);

  const handleCloseDialog = useCallback(() => {
    setPayoutOpen(false);
    setTimeout(resetForm, 200);
  }, [resetForm]);

  const handleQuickAmount = useCallback(
    (percentage) => {
      const available = earnings.availableBalance || 0;
      const amount = Math.floor((available * percentage) / 100);
      setForm((f) => ({ ...f, amount: String(amount) }));
    },
    [earnings.availableBalance]
  );

  const handleNext = () => {
    if (step === 1) {
      const amount = parseInt(form.amount, 10);
      if (!amount || amount <= 0) {
        toast.error("Vui lòng nhập số tiền hợp lệ");
        return;
      }
      if (amount > (earnings.availableBalance || 0)) {
        toast.error("Số tiền rút vượt quá số dư khả dụng");
        return;
      }
      if (amount < MIN_WITHDRAWAL_AMOUNT) {
        toast.error(`Số tiền rút tối thiểu là ${formatMoney(MIN_WITHDRAWAL_AMOUNT)}`);
        return;
      }
    }
    if (step === 2) {
      if (!form.bankName.trim()) {
        toast.error("Vui lòng nhập tên ngân hàng");
        return;
      }
      if (!form.bankAccountNumber.trim()) {
        toast.error("Vui lòng nhập số tài khoản");
        return;
      }
      if (!form.bankAccountName.trim()) {
        toast.error("Vui lòng nhập tên chủ tài khoản");
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
      toast.success("Đã gửi yêu cầu rút tiền thành công");
    } catch {
      toast.error("Gửi yêu cầu rút tiền thất bại");
    }
  };

  const handleCancelPayout = async (id) => {
    try {
      await cancelPayout.mutateAsync(id);
      toast.success("Đã hủy yêu cầu rút tiền");
    } catch {
      toast.error("Không thể hủy yêu cầu");
    }
  };

  if (earningsLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] dark:bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        <Skeleton className="h-10 w-48 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-[32px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto font-sans transition-colors duration-200">
      {/* ── Sub Navigation ── */}
      <FinancialSubNav />

      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t("business.earnings.title")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
            Theo dõi tổng quan tài chính, số dư khả dụng và quản lý rút tiền doanh nghiệp
          </p>
        </div>

        <Button
          onClick={handleOpenDialog}
          className="w-full sm:w-auto justify-center rounded-2xl h-10 px-5 text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground shadow-xs gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Yêu cầu rút tiền
        </Button>
      </div>

      {/* ── Top Bento KPI Metrics ── */}
      <EarningsMetricsGrid earnings={earnings} />

      {/* ── Payout History Bento Section ── */}
      <EarningsPayoutHistoryTable
        payoutFilter={payoutFilter}
        setPayoutFilter={setPayoutFilter}
        historyLoading={historyLoading}
        filteredPayouts={filteredPayouts}
        onCancelPayout={handleCancelPayout}
        cancelPending={cancelPayout.isPending}
      />

      {/* ── Withdrawal Dialog ── */}
      <EarningsWithdrawalWizardModal
        open={payoutOpen}
        onClose={handleCloseDialog}
        step={step}
        form={form}
        setForm={setForm}
        earnings={earnings}
        onQuickAmount={handleQuickAmount}
        onNext={handleNext}
        onBack={handleBack}
        onSubmit={handleSubmit}
        isPending={createPayout.isPending}
      />
    </div>
  );
});

EarningsPage.displayName = "EarningsPage";
export default EarningsPage;
