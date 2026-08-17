export const STATUS_CONFIGS = {
  approved: {
    label: "Đã duyệt",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60",
    dotClass: "bg-emerald-500",
  },
  pending: {
    label: "Chờ phê duyệt",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
    dotClass: "bg-amber-500",
  },
  draft: {
    label: "Bản nháp",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800",
    dotClass: "bg-slate-400",
  },
  rejected: {
    label: "Từ chối",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60",
    dotClass: "bg-rose-500",
  },
};

export const getImageSrc = (place) => {
  if (!place) return null;
  if (place.thumbnail) return place.thumbnail;
  if (place.images?.length > 0) {
    const first = place.images[0];
    if (typeof first === "string") return first;
    if (first?.secureUrl) return first.secureUrl;
    if (first?.thumbnailUrl) return first.thumbnailUrl;
    if (first?.url) return first.url;
    if (first?.imageData) return first.imageData;
  }
  return null;
};
