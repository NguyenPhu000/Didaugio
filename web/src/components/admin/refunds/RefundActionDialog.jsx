import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/formatters";

export const RefundActionDialog = ({
  open,
  onOpenChange,
  selectedPayment,
  dialogTab,
  setDialogTab,
  refundAmount,
  setRefundAmount,
  refundReason,
  setRefundReason,
  actionLoading,
  onApprove,
  onReject,
}) => {
  const paymentAmount = selectedPayment?.amount || 0;
  const alreadyRefunded = selectedPayment?.refundAmount || 0;
  const refundableAmount = Math.max(paymentAmount - alreadyRefunded, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[32px]">
        <DialogHeader>
          <DialogTitle>Xử lý yêu cầu hoàn tiền</DialogTitle>
          <DialogDescription>
            Duyệt hoàn tiền toàn phần/một phần hoặc từ chối yêu cầu hoàn tiền.
          </DialogDescription>
        </DialogHeader>

        {selectedPayment ? (
          <div className="space-y-5">
            <div className="grid gap-3 rounded-2xl border bg-muted/40 p-4 text-sm md:grid-cols-2">
              <div>
                <div className="text-muted-foreground text-xs">Mã đơn</div>
                <div className="font-mono font-semibold">
                  #{selectedPayment.booking?.bookingCode || "-"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Khách hàng</div>
                <div className="font-medium">
                  {selectedPayment.booking?.user?.profile?.fullName ||
                    selectedPayment.booking?.guestName ||
                    "-"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Tổng thanh toán</div>
                <div className="font-semibold text-foreground">
                  {formatMoney(paymentAmount)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Còn có thể hoàn</div>
                <div className="font-semibold text-emerald-600">
                  {formatMoney(refundableAmount)}
                </div>
              </div>
            </div>

            {/* Sub-tabs: Approve / Reject */}
            <div className="inline-flex rounded-xl border bg-muted p-1">
              <button
                type="button"
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                  dialogTab === "approve"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setDialogTab("approve")}
              >
                Duyệt Hoàn Tiền
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                  dialogTab === "reject"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setDialogTab("reject")}
              >
                Từ Chối
              </button>
            </div>

            {dialogTab === "approve" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="refund-amount" className="text-xs font-bold">
                    Số tiền hoàn
                  </Label>
                  <Input
                    id="refund-amount"
                    type="number"
                    min={1}
                    max={refundableAmount || paymentAmount}
                    step={1}
                    value={refundAmount}
                    onChange={(e) => {
                      const raw = e.target.value;
                      // Chỉ chấp nhận chuỗi rỗng hoặc số nguyên dương
                      if (raw === "" || /^\d+$/.test(raw)) {
                        setRefundAmount(raw);
                      }
                    }}
                    placeholder="Nhập số tiền cần hoàn"
                    className="rounded-2xl text-xs h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Để trống sẽ hoàn toàn bộ phần còn lại. Đã hoàn trước đó:{" "}
                    {formatMoney(alreadyRefunded)}. Tối đa có thể hoàn:{" "}
                    <span className="font-bold text-emerald-600">
                      {formatMoney(refundableAmount)}
                    </span>
                    .
                  </p>
                  {refundAmount &&
                    Number(refundAmount) > Number(refundableAmount || 0) && (
                      <p className="text-xs text-rose-600 font-bold">
                        Số tiền vượt quá mức cho phép ({formatMoney(refundAmount)})
                      </p>
                    )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refund-reason" className="text-xs font-bold">
                    Lý do hoàn tiền
                  </Label>
                  <Textarea
                    id="refund-reason"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Nhập lý do hoàn tiền"
                    className="min-h-[100px] rounded-2xl text-xs"
                  />
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={actionLoading}
                    className="rounded-2xl text-xs font-bold"
                  >
                    Đóng
                  </Button>
                  <Button
                    onClick={onApprove}
                    disabled={
                      actionLoading ||
                      (refundAmount !== "" &&
                        Number(refundAmount) > Number(refundableAmount || 0))
                    }
                    className="rounded-2xl text-xs font-bold bg-slate-950 text-white dark:bg-primary dark:text-primary-foreground"
                  >
                    {actionLoading && (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    )}
                    Xác nhận hoàn tiền
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  Khi từ chối, hệ thống sẽ lưu lý do để hiển thị trong lịch sử xử lý hoàn tiền.
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reject-reason" className="text-xs font-bold">
                    Lý do từ chối
                  </Label>
                  <Textarea
                    id="reject-reason"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Nhập lý do từ chối hoàn tiền"
                    className="min-h-[100px] rounded-2xl text-xs"
                  />
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={actionLoading}
                    className="rounded-2xl text-xs font-bold"
                  >
                    Đóng
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={onReject}
                    disabled={actionLoading}
                    className="rounded-2xl text-xs font-bold bg-rose-600 text-white"
                  >
                    {actionLoading && (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    )}
                    Từ chối yêu cầu
                  </Button>
                </DialogFooter>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default RefundActionDialog;
