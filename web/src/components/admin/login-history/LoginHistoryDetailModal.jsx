import React from "react";
import { useTranslation } from "react-i18next";
import { Ban } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { formatDate } from "@/utils/dateUtils";
import { getStatusInfo, getDeviceIcon } from "./loginHistoryConstants";

export const LoginHistoryDetailModal = ({
  open,
  onOpenChange,
  selectedSession,
  handleRevoke,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t("loginHistory.detailTitle", { id: selectedSession?.id })}
          </DialogTitle>
        </DialogHeader>
        {selectedSession && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  User
                </label>
                <p className="mt-1">
                  {selectedSession.user?.profile?.fullName || "N/A"}
                  <br />
                  <span className="text-sm text-gray-500">
                    {selectedSession.user?.email}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {t("loginHistory.status")}
                </label>
                <p className="mt-1">
                  {(() => {
                    const statusInfo = getStatusInfo(selectedSession, t);
                    return (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                      >
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    );
                  })()}
                </p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500">
                  {t("loginHistory.device")}
                </label>
                <div className="mt-1 flex items-center gap-2">
                  {getDeviceIcon(selectedSession.deviceName)}
                  <p className="break-all">{selectedSession.deviceName}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  IP Address
                </label>
                <p className="mt-1 font-mono">{selectedSession.ipAddress}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Device ID
                </label>
                <p className="mt-1 font-mono">
                  {selectedSession.deviceId || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {t("loginHistory.loggedIn")}
                </label>
                <p className="mt-1">{formatDate(selectedSession.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {t("loginHistory.lastUsed")}
                </label>
                <p className="mt-1">
                  {formatDate(selectedSession.lastUsedAt)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {t("loginHistory.expiresAt")}
                </label>
                <p className="mt-1">{formatDate(selectedSession.expiresAt)}</p>
              </div>
            </div>

            {selectedSession.isActive && (
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleRevoke(selectedSession.id);
                    onOpenChange(false);
                  }}
                  className="w-full cursor-pointer"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  {t("loginHistory.deactivateSession")}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoginHistoryDetailModal;
