import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Monitor, Eye, Ban } from "lucide-react";
import { Button } from "@/components/ui";
import { formatDate } from "@/utils/dateUtils";
import { getTableSerialNumber } from "@/utils/tableSerial";
import {
  getStatusInfo,
  getDeviceIcon,
  truncateDevice,
} from "./loginHistoryConstants";

export const LoginHistoryTableView = memo(
  ({
    loading,
    sessions,
    totalItems,
    currentPage,
    itemsPerPage,
    totalPages,
    setCurrentPage,
    handleViewDetail,
    handleRevoke,
  }) => {
    const { t } = useTranslation();

    if (loading) {
      return (
        <div className="bg-white border border-black shadow-sm overflow-hidden">
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-2" />
            <span className="font-mono text-xs uppercase text-gray-500">
              {t("loginHistory.loadingData")}
            </span>
          </div>
        </div>
      );
    }

    if (sessions.length === 0) {
      return (
        <div className="bg-white border border-black shadow-sm overflow-hidden">
          <div className="flex flex-col items-center justify-center py-20">
            <Monitor className="h-12 w-12 text-gray-300 mb-4" />
            <div className="font-bold uppercase text-gray-400">
              {t("loginHistory.noData")}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-black shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white tim-table-header">
                <th className="p-4 border-r border-black/20 w-[60px]">STT</th>
                <th className="p-4 border-r border-black/20">USER</th>
                <th className="p-4 border-r border-black/20">
                  {t("loginHistory.device").toUpperCase()}
                </th>
                <th className="p-4 border-r border-black/20">IP ADDRESS</th>
                <th className="p-4 border-r border-black/20">
                  {t("loginHistory.status").toUpperCase()}
                </th>
                <th className="p-4 border-r border-black/20">
                  {t("loginHistory.loggedIn").toUpperCase()}
                </th>
                <th className="p-4 border-r border-black/20">
                  {t("loginHistory.lastUsed").toUpperCase()}
                </th>
                <th className="p-4 border-r border-black/20">
                  {t("loginHistory.expiresAt").toUpperCase()}
                </th>
                <th className="p-4 text-center">
                  {t("loginHistory.actions").toUpperCase()}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {sessions.map((session, index) => {
                const statusInfo = getStatusInfo(session, t);
                return (
                  <tr
                    key={session.id}
                    className="hover:bg-yellow-50 group transition-colors"
                  >
                    <td className="p-4 font-mono text-sm text-gray-400 border-r border-black/5">
                      {getTableSerialNumber(
                        totalItems || sessions.length,
                        index,
                        currentPage,
                        itemsPerPage
                      )}
                    </td>
                    <td className="p-4 border-r border-black/5">
                      <div>
                        <div className="font-bold uppercase text-sm">
                          {session.user?.profile?.fullName || "N/A"}
                        </div>
                        <div className="text-gray-500 text-xs font-mono">
                          {session.user?.email || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 border-r border-black/5">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(session.deviceName)}
                        <span className="truncate max-w-[200px] text-sm">
                          {truncateDevice(session.deviceName)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 border-r border-black/5">
                      <span className="font-mono text-sm">
                        {session.ipAddress}
                      </span>
                    </td>
                    <td className="p-4 border-r border-black/5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-none border border-black text-[10px] font-bold uppercase font-mono ${statusInfo.color}`}
                      >
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="p-4 border-r border-black/5">
                      <span className="font-mono text-sm text-gray-500">
                        {formatDate(session.createdAt)}
                      </span>
                    </td>
                    <td className="p-4 border-r border-black/5">
                      <span className="font-mono text-sm text-gray-500">
                        {formatDate(session.lastUsedAt)}
                      </span>
                    </td>
                    <td className="p-4 border-r border-black/5">
                      <span className="font-mono text-sm text-gray-500">
                        {formatDate(session.expiresAt)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetail(session)}
                          className="rounded-none border border-transparent hover:border-black hover:bg-white h-8 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {session.isActive && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRevoke(session.id)}
                            className="rounded-none border border-transparent hover:border-red-600 hover:bg-red-50 text-red-600 hover:text-red-700 h-8 cursor-pointer"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-black bg-gray-50 font-mono text-xs uppercase">
            <div>
              {t("common.showing")} {sessions.length} {t("common.results")}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-none border-black h-8 hover:bg-black hover:text-white cursor-pointer"
              >
                {t("common.previous")}
              </Button>
              <span className="flex items-center px-4 font-bold">
                {currentPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="rounded-none border-black h-8 hover:bg-black hover:text-white cursor-pointer"
              >
                {t("common.nextPage")}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

LoginHistoryTableView.displayName = "LoginHistoryTableView";
export default LoginHistoryTableView;
