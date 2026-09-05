import React, { memo } from "react";
import { Building2, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const InteractivePlaceCard = memo(
  ({
    place,
    totalServices = 0,
    activeServices = 0,
    totalBookings = 0,
    isSelected,
    onClick,
    onAddService,
  }) => {
    return (
      <div
        onClick={onClick}
        className={cn(
          "relative p-5 rounded-[28px] border transition-all duration-300 cursor-pointer select-none text-left flex flex-col justify-between min-h-[140px]",
          isSelected
            ? "bg-[#FEE8D3] dark:bg-amber-950/40 border-[#FCD4AF] dark:border-amber-800 shadow-md ring-2 ring-amber-500/80"
            : "bg-white dark:bg-card border-slate-200/80 dark:border-border/80 hover:shadow-md hover:border-slate-300"
        )}
      >
        {/* Top row: Place Category & Active Status Indicator */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors",
                isSelected
                  ? "bg-amber-500 text-white"
                  : "bg-slate-100 dark:bg-muted text-slate-700 dark:text-slate-300"
              )}
            >
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">
              {place.category?.name || "Cơ sở"}
            </span>
          </div>

          {isSelected && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white">
              <Check className="w-3.5 h-3.5" /> Đang lọc
            </span>
          )}
        </div>

        {/* Middle row: Place Name & Address */}
        <div className="my-2 space-y-0.5">
          <h3 className="font-extrabold text-base text-slate-950 dark:text-white tracking-tight truncate">
            {place.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-muted-foreground truncate">
            {place.address || "Cần Thơ, Việt Nam"}
          </p>
        </div>

        {/* Bottom row: Service counts & Add quick trigger */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-border/60 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <span>{totalServices} dịch vụ</span>
            <span className="text-slate-300">•</span>
            <span className="text-blue-600 font-semibold">{totalBookings} lượt đặt</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddService(place.id);
            }}
            className={cn(
              "p-1.5 rounded-lg text-xs font-bold transition-colors hover:bg-slate-900 hover:text-white dark:hover:bg-primary dark:hover:text-primary-foreground",
              isSelected ? "bg-amber-600 text-white" : "bg-slate-100 dark:bg-muted text-slate-600"
            )}
            title="Thêm dịch vụ cho cơ sở này"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }
);

InteractivePlaceCard.displayName = "InteractivePlaceCard";
export default InteractivePlaceCard;
