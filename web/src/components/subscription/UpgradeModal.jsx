import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, QrCode, CheckCircle2, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatVND } from "@/components/business/dashboardWidgetHelpers";
import {
  useProration,
  useUpgradeSubscription,
  useCurrentSubscription,
} from "@/hooks/queries/useSubscriptionQueries";

export default function UpgradeModal({ open, onOpenChange, targetPlan, currentPlan }) {
  const { t } = useTranslation();
  const [step, setStep] = useState("confirm");
  const [invoice, setInvoice] = useState(null);

  const { data: prorationRes, isLoading: prorationLoading } = useProration(
    open ? targetPlan?.id : null,
  );
  const upgradeMutation = useUpgradeSubscription();
  const { data: subRes, refetch: refetchSub } = useCurrentSubscription();

  const proration = prorationRes?.data?.data || prorationRes?.data || {};

  useEffect(() => {
    if (open) {
      setStep("confirm");
      setInvoice(null);
    }
  }, [open]);

  // Poll subscription status when waiting for payment
  useEffect(() => {
    if (step !== "qr" || !invoice) return;

    const interval = setInterval(() => {
      refetchSub().then((res) => {
        const sub = res?.data?.data;
        if (sub?.planId === targetPlan?.id) {
          setStep("success");
          clearInterval(interval);
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [step, invoice, targetPlan?.id, refetchSub]);

  const handleConfirm = () => {
    if (!targetPlan?.id) return;
    upgradeMutation.mutate(targetPlan.id, {
      onSuccess: (res) => {
        const invoiceData = res?.data?.data?.invoice || res?.data?.invoice;
        if (invoiceData?.qrUrl) {
          setInvoice(invoiceData);
          setStep("qr");
        } else {
          setStep("success");
        }
      },
    });
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle>{t("subscription.upgrade.title")}</DialogTitle>
              <DialogDescription>
                {currentPlan?.name} → {targetPlan?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {prorationLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              ) : (
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Gói mới</span>
                    <span className="font-medium">{targetPlan?.name}</span>
                  </div>
                  {proration.currentPlanCredit > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tín dụng còn lại</span>
                      <span className="text-emerald-600">
                        -{formatVND(proration.currentPlanCredit)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Tổng thanh toán</span>
                    <span className="text-lg font-bold">
                      {formatVND(proration.chargeAmount ?? targetPlan?.priceMonthly ?? 0)}
                    </span>
                  </div>
                  {proration.remainingDays > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Tính theo {proration.remainingDays} ngày còn lại của chu kỳ hiện tại
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={prorationLoading || upgradeMutation.isPending}
              >
                {upgradeMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("subscription.upgrade.confirm")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "qr" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                {t("subscription.upgrade.scanQR")}
              </DialogTitle>
              <DialogDescription>
                {t("subscription.upgrade.waiting")}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-4 py-4">
              {invoice?.qrUrl ? (
                <div className="rounded-lg border bg-white p-3">
                  <img
                    src={invoice.qrUrl}
                    alt="VietQR"
                    className="h-52 w-52"
                  />
                </div>
              ) : (
                <div className="flex h-52 w-52 items-center justify-center rounded-lg border">
                  <p className="text-sm text-muted-foreground">Không tạo được QR</p>
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-muted-foreground">Số tiền</p>
                <p className="text-2xl font-bold">{formatVND(invoice?.amount || 0)}</p>
              </div>

              {invoice?.transactionRef && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Nội dung chuyển khoản</p>
                  <p className="font-mono text-sm font-medium">{invoice.transactionRef}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang chờ xác nhận thanh toán...
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                {t("common.cancel")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                {t("common.success")}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-6">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                {targetPlan?.name}
              </Badge>
              <p className="text-center text-sm text-muted-foreground">
                Gói dịch vụ đã được nâng cấp thành công.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>{t("common.done")}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
