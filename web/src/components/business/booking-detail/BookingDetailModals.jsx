import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export const BookingDetailModals = ({
  cancelOpen,
  setCancelOpen,
  cancelReason,
  setCancelReason,
  onConfirmCancel,
  markPaidOpen,
  setMarkPaidOpen,
  markPaidNote,
  setMarkPaidNote,
  onConfirmMarkPaid,
  refundOpen,
  setRefundOpen,
  refundReason,
  setRefundReason,
  refundAmount,
  setRefundAmount,
  onConfirmRefund,
  actionLoading,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* ── Dialog Hủy đơn ── */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-md rounded-[32px] p-6 border border-slate-200/80 dark:border-border/80 shadow-2xl bg-white dark:bg-card">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-rose-600 font-black text-lg">
              {t("business.bookings.cancelTitle")}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {t("business.bookings.cancelDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t("business.bookings.reasonLabel")}
            </Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="VD: Cơ sở quá tải, khách yêu cầu hủy..."
              rows={3}
              className="rounded-2xl text-xs bg-slate-50 dark:bg-muted/50 border-slate-200"
            />
          </div>
          <DialogFooter className="gap-2 pt-2 border-t border-slate-100 dark:border-border/60">
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              className="rounded-2xl h-9 text-xs font-bold"
            >
              {t("common.back")}
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirmCancel}
              disabled={actionLoading}
              className="rounded-2xl h-9 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {actionLoading ? "Đang xử lý..." : t("business.bookings.confirmCancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Ghi nhận thanh toán ── */}
      <Dialog open={markPaidOpen} onOpenChange={setMarkPaidOpen}>
        <DialogContent className="max-w-md rounded-[32px] p-6 border border-slate-200/80 dark:border-border/80 shadow-2xl bg-white dark:bg-card">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="font-black text-lg text-slate-900 dark:text-white">
              Ghi nhận thanh toán tại quầy
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Xác nhận khách hàng đã hoàn tất thanh toán trực tiếp tại cơ sở.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Ghi chú hóa đơn / Biên nhận
            </Label>
            <Input
              value={markPaidNote}
              onChange={(e) => setMarkPaidNote(e.target.value)}
              placeholder="VD: Thu tiền mặt / Chuyển khoản QR ngân hàng..."
              className="rounded-2xl text-xs h-10 bg-slate-50 dark:bg-muted/50 border-slate-200"
            />
          </div>
          <DialogFooter className="gap-2 pt-2 border-t border-slate-100 dark:border-border/60">
            <Button
              variant="outline"
              onClick={() => setMarkPaidOpen(false)}
              className="rounded-2xl h-9 text-xs font-bold"
            >
              {t("common.back")}
            </Button>
            <Button
              onClick={onConfirmMarkPaid}
              disabled={actionLoading}
              className="rounded-2xl h-9 text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground"
            >
              {actionLoading ? "Đang lưu..." : "Xác nhận đã thanh toán"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Hoàn tiền ── */}
      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent className="max-w-md rounded-[32px] p-6 border border-slate-200/80 dark:border-border/80 shadow-2xl bg-white dark:bg-card">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="font-black text-lg text-amber-600 dark:text-amber-400">
              Xử lý hoàn tiền cho khách
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Hệ thống sẽ cập nhật trạng thái hoàn tiền và điều chỉnh sổ doanh thu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Số tiền hoàn trả (VNĐ) *
              </Label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="VD: 150000"
                className="rounded-2xl text-xs h-10 bg-slate-50 dark:bg-muted/50 border-slate-200"
              />
            </div>
            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Lý do hoàn tiền
              </Label>
              <Textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="VD: Khách không đến được do thời tiết, đã hoàn qua Momo..."
                rows={2}
                className="rounded-2xl text-xs bg-slate-50 dark:bg-muted/50 border-slate-200"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2 border-t border-slate-100 dark:border-border/60">
            <Button
              variant="outline"
              onClick={() => setRefundOpen(false)}
              className="rounded-2xl h-9 text-xs font-bold"
            >
              {t("common.back")}
            </Button>
            <Button
              onClick={onConfirmRefund}
              disabled={actionLoading || !refundAmount}
              className="rounded-2xl h-9 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
            >
              {actionLoading ? "Đang xử lý..." : "Xác nhận hoàn tiền"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingDetailModals;
