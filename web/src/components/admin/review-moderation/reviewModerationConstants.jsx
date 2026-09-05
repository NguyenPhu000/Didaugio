import React from "react";
import { Star } from "lucide-react";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { cn } from "@/lib/utils";

export const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "reported", label: "Bị report" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "visible", label: "Đang hiển thị" },
  { value: "hidden", label: "Đã ẩn" },
];

export const REVIEW_STATUS_LABELS = {
  visible: "Đang hiển thị",
  hidden: "Đã ẩn",
  pending: "Chờ duyệt",
  reported: "Bị report",
};

export const REVIEW_STATUS_CLASSES = {
  visible: "border-emerald-200 bg-emerald-50 text-emerald-700",
  hidden: "border-slate-200 bg-slate-100 text-slate-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  reported: "border-red-200 bg-red-50 text-red-700",
};

export const formatDate = (date) =>
  date ? new Date(date).toLocaleString("vi-VN") : "Không rõ";

export const getMediaSrc = (media) =>
  resolveMediaUrl(
    media?.mediaData || media?.thumbnailUrl || media?.secureUrl || media?.url
  );

export const StarRating = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((value) => (
      <Star
        key={value}
        className={cn(
          "h-4 w-4",
          value <= Number(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-muted-foreground/30"
        )}
      />
    ))}
  </div>
);
