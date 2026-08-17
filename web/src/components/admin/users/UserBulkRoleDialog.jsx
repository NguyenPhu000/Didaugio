import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserCog } from "lucide-react";

export const UserBulkRoleDialog = ({
  open,
  onOpenChange,
  selectedCount,
  bulkRoleId,
  setBulkRoleId,
  assignableRoleOptions,
  onSubmit,
  bulkSubmitting,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
            <UserCog className="h-5 w-5 text-[#F3E600]" />
            Gán vai trò hàng loạt
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Cập nhật vai trò cho {selectedCount} người dùng đã chọn
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-3">
          <Select value={bulkRoleId} onValueChange={setBulkRoleId}>
            <SelectTrigger className="rounded-xl border border-black/[0.06] bg-[#F8F7F3] text-xs font-semibold h-10">
              <SelectValue placeholder="Chọn vai trò mới" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
              {assignableRoleOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-black/[0.04]">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full text-xs font-semibold h-9 px-4"
          >
            Hủy
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!bulkRoleId || bulkSubmitting}
            className="rounded-full bg-slate-950 hover:bg-black text-white font-bold text-xs h-9 px-5 shadow-sm"
          >
            {bulkSubmitting ? "Đang cập nhật..." : "Áp dụng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserBulkRoleDialog;
