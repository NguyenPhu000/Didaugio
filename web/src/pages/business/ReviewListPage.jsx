import { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { Star, Search, MessageSquare, Send, X } from "lucide-react";
import api from "@/constants/api";
import { getMyPlaces } from "@/apis/businessApi";
import PlaceAccordion from "@/components/business/PlaceAccordion";

const REVIEW_API = "/business/reviews";

const StarRating = ({ rating, size = "sm" }) => {
  const sz = size === "lg" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sz} ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
};

const RATING_FILTERS = [
  { value: "0", label: "TẤT CẢ" },
  { value: "5", label: "5 ★" },
  { value: "4", label: "4 ★" },
  { value: "3", label: "3 ★" },
  { value: "2", label: "2 ★" },
  { value: "1", label: "1 ★" },
];

const ReviewListPage = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("0");
  const [unrepliedOnly, setUnrepliedOnly] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [expandedPlaces, setExpandedPlaces] = useState({});

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(REVIEW_API, {
        params: {
          search,
          placeId: selectedPlaceId !== "all" ? selectedPlaceId : undefined,
          rating: ratingFilter !== "0" ? ratingFilter : undefined,
          page: 1,
          limit: 20,
        },
      });
      setReviews(response.data || []);
    } catch {
      toast.error("Không thể tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  }, [search, ratingFilter, selectedPlaceId]);

  const loadStats = useCallback(async () => {
    try {
      const response = await api.get(`${REVIEW_API}/stats`);
      setStats(response.data);
    } catch {}
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
    if (!unrepliedOnly) return reviews;
    return reviews.filter((review) => !review.replies?.length);
  }, [reviews, unrepliedOnly]);

  const groupedReviews = useMemo(() => {
    return filteredReviews.reduce((acc, review) => {
      const key = review.place?.id || "none";
      const label = review.place?.name || "Chưa gán địa điểm";
      if (!acc[key]) acc[key] = { label, items: [] };
      acc[key].items.push(review);
      return acc;
    }, {});
  }, [filteredReviews]);

  const placeOverview = useMemo(() => {
    return Object.entries(groupedReviews).map(([placeKey, group]) => {
      const totalRating = group.items.reduce(
        (sum, item) => sum + Number(item.rating || 0),
        0,
      );
      const avgRating = group.items.length
        ? totalRating / group.items.length
        : 0;
      const unreplied = group.items.filter(
        (item) => !item.replies?.length,
      ).length;

      return {
        placeKey,
        label: group.label,
        total: group.items.length,
        avgRating,
        unreplied,
      };
    });
  }, [groupedReviews]);

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
      loadReviews();
    } catch (error) {
      toast.error(error.message || "Không thể phản hồi");
    } finally {
      setSending(false);
    }
  };

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("vi-VN") : "";

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-background relative">
      <div className="absolute inset-0 bg-grid-dots opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-[1200px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between border-b-4 border-black pb-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary border-4 border-black flex items-center justify-center shadow-hard rotate-3 hover:rotate-0 transition-transform">
              <Star className="w-8 h-8 text-black fill-black" />
            </div>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 hover:text-primary transition-colors">
                ĐÁNH GIÁ
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="tim-system bg-black text-white px-3 py-1 text-xs">
                  PORTAL // REVIEWS
                </span>
                {stats?.total > 0 && (
                  <span className="tim-system border-2 border-black px-3 py-1 text-xs">
                    {stats.total} ĐÁNH GIÁ
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Average Rating */}
            <div className="bg-white border-4 border-black p-6 flex flex-col items-center justify-center text-center">
              <p className="font-black text-6xl tracking-tight">
                {Number(stats.avgRating || 0).toFixed(1)}
              </p>
              <StarRating rating={Math.round(stats.avgRating)} size="lg" />
              <p className="font-mono text-xs mt-3 text-gray-500">
                TRUNG BÌNH TỪ {stats.total} ĐÁNH GIÁ
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="md:col-span-2 bg-white border-4 border-black p-6 space-y-3">
              {[5, 4, 3, 2, 1].map((r) => {
                const count = stats.byRating?.[r] || 0;
                const pct = stats.total ? (count / stats.total) * 100 : 0;
                return (
                  <div key={r} className="flex items-center gap-3">
                    <span className="w-8 font-mono text-xs font-bold shrink-0">
                      {r} ★
                    </span>
                    <div className="flex-1 h-3 border-2 border-black bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 font-mono text-xs text-right shrink-0">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white border-4 border-black p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="TÌM NỘI DUNG ĐÁNH GIÁ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 border-2 border-black pl-12 pr-4 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary bg-gray-50 placeholder:normal-case"
              />
            </div>
            <div className="relative w-full md:w-[280px]">
              <select
                value={selectedPlaceId}
                onChange={(e) => setSelectedPlaceId(e.target.value)}
                className="w-full h-12 border-2 border-black px-3 pr-10 font-mono text-xs uppercase bg-white focus:outline-none focus:ring-4 focus:ring-primary/20"
              >
                <option value="all">TẤT CẢ ĐỊA ĐIỂM</option>
                {places.map((place) => (
                  <option key={place.id} value={String(place.id)}>
                    {place.name}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs">
                ▼
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {RATING_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setRatingFilter(f.value)}
                className={`px-4 py-2 border-2 border-black font-mono text-xs font-bold uppercase tracking-widest transition-colors ${
                  ratingFilter === f.value
                    ? "bg-black text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                {f.label}
              </button>
            ))}
            <button
              onClick={() => setUnrepliedOnly((prev) => !prev)}
              className={`px-4 py-2 border-2 border-black font-mono text-xs font-bold uppercase tracking-widest transition-colors ${
                unrepliedOnly
                  ? "bg-black text-white"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              Chưa phản hồi
            </button>
          </div>
        </div>

        {/* Place Overview */}
        {placeOverview.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {placeOverview.map((item) => (
              <button
                key={item.placeKey}
                type="button"
                onClick={() =>
                  setSelectedPlaceId(
                    item.placeKey === "none" ? "all" : String(item.placeKey),
                  )
                }
                className="text-left bg-white border-4 border-black p-4 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <p className="font-black uppercase text-xs tracking-wide truncate">
                  {item.label}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 font-mono text-[11px]">
                  <span className="border border-black px-2 py-1">
                    Tổng: {item.total}
                  </span>
                  <span className="border border-black px-2 py-1">
                    TB: {item.avgRating.toFixed(1)} ★
                  </span>
                  <span className="border border-black px-2 py-1">
                    Chưa reply: {item.unreplied}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Review List */}
        {loading ? (
          <div className="min-h-[30vh] flex flex-col items-center justify-center bg-white border-2 border-black border-dashed">
            <div className="w-12 h-12 border-4 border-black border-t-primary rounded-none animate-spin mb-3" />
            <span className="font-mono text-xs uppercase text-gray-500">
              Đang tải...
            </span>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="min-h-[30vh] flex flex-col items-center justify-center bg-white border-2 border-black border-dashed">
            <Star className="w-12 h-12 text-gray-200 mb-3" />
            <span className="text-gray-400 font-mono font-bold uppercase tracking-widest">
              CHƯA CÓ ĐÁNH GIÁ NÀO
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedReviews).map(([placeKey, group]) => (
              <PlaceAccordion
                key={placeKey}
                title={group.label}
                subtitle="Phản hồi đánh giá theo địa điểm"
                count={group.items.length}
                countLabel="đánh giá"
                expanded={expandedPlaces[placeKey] ?? true}
                onToggle={() =>
                  setExpandedPlaces((prev) => ({
                    ...prev,
                    [placeKey]: !(prev[placeKey] ?? true),
                  }))
                }
                preview={[
                  {
                    label: "TB",
                    value: (
                      group.items.reduce(
                        (sum, item) => sum + Number(item.rating || 0),
                        0,
                      ) / (group.items.length || 1)
                    ).toFixed(1),
                  },
                  {
                    label: "Chưa reply",
                    value: group.items.filter((item) => !item.replies?.length)
                      .length,
                  },
                ]}
                actions={[
                  <button
                    key="filter-unreplied"
                    type="button"
                    onClick={() => {
                      if (placeKey !== "none") {
                        setSelectedPlaceId(String(placeKey));
                      }
                      setUnrepliedOnly(true);
                    }}
                    className="px-3 py-2 border-2 border-black text-xs font-black uppercase tracking-wider bg-white hover:bg-black hover:text-white transition-colors"
                  >
                    Lọc chưa phản hồi địa điểm này
                  </button>,
                  <button
                    key="filter-place"
                    type="button"
                    onClick={() =>
                      setSelectedPlaceId(
                        placeKey === "none" ? "all" : String(placeKey),
                      )
                    }
                    className="px-3 py-2 border-2 border-black text-xs font-black uppercase tracking-wider bg-white hover:bg-black hover:text-white transition-colors"
                  >
                    Lọc theo địa điểm này
                  </button>,
                ]}
              >
                {group.items.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white border-4 border-black p-5 relative hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
                  >
                    {/* Review Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-base">
                            {review.user?.profile?.fullName || "Ẩn danh"}
                          </span>
                          <StarRating rating={review.rating} />
                        </div>
                        <p className="font-mono text-xs text-gray-400">
                          {review.place?.name} · {formatDate(review.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Review Content */}
                    {review.title && (
                      <p className="font-bold mt-3">{review.title}</p>
                    )}
                    {review.content && (
                      <p className="font-mono text-sm text-gray-700 mt-2 leading-relaxed">
                        {review.content}
                      </p>
                    )}

                    {/* Existing Replies */}
                    {review.replies?.length > 0 && (
                      <div className="mt-4 ml-6 border-l-4 border-black pl-4 space-y-3">
                        {review.replies.map((reply) => (
                          <div key={reply.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xs uppercase tracking-widest">
                                {reply.user?.profile?.fullName ||
                                  "Doanh nghiệp"}
                              </span>
                              <span className="text-[10px] font-mono text-gray-400">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            <p className="font-mono text-xs text-gray-600 mt-1">
                              {reply.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply UI */}
                    <div className="mt-4">
                      {replyingTo === review.id ? (
                        <div className="flex gap-2 items-start">
                          <textarea
                            autoFocus
                            placeholder="Nhập phản hồi của bạn..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            rows={2}
                            className="flex-1 border-2 border-black p-3 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-primary/20 resize-none"
                          />
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={handleReply}
                              disabled={sending}
                              className="w-10 h-10 flex items-center justify-center bg-black text-white border-2 border-black hover:bg-primary hover:text-black transition-colors disabled:opacity-50"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent("");
                              }}
                              className="w-10 h-10 flex items-center justify-center border-2 border-black hover:bg-gray-100 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        !review.replies?.length && (
                          <button
                            onClick={() => setReplyingTo(review.id)}
                            className="flex items-center gap-2 px-4 py-2 border-2 border-black font-mono text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                            PHẢN HỒI
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </PlaceAccordion>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewListPage;
