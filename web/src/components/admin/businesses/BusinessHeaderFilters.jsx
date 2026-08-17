import React, { memo } from "react";
import { Search, Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export const BusinessHeaderFilters = memo(
  ({
    searchInput,
    setSearchInput,
    handleExportCsv,
    handleRefresh,
    isLoading,
    isFetching,
    status,
    setStatus,
    statusTabs,
    pendingCount,
    totalCount,
  }) => {
    return (
      <>
        {/* Top App Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-black/[0.04]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#F3E600] shadow-[0_0_6px_#F3E600]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Hệ thống Quản trị Đối tác
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              Đối tác doanh nghiệp
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Thẩm định hồ sơ pháp lý, giám sát quy mô điểm kinh doanh và quản
              lý hợp đồng liên kết.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
            {/* Search Pill */}
            <div className="relative flex-1 sm:flex-initial w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm doanh nghiệp, email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-white rounded-full text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F3E600] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] placeholder:text-slate-400 transition-all"
              />
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              className="h-10 px-4 rounded-full text-xs font-semibold bg-white text-slate-900 hover:bg-[#F4F2EC] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] transition-all flex items-center gap-2 shrink-0 active:scale-95 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-slate-700" />
              <span className="hidden sm:inline">Xuất CSV</span>
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              className="h-10 w-10 rounded-full bg-white text-slate-900 hover:bg-[#F4F2EC] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] transition-all flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
              title="Đồng bộ lại"
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4 text-slate-800",
                  (isLoading || isFetching) && "animate-spin"
                )}
              />
            </button>
          </div>
        </header>

        {/* Filter Pills Bar */}
        <section className="flex items-center justify-between gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex items-center gap-2 shrink-0">
            {statusTabs.map((tab) => {
              const active = status === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatus(tab.value)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 shadow-2xs border cursor-pointer",
                    active
                      ? "bg-slate-950 text-white border-slate-950 shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
                      : "bg-white text-slate-700 border-black/[0.04] hover:bg-[#F4F2EC] hover:text-slate-950"
                  )}
                >
                  {tab.label}
                  {tab.value === "pending" && pendingCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-[#F3E600] text-slate-950 text-[10px] font-bold font-mono tabular-nums">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-xs font-medium text-slate-500 shrink-0 hidden md:block">
            Hiển thị{" "}
            <span className="font-bold text-slate-950 font-mono tabular-nums">
              {totalCount}
            </span>{" "}
            doanh nghiệp
          </div>
        </section>
      </>
    );
  }
);

BusinessHeaderFilters.displayName = "BusinessHeaderFilters";
export default BusinessHeaderFilters;
