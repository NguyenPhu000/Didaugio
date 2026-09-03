import React, { memo } from "react";
import { formatMoney } from "@/utils/formatters";
import { BOOKING_STATUS } from "@/constants/constants";
import { cn } from "@/lib/utils";
import { STATUS_CONFIGS } from "./scheduleConstants";

export const ScheduleBookingCard = memo(({ booking, onClick }) => {
  const cfg = STATUS_CONFIGS[booking.status] || STATUS_CONFIGS[BOOKING_STATUS.PENDING];

  return (
    <button
      type="button"
      onClick={() => onClick(booking)}
      className={cn(
        "w-full text-left p-2.5 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md hover:scale-[1.01] block select-none",
        cfg.bg
      )}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="font-extrabold text-xs text-slate-950 dark:text-white truncate">
          {booking.guestName || booking.user?.fullName || "Khách đặt"}
        </span>
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      </div>

      <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="truncate">{booking.service?.name || "Dịch vụ"}</span>
        <span className="font-mono font-bold text-slate-900 dark:text-white">
          {formatMoney(booking.finalPrice)}
        </span>
      </div>

      {booking.partySize && (
        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
          {booking.partySize} khách • {booking.useTime || "Đúng giờ"}
        </div>
      )}
    </button>
  );
});

ScheduleBookingCard.displayName = "ScheduleBookingCard";
export default ScheduleBookingCard;
