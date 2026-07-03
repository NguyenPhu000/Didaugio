import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useTransition,
  memo,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import {
  Star,
  MessageSquare,
  Send,
  X,
  MessagesSquare,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Image as ImageIcon,
  AlertTriangle,
  Clock,
  Download,
  Search,
} from "lucide-react";
import { exportToCsv, formatCsvDate, slugifyFilename } from "@/utils/csvExport";
import api from "@/constants/api";
import { getMyPlaces } from "@/apis/businessApi";
import {
  BusinessSectionCard,
  BusinessPageHeader,
  BusinessEmptyState,
} from "@/components/business/ui";
import { DESIGN } from "@/components/business/dashboardWidgetHelpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/utils/mediaUrl";

const REVIEW_API = "/business/reviews";
const REVIEW_MEDIA_PREVIEW_LIMIT = 5;

const reviewApi = {
  list: (params) => api.get(REVIEW_API, { params }),
  getStats: () => api.get(`${REVIEW_API}/stats`),
  reply: (reviewId, content) => api.post(`${REVIEW_API}/${reviewId}/reply`, { content }),
  updateReply: (reviewId, replyId, content) => api.put(`${REVIEW_API}/${reviewId}/replies/${replyId}`, { content }),
  deleteReply: (reviewId, replyId) => api.delete(`${REVIEW_API}/${reviewId}/replies/${replyId}`),
  moderateReply: (reviewId, replyId, status) => api.patch(`${REVIEW_API}/${reviewId}/replies/${replyId}/moderation`, { status }),
};

// ─── Star Rating ──────────────────────────────────────────────────────────────

const StarRating = memo(({ rating, size = "sm" }) => {
  const sz = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sz} ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
});
StarRating.displayName = "StarRating";

const getReviewMediaSrc = (media) =>
  resolveMediaUrl(
    media?.mediaData || media?.thumbnailUrl || media?.secureUrl || media?.url,
  );

// ─── Review Card ──────────────────────────────────────────────────────────────

