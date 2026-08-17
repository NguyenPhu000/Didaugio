import React, { memo } from "react";
import {
  Store,
  Mail,
  ClipboardCheck,
  Eye,
  MapPin,
  Layers,
  Ticket,
  Calendar,
  FileCheck2,
  FileWarning,
  ExternalLink,
  Pause,
  XCircle,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { BUSINESS_STATUS, BUSINESS_TYPE_LABELS } from "@/constants/businessConstants";
import { getStatusBadge } from "./businessAdminConstants";
import { cn } from "@/lib/utils";

export const BusinessDetailInspector = memo(
  ({
    selectedBusiness,
    selectedKyc,
    setReviewBusinessId,
    setDetailBusinessId,
    handleSuspend,
    handleReactivate,
    handleTerminate,
  }) => {
    if (!selectedBusiness) return null;

    return (
      <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.04)] border border-black/[0.04] space-y-6 lg:sticky lg:top-6">
        {/* Inspection Header & Action */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-black/[0.04]">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-slate-950 text-[#F3E600] flex items-center justify-center font-black text-2xl shadow-xs shrink-0 border border-slate-800">
              {selectedBusiness.businessName ? (
                selectedBusiness.businessName.charAt(0).toUpperCase()
              ) : (
                <Store className="h-7 w-7" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F4F2EC] text-slate-800">
                  {BUSINESS_TYPE_LABELS[selectedBusiness.businessType] ||
                    selectedBusiness.businessType}
                </span>
                {getStatusBadge(selectedBusiness.status)}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight leading-tight">
                {selectedBusiness.businessName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-1">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{selectedBusiness.owner?.email || "Chưa có email"}</span>
                {selectedBusiness.taxCode && (
                  <>
                    <span>•</span>
                    <span className="tabular-nums">
                      MST: {selectedBusiness.taxCode}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Primary Top Action */}
          <div className="flex items-center gap-2 shrink-0">
            {selectedBusiness.status === BUSINESS_STATUS.PENDING ? (
              <button
                type="button"
                onClick={() => setReviewBusinessId(selectedBusiness.id)}
                className="h-10 px-5 rounded-full bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <ClipboardCheck className="h-4 w-4 text-[#F3E600]" />
                Thẩm định hồ sơ
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDetailBusinessId(selectedBusiness.id)}
                className="h-10 px-5 rounded-full bg-white hover:bg-[#F4F2EC] text-slate-900 font-bold text-xs border border-black/[0.08] shadow-2xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5 text-slate-700" />
                Xem chi tiết địa điểm
              </button>
            )}
          </div>
        </div>

        {/* 4 Metric Attributes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#F8F7F3] border border-black/[0.03] text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 mb-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>Địa điểm</span>
            </div>
            <div className="text-2xl font-black text-slate-950 font-mono tabular-nums">
              {selectedBusiness._count?.places ?? 0}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F8F7F3] border border-black/[0.03] text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 mb-1">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              <span>Dịch vụ</span>
            </div>
            <div className="text-2xl font-black text-slate-950 font-mono tabular-nums">
              {selectedBusiness._count?.services ?? 0}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F8F7F3] border border-black/[0.03] text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 mb-1">
              <Ticket className="h-3.5 w-3.5 text-slate-400" />
              <span>Voucher</span>
            </div>
            <div className="text-2xl font-black text-slate-950 font-mono tabular-nums">
              {selectedBusiness._count?.vouchers ?? 0}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F8F7F3] border border-black/[0.03] text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 mb-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Đặt chỗ</span>
            </div>
            <div className="text-2xl font-black text-slate-950 font-mono tabular-nums">
              {selectedBusiness._count?.bookings ?? 0}
            </div>
          </div>
        </div>

        {/* KYC Compliance Checklist & Legal Status Card */}
        {selectedKyc && (
          <div className="p-5 rounded-2xl bg-[#F8F7F3] border border-black/[0.03] space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tiến độ thẩm định hồ sơ (KYC)
                </h4>
                <p className="text-xs text-slate-800 font-semibold mt-0.5">
                  Hoàn thành{" "}
                  <span className="font-mono tabular-nums">
                    {selectedKyc.completedCount}
                  </span>{" "}
                  /{" "}
                  <span className="font-mono tabular-nums">
                    {selectedKyc.total}
                  </span>{" "}
                  hạng mục
                </p>
              </div>

              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border shadow-2xs",
                  selectedBusiness.contractSigned
                    ? "bg-white text-slate-950 border-black/[0.08]"
                    : "bg-[#FFFDE6] text-slate-900 border-[#F3E600]"
                )}
              >
                {selectedBusiness.contractSigned ? (
                  <>
                    <FileCheck2 className="h-3.5 w-3.5 text-slate-950" />
                    <span>Hợp đồng: Đã ký</span>
                  </>
                ) : (
                  <>
                    <FileWarning className="h-3.5 w-3.5 text-slate-800" />
                    <span>Hợp đồng: Chưa ký</span>
                  </>
                )}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-black/[0.03]">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  selectedKyc.isComplete
                    ? "bg-slate-950"
                    : selectedKyc.completedCount >= 3
                    ? "bg-[#F3E600]"
                    : "bg-slate-300"
                )}
                style={{
                  width: `${(selectedKyc.completedCount / selectedKyc.total) * 100}%`,
                }}
              />
            </div>

            {/* 6 Micro Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {selectedKyc.checks.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "p-2 rounded-xl text-[11px] font-medium flex items-center gap-2 border",
                    item.ok
                      ? "bg-white text-slate-900 border-black/[0.04]"
                      : "bg-white/50 text-slate-400 border-dashed border-black/[0.08]"
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      item.ok
                        ? "bg-[#F3E600] shadow-[0_0_4px_#F3E600]"
                        : "bg-slate-300"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Representative Info */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Người đại diện pháp luật
          </h4>
          <div className="p-4 rounded-2xl bg-white border border-black/[0.04] flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-slate-900">
                {selectedBusiness.owner?.profile?.fullName ||
                  "Chưa cập nhật họ tên"}
              </div>
              <div className="text-slate-500 font-mono mt-0.5">
                {selectedBusiness.owner?.email || "—"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDetailBusinessId(selectedBusiness.id)}
              className="px-3.5 py-1.5 rounded-full bg-[#F4F2EC] hover:bg-slate-200 text-slate-900 font-semibold text-xs transition-all cursor-pointer"
            >
              Xem hồ sơ
            </button>
          </div>
        </div>

        {/* Operational Controls Bottom Strip */}
        <div className="pt-4 border-t border-black/[0.04] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            {selectedBusiness.status === BUSINESS_STATUS.PENDING && (
              <>
                <button
                  type="button"
                  onClick={() => setReviewBusinessId(selectedBusiness.id)}
                  className="px-4 py-2.5 rounded-full bg-slate-950 hover:bg-black text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <ClipboardCheck className="h-3.5 w-3.5 text-[#F3E600]" />
                  Bắt đầu đối chiếu & Thẩm định
                </button>
                <button
                  type="button"
                  onClick={() => setDetailBusinessId(selectedBusiness.id)}
                  className="px-4 py-2.5 rounded-full bg-white hover:bg-[#F4F2EC] text-slate-800 font-semibold text-xs transition-all flex items-center gap-1.5 border border-black/[0.06] cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Xem hồ sơ gốc
                </button>
              </>
            )}

            {selectedBusiness.status === BUSINESS_STATUS.APPROVED && (
              <>
                <button
                  type="button"
                  onClick={() => handleSuspend(selectedBusiness.id)}
                  className="px-4 py-2.5 rounded-full bg-[#F4F2EC] hover:bg-amber-50 hover:text-amber-900 text-slate-800 font-semibold text-xs transition-all flex items-center gap-1.5 border border-black/[0.04] cursor-pointer"
                >
                  <Pause className="h-3.5 w-3.5 text-amber-600" />
                  Tạm ngưng hoạt động
                </button>
                <button
                  type="button"
                  onClick={() => handleTerminate(selectedBusiness.id)}
                  className="px-4 py-2.5 rounded-full bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-semibold text-xs transition-all flex items-center gap-1.5 border border-black/[0.06] cursor-pointer"
                >
                  <XCircle className="h-3.5 w-3.5 text-rose-500" />
                  Chấm dứt hợp đồng
                </button>
              </>
            )}

            {selectedBusiness.status === BUSINESS_STATUS.SUSPENDED && (
              <>
                <button
                  type="button"
                  onClick={() => handleReactivate(selectedBusiness.id)}
                  className="px-4 py-2.5 rounded-full bg-slate-950 hover:bg-black text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-[#F3E600]" />
                  Kích hoạt lại đối tác
                </button>
                <button
                  type="button"
                  onClick={() => handleTerminate(selectedBusiness.id)}
                  className="px-4 py-2.5 rounded-full bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-semibold text-xs transition-all flex items-center gap-1.5 border border-black/[0.06] cursor-pointer"
                >
                  <XCircle className="h-3.5 w-3.5 text-rose-500" />
                  Chấm dứt hợp đồng
                </button>
              </>
            )}

            {selectedBusiness.status === BUSINESS_STATUS.TERMINATED && (
              <div className="inline-flex items-center gap-1.5 text-xs text-rose-600 font-semibold bg-rose-50 px-3 py-1.5 rounded-full">
                <AlertCircle className="h-3.5 w-3.5" />
                Hợp đồng đối tác đã bị chấm dứt
              </div>
            )}
          </div>

          <div className="text-[11px] font-mono text-slate-400 tabular-nums">
            Mã đối tác: #{selectedBusiness.id}
          </div>
        </div>
      </div>
    );
  }
);

BusinessDetailInspector.displayName = "BusinessDetailInspector";
export default BusinessDetailInspector;
