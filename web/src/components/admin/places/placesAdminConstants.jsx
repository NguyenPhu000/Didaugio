import React from "react";
import { cn } from "@/lib/utils";

export const getPlaceCardImageSrc = (place) => {
  const coverImage = Array.isArray(place?.images)
    ? place.images.find((image) => image?.isCover) || place.images[0]
    : null;

  return (
    place?.thumbnail ||
    coverImage?.secureUrl ||
    coverImage?.thumbnailUrl ||
    coverImage?.imageData ||
    coverImage?.url ||
    (typeof coverImage === "string" ? coverImage : null)
  );
};

export const getStatusBadge = (status) => {
  const statusConfig = {
    draft: {
      label: "Bản nháp",
      className: "bg-[#F4F2EC] text-slate-600 border-black/[0.04]",
      dot: "bg-slate-400",
    },
    pending: {
      label: "Chờ duyệt",
      className: "bg-[#FFFDE6] text-slate-900 border-[#F3E600]/80",
      dot: "bg-[#F3E600] animate-pulse shadow-[0_0_6px_#F3E600]",
    },
    approved: {
      label: "Đã duyệt",
      className: "bg-slate-950 text-white border-slate-950",
      dot: "bg-[#F3E600]",
    },
    rejected: {
      label: "Từ chối",
      className: "bg-[#F4F2EC] text-slate-600 border-black/[0.04]",
      dot: "bg-slate-400",
    },
    hidden: {
      label: "Tạm ẩn",
      className: "bg-slate-100 text-slate-600 border-slate-200",
      dot: "bg-slate-400",
    },
  };

  const config = statusConfig[status] || statusConfig.draft;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full border shadow-2xs transition-all",
        config.className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} />
      <span>{config.label}</span>
    </div>
  );
};
