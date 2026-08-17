import React from "react";
import { BUSINESS_STATUS } from "@/constants/businessConstants";
import { cn } from "@/lib/utils";

export const STATUS_CONFIG = {
  [BUSINESS_STATUS.PENDING]: {
    label: "Chờ thẩm định",
    badge: "bg-[#FFFDE6] text-slate-900 border-[#F3E600]/80",
    dot: "bg-[#F3E600] animate-pulse shadow-[0_0_6px_#F3E600]",
  },
  [BUSINESS_STATUS.APPROVED]: {
    label: "Đang hoạt động",
    badge: "bg-slate-950 text-white border-slate-950",
    dot: "bg-[#F3E600]",
  },
  [BUSINESS_STATUS.REJECTED]: {
    label: "Đã từ chối",
    badge: "bg-[#F4F2EC] text-slate-600 border-black/[0.06]",
    dot: "bg-slate-400",
  },
  [BUSINESS_STATUS.SUSPENDED]: {
    label: "Tạm ngưng",
    badge: "bg-[#F4F2EC] text-slate-800 border-black/[0.08]",
    dot: "bg-slate-500",
  },
  [BUSINESS_STATUS.TERMINATED]: {
    label: "Chấm dứt",
    badge: "bg-slate-100 text-slate-900 border-slate-300 line-through",
    dot: "bg-slate-900",
  },
  [BUSINESS_STATUS.SUSPICIOUS]: {
    label: "Đáng ngờ",
    badge: "bg-[#FFFDE6] text-slate-900 border-[#F3E600]",
    dot: "bg-[#F3E600] animate-ping",
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
