import React from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const PayoutRejectDialog = ({
  rejectDialog,
  setRejectDialog,
  rejectReason,
  setRejectReason,
  handleReject,
  isPending,
}) => {
  return (
    <Dialog
      open={rejectDialog.open}
      onOpenChange={(open) => {
        if (!open) {
          setRejectDialog({ open: false, payoutId: null });
          setRejectReason("");
        }
      }}
    >
      <DialogContent className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            Từ chối yêu cầu rút tiền
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Vui lòng nhập lý do từ chối để thông báo cho đối tác.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-3">
          <Label
            htmlFor="reject-reason"
            className="text-xs font-bold text-slate-700"
          >
            Lý do từ chối
          </Label>
          <Input
            id="reject-reason"
            placeholder="VD: Thông tin tài khoản ngân hàng không chính xác..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="rounded-xl border border-black/[0.06] bg-[#F8F7F3] text-xs h-10"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-black/[0.04]">
          <Button
            variant="outline"
            onClick={() => {
              setRejectDialog({ open: false, payoutId: null });
              setRejectReason("");
            }}
            className="rounded-full text-xs font-semibold h-9 px-4 cursor-pointer"
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isPending}
            className="rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 px-5 shadow-sm cursor-pointer"
          >
            Xác nhận từ chối
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PayoutRejectDialog;
