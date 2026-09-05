import React, { memo } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import QuickProcessPendingCard from "./QuickProcessPendingCard";
import { cn } from "@/lib/utils";

export const QuickProcessPendingTab = memo(
  ({
    places,
    pending,
    filteredPending,
    selectedPlaceId,
    setSelectedPlaceId,
    selected,
    setSelected,
    toggleSelect,
    selectAll,
    bulkApprove,
    bulkReject,
    bulkActionLoading,
    loading,
    busyId,
    handleApproveOne,
    handleRejectOne,
  }) => {
    return (
      <div className="space-y-4 focus-visible:ring-0">
        {/* Place Filter Bar */}
        {places.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedPlaceId("all")}
              className={cn(
                "px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 border cursor-pointer",
                selectedPlaceId === "all"
                  ? "bg-slate-950 text-white border-slate-950 shadow-xs dark:bg-primary dark:text-primary-foreground"
                  : "bg-white dark:bg-card border-slate-200/80 dark:border-border/80 text-slate-600 hover:text-slate-950"
              )}
            >
              Tất cả cơ sở ({pending.length})
            </button>

            {places.map((p) => {
              const count = pending.filter(
                (b) => (b.service?.place?.id || b.place?.id) === p.id
              ).length;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlaceId(String(p.id))}
                  className={cn(
                    "px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 border flex items-center gap-2 cursor-pointer",
                    selectedPlaceId === String(p.id)
                      ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                      : "bg-white dark:bg-card border-slate-200/80 dark:border-border/80 text-slate-600 hover:text-slate-950"
                  )}
                >
                  <span>{p.name}</span>
                  {count > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 text-inherit font-black">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Sticky Bulk Island */}
        {selected.length > 0 && (
          <div className="sticky top-4 z-40 p-4 rounded-[32px] border border-slate-200/80 bg-white/95 dark:bg-card/95 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Đã chọn {selected.length} đơn đặt chỗ
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={bulkApprove}
                disabled={bulkActionLoading}
                className="rounded-2xl h-8 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
              >
                {bulkActionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : null}
                Xác nhận tất cả ({selected.length})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={bulkReject}
                disabled={bulkActionLoading}
                className="rounded-2xl h-8 px-3 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-950/40 cursor-pointer"
              >
                Từ chối ({selected.length})
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelected([])}
                className="rounded-2xl h-8 px-3 text-xs text-slate-500 font-bold cursor-pointer"
              >
                Bỏ chọn
              </Button>
            </div>
          </div>
        )}

        {/* Select All Checkbox */}
        {filteredPending.length > 0 && (
          <div className="flex items-center gap-2.5 px-3 py-1">
            <Checkbox
              checked={
                selected.length === filteredPending.length &&
                filteredPending.length > 0
              }
              onCheckedChange={selectAll}
              id="select-all-pending"
            />
            <label
              htmlFor="select-all-pending"
              className="text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Chọn tất cả {filteredPending.length} đơn chờ
            </label>
          </div>
        )}

        {/* List Content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-[28px] bg-slate-100 dark:bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : filteredPending.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-[36px] border border-slate-200/80 dark:border-border/80 bg-white dark:bg-card shadow-sm text-center">
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">
              Không có đơn đặt chỗ nào chờ duyệt
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Tất cả đơn đặt chỗ trong hệ thống đã được xử lý hoàn tất.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPending.map((b) => (
              <QuickProcessPendingCard
                key={b.id}
                booking={b}
                isSelected={selected.includes(b.id)}
                onToggleSelect={() => toggleSelect(b.id)}
                onApprove={() => handleApproveOne(b.id)}
                onReject={() => handleRejectOne(b.id)}
                isApproving={busyId === `approve-${b.id}`}
                isRejecting={busyId === `reject-${b.id}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

QuickProcessPendingTab.displayName = "QuickProcessPendingTab";
export default QuickProcessPendingTab;
