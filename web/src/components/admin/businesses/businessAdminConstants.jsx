import React from "react";
import { BUSINESS_STATUS } from "@/constants/businessConstants";
import { cn } from "@/lib/utils";

export const STATUS_CONFIG = {
  [BUSINESS_STATUS.PENDING]: {
    label: "Chờ thẩm định",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  [BUSINESS_STATUS.APPROVED]: {
    label: "Đang hoạt động",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  [BUSINESS_STATUS.REJECTED]: {
    label: "Đã từ chối",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
  [BUSINESS_STATUS.SUSPENDED]: {
    label: "Tạm ngưng",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  },
  [BUSINESS_STATUS.TERMINATED]: {
    label: "Chấm dứt",
    badge: "bg-slate-100 text-slate-500 border-slate-200 line-through",
    dot: "bg-slate-400",
  },
  [BUSINESS_STATUS.SUSPICIOUS]: {
    label: "Đáng ngờ",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
};

export const getStatusBadge = (status) => {
  const conf = STATUS_CONFIG[status] || {
    label: String(status),
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-full border shadow-2xs transition-all",
        conf.badge
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", conf.dot)} />
      <span>{conf.label}</span>
    </div>
  );
};

export const getKycDetails = (biz) => {
  const checks = [
    {
      id: "mst",
      label: "Mã số thuế",
      ok: Boolean(biz?.taxCode || biz?.taxCodeMasked),
    },
    {
      id: "cccd",
      label: "CCCD/Hộ chiếu",
      ok: Boolean(
        biz?.idCardFront ||
          biz?.idCardBack ||
          biz?.hasIdCardFront ||
          biz?.hasIdCardBack
      ),
    },
    {
      id: "gpl",
      label: "Giấy phép KD",
      ok: Boolean(biz?.businessLicense || biz?.hasBusinessLicense),
    },
    {
      id: "nh",
      label: "Tài khoản ngân hàng",
      ok: Boolean(
        biz?.bankName &&
          (biz?.bankAccountNumber ||
            biz?.bankAccountNumberMasked ||
            biz?.bankAccount)
      ),
    },
    { id: "hd", label: "Hợp đồng điện tử", ok: Boolean(biz?.contractSigned) },
    {
      id: "ck",
      label: "Tỷ lệ chiết khấu",
      ok: Boolean(biz?.commissionRate != null),
    },
  ];
  const completedCount = checks.filter((c) => c.ok).length;
  return {
    checks,
    completedCount,
    total: checks.length,
    isComplete: completedCount === checks.length,
  };
};
