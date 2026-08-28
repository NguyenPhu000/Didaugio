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
      className: "bg-slate-100 text-slate-600 border-slate-200",
      dot: "bg-slate-400",
    },
    pending: {
      label: "Chờ duyệt",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
    },
    approved: {
      label: "Đã duyệt",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
    },
    rejected: {
      label: "Từ chối",
      className: "bg-rose-50 text-rose-700 border-rose-200",
      dot: "bg-rose-500",
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
