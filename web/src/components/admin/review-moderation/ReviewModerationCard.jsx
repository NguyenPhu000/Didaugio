import React, { memo } from "react";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_CLASSES,
  formatDate,
  getMediaSrc,
  StarRating,
} from "./reviewModerationConstants";

export const ReviewModerationCard = memo(
  ({
    review,
    note,
    moderationReason,
    replyReasons,
    actionLoading,
    onNoteChange,
    onModerationReasonChange,
    onReplyReasonChange,
    onModerateReview,
    onModerateReply,
  }) => {
    const author =
      review.user?.profile?.fullName ||
      review.user?.email?.split("@")[0] ||
      "Ẩn danh";
    const mediaItems = (review.media || [])
      .map((media) => ({ ...media, src: getMediaSrc(media) }))
      .filter((media) => media.src)
      .slice(0, 5);
    const statusClass =
      REVIEW_STATUS_CLASSES[review.status] || REVIEW_STATUS_CLASSES.pending;
    const isHidden = review.status === "hidden";

    return (
      <article className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">{author}</span>
              <StarRating rating={review.rating} />
              <Badge variant="outline" className={statusClass}>
                {REVIEW_STATUS_LABELS[review.status] || review.status}
              </Badge>
              {mediaItems.length > 0 && (
                <Badge variant="outline" className="gap-1">
                  <ImageIcon className="h-3 w-3" />
                  {mediaItems.length} ảnh
                </Badge>
              )}
              {review.isSeeded && (
                <Badge
                  variant="outline"
                  className="border-violet-200 bg-violet-50 text-violet-800"
                >
                  Seed
                </Badge>
              )}
              {review.isVerifiedPurchase && (
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  Đã xác thực
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {review.place?.name || "Không rõ địa điểm"} ·{" "}
              {review.place?.business?.businessName || "Chưa gắn business"} ·{" "}
              {formatDate(review.createdAt)}
            </p>

            {(review.moderationLogs?.length ?? 0) > 0 && (
              <details className="rounded-xl bg-muted/40 px-3 py-2 text-xs">
                <summary className="cursor-pointer font-medium text-muted-foreground">
                  Nhật ký moderation ({review.moderationLogs.length})
                </summary>
                <ul className="mt-2 space-y-2 text-muted-foreground">
                  {review.moderationLogs.map((log) => (
                    <li key={log.id} className="border-l-2 border-primary/30 pl-2">
                      <span className="text-foreground">
                        {log.action === "REVIEW_STATUS"
                          ? "Review"
                          : log.action === "REPLY_STATUS"
                            ? "Phản hồi"
                            : log.action}
                      </span>
                      {log.fromStatus || log.toStatus ? (
                        <>
                          {": "}
                          <span className="font-mono">
                            {log.fromStatus ?? "—"} → {log.toStatus ?? "—"}
                          </span>
                        </>
                      ) : null}
                      {log.reason ? (
                        <span className="mt-0.5 block italic text-foreground/80">
                          Lý do: {log.reason}
                        </span>
                      ) : null}
                      <span className="mt-0.5 block text-[10px] uppercase tracking-wide">
                        {log.actor?.profile?.fullName ||
                          log.actor?.email ||
                          "Admin"}{" "}
                        · {formatDate(log.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {review.title && (
              <p className="font-medium text-foreground">{review.title}</p>
            )}
            {review.content && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {review.content}
              </p>
            )}

            {mediaItems.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {mediaItems.map((media, index) => (
                  <a
                    key={media.id || `${media.src}-${index}`}
                    href={media.src}
                    target="_blank"
                    rel="noreferrer"
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted"
                  >
                    <img
                      src={media.src}
                      alt={media.caption || `Ảnh đánh giá ${index + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            )}

            {review.replies?.length > 0 && (
              <div className="space-y-2 border-l-2 border-primary/30 pl-4">
                {review.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="rounded-xl bg-muted/60 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-primary">
                        {reply.user?.profile?.fullName ||
                          reply.user?.email ||
                          "Doanh nghiệp"}
                      </span>
                      <div className="flex items-center gap-2">
                        {reply.status === "hidden" && (
                          <Badge variant="outline">Đã ẩn</Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          loading={actionLoading === `reply-${reply.id}`}
                          onClick={() =>
                            onModerateReply(
                              review.id,
                              reply.id,
                              reply.status === "hidden" ? "visible" : "hidden",
                              replyReasons[reply.id] || ""
                            )
                          }
                        >
                          {reply.status === "hidden" ? "Hiện" : "Ẩn"}
                        </Button>
                      </div>
                    </div>
                    <p className="mt-1 text-muted-foreground">{reply.content}</p>
                    {reply.status === "visible" && (
                      <Textarea
                        value={replyReasons[reply.id] || ""}
                        onChange={(e) =>
                          onReplyReasonChange(reply.id, e.target.value)
                        }
                        placeholder="Lý do khi ẩn phản hồi (bắt buộc)"
                        rows={2}
                        className="mt-2 text-xs"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-full space-y-2 lg:w-72">
            <Textarea
              value={note}
              onChange={(event) => onNoteChange(review.id, event.target.value)}
              placeholder="Note nội bộ cho moderation..."
              rows={3}
              className="text-sm"
            />
            <Textarea
              value={moderationReason}
              onChange={(event) =>
                onModerationReasonChange(review.id, event.target.value)
              }
              placeholder="Lý do can thiệp (bắt buộc khi Ẩn / Report)..."
              rows={2}
              className="text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={isHidden ? "outline" : "destructive"}
                size="sm"
                loading={actionLoading === `review-${review.id}-hidden`}
                onClick={() =>
                  onModerateReview(review.id, isHidden ? "visible" : "hidden")
                }
              >
                {isHidden ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                {isHidden ? "Khôi phục" : "Ẩn"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                loading={actionLoading === `review-${review.id}-reported`}
                onClick={() => onModerateReview(review.id, "reported")}
              >
                <AlertTriangle className="h-4 w-4" />
                Report
              </Button>
            </div>
          </div>
        </div>
      </article>
    );
  }
);

ReviewModerationCard.displayName = "ReviewModerationCard";
export default ReviewModerationCard;