const ReviewCard = memo(({
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
  onModerateReply,
}) => {
  const { t } = useTranslation();
  const formatDate = useCallback(
    (date) => (date ? new Date(date).toLocaleDateString("vi-VN") : ""),
    [],
  );
  const hasReplied = review.replies?.length > 0;
  const isReplying = replyingTo === review.id;
  const mediaItems = useMemo(
    () =>
      (review.media || [])
        .map((media) => ({ ...media, src: getReviewMediaSrc(media) }))
        .filter((media) => media.src)
        .slice(0, REVIEW_MEDIA_PREVIEW_LIMIT),
    [review.media],
  );

  const handleQuickReply = useCallback(
    (template) => {
      onStartReply(review.id);
      onContentChange(template);
    },
    [review.id, onStartReply, onContentChange],
  );

  const handleLowRatingReply = useCallback(() => {
    onStartReply(review.id);
    onContentChange(t("business.reviews.quickReplies.apologize"));
  }, [review.id, onStartReply, onContentChange, t]);

  return (
    <div className={cn(DESIGN.card, "[content-visibility:auto] p-4 md:p-5 gap-3 flex flex-col")}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 font-semibold text-sm text-zinc-600">
          {(review.user?.profile?.fullName || "?")?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-zinc-950">
              {review.user?.profile?.fullName || t("admin.reviewModeration.anonymous")}
            </span>
            <StarRating rating={review.rating} />
            {!hasReplied && (
              <Badge
                variant="outline"
                className="text-[10px] text-amber-600 border-amber-200 bg-amber-50"
              >
                {t("business.reviews.title")}
              </Badge>
            )}
            {review.isVerifiedPurchase && (
              <Badge
                variant="outline"
                className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                {t("admin.reviewModeration.verified")}
              </Badge>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            {review.place?.name} · {formatDate(review.createdAt)}
          </p>
        </div>
      </div>

      {/* Content */}
      {review.title && (
        <p className="font-medium text-sm text-zinc-950">{review.title}</p>
      )}
      {review.content && (
        <p className="text-sm text-zinc-500 leading-relaxed">
          {review.content}
        </p>
      )}
      {mediaItems.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {mediaItems.map((media, index) => (
            <a
              key={media.id || `${media.src}-${index}`}
              href={media.src}
              target="_blank"
              rel="noreferrer"
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
              title={media.caption || t("business.reviews.title")}
            >
              <img
                src={media.src}
                alt={media.caption || `${t("business.reviews.title")} ${index + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      )}

      {/* Existing replies */}
      {hasReplied && (
        <div className="ml-3 md:ml-6 pl-3 md:pl-4 border-l-2 border-zinc-200 gap-3 flex flex-col">
          {review.replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              placeName={review.place?.name}
              editingReplyId={editingReplyId}
              editContent={editContent}
              actionLoadingByReply={actionLoadingByReply}
              onStartEditReply={onStartEditReply}
              onCancelEditReply={onCancelEditReply}
              onEditContentChange={onEditContentChange}
              onSaveEditReply={onSaveEditReply}
              onDeleteReply={onDeleteReply}
              onModerateReply={onModerateReply}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* Reply UI */}
      {isReplying ? (
        <div className="gap-2 flex flex-col">
          <div className="flex flex-wrap gap-1.5">
            {quickReplyTemplates.map((template) => (
              <Button
                key={template}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-full px-2.5 text-[11px]"
                onClick={() => onContentChange(template)}
              >
                {template.slice(0, 34)}...
              </Button>
            ))}
          </div>
          <div className="flex gap-2 items-start">
            <Textarea
              autoFocus
              placeholder={t("business.reviews.replySuccess")}
              value={replyContent}
              onChange={(e) => onContentChange(e.target.value)}
              rows={2}
              className="flex-1 text-sm min-w-0"
            />
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                className="h-9 w-9 p-0 bg-zinc-950 text-white hover:bg-zinc-900"
                onClick={onSendReply}
                disabled={sending}
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={onCancelReply}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        !hasReplied && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9 min-h-[44px] md:min-h-0 md:h-8 text-xs"
              onClick={() => onStartReply(review.id)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {t("admin.reviewModeration.reply")}
            </Button>
            {review.rating <= 2 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-9 min-h-[44px] md:min-h-0 md:h-8 text-xs border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                onClick={handleLowRatingReply}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {t("business.schedule.processing")}
              </Button>
            )}
          </div>
        )
      )}
    </div>
  );
});
ReviewCard.displayName = "ReviewCard";

// ─── Reply Item (extracted for memoization) ───────────────────────────────────

const ReplyItem = memo(({
  reply,
  placeName,
  editingReplyId,
  editContent,
  actionLoadingByReply,
  onStartEditReply,
  onCancelEditReply,
  onEditContentChange,
  onSaveEditReply,
  onDeleteReply,
  onModerateReply,
  formatDate,
}) => {
  const { t } = useTranslation();
  const isEditing = editingReplyId === reply.id;
  const isLoading = !!actionLoadingByReply[reply.id];

  const moderateIcon = useMemo(() => {
    if (isLoading) return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    if (reply.status === "hidden") return <Eye className="h-3.5 w-3.5" />;
    return <EyeOff className="h-3.5 w-3.5" />;
  }, [isLoading, reply.status]);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-zinc-950 truncate">
            {placeName}
          </span>
          <span className="text-[10px] text-zinc-500 shrink-0">
            {formatDate(reply.createdAt)}
          </span>
          {reply.status === "hidden" && (
            <Badge
              variant="outline"
              className="text-[10px] border-amber-300 text-amber-700 bg-amber-50 shrink-0"
            >
              {t("admin.reviewModeration.hidden")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 md:h-7 md:w-7 p-0"
            onClick={() => onStartEditReply(reply)}
            disabled={isLoading || isEditing}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 md:h-7 md:w-7 p-0"
            onClick={() =>
              onModerateReply(reply.id, reply.status === "hidden" ? "visible" : "hidden")
            }
            disabled={isLoading}
          >
            {moderateIcon}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 md:h-7 md:w-7 p-0 text-destructive hover:text-destructive"
            onClick={() => onDeleteReply(reply.id)}
            disabled={isLoading}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="mt-1 flex gap-2 items-start">
          <Textarea
            value={editContent}
            onChange={(e) => onEditContentChange(e.target.value)}
            rows={2}
            className="flex-1 text-xs min-w-0"
          />
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              className="h-8 w-8 p-0 bg-zinc-950 text-white hover:bg-zinc-900"
              onClick={() => onSaveEditReply(reply.id)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onCancelEditReply}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
          {reply.content}
        </p>
      )}
    </div>
  );
});
ReplyItem.displayName = "ReplyItem";

// ─── Rating Bar ───────────────────────────────────────────────────────────────

const RatingBar = memo(({ star, count, total }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-8 shrink-0 text-right">
        {star} ★
      </span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-6 shrink-0">
        {count}
      </span>
    </div>
  );
});
RatingBar.displayName = "RatingBar";

// ─── Search Debounce Hook ─────────────────────────────────────────────────────

const useDebouncedValue = (value, delay = 350) => {
  const [debounced, setDebounced] = useState(value);
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timerRef.current);
  }, [value, delay]);

  return debounced;
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────

const ReviewCardSkeleton = memo(() => (
  <div className="space-y-2 p-4 rounded-xl border border-border">
    <div className="flex items-center gap-2">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <Skeleton className="h-3.5 w-full" />
    <Skeleton className="h-3.5 w-3/4" />
  </div>
));
ReviewCardSkeleton.displayName = "ReviewCardSkeleton";

// ─── Main Page ────────────────────────────────────────────────────────────────

const ReviewListPage = () => {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [selectedPlaceId, setSelectedPlaceId] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("0");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [tabFilter, setTabFilter] = useState("all");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [actionLoadingByReply, setActionLoadingByReply] = useState({});
  const [isPendingTransition, startTransition] = useTransition();

  const QUICK_REPLY_TEMPLATES = useMemo(
    () => [
      t("business.reviews.quickReplies.thankPositive"),
      t("business.reviews.quickReplies.thankNeutral"),
      t("business.reviews.quickReplies.apologize"),
    ],
    [t],
  );

  const STATUS_LABELS = useMemo(
    () => ({
      visible: t("admin.reviewModeration.show"),
      hidden: t("admin.reviewModeration.hidden"),
      pending: t("admin.reviewModeration.pending"),
      reported: t("admin.reviewModeration.reported"),
    }),
    [t],
  );

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const response = await reviewApi.list({
        search: debouncedSearch || undefined,
        placeId: selectedPlaceId !== "all" ? selectedPlaceId : undefined,
        rating: ratingFilter !== "0" ? ratingFilter : undefined,
        hasMedia: mediaFilter === "with-media" ? true : undefined,
        page: 1,
        limit: 50,
      });
      setReviews(response.data || []);
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.reviews.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, ratingFilter, selectedPlaceId, mediaFilter, t]);

  const loadStats = useCallback(async () => {
    try {
      const response = await reviewApi.getStats();
      setStats(response.data);
    } catch (err) {
      console.error("[ReviewListPage] Failed to load stats:", err);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);
  useEffect(() => {
    loadStats();
  }, [loadStats]);
  useEffect(() => {
    getMyPlaces()
      .then((res) => setPlaces(res.data || []))
      .catch(() => {});
  }, []);

  const filteredReviews = useMemo(() => {
    if (tabFilter === "replied")
      return reviews.filter((r) => r.replies?.length > 0);
    if (tabFilter === "unreplied")
      return reviews.filter((r) => !r.replies?.length);
    if (tabFilter === "attention")
      return reviews.filter((r) => Number(r.rating) <= 2 && !r.replies?.length);
    return reviews;
  }, [reviews, tabFilter]);

  const unrepliedCount = useMemo(
    () => reviews.filter((r) => !r.replies?.length).length,
    [reviews],
  );
  const attentionCount = useMemo(
    () => reviews.filter((r) => Number(r.rating) <= 2 && !r.replies?.length).length,
    [reviews],
  );

  const handleTabChange = useCallback((nextTab) => {
    startTransition(() => {
      setTabFilter(nextTab);
    });
  }, []);

  const handleReply = useCallback(async () => {
    if (!replyContent.trim()) {
      toast.error(t("business.reviews.replyFailed"));
      return;
    }
    setSending(true);
    try {
      await reviewApi.reply(replyingTo, replyContent);
      toast.success(t("business.reviews.replySuccess"));
      setReplyingTo(null);
      setReplyContent("");
      await loadReviews();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.reviews.replyFailed"));
    } finally {
      setSending(false);
    }
  }, [replyContent, replyingTo, t, loadReviews]);

  const handleStartReply = useCallback((reviewId) => {
    setReplyingTo(reviewId);
    setReplyContent("");
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
    setReplyContent("");
  }, []);

  const handleStartEditReply = useCallback((reply) => {
    setEditingReplyId(reply.id);
    setEditContent(reply.content || "");
  }, []);

  const handleCancelEditReply = useCallback(() => {
    setEditingReplyId(null);
    setEditContent("");
  }, []);

  const handleSaveEditReply = useCallback(async (reviewId, replyId) => {
    if (!editContent.trim()) {
      toast.error(t("business.reviews.replyFailed"));
      return;
    }

    setActionLoadingByReply((prev) => ({ ...prev, [replyId]: true }));
    try {
      await reviewApi.updateReply(reviewId, replyId, editContent);
      toast.success(t("business.reviews.replySuccess"));
      handleCancelEditReply();
      await loadReviews();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.reviews.replyFailed"));
    } finally {
      setActionLoadingByReply((prev) => ({ ...prev, [replyId]: false }));
    }
  }, [editContent, t, loadReviews, handleCancelEditReply]);

  const handleDeleteReply = useCallback(async (reviewId, replyId) => {
    setActionLoadingByReply((prev) => ({ ...prev, [replyId]: true }));
    try {
      await reviewApi.deleteReply(reviewId, replyId);
      toast.success(t("common.deletedSuccessfully"));
      if (editingReplyId === replyId) {
        handleCancelEditReply();
      }
      await loadReviews();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.reviews.replyFailed"));
    } finally {
      setActionLoadingByReply((prev) => ({ ...prev, [replyId]: false }));
    }
  }, [editingReplyId, t, loadReviews, handleCancelEditReply]);

  const handleModerateReply = useCallback(async (reviewId, replyId, status) => {
    setActionLoadingByReply((prev) => ({ ...prev, [replyId]: true }));
    try {
      await reviewApi.moderateReply(reviewId, replyId, status);
      toast.success(
        status === "hidden" ? t("admin.reviewModeration.hidden") : t("admin.reviewModeration.show"),
      );
      await loadReviews();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.reviews.replyFailed"));
    } finally {
      setActionLoadingByReply((prev) => ({ ...prev, [replyId]: false }));
    }
  }, [t, loadReviews]);

  const handleExportCsv = useCallback(() => {
    if (!reviews || reviews.length === 0) {
      toast.error(t("admin.reviewModeration.noReviews"));
      return;
    }

    exportToCsv({
      columns: [
        { key: "id", label: "ID" },
        { key: (row) => row.user?.profile?.fullName || row.user?.email?.split("@")[0] || t("admin.reviewModeration.anonymous"), label: t("business.reviews.title") },
        { key: (row) => row.user?.email || "", label: "Email" },
        { key: "rating", label: t("admin.analytics.avgRating") },
        { key: (row) => row.content || row.comment || "", label: t("business.reviews.title") },
        { key: (row) => STATUS_LABELS[row.status] || row.status, label: t("business.revenue.status") },
        { key: (row) => row.place?.name || "", label: t("business.places.title") },
        { key: (row) => row.replies?.[0]?.content || "", label: t("admin.reviewModeration.reply") },
        { key: (row) => row._count?.replies ?? (row.replies?.length ?? 0), label: `${t("admin.reviewModeration.reply")} (SL)` },
        { key: (row) => (row.media || []).length, label: "Media" },
        { key: (row) => formatCsvDate(row.createdAt), label: t("common.createdAt") },
      ],
      data: reviews,
      filename: slugifyFilename("danh_sach_danh_gia"),
    });

    toast.success(t("common.export"));
  }, [reviews, t, STATUS_LABELS]);

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <BusinessPageHeader
          title={t("business.reviews.title")}
          description={t("business.reviews.description")}
          badge={stats?.total || undefined}
        />
        <Button
          variant="outline"
          onClick={handleExportCsv}
          className="h-9 px-3 gap-1.5 font-mono text-xs uppercase font-bold shrink-0 self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          CSV
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Average rating */}
          <BusinessSectionCard>
            <div className="flex flex-col items-center justify-center py-3 md:py-4 gap-1.5 md:gap-2">
              <p className="text-3xl md:text-5xl font-bold text-foreground">
                {Number(stats.avgRating || 0).toFixed(1)}
              </p>
              <StarRating rating={Math.round(stats.avgRating)} size="lg" />
              <p className="text-[10px] md:text-xs text-muted-foreground text-center">
                {t("admin.analytics.avgRating")} ({stats.total})
              </p>
            </div>
          </BusinessSectionCard>

          <BusinessSectionCard>
            <div className="flex flex-col items-center justify-center py-3 md:py-4 gap-1.5 md:gap-2">
              <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <p className="text-2xl md:text-3xl font-bold text-foreground">
                {Number(stats.responseRate || 0).toFixed(1)}%
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground text-center">
                {t("business.reviews.responseRate", { defaultValue: "Tỷ lệ phản hồi" })}
              </p>
            </div>
          </BusinessSectionCard>

          <BusinessSectionCard>
            <div className="flex flex-col items-center justify-center py-3 md:py-4 gap-1.5 md:gap-2">
              <Clock className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <p className="text-2xl md:text-3xl font-bold text-foreground">
                {Number(stats.avgResponseTimeHours || 0).toFixed(1)}h
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground text-center">
                {t("business.reviews.avgResponseTime", { defaultValue: "Thời gian phản hồi" })}
              </p>
            </div>
          </BusinessSectionCard>

          <BusinessSectionCard>
            <div className="flex flex-col items-center justify-center py-3 md:py-4 gap-1.5 md:gap-2">
              <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
              <p className="text-2xl md:text-3xl font-bold text-foreground">
                {Math.max((stats.total || 0) - (stats.repliedCount || 0), 0)}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground text-center">
                {t("admin.reviewModeration.pending")}
              </p>
            </div>
          </BusinessSectionCard>

          {/* Rating distribution */}
          <BusinessSectionCard title={t("admin.analytics.avgRating")} className="col-span-2 md:col-span-4">
            <div className="space-y-2.5">
              {[5, 4, 3, 2, 1].map((r) => (
                <RatingBar
                  key={r}
                  star={r}
                  count={stats.byRating?.[r] || 0}
                  total={stats.total || 0}
                />
              ))}
            </div>
          </BusinessSectionCard>
        </div>
      )}

      {/* Main List */}
      <BusinessSectionCard
        title={t("business.reviews.title")}
        titleIcon={MessagesSquare}
        bodyClassName="p-0"
        action={
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={selectedPlaceId} onValueChange={setSelectedPlaceId}>
              <SelectTrigger className="h-9 md:h-8 text-xs w-full sm:w-40">
                <SelectValue placeholder={t("business.bookings.allPlaces")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("business.bookings.allPlaces")}</SelectItem>
                {places.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="h-9 md:h-8 text-xs w-full sm:w-28">
                <SelectValue placeholder={t("admin.reviewModeration.allStars")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("admin.reviewModeration.allStars")}</SelectItem>
                {[5, 4, 3, 2, 1].map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    {r} ★
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={mediaFilter} onValueChange={setMediaFilter}>
              <SelectTrigger className="h-9 md:h-8 text-xs w-full sm:w-32">
                <SelectValue placeholder={t("admin.reviewModeration.allPhotos")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.reviewModeration.allPhotos")}</SelectItem>
                <SelectItem value="with-media">
                  <span className="inline-flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" />
                    {t("admin.reviewModeration.withPhotos")}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={t("admin.reviewModeration.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 md:h-8 text-xs w-full sm:w-40"
              />
            </div>
          </div>
        }
      >
        <Tabs value={tabFilter} onValueChange={handleTabChange}>
          <div className="px-4 md:px-5 border-b border-border/60 overflow-x-auto">
            <TabsList className="h-10 bg-transparent gap-1 p-0">
              <TabsTrigger value="all" className={DESIGN.tabUnderlineTrigger}>
                {t("common.all")} ({reviews.length})
              </TabsTrigger>
              <TabsTrigger
                value="unreplied"
                className={DESIGN.tabUnderlineTrigger}
              >
                {t("admin.reviewModeration.pending")} ({unrepliedCount})
              </TabsTrigger>
              <TabsTrigger
                value="replied"
                className={DESIGN.tabUnderlineTrigger}
              >
                {t("admin.reviewModeration.reply")} ({reviews.length - unrepliedCount})
              </TabsTrigger>
              <TabsTrigger
                value="attention"
                className={DESIGN.tabUnderlineTrigger}
              >
                {t("admin.reviewModeration.needsAction")} ({attentionCount})
              </TabsTrigger>
            </TabsList>
            {isPendingTransition && (
              <p className="py-1 text-[11px] text-muted-foreground">
                {t("common.processing")}
              </p>
            )}
          </div>

          {["all", "unreplied", "replied", "attention"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              <div className="p-4 md:p-5">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <ReviewCardSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredReviews.length === 0 ? (
                  <BusinessEmptyState
                    icon={Star}
                    message={t("admin.reviewModeration.noReviews")}
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTabFilter("all");
                          setSearch("");
                          setSelectedPlaceId("all");
                          setRatingFilter("0");
                          setMediaFilter("all");
                        }}
                      >
                        {t("common.reset", { defaultValue: "Đặt lại bộ lọc" })}
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-4">
                    {filteredReviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        replyingTo={replyingTo}
                        replyContent={replyContent}
                        editingReplyId={editingReplyId}
                        editContent={editContent}
                        sending={sending}
                        actionLoadingByReply={actionLoadingByReply}
                        quickReplyTemplates={QUICK_REPLY_TEMPLATES}
                        onStartReply={handleStartReply}
                        onCancelReply={handleCancelReply}
                        onContentChange={setReplyContent}
                        onSendReply={handleReply}
                        onStartEditReply={handleStartEditReply}
                        onCancelEditReply={handleCancelEditReply}
                        onEditContentChange={setEditContent}
                        onSaveEditReply={(replyId) =>
                          handleSaveEditReply(review.id, replyId)
                        }
                        onDeleteReply={(replyId) =>
                          handleDeleteReply(review.id, replyId)
                        }
                        onModerateReply={(replyId, status) =>
                          handleModerateReply(review.id, replyId, status)
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </BusinessSectionCard>
    </div>
  );
};

export default ReviewListPage;
