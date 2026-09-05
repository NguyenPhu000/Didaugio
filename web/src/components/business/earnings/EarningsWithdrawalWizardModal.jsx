import React from "react";
import { formatMoney } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

const MIN_WITHDRAWAL_AMOUNT = 50000;

const STEPS = [
  { id: 1, title: "Số tiền", description: "Nhập số tiền muốn rút" },
  { id: 2, title: "Ngân hàng", description: "Thông tin tài khoản nhận" },
  { id: 3, title: "Xác nhận", description: "Kiểm tra lại thông tin" },
  { id: 4, title: "Hoàn tất", description: "Gửi yêu cầu thành công" },
];

export const EarningsWithdrawalWizardModal = ({
  open,
  onClose,
  step,
  form,
  setForm,
  earnings,
  onQuickAmount,
  onNext,
  onBack,
  onSubmit,
  isPending,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-[40px] p-7 sm:p-8 border border-slate-200/80 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-black text-xl text-slate-900 dark:text-white tracking-tight">
            Tạo Yêu Cầu Rút Tiền
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Số dư khả dụng có thể rút:{" "}
            <strong className="text-slate-900 dark:text-white">
              {formatMoney(earnings.availableBalance || 0)}
            </strong>
          </DialogDescription>
        </DialogHeader>

        {/* Stepper Pills */}
        <div className="flex items-center gap-1.5 py-2">
          {STEPS.map((s) => (
            <div key={s.id} className="flex-1 flex items-center gap-1.5">
              <div
                className={cn(
                  "h-1.5 rounded-full flex-1 transition-all duration-300",
                  step >= s.id
                    ? "bg-slate-950 dark:bg-primary"
                    : "bg-slate-200 dark:bg-muted"
                )}
              />
            </div>
          ))}
        </div>

        <div className="py-2 text-xs">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Nhập số tiền muốn rút (VNĐ)
                </Label>
                <Input
                  type="number"
                  placeholder="VD: 500000"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  className="h-11 rounded-2xl text-base font-black tracking-tight"
                />
                {form.amount && (
                  <p className="text-xs font-bold text-amber-600">
                    = {formatMoney(parseInt(form.amount, 10) || 0)}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onQuickAmount(50)}
                  className="flex-1 py-2 rounded-2xl bg-slate-100 dark:bg-muted hover:bg-slate-200 font-bold text-xs transition-colors"
                >
                  Rút 50%
                </button>
                <button
                  type="button"
                  onClick={() => onQuickAmount(100)}
                  className="flex-1 py-2 rounded-2xl bg-slate-100 dark:bg-muted hover:bg-slate-200 font-bold text-xs transition-colors"
                >
                  Rút toàn bộ 100%
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                Số tiền rút tối thiểu: {formatMoney(MIN_WITHDRAWAL_AMOUNT)} / lần.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Tên Ngân Hàng</Label>
                <Input
                  placeholder="VD: Vietcombank, MB Bank, Techcombank..."
                  value={form.bankName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bankName: e.target.value }))
                  }
                  className="h-10 rounded-2xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Số Tài Khoản</Label>
                <Input
                  placeholder="Nhập số tài khoản thụ hưởng"
                  value={form.bankAccountNumber}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      bankAccountNumber: e.target.value,
                    }))
                  }
                  className="h-10 rounded-2xl text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Tên Chủ Tài Khoản</Label>
                <Input
                  placeholder="VD: NGUYEN VAN A"
                  value={form.bankAccountName}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      bankAccountName: e.target.value,
                    }))
                  }
                  className="h-10 rounded-2xl text-xs uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Ghi Chú (Tùy Chọn)</Label>
                <Input
                  placeholder="VD: Rút doanh thu tour du lịch tháng 8"
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
                  }
                  className="h-10 rounded-2xl text-xs"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-muted/40 border border-slate-100 dark:border-border/60 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Số tiền rút:</span>
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {formatMoney(parseInt(form.amount, 10) || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ngân hàng:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {form.bankName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số tài khoản:</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    {form.bankAccountNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Chủ tài khoản:</span>
                  <span className="font-bold text-slate-900 dark:text-white uppercase">
                    {form.bankAccountName}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Yêu cầu rút tiền sẽ được bộ phận tài chính xét duyệt trong vòng 24 giờ làm việc.
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                Gửi Yêu Cầu Thành Công
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Hệ thống đã tiếp nhận yêu cầu rút tiền của bạn. Bạn có thể theo dõi tiến độ ở bảng lịch sử bên dưới.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-slate-100 dark:border-border/60">
          {step < 4 ? (
            <>
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="rounded-2xl text-xs font-bold"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Quay lại
                </Button>
              )}
              {step < 3 ? (
                <Button
                  onClick={onNext}
                  className="rounded-2xl text-xs font-bold bg-slate-950 text-white dark:bg-primary dark:text-primary-foreground ml-auto"
                >
                  Tiếp tục <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={onSubmit}
                  disabled={isPending}
                  className="rounded-2xl text-xs font-bold bg-slate-950 text-white dark:bg-primary dark:text-primary-foreground ml-auto"
                >
                  {isPending && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  )}
                  Gửi yêu cầu
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={onClose}
              className="rounded-2xl text-xs font-bold bg-slate-950 text-white dark:bg-primary dark:text-primary-foreground w-full"
            >
              Hoàn tất
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EarningsWithdrawalWizardModal;
