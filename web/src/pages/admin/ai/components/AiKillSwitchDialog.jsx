import { useEffect, useState } from "react";
import { Power, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default function AiKillSwitchDialog({
  open,
  onOpenChange,
  enabled,
  onConfirm,
  isPending = false,
}) {
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("");
      setConfirmation("");
    }
  }, [open]);

  const confirm = (event) => {
    event.preventDefault();
    if (reason.trim().length < 5 || confirmation !== "TAT AI") return;
    onConfirm({ enabled, reason: reason.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-black p-0 shadow-2xl dark:border-white">
        <DialogHeader className="border-b border-destructive/40 bg-destructive/10 p-5 pr-12">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-destructive">
            Emergency control
          </p>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold uppercase tracking-tight">
            <TriangleAlert
              aria-hidden="true"
              className="size-5 text-destructive"
            />
            {enabled ? "Tắt AI runtime" : "Bật lại AI runtime"}
          </DialogTitle>
          <DialogDescription>
            Thao tác tác động ngay đến Mobile fallback và luôn được audit.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={confirm}>
          <div className="space-y-5 p-5">
            <div className="space-y-2">
              <Label
                htmlFor="ai-kill-reason"
                className="font-mono text-[11px] font-semibold uppercase tracking-wide"
              >
                Lý do thay đổi kill switch
              </Label>
              <Input
                id="ai-kill-reason"
                value={reason}
                maxLength={300}
                onChange={(event) => setReason(event.target.value)}
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="ai-kill-confirmation"
                className="font-mono text-[11px] font-semibold uppercase tracking-wide"
              >
                Nhập TAT AI để xác nhận
              </Label>
              <Input
                id="ai-kill-confirmation"
                value={confirmation}
                autoComplete="off"
                onChange={(event) => setConfirmation(event.target.value)}
                className="rounded-none font-mono"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 border-t border-black/20 p-5 dark:border-white/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-none"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant={enabled ? "destructive" : "default"}
              loading={isPending}
              disabled={
                isPending ||
                reason.trim().length < 5 ||
                confirmation !== "TAT AI"
              }
              className="rounded-none"
            >
              <Power aria-hidden="true" />
              {enabled ? "Xác nhận tắt AI" : "Xác nhận bật AI"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
