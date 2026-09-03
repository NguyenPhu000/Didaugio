import React, { memo } from "react";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { getTimeOfDay } from "@/components/booking/BookingCard";
import { formatDate } from "@/components/business/dashboardWidgetHelpers";
import { formatMoney } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export const QuickProcessPendingCard = memo(
  ({
    booking,
    isSelected,
    onToggleSelect,
    onApprove,
    onReject,
    isApproving,
    isRejecting,
  }) => {
    const timeOfDay = getTimeOfDay(booking.useTime, booking.useDate || booking.bookingAt);
    const placeName = booking.service?.place?.name || booking.place?.name;

    return (
      <div
        className={cn(
          "p-5 rounded-[28px] border transition-all duration-300 bg-white dark:bg-card shadow-xs hover:shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4",
          isSelected && "ring-2 ring-amber-500/80 bg-[#FFF9F2] dark:bg-amber-950/20 border-[#FCD4AF]"
        )}
      >
        {/* Left: Checkbox + Customer + Specs */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="mt-1"
          />

          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-base text-slate-950 dark:text-white truncate">
                {booking.guestName || booking.user?.fullName || "Khách vãng lai"}
              </span>
              <span className="font-mono font-bold text-xs text-slate-400">
                #{booking.bookingCode}
              </span>
              {timeOfDay && (
                <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border", timeOfDay.badgeClass)}>
                  {timeOfDay.label}
                </span>
              )}
              {placeName && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-muted text-slate-600 dark:text-slate-300">
                  {placeName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-muted-foreground flex-wrap font-medium">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {booking.service?.name || "Dịch vụ"}
              </span>
              <span className="text-slate-300">•</span>
              <span>{formatDate(booking.useDate || booking.bookingAt)}</span>
              {booking.useTime && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="font-bold text-slate-900 dark:text-white">{booking.useTime}</span>
                </>
              )}
              {booking.partySize && (
                <>
                  <span className="text-slate-300">•</span>
                  <span>{booking.partySize} khách</span>
                </>
              )}
              {booking.guestPhone && (
                <>
                  <span className="text-slate-300">•</span>
                  <span>{booking.guestPhone}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Price & Quick 1-Click Actions */}
        <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-border/60">
          <span className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight">
            {formatMoney(booking.finalPrice)}
          </span>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onApprove}
              disabled={isApproving}
              className="rounded-2xl h-8 px-4 text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground shadow-xs"
            >
              {isApproving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : null}
              Duyệt ngay
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              disabled={isRejecting}
              className="rounded-2xl h-8 px-3 text-xs font-bold text-rose-600 border-slate-200 hover:bg-rose-50 dark:border-border/80 dark:hover:bg-rose-950/40"
            >
              Từ chối
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

QuickProcessPendingCard.displayName = "QuickProcessPendingCard";
export default QuickProcessPendingCard;
