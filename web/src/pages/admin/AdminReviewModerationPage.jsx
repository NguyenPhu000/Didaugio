// MAP: AdminReviewModerationPage
// ├── UI: @/components/admin/reviews/{ReviewModerationFilters, ReviewModerationTable, ReviewModerationInspectModal}
// └── API: @/apis/businessReviewApi

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MessageSquare, Download } from "lucide-react";
import { exportToCsv, formatCsvDate, slugifyFilename } from "@/utils/csvExport";
import {
  getAdminReviewStats,
  getAdminReviews,
  moderateAdminReview,
  moderateAdminReviewReply,
} from "@/apis/adminReviewApi";
import { Skeleton } from "@/components/ui/skeleton";

// Extracted Sub-Components
import ReviewModerationStats from "@/components/admin/review-moderation/ReviewModerationStats";
import ReviewModerationFilterBar from "@/components/admin/review-moderation/ReviewModerationFilterBar";
import ReviewModerationCard from "@/components/admin/review-moderation/ReviewModerationCard";

const AdminReviewModerationPage = () => {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("reported");
  const [queue, setQueue] = useState("all");
  const [sort, setSort] = useState("created_desc");
  const [isSeededFilter, setIsSeededFilter] = useState("all");
  const [rating, setRating] = useState("all");
  const [hasMedia, setHasMedia] = useState("all");
  const [notesByReview, setNotesByReview] = useState({});
  const [reasonsByReview, setReasonsByReview] = useState({});
  const [replyReasons, setReplyReasons] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  const params = useMemo(
    () => ({
      search,
      status: queue === "needs_action" ? "all" : status,
      rating: rating !== "all" ? rating : undefined,
      hasMedia: hasMedia === "with-media" ? "true" : undefined,
      queue,
      sort,
      isSeeded:
        isSeededFilter === "seeded"
          ? "true"
          : isSeededFilter === "not-seeded"
            ? "false"
            : undefined,
      page: 1,
      limit: 50,
    }),
    [hasMedia, isSeededFilter, queue, rating, search, sort, status]
  );

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAdminReviews(params);
      setReviews(response.data || []);
      setNotesByReview((current) => {
        const next = { ...current };
        (response.data || []).forEach((review) => {
          if (next[review.id] === undefined) {
            next[review.id] = review.adminNote || "";
          }
        });
        return next;
      });
      setReasonsByReview((current) => {
        const next = { ...current };
        (response.data || []).forEach((review) => {
          if (next[review.id] === undefined) {
            next[review.id] = "";
          }
        });
        return next;
      });
    } catch (error) {
      toast.error(error?.message || "Không thể tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  }, [params]);

  const loadStats = useCallback(async () => {
    try {
      const response = await getAdminReviewStats();
      setStats(response);
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (sort === "priority" && queue === "all") {
      setQueue("needs_action");
    }
  }, [queue, sort]);

  const ratingDistributionData = useMemo(() => {
    if (!stats) return [];
    const total = stats.total || 0;
    const avg = stats.avgRating || 0;
    return [
      {
        star: "5 Sao",
        count: Math.round(total * (avg >= 4.5 ? 0.6 : avg >= 4.0 ? 0.45 : 0.3)),
      },
      {
        star: "4 Sao",
        count: Math.round(total * (avg >= 4.5 ? 0.25 : avg >= 4.0 ? 0.35 : 0.3)),
      },
      { star: "3 Sao", count: Math.round(total * 0.12) },
      { star: "2 Sao", count: Math.round(total * 0.05) },
      { star: "1 Sao", count: Math.round(total * 0.03) },
    ];
  }, [stats]);

  const moderationStatusData = useMemo(() => {
    if (!stats) return [];
    const visible = Math.max(
      0,
      (stats.total || 0) -
        (stats.reported || 0) -
        (stats.pending || 0) -
        (stats.hidden || 0)
    );
    return [
      { name: "Đang hiển thị", value: visible, color: "#10b981" },
      { name: "Chờ duyệt", value: stats.pending || 0, color: "#f59e0b" },
      { name: "Bị báo cáo", value: stats.reported || 0, color: "#ef4444" },
      { name: "Đã ẩn", value: stats.hidden || 0, color: "#6b7280" },
    ];
  }, [stats]);

  const handleNoteChange = (reviewId, value) => {
    setNotesByReview((current) => ({ ...current, [reviewId]: value }));
  };

  const handleModerationReasonChange = (reviewId, value) => {
    setReasonsByReview((current) => ({ ...current, [reviewId]: value }));
  };

  const handleReplyReasonChange = (replyId, value) => {
    setReplyReasons((current) => ({ ...current, [replyId]: value }));
  };

  const handleModerateReview = async (reviewId, nextStatus) => {
    setActionLoading(`review-${reviewId}-${nextStatus}`);
    try {
      await moderateAdminReview(reviewId, {
        status: nextStatus,
        adminNote: notesByReview[reviewId] || null,
        moderationReason:
          nextStatus === "hidden" || nextStatus === "reported"
            ? reasonsByReview[reviewId] || null
            : null,
      });
      toast.success("Đã cập nhật trạng thái đánh giá");
      await Promise.all([loadReviews(), loadStats()]);
    } catch (error) {
      toast.error(error?.message || "Không thể moderation đánh giá");
    } finally {
      setActionLoading(null);
    }
  };

  const handleModerateReply = async (reviewId, replyId, nextStatus, reasonText) => {
    setActionLoading(`reply-${replyId}`);
    try {
      await moderateAdminReviewReply(reviewId, replyId, {
        status: nextStatus,
        ...(nextStatus === "hidden" && {
          moderationReason: reasonText?.trim() || null,
        }),
      });
      toast.success("Đã cập nhật phản hồi");
      setReplyReasons((current) => ({ ...current, [replyId]: "" }));
      await loadReviews();
    } catch (error) {
      toast.error(error?.message || "Không thể moderation phản hồi");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCsv = () => {
    if (!reviews || reviews.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }

    exportToCsv({
      columns: [
        { key: "id", label: "ID" },
        {
          key: (row) =>
            row.user?.profile?.fullName ||
            row.user?.email?.split("@")[0] ||
            "Ẩn danh",
          label: "Tác giả",
        },
        { key: (row) => row.user?.email || "", label: "Email" },
        { key: "rating", label: "Đánh giá" },
        { key: "status", label: "Trạng thái" },
        { key: "comment", label: "Nội dung" },
        { key: (row) => row.place?.name || "", label: "Địa điểm" },
        { key: (row) => row.adminNote || "", label: "Ghi chú admin" },
        { key: (row) => row._count?.replies ?? 0, label: "Số phản hồi" },
        { key: (row) => formatCsvDate(row.createdAt), label: "Thời gian" },
      ],
      data: reviews,
      filename: slugifyFilename("danh_gia_moderation"),
    });

    toast.success(`Đã xuất ${reviews.length} bản ghi`);
  };

  return (
    <div className="space-y-6 text-slate-900 antialiased max-w-[1560px] mx-auto">
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Kiểm duyệt Nội dung & Tương tác
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            {t("admin.reviewModeration.title")}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {t("admin.reviewModeration.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex-1 md:flex-initial justify-center h-10 px-4 rounded-full text-xs font-semibold bg-white text-slate-900 hover:bg-[#F4F2EC] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] transition-all flex items-center gap-2 shrink-0 active:scale-95 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-700" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </header>

      {/* Stats KPI & Charts */}
      <ReviewModerationStats
        stats={stats}
        ratingDistributionData={ratingDistributionData}
        moderationStatusData={moderationStatusData}
      />

      {/* Filter Bar */}
      <ReviewModerationFilterBar
        search={search}
        setSearch={setSearch}
        queue={queue}
        setQueue={setQueue}
        sort={sort}
        setSort={setSort}
        isSeededFilter={isSeededFilter}
        setIsSeededFilter={setIsSeededFilter}
        status={status}
        setStatus={setStatus}
        rating={rating}
        setRating={setRating}
        hasMedia={hasMedia}
        setHasMedia={setHasMedia}
      />

      {/* Review Cards List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="space-y-3 rounded-3xl border border-black/[0.04] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
            >
              <Skeleton className="h-5 w-56 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-2/3 rounded-lg" />
            </div>
          ))
        ) : reviews.length === 0 ? (
          <div className="rounded-3xl border border-black/[0.04] bg-white p-16 text-center text-slate-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
            <p className="font-bold text-slate-800">Không có đánh giá phù hợp.</p>
            <p className="text-xs text-slate-500 mt-1">
              Thử thay đổi bộ lọc hoặc điều kiện tìm kiếm.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewModerationCard
              key={review.id}
              review={review}
              note={notesByReview[review.id] || ""}
              moderationReason={reasonsByReview[review.id] || ""}
              replyReasons={replyReasons}
              actionLoading={actionLoading}
              onNoteChange={handleNoteChange}
              onModerationReasonChange={handleModerationReasonChange}
              onReplyReasonChange={handleReplyReasonChange}
              onModerateReview={handleModerateReview}
              onModerateReply={handleModerateReply}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AdminReviewModerationPage;
