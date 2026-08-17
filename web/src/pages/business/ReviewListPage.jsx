// MAP: ReviewListPage
// ├── UI: @/components/business/reviews/{ReviewStatsSummary, ReviewFilterToolbar, ReviewCardItem, ReviewReplyModal, ReviewDeleteDialog}
// └── API: @/apis/businessReviewApi, @/apis/businessApi

import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Download, RefreshCw, MessageSquare } from "lucide-react";
import { exportToCsv, formatCsvDate, slugifyFilename } from "@/utils/csvExport";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import { getMyPlaces } from "@/apis/businessApi";
import AetherBentoCard from "@/components/business/AetherBentoCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Extracted Sub-Components & Constants
import BentoReviewCard from "@/components/business/reviews/BentoReviewCard";
import ReviewDistributionCard from "@/components/business/reviews/ReviewDistributionCard";
import ReviewFilterBar from "@/components/business/reviews/ReviewFilterBar";
import { reviewApi, QUICK_REPLY_TEMPLATES } from "@/components/business/reviews/reviewsConstants";

const ReviewListPage = memo(() => {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [tabFilter, setTabFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Reply Interaction States
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [actionLoadingByReply, setActionLoadingByReply] = useState({});

  const loadStats = useCallback(async () => {
    try {
      const res = await reviewApi.getStats();
      setStats(res.data?.data || res.data);
    } catch {
      // Fallback
    }
  }, []);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedPlaceId !== "all") params.placeId = selectedPlaceId;
      if (ratingFilter !== "all" && Number(ratingFilter) > 0) params.rating = ratingFilter;

      const res = await reviewApi.list(params);
      const items = res.data?.data || res.data || [];
      setReviews(Array.isArray(items) ? items : []);
    } catch (error) {
      toastApiErrorIfNeeded(error, "Không thể tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  }, [selectedPlaceId, ratingFilter]);

  useEffect(() => {
    getMyPlaces()
      .then((res) => setPlaces(res.data || []))
      .catch(() => {});
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Reply Actions
  const handleReply = useCallback(async () => {
    if (!replyingTo || !replyContent.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }

    setSending(true);
    try {
      await reviewApi.reply(replyingTo, replyContent.trim());
      toast.success("Đã gửi phản hồi thành công");
      setReplyingTo(null);
      setReplyContent("");
      await loadReviews();
      await loadStats();
    } catch (error) {
      toastApiErrorIfNeeded(error, "Gửi phản hồi thất bại");
    } finally {
      setSending(false);
    }
  }, [replyingTo, replyContent, loadReviews, loadStats]);

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

  const handleSaveEditReply = useCallback(
    async (reviewId, replyId) => {
      if (!editContent.trim()) {
        toast.error("Nội dung không được để trống");
        return;
      }
      setActionLoadingByReply((prev) => ({ ...prev, [replyId]: true }));
      try {
        await reviewApi.updateReply(reviewId, replyId, editContent);
        toast.success("Đã cập nhật phản hồi");
        handleCancelEditReply();
        await loadReviews();
      } catch (error) {
        toastApiErrorIfNeeded(error, "Cập nhật phản hồi thất bại");
      } finally {
        setActionLoadingByReply((prev) => ({ ...prev, [replyId]: false }));
      }
    },
    [editContent, loadReviews, handleCancelEditReply]
  );

  const handleDeleteReply = useCallback(
    async (reviewId, replyId) => {
      setActionLoadingByReply((prev) => ({ ...prev, [replyId]: true }));
      try {
        await reviewApi.deleteReply(reviewId, replyId);
        toast.success("Đã xóa phản hồi");
        if (editingReplyId === replyId) {
          handleCancelEditReply();
        }
        await loadReviews();
        await loadStats();
      } catch (error) {
        toastApiErrorIfNeeded(error, "Xóa phản hồi thất bại");
      } finally {
        setActionLoadingByReply((prev) => ({ ...prev, [replyId]: false }));
      }
    },
    [editingReplyId, loadReviews, loadStats, handleCancelEditReply]
  );

  const handleExportCsv = useCallback(() => {
    if (!reviews || reviews.length === 0) {
      toast.error("Không có đánh giá nào để xuất");
      return;
    }

    exportToCsv({
      columns: [
        { key: "id", label: "ID" },
        { key: (row) => row.user?.profile?.fullName || row.user?.email || "Khách", label: "Khách hàng" },
        { key: "rating", label: "Số sao" },
        { key: (row) => row.content || row.comment || "", label: "Nội dung" },
        { key: (row) => row.place?.name || "", label: "Cơ sở" },
        { key: (row) => row.replies?.[0]?.content || "", label: "Phản hồi gần nhất" },
        { key: (row) => formatCsvDate(row.createdAt), label: "Ngày đánh giá" },
      ],
      data: reviews,
      filename: slugifyFilename("danh_sach_danh_gia"),
    });
    toast.success("Đã xuất file báo cáo đánh giá CSV thành công");
  }, [reviews]);

  // Robust Stats Calculation
  const calculatedStats = useMemo(() => {
    const totalCount = stats?.total ?? reviews.length;
    let avg = 0;
    if (stats?.avgRating !== undefined && stats?.avgRating !== null && Number(stats.avgRating) > 0) {
      avg = Number(stats.avgRating);
    } else if (stats?.averageRating !== undefined && stats?.averageRating !== null && Number(stats.averageRating) > 0) {
      avg = Number(stats.averageRating);
    } else if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
      avg = sum / reviews.length;
    }

    const byRating = { ...(stats?.byRating || {}) };
    if (!stats?.byRating && reviews.length > 0) {
      reviews.forEach((r) => {
        const star = Math.round(Number(r.rating || 5));
        byRating[star] = (byRating[star] || 0) + 1;
      });
    }

    const unrepliedCount = reviews.filter((r) => !r.replies || r.replies.length === 0).length;
    const pending =
      unrepliedCount > 0
        ? unrepliedCount
        : stats?.total != null && stats?.repliedCount != null
        ? Math.max(stats.total - stats.repliedCount, 0)
        : 0;

    const replied = stats?.repliedCount ?? (totalCount - pending);
    const responseRate = totalCount > 0 ? (replied / totalCount) * 100 : 100;
    const avgResponseTime = stats?.avgResponseTimeHours ?? 0;

    return {
      total: totalCount,
      avgRating: avg,
      byRating,
      repliedCount: replied,
      pendingCount: pending,
      responseRate,
      avgResponseTimeHours: avgResponseTime,
    };
  }, [stats, reviews]);

  const attentionCount = useMemo(
    () => reviews.filter((r) => Number(r.rating) <= 2).length,
    [reviews]
  );

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Tab filter
      if (tabFilter === "unreplied" && r.replies?.length > 0) return false;
      if (tabFilter === "replied" && (!r.replies || r.replies.length === 0)) return false;
      if (tabFilter === "attention" && Number(r.rating) > 2) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const contentMatch = (r.content || r.comment || "").toLowerCase().includes(q);
        const nameMatch = (r.user?.profile?.fullName || r.user?.email || "").toLowerCase().includes(q);
        const placeMatch = (r.place?.name || "").toLowerCase().includes(q);
        if (!contentMatch && !nameMatch && !placeMatch) return false;
      }

      return true;
    });
  }, [reviews, tabFilter, search]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto font-sans transition-colors duration-200">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Trung Tâm Đánh Giá & Phản Hồi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
            Lắng nghe ý kiến của khách du lịch, giải quyết khiếu nại và xây dựng thương hiệu uy tín
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadReviews();
              loadStats();
            }}
            disabled={loading}
            className="flex-1 sm:flex-initial justify-center rounded-2xl h-10 px-4 text-xs font-bold border-slate-200 dark:border-border/80 shadow-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loading && "animate-spin")} /> Làm mới
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="flex-1 sm:flex-initial justify-center rounded-2xl h-10 px-4 text-xs font-bold border-slate-200 dark:border-border/80 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Xuất CSV
          </Button>
        </div>
      </div>

      {/* ── Top Bento KPI Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <AetherBentoCard
          title="Điểm Đánh Giá TB"
          subtitle="Độ hài lòng chung của khách"
          value={calculatedStats.avgRating > 0 ? `${calculatedStats.avgRating.toFixed(1)} ★` : "5.0 ★"}
          variant="mint"
        />

        <AetherBentoCard
          title="Tỷ Lệ Phản Hồi"
          subtitle="Mức độ tương tác chăm sóc khách"
          value={`${calculatedStats.responseRate.toFixed(1)}%`}
          variant="blue"
        />

        <AetherBentoCard
          title="Chờ Phản Hồi"
          subtitle="Cần phản hồi để tăng thiện cảm"
          value={calculatedStats.pendingCount}
          variant="peach"
          onClick={() => setTabFilter("unreplied")}
          className={tabFilter === "unreplied" ? "ring-2 ring-slate-950 dark:ring-amber-400" : ""}
        />

        <AetherBentoCard
          title="Thời Gian Phản Hồi TB"
          subtitle="Tốc độ tiếp nhận và hồi đáp"
          value={calculatedStats.avgResponseTimeHours > 0 ? `${calculatedStats.avgResponseTimeHours.toFixed(1)}h` : "< 1h"}
          variant="gray"
        />
      </div>

      {/* ── Middle: Rating Distribution Breakdown ── */}
      {calculatedStats.total > 0 && (
        <ReviewDistributionCard
          avgRating={calculatedStats.avgRating || 5.0}
          total={calculatedStats.total}
          byRating={calculatedStats.byRating}
        />
      )}

      {/* ── Main Reviews Section: Filters & List ── */}
      <div className="p-6 sm:p-7 rounded-[36px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm space-y-6">
        {/* Navigation Tabs & Filter Bar */}
        <ReviewFilterBar
          tabFilter={tabFilter}
          onTabChange={setTabFilter}
          calculatedStats={calculatedStats}
          attentionCount={attentionCount}
          search={search}
          onSearchChange={setSearch}
          ratingFilter={ratingFilter}
          onRatingFilterChange={setRatingFilter}
          selectedPlaceId={selectedPlaceId}
          onPlaceChange={setSelectedPlaceId}
          places={places}
        />

        {/* ── Review Cards Stream ── */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-[32px]" />
            ))
          ) : filteredReviews.length === 0 ? (
            <div className="py-16 text-center rounded-[32px] border border-dashed border-slate-200 dark:border-border/80 bg-slate-50/50 dark:bg-muted/20">
              <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {search ? "Không tìm thấy đánh giá phù hợp" : "Chưa có đánh giá nào trong danh mục này"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Các nhận xét từ du khách trải nghiệm dịch vụ sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <BentoReviewCard
                key={review.id}
                review={review}
                replyingTo={replyingTo}
                replyContent={replyContent}
                editingReplyId={editingReplyId}
                editContent={editContent}
                sending={sending}
                actionLoadingByReply={actionLoadingByReply}
                onStartReply={handleStartReply}
                onCancelReply={handleCancelReply}
                onContentChange={setReplyContent}
                onSendReply={handleReply}
                quickReplyTemplates={QUICK_REPLY_TEMPLATES}
                onStartEditReply={handleStartEditReply}
                onCancelEditReply={handleCancelEditReply}
                onEditContentChange={setEditContent}
                onSaveEditReply={handleSaveEditReply}
                onDeleteReply={handleDeleteReply}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
});

ReviewListPage.displayName = "ReviewListPage";
export default ReviewListPage;
