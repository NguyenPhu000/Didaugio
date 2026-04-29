import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useTransition,
} from "react";
import toast from "react-hot-toast";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import {
  Star,
  Search,
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
} from "lucide-react";
import api from "@/constants/api";
import { getMyPlaces } from "@/apis/businessApi";
import {
  SectionCard,
  PageHeader,
  EmptyState,
} from "@/components/business/DashboardWidgets";
import { DESIGN } from "@/components/business/dashboardWidgetHelpers";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
const QUICK_REPLY_TEMPLATES = [
  "Cảm ơn bạn đã chia sẻ trải nghiệm. Chúng tôi rất vui khi được phục vụ bạn và mong sớm gặp lại bạn.",
  "Cảm ơn góp ý của bạn. Chúng tôi đã ghi nhận phản hồi này để cải thiện chất lượng dịch vụ.",
  "Rất tiếc vì trải nghiệm của bạn chưa như kỳ vọng. Chúng tôi sẽ kiểm tra lại ngay và phản hồi hướng xử lý sớm nhất.",
];

const NEGATIVE_REPLY_TEMPLATE =
  "Rất tiếc vì trải nghiệm của bạn chưa tốt. Chúng tôi xin ghi nhận và sẽ kiểm tra lại để cải thiện ngay.";

// ─── Star Rating ──────────────────────────────────────────────────────────────

const StarRating = ({ rating, size = "sm" }) => {
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
};

const getReviewMediaSrc = (media) =>
  resolveMediaUrl(
    media?.mediaData || media?.thumbnailUrl || media?.secureUrl || media?.url,
  );

// ─── Review Card ──────────────────────────────────────────────────────────────

