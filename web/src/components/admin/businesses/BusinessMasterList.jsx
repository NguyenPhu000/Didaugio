import React, { memo } from "react";
import { Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUSINESS_TYPE_LABELS } from "@/constants/businessConstants";
import { getStatusBadge } from "./businessAdminConstants";

export const BusinessMasterList = memo(
  ({
    businesses,
    selectedBusinessId,
    setSelectedBusinessId,
    page,
    setPage,
    pagination,
  }) => {
    return (
      <div className="lg:col-span-5 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Danh sách (
            <span className="font-mono tabular-nums">{businesses.length}</span>)
          </span>
          <span className="text-[11px] font-medium text-slate-500">
            Trang <span className="font-mono tabular-nums">{page}</span>/
            <span className="font-mono tabular-nums">
              {pagination.totalPages}
            </span>
          </span>
        </div>

        {/* Independent Scrollable List View */}
        <div className="space-y-3 h-[calc(100vh-290px)] min-h-[580px] max-h-[820px] overflow-y-auto pr-1.5 scrollbar-thin">
          {businesses.map((biz) => {
            const isSelected = selectedBusinessId === biz.id;
            return (
              <article
                key={biz.id}
                onClick={() => setSelectedBusinessId(biz.id)}
                className={cn(
                  "p-4 rounded-2xl cursor-pointer transition-all duration-300 flex items-center gap-3.5 border relative overflow-hidden group",
                  isSelected
                    ? "bg-white border-slate-950 shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-950/10 -translate-y-0.5"
                    : "bg-white/80 hover:bg-white border-black/[0.04] shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.04)]"
                )}
              >
                {/* Selected Indicator Pill */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-950" />
                )}

                {/* Thumbnail / Monogram */}
                <div className="w-16 h-16 rounded-xl bg-slate-950 text-[#F3E600] flex items-center justify-center font-extrabold text-xl shadow-xs shrink-0 border border-slate-800">
                  {biz.businessName ? (
                    biz.businessName.charAt(0).toUpperCase()
                  ) : (
                    <Store className="h-6 w-6" />
                  )}
                </div>

                {/* Business Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[11px] font-medium text-slate-500 truncate">
                      {BUSINESS_TYPE_LABELS[biz.businessType] ||
                        biz.businessType}
                    </span>
                    {getStatusBadge(biz.status)}
                  </div>

                  <h3
                    className="font-bold text-sm text-slate-950 truncate group-hover:text-slate-800 transition-colors"
                    title={biz.businessName}
                  >
                    {biz.businessName}
                  </h3>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
                    <span>{biz._count?.places ?? 0} địa điểm</span>
                    <span>•</span>
                    <span>{biz._count?.services ?? 0} dịch vụ</span>
                    <span>•</span>
                    <span>{biz._count?.bookings ?? 0} đặt chỗ</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 px-1 text-xs">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-full bg-white border border-black/[0.05] shadow-2xs font-semibold text-slate-800 disabled:opacity-40 hover:bg-[#F4F2EC] cursor-pointer"
            >
              ← Trước
            </button>
            <span className="text-slate-500 font-medium">
              Trang{" "}
              <span className="font-mono tabular-nums">{page}</span> /{" "}
              <span className="font-mono tabular-nums">
                {pagination.totalPages}
              </span>
            </span>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              className="px-3 py-1.5 rounded-full bg-white border border-black/[0.05] shadow-2xs font-semibold text-slate-800 disabled:opacity-40 hover:bg-[#F4F2EC] cursor-pointer"
            >
              Sau →
            </button>
          </div>
        )}
      </div>
    );
  }
);

BusinessMasterList.displayName = "BusinessMasterList";
export default BusinessMasterList;
