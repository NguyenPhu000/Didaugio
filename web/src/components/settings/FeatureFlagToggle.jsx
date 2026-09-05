import { useState } from "react";
import { Switch } from "@/components/ui/switch";
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
          "flex items-center justify-between gap-4 rounded-2xl p-4 transition-all duration-200",
          enabled
            ? "bg-[#F7F9F7] border border-emerald-100/80"
            : "bg-[#F9F9FB] border border-black/[0.02] hover:bg-[#F2F2F7]/80"
        )}
      >
        <div className="flex-1 space-y-1 pr-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">
              {name}
            </span>
            {critical && (
              <span className="rounded-full bg-red-50 text-red-600 px-2 py-0.5 text-[11px] font-semibold tracking-wide">
                QUAN TRỌNG
              </span>
            )}
            {percentageRollout != null && enabled && (
              <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[11px] font-medium">
                {percentageRollout}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-500 font-normal leading-relaxed">{description}</p>
          )}
        </div>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : (
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
          />
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-3xl border border-black/[0.04] bg-white p-6 sm:max-w-[420px] shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Xác nhận tắt tính năng
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs leading-relaxed text-slate-600">
            Bạn có chắc chắn muốn tắt <strong className="text-slate-900">{name}</strong>?
            {critical && " Đây là tính năng cốt lõi của hệ thống, việc tắt có thể làm gián đoạn trải nghiệm của người dùng và đối tác."}
          </p>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium px-4 h-9"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleConfirm}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 h-9 shadow-sm"
            >
              Xác nhận tắt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeatureFlagToggle;
