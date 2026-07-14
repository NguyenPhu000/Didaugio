import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarClock, CheckCircle2, Loader2, QrCode } from "lucide-react";
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
  useCurrentSubscription,
  useDowngradeSubscription,
  useProration,
  useUpgradeSubscription,
} from "@/hooks/queries/useSubscriptionQueries";

function unwrapResponse(res) {
  return res?.data?.data || res?.data || {};
}

export default function UpgradeModal({ open, onOpenChange, targetPlan, currentPlan, billingCycle = "monthly" }) {
  const { t } = useTranslation();
  const [step, setStep] = useState("confirm");
  const [invoice, setInvoice] = useState(null);

  const { data: prorationRes, isLoading: prorationLoading } = useProration(
    open ? targetPlan?.id : null,
    billingCycle,
  );
  const upgradeMutation = useUpgradeSubscription();
  const downgradeMutation = useDowngradeSubscription();
  const { refetch: refetchSub } = useCurrentSubscription();

  const proration = unwrapResponse(prorationRes);
  const direction = useMemo(() => {
    if (proration.direction) return proration.direction;
    const currentOrder = Number(currentPlan?.sortOrder || 0);
    const targetOrder = Number(targetPlan?.sortOrder || 0);
    return targetOrder < currentOrder ? "downgrade" : "upgrade";
  }, [currentPlan?.sortOrder, proration.direction, targetPlan?.sortOrder]);
  const isDowngrade = direction === "downgrade";
  const isSubmitting = upgradeMutation.isPending || downgradeMutation.isPending;

  useEffect(() => {
    if (open) {
      setStep("confirm");
      setInvoice(null);
    }
  }, [open]);

  useEffect(() => {
    if (step !== "qr" || !invoice || !targetPlan?.id) return undefined;

    const interval = setInterval(() => {
      refetchSub().then((res) => {
        const sub = unwrapResponse(res);
        if (sub?.planId === targetPlan.id && sub?.billingCycle === billingCycle) {
          setStep("success");
          clearInterval(interval);
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [billingCycle, invoice, refetchSub, step, targetPlan?.id]);

  const handleConfirm = () => {
    if (!targetPlan?.id) return;

    if (isDowngrade) {
      downgradeMutation.mutate(targetPlan.id, {
        onSuccess: () => setStep("success"),
      });
      return;
    }

    upgradeMutation.mutate({ targetPlanId: targetPlan.id, billingCycle }, {
      onSuccess: (res) => {
        const invoiceData = unwrapResponse(res)?.invoice;
        if (invoiceData?.qrUrl) {
          setInvoice(invoiceData);
          setStep("qr");
        } else {
          refetchSub();
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
              <DialogTitle>
                {isDowngrade ? t("subscription.changePlan.downgradeTitle") : t("subscription.upgrade.title")}
              </DialogTitle>
              <DialogDescription>
                {currentPlan?.name} {"->"} {targetPlan?.name}
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
                    <span className="text-muted-foreground">{t("subscription.changePlan.newPlan")}</span>
                    <span className="font-medium">{targetPlan?.name}</span>
                  </div>

                  {isDowngrade && (
                    <div className="flex items-center justify-between gap-4 rounded-md bg-sky-50 px-3 py-2 text-sm text-sky-800">
                      <span className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4" />
                        {t("subscription.changePlan.effectiveAt")}
                      </span>
                      <span className="font-medium">
                        {proration.effectiveAt
                          ? new Date(proration.effectiveAt).toLocaleDateString("vi-VN")
                          : t("subscription.changePlan.endOfCycle")}
                      </span>
                    </div>
                  )}

                  {proration.unusedCredit > 0 && !isDowngrade && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("subscription.changePlan.remainingCredit")}</span>
                      <span className="text-emerald-600">
                        -{formatVND(proration.unusedCredit)}
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {isDowngrade ? t("subscription.changePlan.payNow") : t("subscription.changePlan.totalPayment")}
                    </span>
                    <span className="text-lg font-bold">
                      {formatVND(
                        proration.chargeAmount
                        ?? (billingCycle === "yearly" ? targetPlan?.priceYearly : targetPlan?.priceMonthly)
                        ?? 0,
                      )}
                    </span>
                  </div>

                  {isDowngrade ? (
                    <p className="text-xs text-muted-foreground">
                      {t("subscription.changePlan.downgradeNote")}
                    </p>
                  ) : proration.remainingDays > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {t("subscription.changePlan.remainingDaysNote", { days: proration.remainingDays })}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={prorationLoading || isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isDowngrade ? t("subscription.changePlan.scheduleDowngrade") : t("subscription.upgrade.confirm")}
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
              <DialogDescription>{t("subscription.upgrade.waiting")}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-4 py-4">
              {invoice?.qrUrl ? (
                <div className="rounded-lg border bg-white p-3">
                  <img src={invoice.qrUrl} alt="VietQR" className="h-52 w-52" />
                </div>
              ) : (
                <div className="flex h-52 w-52 items-center justify-center rounded-lg border">
                  <p className="text-sm text-muted-foreground">{t("subscription.changePlan.qrUnavailable")}</p>
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-muted-foreground">{t("subscription.changePlan.amount")}</p>
                <p className="text-2xl font-bold">{formatVND(invoice?.amount || 0)}</p>
              </div>

              {invoice?.transactionRef && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">{t("subscription.changePlan.transferContent")}</p>
                  <p className="font-mono text-sm font-medium">{invoice.transactionRef}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("subscription.changePlan.waitingPayment")}
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
                {isDowngrade
                  ? t("subscription.changePlan.downgradeSuccess")
                  : t("subscription.changePlan.upgradeSuccess")}
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
