import React, { memo } from "react";
import {
  DollarSign,
  CheckCircle2,
  XCircle,
  Send,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { STATUS_TABS, STATUS_BADGE_MAP } from "./payoutConstants";
import { formatMoney } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export const PayoutQueueTable = memo(
  ({
    activeTab,
    setActiveTab,
    page,
    setPage,
    selectedIds,
    setSelectedIds,
    toggleSelect,
    toggleSelectAll,
    payouts,
    payoutsLoading,
    pagination,
    handleApprove,
    handleTransfer,
    setRejectDialog,
    reviewPending,
    transferPending,
  }) => {
    return (
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v);
          setPage(1);
          setSelectedIds(new Set());
        }}
      >
        <div className="flex items-center justify-between">
          <TabsList className="rounded-full bg-white border border-black/[0.04] p-1 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            {STATUS_TABS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-full px-4 py-1.5 text-xs font-bold gap-1.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white transition-all cursor-pointer"
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {STATUS_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            <div className="rounded-3xl border border-black/[0.04] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
              {!payoutsLoading && payouts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
                  <DollarSign className="h-10 w-10 text-slate-300 stroke-[1.5]" />
                  <p className="font-bold text-slate-800">
                    Không có yêu cầu nào trong mục này
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#FAF9F5] text-slate-500 font-semibold border-b border-black/[0.04]">
                        {activeTab === "pending" && (
                          <th className="p-4 w-10">
                            <Checkbox
                              checked={
                                selectedIds.size === payouts.length &&
                                payouts.length > 0
                              }
                              onCheckedChange={toggleSelectAll}
                              disabled={payoutsLoading}
                              className="rounded-md"
                            />
                          </th>
                        )}
                        <th className="p-4">Đối tác</th>
                        <th className="p-4 text-right">Số tiền</th>
                        <th className="p-4">Ngân hàng</th>
                        <th className="p-4">Trạng thái</th>
                        <th className="p-4">Ngày yêu cầu</th>
                        <th className="p-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.03]">
                      {payoutsLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            {activeTab === "pending" && (
                              <td className="p-4"><div className="h-4 w-4 bg-slate-200 rounded" /></td>
                            )}
                            <td className="p-4">
                              <div className="space-y-1.5">
                                <div className="h-3.5 w-32 bg-slate-200 rounded" />
                                <div className="h-2.5 w-20 bg-slate-200 rounded" />
                              </div>
                            </td>
                            <td className="p-4 text-right"><div className="h-4 w-24 bg-slate-200 rounded ml-auto" /></td>
                            <td className="p-4"><div className="h-3.5 w-28 bg-slate-200 rounded" /></td>
                            <td className="p-4"><div className="h-5 w-20 bg-slate-200 rounded-full" /></td>
                            <td className="p-4"><div className="h-3.5 w-24 bg-slate-200 rounded" /></td>
                            <td className="p-4 text-right"><div className="h-8 w-20 bg-slate-200 rounded-full ml-auto" /></td>
                          </tr>
                        ))
                      ) : (
                        payouts.map((p) => {
                        const statusInfo =
                          STATUS_BADGE_MAP[p.status] || STATUS_BADGE_MAP.pending;
                        const isProcessing = reviewPending || transferPending;
                        return (
                          <tr
                            key={p.id}
                            className="hover:bg-[#FAF9F5] transition-colors"
                          >
                            {activeTab === "pending" && (
                              <td className="p-4">
                                <Checkbox
                                  checked={selectedIds.has(p.id)}
                                  onCheckedChange={() => toggleSelect(p.id)}
                                  className="rounded-md"
                                />
                              </td>
                            )}
                            <td className="p-4">
                              <div>
                                <div className="font-bold text-slate-950">
                                  {p.business?.businessName || "—"}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  {p.business?.owner?.email || ""}
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-right font-mono font-bold text-slate-950 tabular-nums">
                              {formatMoney(p.amount)}
                            </td>
                            <td className="p-4">
                              <div className="text-xs">
                                <div className="font-semibold text-slate-900">
                                  {p.bankName || "—"}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  {p.bankAccountNumber || p.bankAccount || ""}{" "}
                                  —{" "}
                                  {p.bankAccountName || p.bankOwner || ""}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span
                                className={cn(
                                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                                  statusInfo.className
                                )}
                              >
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="p-4 text-slate-400 font-mono text-[11px]">
                              {new Date(
                                p.requestedAt || p.createdAt
                              ).toLocaleDateString("vi-VN")}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {p.status === "pending" && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={isProcessing}
                                      onClick={() => handleApprove(p.id)}
                                      className="h-8 px-3 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-0.5" />
                                      Duyệt
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isProcessing}
                                      onClick={() =>
                                        setRejectDialog({
                                          open: true,
                                          payoutId: p.id,
                                        })
                                      }
                                      className="h-8 px-3 rounded-full text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                                    >
                                      <XCircle className="h-3.5 w-3.5 mr-0.5" />
                                      Từ chối
                                    </button>
                                  </>
                                )}
                                {p.status === "approved" && (
                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => handleTransfer(p.id)}
                                    className="h-8 px-3 rounded-full text-xs font-semibold bg-slate-950 hover:bg-black text-white transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                                  >
                                    <Send className="h-3.5 w-3.5 mr-0.5 text-[#F3E600]" />
                                    Xác nhận chuyển
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      }) )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 bg-[#FAF9F5] rounded-2xl mt-4 border border-black/[0.04] text-xs">
                <p className="text-slate-500 font-medium">
                  Trang{" "}
                  <span className="font-bold text-slate-900 font-mono tabular-nums">
                    {pagination.page}
                  </span>{" "}
                  /{" "}
                  <span className="font-mono tabular-nums">
                    {pagination.totalPages}
                  </span>{" "}
                  ({pagination.total} yêu cầu)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-full text-xs font-semibold h-8 px-3.5 bg-white border border-black/[0.05] shadow-2xs hover:bg-[#F5F4F0] disabled:opacity-40 transition-all text-slate-900 cursor-pointer"
                  >
                    ← Trước
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-full text-xs font-semibold h-8 px-3.5 bg-white border border-black/[0.05] shadow-2xs hover:bg-[#F5F4F0] disabled:opacity-40 transition-all text-slate-900 cursor-pointer"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    );
  }
);

PayoutQueueTable.displayName = "PayoutQueueTable";
export default PayoutQueueTable;
