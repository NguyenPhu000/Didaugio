import React, { memo } from "react";
import { cn } from "@/lib/utils";

export const ReportCategorySwitcher = memo(
  ({ reportTypes, activeReportType, onSelectReportType }) => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {reportTypes.map((report) => {
          const isSelected = activeReportType === report.id;
          return (
            <button
              key={report.id}
              onClick={() => onSelectReportType(report.id)}
              className={cn(
                "p-4 rounded-[26px] border text-left transition-all duration-200 select-none flex flex-col justify-between min-h-[90px]",
                isSelected
                  ? "bg-slate-950 text-white dark:bg-primary dark:text-primary-foreground border-slate-950 shadow-md"
                  : "bg-white dark:bg-card border-slate-200/80 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-muted"
              )}
            >
              <span className="font-extrabold text-xs sm:text-sm">{report.label}</span>
              <span
                className={cn(
                  "text-[11px] font-medium line-clamp-1 mt-1",
                  isSelected ? "opacity-80" : "text-slate-400"
                )}
              >
                {report.description}
              </span>
            </button>
          );
        })}
      </div>
    );
  }
);

ReportCategorySwitcher.displayName = "ReportCategorySwitcher";
export default ReportCategorySwitcher;
