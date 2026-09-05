import React, { memo } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export const DashboardContractWidget = memo(
  ({ docsUploadedCount, handleDownloadContract }) => {
    return (
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.06] p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_12px_32px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-white/[0.04]">
          <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
            Hợp Đồng & Pháp Lý
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60">
            Đã xác thực
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-slate-500 font-medium">Hồ sơ năng lực doanh nghiệp</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {docsUploadedCount}/4 danh mục
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadContract}
            className="w-full rounded-full h-9 text-xs font-semibold border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Tải bản hợp đồng điện tử
          </Button>
        </div>
      </div>
    );
  }
);

DashboardContractWidget.displayName = "DashboardContractWidget";
export default DashboardContractWidget;
