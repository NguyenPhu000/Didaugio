import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const CancelSubscriptionDialog = ({
  open,
  onOpenChange,
  planName,
  onConfirm,
  isLoading,
}) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-destructive font-extrabold text-lg">
            {t("subscription.cancel.title")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            {t("subscription.cancel.confirm", { planName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3">
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3.5">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>{t("subscription.cancel.warningLabel")}</strong>{" "}
              {t("subscription.cancel.warningText")}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">
              {t("subscription.cancel.reasonLabel")}
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("subscription.cancel.reasonPlaceholder")}
              rows={3}
              className="rounded-xl text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="rounded-xl text-xs font-bold cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            {t("subscription.cancel.keepPlan")}
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl text-xs font-bold cursor-pointer"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("subscription.cancel.confirmBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelSubscriptionDialog;
