import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AiPublishDialog({
  open,
  onOpenChange,
  revision,
  currentVersion,
  draftVersion,
  onConfirm,
  isPending = false,
  errorMessage = "",
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setReason(`Cập nhật nhanh cấu hình AI v${draftVersion ?? ""}`);
    }
  }, [open, draftVersion]);

  const confirm = (event) => {
    event.preventDefault();
    if (reason.trim().length < 5 || !Number.isInteger(revision)) return;
    onConfirm({ revision, changeReason: reason.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-black p-0 shadow-2xl dark:border-white">
        <DialogHeader className="border-b border-black/20 bg-primary/15 p-5 pr-12 dark:border-white/20">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Guarded mutation
          </p>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold uppercase tracking-tight">
            <Send aria-hidden="true" className="size-5" />
            Phát hành draft
          </DialogTitle>
          <DialogDescription>
            Draft sẽ trở thành cấu hình chạy trên Mobile. Hệ thống không tự
            retry khi revision đã cũ.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={confirm}>
          <div className="space-y-5 p-5">
            {errorMessage && (
              <p
                role="alert"
                className="border-l-4 border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {errorMessage}
              </p>
            )}
            <div className="border-y border-black/20 py-4 text-center dark:border-white/20">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Published → Draft
              </p>
              <p className="mt-2 font-mono text-xl font-bold">
                v{currentVersion ?? "—"} → v{draftVersion ?? "—"}
              </p>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="ai-publish-reason"
                className="font-mono text-[11px] font-semibold uppercase tracking-wide"
              >
                Lý do phát hành
              </Label>
              <Input
                id="ai-publish-reason"
                value={reason}
                maxLength={300}
                onChange={(event) => setReason(event.target.value)}
                className="rounded-none"
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
              loading={isPending}
              disabled={
                isPending ||
                reason.trim().length < 5 ||
                !Number.isInteger(revision) ||
                !Number.isInteger(currentVersion) ||
                !Number.isInteger(draftVersion)
              }
              className="rounded-none"
            >
              Xác nhận phát hành
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
