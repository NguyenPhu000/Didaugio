import React from "react";
import { cn } from "@/lib/utils";
import { TIME_SLOTS, isSameDay } from "./scheduleConstants";
import ScheduleBookingCard from "./ScheduleBookingCard";

export const ScheduleDayColumnGrid = ({ date, bookings, onViewBooking }) => {
  const isToday = isSameDay(date, new Date());

  const getBookingsForSlot = (timeId) => {
    const slotHour = parseInt(timeId.split(":")[0], 10);
    return bookings.filter((b) => {
      if (!b.useTime) return false;
      const bookingHour = parseInt(b.useTime.split(":")[0], 10);
      return bookingHour === slotHour;
    });
  };

  return (
    <div
      className={cn(
        "flex-1 min-w-[130px] border-r border-slate-100 dark:border-border/60 last:border-r-0",
        isToday && "bg-slate-50/50 dark:bg-muted/20"
      )}
    >
      {TIME_SLOTS.map((slot) => {
        const slotBookings = getBookingsForSlot(slot.id);

        return (
          <div
            key={slot.id}
            className={cn(
              "min-h-[80px] border-b border-slate-100 dark:border-border/50 p-1.5 transition-colors",
              slotBookings.length > 0 ? "bg-white/80 dark:bg-card/80" : ""
            )}
          >
            {slotBookings.length > 0 ? (
              <div className="space-y-1.5">
                {slotBookings.slice(0, 2).map((b) => (
                  <ScheduleBookingCard
                    key={b.id}
                    booking={b}
                    onClick={onViewBooking}
                  />
                ))}
                {slotBookings.length > 2 && (
                  <p className="text-[10px] font-bold text-amber-600 text-center">
                    +{slotBookings.length - 2} đơn khác
                  </p>
                )}
              </div>
            ) : (
              <div className="w-full h-full min-h-[60px] flex items-center justify-center opacity-10">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ScheduleDayColumnGrid;
