import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Star, Search, MessageSquare, Send } from "lucide-react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import api from "@/constants/api";

const REVIEW_API = "/business/reviews";

const StarRating = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))}
  </div>
);

const ReviewListPage = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(REVIEW_API, { params: { search, page: 1, limit: 20 } });
      setReviews(response.data || []);
    } catch {
      toast.error("Không thể tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  }, [search]);

  const loadStats = async () => {
    try {
      const response = await api.get(`${REVIEW_API}/stats`);
      setStats(response.data);
    } catch {}
  };

  useEffect(() => { loadReviews(); }, [loadReviews]);
  useEffect(() => { loadStats(); }, []);

  const handleReply = async () => {
    if (!replyContent.trim()) {
      toast.error("Nội dung phản hồi không được trống");
      return;
    }
    setSending(true);
    try {
      await api.post(`${REVIEW_API}/${replyingTo}/reply`, { content: replyContent });
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Star className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Đánh giá & Phản hồi</h1>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold">{stats.avgRating}</p>
              <StarRating rating={Math.round(stats.avgRating)} />
              <p className="text-sm text-gray-500 mt-1">{stats.total} đánh giá</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((r) => {
                  const count = stats.byRating?.[r] || 0;
                  const pct = stats.total ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={r} className="flex items-center gap-3">
                      <span className="w-8 text-sm font-medium">{r} ★</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-sm text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tìm nội dung đánh giá..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Chưa có đánh giá nào</div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{review.user?.fullName || "Ẩn danh"}</span>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-xs text-gray-400">
                      {review.place?.name} — {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>

                {review.title && (
                  <p className="font-medium">{review.title}</p>
                )}
                {review.content && (
                  <p className="text-gray-700">{review.content}</p>
                )}

                {review.replies?.length > 0 && (
                  <div className="ml-6 space-y-2 border-l-2 border-gray-200 pl-4">
                    {review.replies.map((reply) => (
                      <div key={reply.id} className="text-sm">
                        <span className="font-medium">{reply.user?.fullName}</span>
                        <span className="text-gray-500 text-xs ml-2">
                          {formatDate(reply.createdAt)}
                        </span>
                        <p className="text-gray-600 mt-1">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {replyingTo === review.id ? (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Nhập phản hồi..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleReply} disabled={sending}>
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setReplyingTo(null); setReplyContent(""); }}
                    >
                      Hủy
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReplyingTo(review.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" /> Phản hồi
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewListPage;