const ReviewCard = ({
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
  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("vi-VN") : "";
  const hasReplied = review.replies?.length > 0;
  const isReplying = replyingTo === review.id;
  const mediaItems = (review.media || [])
    .map((media) => ({ ...media, src: getReviewMediaSrc(media) }))
    .filter((media) => media.src)
    .slice(0, REVIEW_MEDIA_PREVIEW_LIMIT);

  const getModerateReplyIcon = (reply) => {
    if (actionLoadingByReply[reply.id]) {
      return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    }
    if (reply.status === "hidden") {
      return <Eye className="h-3.5 w-3.5" />;
    }
    return <EyeOff className="h-3.5 w-3.5" />;
  };

  return (
    <div className={cn(DESIGN.card, "[content-visibility:auto] p-5 space-y-3")}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 font-semibold text-sm text-muted-foreground">
          {(review.user?.profile?.fullName || "?")?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">
              {review.user?.profile?.fullName || "Ẩn danh"}
            </span>
            <StarRating rating={review.rating} />
            {!hasReplied && (
              <Badge
                variant="outline"
                className="text-[10px] text-amber-600 border-amber-200 bg-amber-50"
              >
                Chưa phản hồi
              </Badge>
            )}
            {review.isVerifiedPurchase && (
              <Badge
                variant="outline"
                className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                Đã xác thực
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {review.place?.name} · {formatDate(review.createdAt)}
          </p>
        </div>
      </div>

      {/* Content */}
      {review.title && (
        <p className="font-medium text-sm text-foreground">{review.title}</p>
      )}
      {review.content && (
        <p className="text-sm text-muted-foreground leading-relaxed">
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
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted"
              title={media.caption || "Ảnh đánh giá"}
            >
              <img
                src={media.src}
                alt={media.caption || `Ảnh đánh giá ${index + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      )}

      {/* Existing replies */}
      {hasReplied && (
        <div className="ml-6 pl-4 border-l-2 border-primary/30 space-y-3">
          {review.replies.map((reply) => (
            <div key={reply.id}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary">
                    {reply.user?.profile?.fullName || "Doanh nghiệp"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(reply.createdAt)}
                  </span>
                  {reply.status === "hidden" && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-amber-300 text-amber-700 bg-amber-50"
                    >
                      Đã ẩn
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onStartEditReply(reply)}
                    disabled={
                      !!actionLoadingByReply[reply.id] ||
                      editingReplyId === reply.id
                    }
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() =>
                      onModerateReply(
                        reply.id,
                        reply.status === "hidden" ? "visible" : "hidden",
                      )
                    }
                    disabled={!!actionLoadingByReply[reply.id]}
                  >
                    {getModerateReplyIcon(reply)}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => onDeleteReply(reply.id)}
                    disabled={!!actionLoadingByReply[reply.id]}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {editingReplyId === reply.id ? (
                <div className="mt-1 flex gap-2 items-start">
                  <Textarea
                    value={editContent}
                    onChange={(e) => onEditContentChange(e.target.value)}
                    rows={2}
                    className="flex-1 text-xs"
                  />
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onSaveEditReply(reply.id)}
                      disabled={!!actionLoadingByReply[reply.id]}
                    >
                      {actionLoadingByReply[reply.id] ? (
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
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {reply.content}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reply UI */}
      {isReplying ? (
        <div className="space-y-2">
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
              placeholder="Nhập phản hồi..."
              value={replyContent}
              onChange={(e) => onContentChange(e.target.value)}
              rows={2}
              className="flex-1 text-sm"
            />
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                className="h-9 w-9 p-0"
                onClick={onSendReply}
                disabled={sending}
              >
                <Send className="h-3.5 w-3.5" />
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
              className="gap-1.5 h-8 text-xs"
              onClick={() => onStartReply(review.id)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Phản hồi
            </Button>
            {review.rating <= 2 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                onClick={() => {
                  onStartReply(review.id);
                  onContentChange(NEGATIVE_REPLY_TEMPLATE);
                }}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Xử lý nhanh
              </Button>
            )}
          </div>
        )
      )}
    </div>
  );
};

// ─── Rating Bar ───────────────────────────────────────────────────────────────

const RatingBar = ({ star, count, total }) => {
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
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const ReviewListPage = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState("");
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

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(REVIEW_API, {
        params: {
          search,
          placeId: selectedPlaceId !== "all" ? selectedPlaceId : undefined,
          rating: ratingFilter !== "0" ? ratingFilter : undefined,
          hasMedia: mediaFilter === "with-media" ? true : undefined,
          page: 1,
          limit: 50,
        },
      });
      setReviews(response.data || []);
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  }, [search, ratingFilter, selectedPlaceId, mediaFilter]);

  const loadStats = useCallback(async () => {
    try {
      const response = await api.get(`${REVIEW_API}/stats`);
      setStats(response.data);
    } catch {
      // Keep list visible even if stats endpoint fails.
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

  const handleTabChange = (nextTab) => {
    startTransition(() => {
      setTabFilter(nextTab);
    });
  };

  const handleReply = async () => {
    if (!replyContent.trim()) {
      toast.error("Nội dung phản hồi không được trống");
      return;
    }
    setSending(true);
    try {
      await api.post(`${REVIEW_API}/${replyingTo}/reply`, {
        content: replyContent,
      });
      toast.success("Phản hồi thành công");
      setReplyingTo(null);
      setReplyContent("");
      await loadReviews();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể phản hồi");
    } finally {
      setSending(false);
    }
  };

  const handleStartEditReply = (reply) => {
    setEditingReplyId(reply.id);
    setEditContent(reply.content || "");
  };

  const handleCancelEditReply = () => {
    setEditingReplyId(null);
    setEditContent("");
  };

  const handleSaveEditReply = async (reviewId, replyId) => {
    if (!editContent.trim()) {
      toast.error("Nội dung phản hồi không được trống");
      return;
    }

    setActionLoadingByReply((prev) => ({ ...prev, [replyId]: true }));
    try {
      await api.put(`${REVIEW_API}/${reviewId}/replies/${replyId}`, {
        content: editContent,
      });
      toast.success("Cập nhật phản hồi thành công");
      handleCancelEditReply();
      await loadReviews();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể cập nhật phản hồi");
    } finally {
      setActionLoadingByReply((prev) => ({ ...prev, [replyId]: false }));
    }
  };

  const handleDeleteReply = async (reviewId, replyId) => {
    setActionLoadingByReply((prev) => ({ ...prev, [replyId]: true }));
    try {
      await api.delete(`${REVIEW_API}/${reviewId}/replies/${replyId}`);
      toast.success("Xóa phản hồi thành công");
      if (editingReplyId === replyId) {
        handleCancelEditReply();
      }
      await loadReviews();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể xóa phản hồi");
    } finally {
      setActionLoadingByReply((prev) => ({ ...prev, [replyId]: false }));
    }
  };

  const handleModerateReply = async (reviewId, replyId, status) => {
    setActionLoadingByReply((prev) => ({ ...prev, [replyId]: true }));
    try {
      await api.patch(
        `${REVIEW_API}/${reviewId}/replies/${replyId}/moderation`,
        {
          status,
        },
      );
      toast.success(
        status === "hidden" ? "Đã ẩn phản hồi" : "Đã hiển thị phản hồi",
      );
      await loadReviews();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể moderation phản hồi");
    } finally {
      setActionLoadingByReply((prev) => ({ ...prev, [replyId]: false }));
    }
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <PageHeader
        title="Quản lý đánh giá"
        subtitle="Xem và phản hồi đánh giá từ khách hàng"
        badge={stats?.total || undefined}
      />

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Average rating */}
          <SectionCard>
            <div className="flex flex-col items-center justify-center py-4 gap-2">
              <p className="text-5xl font-bold text-foreground">
                {Number(stats.avgRating || 0).toFixed(1)}
              </p>
              <StarRating rating={Math.round(stats.avgRating)} size="lg" />
              <p className="text-xs text-muted-foreground">
                Trung bình từ {stats.total} đánh giá
              </p>
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex flex-col items-center justify-center py-4 gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              <p className="text-3xl font-bold text-foreground">
                {Number(stats.responseRate || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                Tỷ lệ đã phản hồi
              </p>
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex flex-col items-center justify-center py-4 gap-2">
              <Clock className="h-6 w-6 text-primary" />
              <p className="text-3xl font-bold text-foreground">
                {Number(stats.avgResponseTimeHours || 0).toFixed(1)}h
              </p>
              <p className="text-xs text-muted-foreground">
                Thời gian phản hồi TB
              </p>
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex flex-col items-center justify-center py-4 gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <p className="text-3xl font-bold text-foreground">
                {Math.max((stats.total || 0) - (stats.repliedCount || 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground">Chưa phản hồi</p>
            </div>
          </SectionCard>

          {/* Rating distribution */}
          <SectionCard title="Phân bố xếp hạng" className="md:col-span-4">
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
          </SectionCard>
        </div>
      )}

      {/* Main List */}
      <SectionCard
        title="Danh sách đánh giá"
        titleIcon={MessagesSquare}
        bodyClassName="p-0"
        action={
          <div className="flex gap-2 items-center">
            <Select value={selectedPlaceId} onValueChange={setSelectedPlaceId}>
              <SelectTrigger className="h-8 text-xs w-40">
                <SelectValue placeholder="Tất cả địa điểm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả địa điểm</SelectItem>
                {places.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="h-8 text-xs w-28">
                <SelectValue placeholder="Tất cả sao" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Tất cả sao</SelectItem>
                {[5, 4, 3, 2, 1].map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    {r} sao
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={mediaFilter} onValueChange={setMediaFilter}>
              <SelectTrigger className="h-8 text-xs w-32">
                <SelectValue placeholder="Ảnh đánh giá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả ảnh</SelectItem>
                <SelectItem value="with-media">
                  <span className="inline-flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Có ảnh
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Tìm nội dung..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs w-40"
              />
            </div>
          </div>
        }
      >
        <Tabs value={tabFilter} onValueChange={handleTabChange}>
          <div className="px-5 border-b border-border/60">
            <TabsList className="h-10 bg-transparent gap-1 p-0">
              <TabsTrigger value="all" className={DESIGN.tabUnderlineTrigger}>
                Tất cả ({reviews.length})
              </TabsTrigger>
              <TabsTrigger
                value="unreplied"
                className={DESIGN.tabUnderlineTrigger}
              >
                Chưa phản hồi ({unrepliedCount})
              </TabsTrigger>
              <TabsTrigger
                value="replied"
                className={DESIGN.tabUnderlineTrigger}
              >
                Đã phản hồi ({reviews.length - unrepliedCount})
              </TabsTrigger>
              <TabsTrigger
                value="attention"
                className={DESIGN.tabUnderlineTrigger}
              >
                Cần xử lý ({attentionCount})
              </TabsTrigger>
            </TabsList>
            {isPendingTransition && (
              <p className="py-1 text-[11px] text-muted-foreground">
                Đang lọc đánh giá...
              </p>
            )}
          </div>

          {["all", "unreplied", "replied", "attention"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              <div className="p-5">
                {(() => {
                  if (loading) {
                    return (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className="space-y-2 p-4 rounded-xl border border-border"
                          >
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-9 w-9 rounded-full" />
                              <div className="space-y-1.5">
                                <Skeleton className="h-3.5 w-32" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                            <Skeleton className="h-3.5 w-full" />
                            <Skeleton className="h-3.5 w-3/4" />
                          </div>
                        ))}
                      </div>
                    );
                  }

                  if (filteredReviews.length === 0) {
                    return (
                      <EmptyState
                        icon={Star}
                        message="Không có đánh giá nào."
                      />
                    );
                  }

                  return (
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
                          onStartReply={(reviewId) => {
                            setReplyingTo(reviewId);
                            setReplyContent("");
                          }}
                          onCancelReply={() => {
                            setReplyingTo(null);
                            setReplyContent("");
                          }}
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
                  );
                })()}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </SectionCard>
    </div>
  );
};

export default ReviewListPage;
