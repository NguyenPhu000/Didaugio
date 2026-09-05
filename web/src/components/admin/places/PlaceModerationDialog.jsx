import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const PlaceModerationDialog = ({
  open,
  onOpenChange,
  moderationDialog,
  setModerationDialog,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl bg-white border border-black/[0.06] p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-950">
            {moderationDialog.action === "approved"
              ? "Duyệt địa điểm"
              : "Từ chối địa điểm"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {moderationDialog.place?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <label className="text-xs font-semibold text-slate-700">
            {moderationDialog.action === "approved"
              ? "Ghi chú duyệt (tùy chọn):"
              : "Lý do từ chối (bắt buộc, gửi thông báo cho đối tác):"}
          </label>
          <Textarea
            value={moderationDialog.comment}
            onChange={(e) =>
              setModerationDialog((prev) => ({
                ...prev,
                comment: e.target.value,
              }))
            }
            placeholder={
              moderationDialog.action === "approved"
                ? "Nhập ghi chú cho quản trị viên..."
                : "Nêu rõ lý do từ chối (thiếu thông tin, hình ảnh không đạt chuẩn...)"
            }
            rows={3}
            className="rounded-xl border border-black/[0.06] bg-[#F8F7F3] text-xs"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full text-xs font-semibold h-9 px-4"
          >
            Hủy
          </Button>
          <Button
            onClick={onConfirm}
            className={cn(
              "rounded-full text-xs font-semibold h-9 px-5 shadow-sm",
              moderationDialog.action === "approved"
                ? "bg-slate-950 text-white hover:bg-black"
                : "bg-rose-600 text-white hover:bg-rose-700"
            )}
          >
            Xác nhận
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlaceModerationDialog;
