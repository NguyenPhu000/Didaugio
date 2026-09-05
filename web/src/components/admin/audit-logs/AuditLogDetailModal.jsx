import React from "react";
import { useTranslation } from "react-i18next";
import {
  FileText,
  CheckCircle,
  Shield,
  Globe,
  Monitor,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import auditLogService from "@/apis/auditLogService";
import { formatDateTime } from "@/utils/dateUtils";
import { getRoleDisplay } from "./auditLogsConstants";

export const AuditLogDetailModal = ({
  open,
  onOpenChange,
  selectedLog,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl border border-black/[0.06] p-0 bg-white shadow-xl">
        <DialogHeader className="p-6 border-b border-black/[0.04] bg-[#FAF9F5]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-950 text-[#F3E600] flex items-center justify-center shadow-2xs">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-950">
                {t("auditLogs.detailTitle")}
              </DialogTitle>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5 tabular-nums">
                AUDIT LOG #{selectedLog?.id}
              </p>
            </div>
          </div>
        </DialogHeader>

        {selectedLog && (
          <div className="p-6 space-y-5">
            {/* Action & Table Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#F8F7F3] rounded-2xl p-4 border border-black/[0.03]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  {t("auditLogs.actionCol")}
                </label>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase font-mono inline-block ${auditLogService.getActionColor(selectedLog.action)}`}
                >
                  {auditLogService.getActionLabel(selectedLog.action)} (
                  {selectedLog.action})
                </span>
              </div>

              <div className="bg-[#F8F7F3] rounded-2xl p-4 border border-black/[0.03]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  {t("auditLogs.object")}
                </label>
                <div className="font-mono font-bold text-xs text-slate-900">
                  {auditLogService.getTableLabel(selectedLog.tableName)}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {selectedLog.tableName} #{selectedLog.recordId}
                </div>
              </div>

              <div className="bg-[#F8F7F3] rounded-2xl p-4 border border-black/[0.03]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  {t("auditLogs.time")}
                </label>
                <div className="font-mono text-xs text-slate-800 tabular-nums">
                  {formatDateTime(selectedLog.createdAt)}
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedLog.description && (
              <div className="bg-[#FFFDE6] rounded-2xl p-4 border border-[#F3E600]/80">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  {t("auditLogs.description")}
                </label>
                <div className="text-xs font-medium text-slate-900">
                  {selectedLog.description}
                </div>
              </div>
            )}

            {/* User Info */}
            <div className="bg-white rounded-2xl p-4 border border-black/[0.04] shadow-2xs">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                {t("auditLogs.performer")}
              </label>
              <div className="flex items-center gap-3">
                <div className="bg-slate-950 text-white w-10 h-10 flex items-center justify-center rounded-full text-xs font-bold">
                  {(
                    selectedLog.user?.profile?.fullName ||
                    selectedLog.user?.email ||
                    "N/A"
                  )
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-slate-900">
                    {selectedLog.user?.profile?.fullName ||
                      selectedLog.user?.email ||
                      "N/A"}
                  </div>
                  <div className="font-mono text-[11px] text-slate-400">
                    {selectedLog.user?.email || "N/A"}
                  </div>
                  <div className="mt-1">
                    <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-[#F8F7F3] text-slate-700 border border-black/[0.04] inline-flex items-center gap-1">
                      <Shield className="w-3 h-3 text-slate-400" />
                      {getRoleDisplay(selectedLog)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#F8F7F3] rounded-2xl p-4 border border-black/[0.03]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> {t("auditLogs.ipAddress")}
                </label>
                <div className="font-mono text-xs text-slate-800 tabular-nums">
                  {selectedLog.ipAddress || t("auditLogs.notDefined")}
                </div>
              </div>
              <div className="bg-[#F8F7F3] rounded-2xl p-4 border border-black/[0.03]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                  <Monitor className="w-3.5 h-3.5" /> {t("auditLogs.device")}
                </label>
                <div className="font-mono text-[11px] text-slate-600 break-all line-clamp-2">
                  {selectedLog.userAgent || t("auditLogs.notDefined")}
                </div>
              </div>
            </div>

            {/* Data Comparison */}
            {(selectedLog.oldData || selectedLog.newData) && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {t("auditLogs.dataChanges")}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedLog.oldData && (
                    <div className="bg-white rounded-2xl border border-rose-100 overflow-hidden">
                      <div className="bg-rose-50 text-rose-700 px-4 py-2 border-b border-rose-100 font-bold text-xs flex items-center gap-1.5">
                        <X className="w-3.5 h-3.5" /> {t("auditLogs.oldData")}
                      </div>
                      <div className="p-4 max-h-60 overflow-y-auto">
                        <pre className="text-[11px] font-mono whitespace-pre-wrap text-slate-700">
                          {typeof selectedLog.oldData === "string"
                            ? selectedLog.oldData
                            : JSON.stringify(selectedLog.oldData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {selectedLog.newData && (
                    <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden">
                      <div className="bg-emerald-50 text-emerald-700 px-4 py-2 border-b border-emerald-100 font-bold text-xs flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />{" "}
                        {t("auditLogs.newData")}
                      </div>
                      <div className="p-4 max-h-60 overflow-y-auto">
                        <pre className="text-[11px] font-mono whitespace-pre-wrap text-slate-700">
                          {typeof selectedLog.newData === "string"
                            ? selectedLog.newData
                            : JSON.stringify(selectedLog.newData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t border-black/[0.04]">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-10 px-6 rounded-full bg-slate-950 text-white font-bold text-xs hover:bg-black shadow-sm cursor-pointer"
              >
                {t("auditLogs.close")}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuditLogDetailModal;
