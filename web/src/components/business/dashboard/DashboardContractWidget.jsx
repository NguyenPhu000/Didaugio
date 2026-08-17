import React, { memo } from "react";
import { Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const DashboardContractWidget = memo(
  ({ docsUploadedCount, handleDownloadContract }) => {
    return (
      <div className="p-1.5 rounded-[36px] bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
        <div className="p-6 sm:p-7 rounded-[30px] bg-white dark:bg-slate-900/90 border border-slate-200/40 dark:border-white/[0.04] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-slate-900 dark:text-white tracking-tight">
              Hợp Đồng & Pháp Lý
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60">
              Đã xác thực
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Hồ sơ năng lực
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {docsUploadedCount}/4 danh mục
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadContract}
              className="w-full rounded-2xl h-10 text-xs font-bold border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Tải bản hợp đồng điện tử
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

DashboardContractWidget.displayName = "DashboardContractWidget";
export default DashboardContractWidget;
