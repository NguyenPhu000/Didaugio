import React from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge, getTimeOfDay } from "@/components/booking/BookingCard";
import { formatDate } from "@/components/business/dashboardWidgetHelpers";
import { formatMoney } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export const ScheduleDetailModal = ({ booking, open, onClose }) => {
  if (!booking) return null;
  const timeOfDay = getTimeOfDay(booking.useTime, booking.useDate || booking.bookingAt);
  const placeName = booking.service?.place?.name || booking.place?.name;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-[40px] p-6 sm:p-7 border border-slate-200/80 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono font-bold text-xs text-slate-400">
              #{booking.bookingCode}
            </span>
            <StatusBadge status={booking.status} />
            {timeOfDay && (
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                  timeOfDay.badgeClass
                )}
              >
                {timeOfDay.label}
              </span>
            )}
          </div>
          <DialogTitle className="font-black text-xl text-slate-900 dark:text-white tracking-tight">
            {booking.guestName || booking.user?.fullName || "Khách đặt dịch vụ"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-muted/40 border border-slate-100 dark:border-border/60 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Dịch vụ:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {booking.service?.name}
              </span>
            </div>
            {placeName && (
              <div className="flex justify-between">
                <span className="text-slate-400">Cơ sở:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {placeName}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Ngày sử dụng:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatDate(booking.useDate || booking.bookingAt)} • {booking.useTime || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Số lượng khách:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {booking.partySize || 1} người
              </span>
            </div>
            {(booking.guestPhone || booking.user?.phone) && (
              <div className="flex justify-between">
                <span className="text-slate-400">Số điện thoại:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {booking.guestPhone || booking.user?.phone}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FEE8D3]/60 dark:bg-amber-950/30 border border-[#FCD4AF] dark:border-amber-900/50">
            <span className="font-bold text-slate-800 dark:text-amber-200">
              Tổng tiền thanh toán
            </span>
            <span className="font-black text-lg text-slate-950 dark:text-white">
              {formatMoney(booking.finalPrice)}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-slate-100 dark:border-border/60">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-2xl text-xs font-bold w-full"
          >
            Đóng
          </Button>
          <Button
            asChild
            className="rounded-2xl text-xs font-bold bg-slate-950 text-white w-full"
          >
            <Link to={`/business/bookings/${booking.id}`}>Xem chi tiết đầy đủ ↗</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleDetailModal;
