import React, { memo } from "react";
import { cn } from "@/lib/utils";
import PlaceBookingCard from "./PlaceBookingCard";

export const BookingPlacesSection = memo(
  ({ places, selectedPlace, onSelectPlace, placeBookingStats, totalBookingsCount }) => {
    if (!places || places.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Cơ Sở Đón Tiếp & Quản Lý Đơn
            </h2>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              Nhấp vào từng cơ sở để xem và xử lý đơn đặt chỗ của riêng chi nhánh đó
            </p>
          </div>

          {selectedPlace !== "all" && (
            <button
              type="button"
              onClick={() => onSelectPlace("all")}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 underline"
            >
              Xem tất cả cơ sở
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* All Places Card */}
          <div
            onClick={() => onSelectPlace("all")}
            className={cn(
              "p-5 rounded-[28px] border transition-all duration-300 cursor-pointer select-none text-left flex flex-col justify-between min-h-[130px]",
              selectedPlace === "all"
                ? "bg-slate-950 text-white dark:bg-primary dark:text-primary-foreground shadow-md ring-2 ring-slate-950/20"
                : "bg-white dark:bg-card border-slate-200/80 dark:border-border/80 hover:shadow-md"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
                Toàn bộ hệ thống
              </span>
              {selectedPlace === "all" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20">
                  Đang xem
                </span>
              )}
            </div>

            <div className="my-2">
              <h3 className="font-black text-lg tracking-tight">Tất Cả Cơ Sở</h3>
              <p className="text-xs opacity-70 mt-0.5">
                {places.length} địa điểm kinh doanh
              </p>
            </div>

            <div className="pt-2 border-t border-white/10 text-xs font-bold opacity-80">
              Tổng cộng {totalBookingsCount} đơn hiện tại
            </div>
          </div>

          {/* Individual Place Cards */}
          {places.map((place) => {
            const pStats = placeBookingStats[place.id] || { total: 0, pending: 0 };
            return (
              <PlaceBookingCard
                key={place.id}
                place={place}
                totalBookings={pStats.total}
                pendingBookings={pStats.pending}
                isSelected={selectedPlace === String(place.id)}
                onClick={() => onSelectPlace(String(place.id))}
              />
            );
          })}
        </div>
      </div>
    );
  }
);

BookingPlacesSection.displayName = "BookingPlacesSection";
export default BookingPlacesSection;
