import React, { useCallback, useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import {
  Star,
  Pencil,
  Trash2,
  Building2,
  MessageSquare,
  Sparkles,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { cn } from "@/lib/utils";

const REVIEW_MEDIA_PREVIEW_LIMIT = 5;

export const StarRating = memo(({ rating, size = "sm" }) => {
  const sz = size === "lg" ? "w-5 h-5" : size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            sz,
            i <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200 dark:fill-slate-800 dark:text-slate-800"
          )}
        />
      ))}
    </div>
  );
});
StarRating.displayName = "StarRating";

const getReviewMediaSrc = (media) =>
  resolveMediaUrl(
    media?.mediaData || media?.thumbnailUrl || media?.secureUrl || media?.url
  );

export const BentoReviewCard = memo(
  ({
    review,
    replyingTo,
    replyContent,
    editingReplyId,
    editContent,
    sending,
    actionLoadingByReply,
    onStartReply,
    onCancelReply,
    onContentChange,
    onSendReply,
    quickReplyTemplates,
    onStartEditReply,
    onCancelEditReply,
    onEditContentChange,
    onSaveEditReply,
    onDeleteReply,
  }) => {
    const { t } = useTranslation();
    const formatDate = useCallback(
      (date) => (date ? new Date(date).toLocaleDateString("vi-VN") : ""),
      []
    );

    const hasReplied = review.replies?.length > 0;
    const isReplying = replyingTo === review.id;
    const mediaItems = useMemo(
      () =>
        (review.media || [])
          .map((media) => ({ ...media, src: getReviewMediaSrc(media) }))
          .filter((media) => media.src)
          .slice(0, REVIEW_MEDIA_PREVIEW_LIMIT),
      [review.media]
    );

    const placeName =
      review.place?.name || review.booking?.service?.place?.name || "Cơ sở du lịch";
    const reviewerName =
      review.user?.profile?.fullName ||
      review.user?.email?.split("@")[0] ||
      "Khách du lịch";
    const avatarLetter = reviewerName[0]?.toUpperCase() || "K";

    return (
      <article className="rounded-[32px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 space-y-4">
        {/* Header: Reviewer, Rating & Place Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[18px] bg-slate-100 dark:bg-muted text-slate-800 dark:text-slate-200 flex items-center justify-center font-black text-sm shrink-0 border border-slate-200/60 dark:border-border/60">
              {avatarLetter}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {reviewerName}
                </h4>
                <span className="text-[11px] text-slate-400">•</span>
                <span className="text-xs text-slate-400">
                  {formatDate(review.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-muted-foreground bg-slate-100 dark:bg-muted px-2.5 py-0.5 rounded-full">
                  <Building2 className="w-3 h-3" />
                  {placeName}
                </span>
              </div>
            </div>
          </div>

          {/* Rating & Status Badge */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <StarRating rating={Number(review.rating || 5)} size="md" />
            <span
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-extrabold border shadow-xs",
                hasReplied
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : Number(review.rating) <= 2
                  ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 animate-pulse"
                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
              )}
            >
              {hasReplied
                ? "Đã phản hồi"
                : Number(review.rating) <= 2
                ? "Cần xử lý gấp"
                : "Chưa phản hồi"}
            </span>
          </div>
        </div>

        {/* Review Body */}
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            {review.content ||
              review.comment ||
              "Khách hàng không để lại nhận xét bằng lời."}
          </p>

          {/* Media Attachments */}
          {mediaItems.length > 0 && (
            <div className="flex items-center gap-2.5 flex-wrap pt-1">
              {mediaItems.map((media, idx) => (
                <a
                  key={idx}
                  href={media.src}
                  target="_blank"
                  rel="noreferrer"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-[18px] overflow-hidden border border-slate-200 dark:border-border/80 hover:opacity-90 transition-opacity shrink-0"
                >
                  <img
                    src={media.src}
                    alt="Ảnh đánh giá"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* ── Official Replies Stream ── */}
        {hasReplied && (
          <div className="space-y-3 pt-2">
            {review.replies.map((reply) => {
              const isEditing = editingReplyId === reply.id;
              const isActionLoading = actionLoadingByReply?.[reply.id];

              return (
                <div
                  key={reply.id}
                  className="p-4 sm:p-5 rounded-[26px] bg-[#FAFAF8] dark:bg-muted/50 border border-slate-200/80 dark:border-border/80 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-950 dark:bg-white" />
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        Phản hồi từ Doanh nghiệp
                      </span>
                      <span className="text-[11px] text-slate-400">
                        • {formatDate(reply.createdAt)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onStartEditReply(reply)}
                        disabled={isActionLoading}
                        className="p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-muted text-slate-500 hover:text-slate-900 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteReply(review.id, reply.id)}
                        disabled={isActionLoading}
                        className="p-1.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 transition-colors"
                        title="Xóa phản hồi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => onEditContentChange(e.target.value)}
                        className="rounded-2xl text-xs bg-white dark:bg-card border-slate-200"
                        rows={3}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={onCancelEditReply}
                          className="rounded-xl h-8 px-3 text-xs"
                        >
                          Hủy
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onSaveEditReply(review.id, reply.id)}
                          disabled={isActionLoading}
                          className="rounded-xl h-8 px-3.5 text-xs font-bold bg-slate-950 text-white"
                        >
                          Lưu thay đổi
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {reply.content}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Reply Trigger / Input Form ── */}
        {!hasReplied && !isReplying && (
          <div className="pt-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {quickReplyTemplates.map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onStartReply(review.id);
                    onContentChange(template);
                  }}
                  className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-muted text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                >
                  ⚡ {template.slice(0, 32)}...
                </button>
              ))}
            </div>

            <Button
              size="sm"
              onClick={() => onStartReply(review.id)}
              className="rounded-[20px] h-8 px-4 text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground shadow-xs gap-1.5 shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Phản hồi
            </Button>
          </div>
        )}

        {/* Active Replying Form */}
        {isReplying && (
          <div className="p-4 sm:p-5 rounded-[26px] bg-[#FAFAF8] dark:bg-muted/40 border border-slate-200/80 dark:border-border/80 space-y-3 pt-3 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Soạn phản hồi gửi khách hàng
              </span>
              <button
                type="button"
                onClick={onCancelReply}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Hủy
              </button>
            </div>

            <Textarea
              value={replyContent}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Nhập nội dung phản hồi lịch sự, tri ân khách hàng..."
              className="rounded-2xl text-xs bg-white dark:bg-card border-slate-200 focus:outline-hidden"
              rows={3}
            />

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                {quickReplyTemplates.map((template, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onContentChange(template)}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-card border border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    Mẫu {idx + 1}
                  </button>
                ))}
              </div>

              <Button
                size="sm"
                onClick={onSendReply}
                disabled={sending || !replyContent.trim()}
                className="rounded-2xl h-8 px-4 text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white shadow-xs gap-1.5"
              >
                <Send className="w-3 h-3" /> Gửi phản hồi
              </Button>
            </div>
          </div>
        )}
      </article>
    );
  }
);

BentoReviewCard.displayName = "BentoReviewCard";
export default BentoReviewCard;
