import { useMemo, useState } from "react";
import { Ban, CheckCheck, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_CANCEL_REASONS = [
  "Khách yêu cầu hủy",
  "Không còn suất phù hợp",
  "Điều chỉnh lịch phục vụ",
  "Lý do vận hành khác",
];

const BulkActionBar = ({
  selectedCount = 0,
  cancelReasons = DEFAULT_CANCEL_REASONS,
  onBulkConfirm,
  onBulkCancel,
  onClearSelection,
  loading = false,
}) => {
  const [cancelReason, setCancelReason] = useState("");

  const canShow = selectedCount > 0;
  const canCancel = Boolean(cancelReason) && !loading;

  const subtitle = useMemo(() => {
    if (selectedCount <= 0) return "";
    return `${selectedCount} mục đang được chọn`;
  }, [selectedCount]);

  if (!canShow) return null;

  return (
    <div className="sticky bottom-4 z-40">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-lg backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Thao tác hàng loạt
          </p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={cancelReason} onValueChange={setCancelReason}>
            <SelectTrigger className="h-9 w-full sm:w-56">
              <SelectValue placeholder="Chọn lý do hủy" />
            </SelectTrigger>
            <SelectContent>
              {cancelReasons.map((reason) => (
                <SelectItem key={reason} value={reason}>
                  {reason}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            className="gap-1.5"
            onClick={() => onBulkConfirm?.()}
            disabled={loading}
          >
            <CheckCheck className="h-4 w-4" />
            Xác nhận
          </Button>

          <Button
            type="button"
            variant="destructive"
            className="gap-1.5"
            onClick={() => onBulkCancel?.(cancelReason)}
            disabled={!canCancel}
          >
            <Ban className="h-4 w-4" />
            Hủy hàng loạt
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onClearSelection?.()}
            disabled={loading}
            aria-label="Bỏ chọn tất cả"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionBar;
