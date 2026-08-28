import React from "react";
import { useTranslation } from "react-i18next";
import {
  Monitor,
  Ban,
  Globe,
  Clock,
  Shield,
  Smartphone,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/utils/dateUtils";
import {
  getStatusInfo,
  getDeviceIcon,
} from "./loginHistoryConstants";

export const LoginHistoryDetailModal = ({
  open,
  onOpenChange,
  selectedSession,
  handleRevoke,
}) => {
  const { t } = useTranslation();

  if (!selectedSession) return null;

  const statusInfo = getStatusInfo(selectedSession, t);
  const userFullName =
    selectedSession.user?.profile?.fullName ||
    selectedSession.user?.email ||
    "N/A";
  const userEmail = selectedSession.user?.email || "N/A";
  const initials = userFullName.substring(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl border border-black/[0.06] p-0 bg-white shadow-xl">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-black/[0.04] bg-[#FAF9F5]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-2xs">
              <Monitor className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-950">
                {t("loginHistory.detailTitle", { id: selectedSession.id }) ||
                  `Chi tiết Phiên Đăng nhập #${selectedSession.id}`}
              </DialogTitle>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5 tabular-nums">
                SESSION ID: {selectedSession.id}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Status & Technical Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#F8F7F3] rounded-2xl p-4 border border-black/[0.03]">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                {t("loginHistory.status") || "Trạng thái"}
              </label>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}
              >
                {statusInfo.icon}
                {statusInfo.label}
              </span>
            </div>

            <div className="bg-[#F8F7F3] rounded-2xl p-4 border border-black/[0.03]">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> IP Address
              </label>
              <div className="font-mono font-bold text-xs text-slate-900 tabular-nums">
                {selectedSession.ipAddress || "Không xác định"}
              </div>
            </div>

            <div className="bg-[#F8F7F3] rounded-2xl p-4 border border-black/[0.03]">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {t("loginHistory.loggedIn") || "Thời gian đăng nhập"}
              </label>
              <div className="font-mono text-xs text-slate-800 tabular-nums">
                {formatDateTime(selectedSession.createdAt)}
              </div>
            </div>
          </div>

          {/* User Info Card */}
          <div className="bg-white rounded-2xl p-4 border border-black/[0.04] shadow-2xs">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
              {t("loginHistory.user") || "Tài khoản đăng nhập"}
            </label>
            <div className="flex items-center gap-3">
              <div className="bg-slate-950 text-white w-10 h-10 flex items-center justify-center rounded-full text-xs font-bold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs text-slate-900">
                  {userFullName}
                </div>
                <div className="font-mono text-[11px] text-slate-400">
                  {userEmail}
                </div>
                {selectedSession.user?.role?.name && (
                  <div className="mt-1">
                    <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-[#F8F7F3] text-slate-700 border border-black/[0.04] inline-flex items-center gap-1">
                      <Shield className="w-3 h-3 text-slate-400" />
                      {selectedSession.user.role.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Device & Timestamps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#F8F7F3] rounded-2xl p-4 border border-black/[0.03]">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                {getDeviceIcon(selectedSession.deviceName)} {t("loginHistory.device") || "Thiết bị"}
              </label>
              <div className="font-mono text-xs text-slate-800 break-all">
                {selectedSession.deviceName || "Không xác định"}
              </div>
              {selectedSession.deviceId && (
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  Device ID: {selectedSession.deviceId}
                </div>
              )}
            </div>

            <div className="bg-[#F8F7F3] rounded-2xl p-4 border border-black/[0.03] space-y-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {t("loginHistory.lastUsed") || "Sử dụng lần cuối"}
                </label>
                <div className="font-mono text-xs text-slate-800 tabular-nums">
                  {formatDateTime(selectedSession.lastUsedAt)}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {t("loginHistory.expiresAt") || "Thời điểm hết hạn"}
                </label>
                <div className="font-mono text-xs text-slate-800 tabular-nums">
                  {formatDateTime(selectedSession.expiresAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-black/[0.04]">
            {selectedSession.isActive ? (
              <button
                type="button"
                onClick={() => {
                  handleRevoke(selectedSession.id);
                  onOpenChange(false);
                }}
                className="h-10 px-5 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Ban className="w-3.5 h-3.5" />
                {t("loginHistory.deactivateSession") || "Thu hồi phiên này"}
              </button>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-10 px-6 rounded-full bg-slate-950 text-white font-bold text-xs hover:bg-black shadow-sm cursor-pointer"
            >
              {t("common.close") || "Đóng"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginHistoryDetailModal;
