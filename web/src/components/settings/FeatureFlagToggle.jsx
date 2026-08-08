import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from "@/components/ui";
import { Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const FeatureFlagToggle = ({
  name,
  description,
  enabled,
  onToggle,
  critical = false,
  percentageRollout,
  loading = false,
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState(false);

  const handleToggle = (checked) => {
    if (critical && !checked) {
      setPendingValue(checked);
      setConfirmOpen(true);
    } else {
      onToggle(checked);
    }
  };

  const handleConfirm = () => {
    onToggle(pendingValue);
    setConfirmOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          "flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors",
          enabled ? "border-emerald-200 bg-emerald-50/70" : "border-zinc-200 bg-white"
        )}
      >
        <div className="flex-1 space-y-0.5 pr-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-900">
              {name}
            </span>
            {critical && (
              <Badge
                variant="outline"
                className="rounded-full border-red-300 px-2 py-0.5 text-xs uppercase"
              >
                CRITICAL
              </Badge>
            )}
            {percentageRollout != null && enabled && (
              <Badge
                variant="outline"
                className="rounded-full border-blue-300 px-2 py-0.5 text-xs"
              >
                {percentageRollout}%
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            className={cn(
              critical && !enabled && "border-red-200"
            )}
          />
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-2xl border-black sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              XÁC NHẬN TẮT TÍNH NĂNG
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc chắn muốn tắt <strong className="uppercase">{name}</strong>?
            {critical && " Đây là tính năng quan trọng, việc tắt có thể ảnh hưởng đến toàn bộ hệ thống."}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="rounded-xl border-black/30 text-sm"
            >
              HỦY
            </Button>
            <Button
              onClick={handleConfirm}
              className="rounded-xl border-2 border-red-600 bg-red-600 text-sm font-semibold uppercase text-white hover:bg-red-700"
            >
              TẮT TÍNH NĂNG
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeatureFlagToggle;
