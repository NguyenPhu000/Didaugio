import React, { memo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const ReviewFilterBar = memo(
  ({
    tabFilter,
    onTabChange,
    calculatedStats,
    attentionCount,
    search,
    onSearchChange,
    ratingFilter,
    onRatingFilterChange,
    selectedPlaceId,
    onPlaceChange,
    places,
  }) => {
    return (
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-border/60 pb-5">
        {/* Status Tabs Capsule */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-muted/80 rounded-[24px] overflow-x-auto">
          {[
            { id: "all", label: "Tất cả", count: calculatedStats.total },
            {
              id: "unreplied",
              label: "Chưa phản hồi",
              count: calculatedStats.pendingCount,
              badgeClass: "bg-amber-500 text-white",
            },
            {
              id: "replied",
              label: "Đã phản hồi",
              count: calculatedStats.repliedCount,
              badgeClass: "bg-emerald-500 text-white",
            },
            {
              id: "attention",
              label: "Cần chú ý (≤2★)",
              count: attentionCount,
              badgeClass: "bg-rose-500 text-white",
            },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 select-none",
                tabFilter === t.id
                  ? "bg-slate-950 text-white dark:bg-primary dark:text-primary-foreground shadow-xs"
                  : "text-slate-600 dark:text-muted-foreground hover:text-slate-950 dark:hover:text-white"
              )}
            >
              <span>{t.label}</span>
              {t.count > 0 && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-black",
                    t.badgeClass ||
                      (tabFilter === t.id
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 dark:bg-muted text-slate-700 dark:text-slate-300")
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search, Star & Place Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Tìm nội dung, khách..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-3 h-9 rounded-2xl text-xs bg-slate-50 dark:bg-muted/50 border-slate-200"
            />
          </div>

          <Select value={ratingFilter} onValueChange={onRatingFilterChange}>
            <SelectTrigger className="w-32 h-9 rounded-2xl text-xs border-slate-200">
              <SelectValue placeholder="Số sao" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">Tất cả sao</SelectItem>
              <SelectItem value="5">5 sao ★★★★★</SelectItem>
              <SelectItem value="4">4 sao ★★★★</SelectItem>
              <SelectItem value="3">3 sao ★★★</SelectItem>
              <SelectItem value="2">2 sao ★★</SelectItem>
              <SelectItem value="1">1 sao ★</SelectItem>
            </SelectContent>
          </Select>

          {places.length > 0 && (
            <Select value={selectedPlaceId} onValueChange={onPlaceChange}>
              <SelectTrigger className="w-44 h-9 rounded-2xl text-xs border-slate-200">
                <SelectValue placeholder="Cơ sở" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">Tất cả cơ sở</SelectItem>
                {places.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    );
  }
);

ReviewFilterBar.displayName = "ReviewFilterBar";
export default ReviewFilterBar;
