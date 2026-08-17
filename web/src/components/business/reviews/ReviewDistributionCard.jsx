import React, { memo } from "react";
import { Star } from "lucide-react";
import { StarRating } from "./BentoReviewCard";
import { cn } from "@/lib/utils";

export const RatingBar = memo(({ star, count, total }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="flex items-center gap-1 w-12 shrink-0 font-extrabold text-slate-700 dark:text-slate-300">
        <span>{star}</span>
        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      </div>
      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-muted overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="w-12 text-right text-[11px] font-bold text-slate-400 tabular-nums">
        {count}
      </div>
    </div>
  );
});
RatingBar.displayName = "RatingBar";

export const ReviewDistributionCard = memo(({ avgRating, total, byRating }) => {
  return (
    <div className="p-6 sm:p-7 rounded-[36px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Average score block */}
      <div className="flex items-center gap-5 shrink-0">
        <div className="text-center sm:text-left space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-slate-400">/ 5.0</span>
          </div>
          <StarRating rating={Math.round(avgRating)} size="lg" />
          <p className="text-xs text-slate-500 dark:text-muted-foreground pt-0.5">
            Dựa trên <strong>{total}</strong> lượt đánh giá của du khách
          </p>
        </div>
      </div>

      {/* 5-star distribution chart */}
      <div className="flex-1 max-w-md w-full space-y-1.5 border-t md:border-t-0 md:border-l border-slate-100 dark:border-border/60 pt-4 md:pt-0 md:pl-6">
        {[5, 4, 3, 2, 1].map((star) => (
          <RatingBar
            key={star}
            star={star}
            count={byRating[star] || 0}
            total={total}
          />
        ))}
      </div>
    </div>
  );
});

ReviewDistributionCard.displayName = "ReviewDistributionCard";
export default ReviewDistributionCard;
