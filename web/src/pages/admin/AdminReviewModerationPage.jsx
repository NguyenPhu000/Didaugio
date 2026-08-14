import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  MessageSquare,
  Search,
  ShieldAlert,
  Star,
  Tag,
  Download,
} from "lucide-react";
import { exportToCsv, formatCsvDate, slugifyFilename } from "@/utils/csvExport";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  getAdminReviewStats,
  getAdminReviews,
  moderateAdminReview,
  moderateAdminReviewReply,
} from "@/apis/adminReviewApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "reported", label: "Bị report" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "visible", label: "Đang hiển thị" },
  { value: "hidden", label: "Đã ẩn" },
];

const REVIEW_STATUS_LABELS = {
  visible: "Đang hiển thị",
  hidden: "Đã ẩn",
  pending: "Chờ duyệt",
  reported: "Bị report",
};

const REVIEW_STATUS_CLASSES = {
  visible: "border-emerald-200 bg-emerald-50 text-emerald-700",
  hidden: "border-slate-200 bg-slate-100 text-slate-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  reported: "border-red-200 bg-red-50 text-red-700",
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleString("vi-VN") : "Không rõ";

const getMediaSrc = (media) =>
  resolveMediaUrl(
    media?.mediaData || media?.thumbnailUrl || media?.secureUrl || media?.url,
  );

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((value) => (
      <Star
        key={value}
        className={cn(
          "h-4 w-4",
          value <= Number(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-muted-foreground/30",
        )}
      />
    ))}
  </div>
);

const StatCard = ({ title, value, icon: Icon, tone = "default", subtitle }) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] transition-all duration-300 relative group overflow-hidden">
      <div className="h-0.5 w-0 group-hover:w-full bg-[#F3E600] absolute top-0 left-0 transition-all duration-300" />
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">{title}</p>
          <p className="text-2xl font-black tracking-tight text-slate-950 font-mono tabular-nums">{value ?? 0}</p>
          {subtitle && (
            <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-black/[0.04] text-slate-800 shrink-0 group-hover:bg-[#FFFDE6] group-hover:text-slate-950 transition-colors">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
};

const ReviewCard = ({
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
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
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
              <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-800">
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
                      {log.actor?.profile?.fullName || log.actor?.email || "Admin"} ·{" "}
                      {formatDate(log.createdAt)}
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
                            replyReasons[reply.id] || "",
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
                      onChange={(e) => onReplyReasonChange(reply.id, e.target.value)}
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
};

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
    [hasMedia, isSeededFilter, queue, rating, search, sort, status],
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
        (stats.hidden || 0),
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
        { key: (row) => row.user?.profile?.fullName || row.user?.email?.split("@")[0] || "Ẩn danh", label: "Tác giả" },
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
    <div className="space-y-6 text-slate-900 antialiased selection:bg-[#F3E600] selection:text-slate-950 max-w-[1560px] mx-auto">
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#F3E600] shadow-[0_0_6px_#F3E600]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Kiểm duyệt Nội dung & Tương tác
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            {t("admin.reviewModeration.title")}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {t("admin.reviewModeration.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            className="h-10 px-4 rounded-full text-xs font-semibold bg-white text-slate-900 hover:bg-[#F4F2EC] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] transition-all flex items-center gap-2 shrink-0 active:scale-95"
          >
            <Download className="h-3.5 w-3.5 text-slate-700" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </header>

      {stats && (
        <div className="space-y-6">
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <StatCard title={t("admin.reviewModeration.totalReviews")} value={stats.total} icon={Star} subtitle="Tất cả đánh giá" />
            <StatCard
              title={t("admin.reviewModeration.reported")}
              value={stats.reported}
              icon={AlertTriangle}
              tone="danger"
              subtitle="Cần kiểm tra"
            />
            <StatCard
              title={t("admin.reviewModeration.pending")}
              value={stats.pending}
              icon={MessageSquare}
              tone="warning"
              subtitle="Đang chờ duyệt"
            />
            <StatCard title={t("admin.reviewModeration.hidden")} value={stats.hidden} icon={EyeOff} tone="default" subtitle="Đã bị ẩn" />
            <StatCard title={t("admin.reviewModeration.seedData")} value={stats.seeded ?? 0} icon={Tag} tone="default" subtitle="Dữ liệu mẫu" />
            <StatCard title={t("admin.reviewModeration.avgRating")} value={stats.avgRating} icon={Star} tone="success" subtitle="Điểm trung bình" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-3xl bg-white border border-black/[0.04] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
              <div className="pb-4 border-b border-black/[0.04] flex items-center gap-2">
                <Star className="h-4 w-4 text-[#F3E600]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Phân phối số sao đánh giá (Ước tính)
                </h3>
              </div>
              <div className="h-64 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ratingDistributionData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <XAxis dataKey="star" tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="count" name="Số lượng đánh giá" fill="#0f172a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-black/[0.04] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
              <div className="pb-4 border-b border-black/[0.04] flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-slate-800" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Cơ cấu trạng thái duyệt
                </h3>
              </div>
              <div className="h-64 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={moderationStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {moderationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-2xl border border-black/[0.04] bg-white p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 w-full">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm nội dung, địa điểm, người dùng, note..."
              className="w-full h-10 pl-10 pr-4 bg-[#F8F7F3] rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#F3E600] placeholder:text-slate-400 transition-all border border-transparent focus:border-[#F3E600]/50"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:items-center gap-2.5 w-full lg:w-auto">
            <Select value={queue} onValueChange={setQueue}>
              <SelectTrigger className="h-10 px-3.5 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-full lg:w-44">
                <SelectValue placeholder="Hàng đợi" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
                <SelectItem value="all">Tất cả review</SelectItem>
                <SelectItem value="needs_action">Cần xử lý (chờ/report)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-10 px-3.5 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-full lg:w-44">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
                <SelectItem value="created_desc">Mới nhất trước</SelectItem>
                <SelectItem value="priority">Ưu tiên (report → chờ)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={isSeededFilter} onValueChange={setIsSeededFilter}>
              <SelectTrigger className="h-10 px-3.5 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-full lg:w-36">
                <SelectValue placeholder="Nguồn" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
                <SelectItem value="all">Mọi nguồn</SelectItem>
                <SelectItem value="seeded">Chỉ seed</SelectItem>
                <SelectItem value="not-seeded">Không seed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus} disabled={queue === "needs_action"}>
              <SelectTrigger className="h-10 px-3.5 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-full lg:w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger className="h-10 px-3.5 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-full lg:w-32">
                <SelectValue placeholder="Số sao" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
                <SelectItem value="all">Tất cả sao</SelectItem>
                {[5, 4, 3, 2, 1].map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value} sao
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={hasMedia} onValueChange={setHasMedia}>
              <SelectTrigger className="h-10 px-3.5 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-full lg:w-36">
                <SelectValue placeholder="Ảnh" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
                <SelectItem value="all">Tất cả ảnh</SelectItem>
                <SelectItem value="with-media">Có ảnh</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

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
            <p className="text-xs text-slate-500 mt-1">Thử thay đổi bộ lọc hoặc điều kiện tìm kiếm.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard
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
