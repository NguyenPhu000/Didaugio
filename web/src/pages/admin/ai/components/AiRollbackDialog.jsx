import { useEffect, useState } from "react";
import { ArchiveRestore } from "lucide-react";
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

export default function AiRollbackDialog({
  open,
  onOpenChange,
  currentVersion,
  versions = [],
  onConfirm,
  isPending = false,
  errorMessage = "",
}) {
  const [targetVersion, setTargetVersion] = useState("");
  const [reason, setReason] = useState("");
  const rollbackVersions = versions.filter(
    (version) =>
      version.status !== "draft" && version.version !== currentVersion,
  );

  useEffect(() => {
    if (!open) {
      setTargetVersion("");
      setReason("");
    }
  }, [open]);

  const confirm = (event) => {
    event.preventDefault();
    const target = Number(targetVersion);
    if (
      !Number.isInteger(target) ||
      target <= 0 ||
      reason.trim().length < 5
    ) {
      return;
    }
    onConfirm({ targetVersion: target, changeReason: reason.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-black p-0 shadow-2xl dark:border-white">
        <DialogHeader className="border-b border-black/20 bg-primary/15 p-5 pr-12 dark:border-white/20">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Guarded mutation
          </p>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold uppercase tracking-tight">
            <ArchiveRestore aria-hidden="true" className="size-5" />
            Rollback cấu hình
          </DialogTitle>
          <DialogDescription>
            Snapshot được chọn sẽ được sao chép thành một phiên bản published
            mới; lịch sử cũ không bị sửa.
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
            <div className="space-y-2">
              <Label
                htmlFor="ai-rollback-version"
                className="font-mono text-[11px] font-semibold uppercase tracking-wide"
              >
                Phiên bản đích
              </Label>
              <select
                id="ai-rollback-version"
                value={targetVersion}
                onChange={(event) => setTargetVersion(event.target.value)}
                className="h-10 w-full rounded-none border border-input bg-background px-3 font-mono text-sm"
              >
                <option value="">Chọn phiên bản</option>
                {rollbackVersions.map((version) => (
                  <option key={version.version} value={version.version}>
                    v{version.version} · {version.status}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-y border-black/20 py-4 text-center dark:border-white/20">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Current → Target
              </p>
              <p className="mt-2 font-mono text-xl font-bold">
                v{currentVersion ?? "—"} →{" "}
                {targetVersion ? `v${targetVersion}` : "—"}
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="ai-rollback-reason"
                className="font-mono text-[11px] font-semibold uppercase tracking-wide"
              >
                Lý do rollback
              </Label>
              <Input
                id="ai-rollback-reason"
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
                !targetVersion ||
                reason.trim().length < 5 ||
                !Number.isInteger(currentVersion)
              }
              className="rounded-none"
            >
              Xác nhận rollback
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
