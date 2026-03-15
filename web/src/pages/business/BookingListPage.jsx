import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  CalendarCheck,
  Check,
  X,
  CheckCircle,
  AlertTriangle,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
} from "lucide-react";
import * as bookingApi from "@/apis/bookingService";
import { getMyPlaces } from "@/apis/businessApi";
import { BUSINESS_ROUTES } from "@/constants/routes";
import PlaceAccordion from "@/components/business/PlaceAccordion";

const STATUS_CONFIG = {
  pending: {
    label: "CHỜ XÁC NHẬN",
    bg: "bg-yellow-400 text-black",
    border: "border-yellow-500",
  },
  confirmed: {
    label: "ĐÃ XÁC NHẬN",
    bg: "bg-blue-500 text-white",
    border: "border-blue-600",
  },
  completed: {
    label: "HOÀN THÀNH",
    bg: "bg-emerald-500 text-white",
    border: "border-emerald-600",
  },
  cancelled: {
    label: "ĐÃ HỦY",
    bg: "bg-red-500 text-white",
    border: "border-red-600",
  },
  no_show: {
    label: "KHÔNG ĐẾN",
    bg: "bg-gray-400 text-white",
    border: "border-gray-500",
  },
};

const STATUS_TABS = [
  { value: "all", label: "TẤT CẢ" },
  { value: "pending", label: "CHỜ XÁC NHẬN" },
  { value: "confirmed", label: "ĐÃ XÁC NHẬN" },
  { value: "completed", label: "HOÀN THÀNH" },
  { value: "cancelled", label: "ĐÃ HỦY" },
];

const PAGE_SIZE = 20;

const CancelModal = ({ onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white border-4 border-black max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b-4 border-black bg-red-500 flex items-center gap-2">
          <X className="w-5 h-5 text-white" />
          <h3 className="font-black uppercase tracking-widest text-white">
            HỦY BOOKING
          </h3>
        </div>
        <div className="p-5 space-y-3">
          <p className="font-mono text-xs text-gray-500 uppercase">
            Lý do hủy (ít nhất 5 ký tự)
          </p>
          <textarea
            autoFocus
            className="w-full border-2 border-black p-3 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-red-200 min-h-[80px] resize-none"
            placeholder="Nhập lý do..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="p-4 border-t-4 border-black bg-gray-100 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border-2 border-black font-black uppercase text-sm hover:bg-white transition-colors"
          >
            QUAY LẠI
          </button>
          <button
            onClick={() => {
              if (reason.trim().length < 5) {
                toast.error("Lý do phải có ít nhất 5 ký tự");
                return;
              }
              onConfirm(reason.trim());
            }}
            className="flex-1 py-3 bg-red-500 text-white font-black uppercase text-sm hover:bg-red-600 border-2 border-red-700 transition-colors"
          >
            XÁC NHẬN HỦY
          </button>
        </div>
      </div>
    </div>
  );
};

const BookingListPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedPlaceId, setSelectedPlaceId] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState([]);
  const [cancelModal, setCancelModal] = useState(null); // bookingId
  const [expandedPlaces, setExpandedPlaces] = useState({});

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await bookingApi.getAll({
        search,
        status,
        page,
        limit: PAGE_SIZE,
        ...(selectedPlaceId !== "all" && { placeId: selectedPlaceId }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
      });
      setBookings(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || 0);
    } catch {
      toast.error("Không thể tải danh sách booking");
    } finally {
      setLoading(false);
    }
  }, [search, status, page, fromDate, toDate, selectedPlaceId]);

  const loadStats = useCallback(async () => {
    try {
      const response = await bookingApi.getStats();
      setStats(response.data);
    } catch {}
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    getMyPlaces()
      .then((res) => setPlaces(res.data || []))
      .catch(() => {});
  }, []);

  // Reset về page 1 khi filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [search, status, fromDate, toDate, selectedPlaceId]);

  const groupedBookings = useMemo(() => {
    return bookings.reduce((acc, bk) => {
      const key = bk.service?.place?.id || "none";
      const label = bk.service?.place?.name || "Chưa gán địa điểm";
      if (!acc[key]) acc[key] = { label, items: [] };
      acc[key].items.push(bk);
      return acc;
    }, {});
  }, [bookings]);

  const placeOverview = useMemo(() => {
    return Object.entries(groupedBookings).map(([placeKey, group]) => {
      const pending = group.items.filter(
        (item) => item.status === "pending",
      ).length;
      const confirmed = group.items.filter(
        (item) => item.status === "confirmed",
      ).length;
      const revenue = group.items.reduce(
        (sum, item) => sum + Number(item.finalPrice || 0),
        0,
      );
      return {
        placeKey,
        label: group.label,
        total: group.items.length,
        pending,
        confirmed,
        revenue,
      };
    });
  }, [groupedBookings]);

  const refresh = () => {
    loadBookings();
    loadStats();
  };

  const handleConfirm = async (id) => {
    try {
      await bookingApi.confirm(id);
      toast.success("Xác nhận thành công");
      refresh();
    } catch (error) {
      toast.error(error.message || "Không thể xác nhận");
    }
  };

  const handleCancelConfirmed = async (reason) => {
    try {
      await bookingApi.cancel(cancelModal, reason);
      toast.success("Hủy booking thành công");
      setCancelModal(null);
      refresh();
    } catch (error) {
      toast.error(error.message || "Không thể hủy");
    }
  };

  const handleComplete = async (id) => {
    try {
      await bookingApi.complete(id);
      toast.success("Hoàn thành booking");
      refresh();
    } catch (error) {
      toast.error(error.message || "Không thể hoàn thành");
    }
  };

  const handleNoShow = async (id) => {
    try {
      await bookingApi.markNoShow(id);
      toast.success("Đánh dấu không đến");
      refresh();
    } catch (error) {
      toast.error(error.message || "Không thể đánh dấu");
    }
  };

  const handleBulkConfirm = async () => {
    if (selected.length === 0) return;
    try {
      await bookingApi.bulkConfirm(selected);
      toast.success(`Đã xác nhận ${selected.length} booking`);
      setSelected([]);
      refresh();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggleSelect = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const formatPrice = (price) =>
    price
      ? new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(price)
      : "—";

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "—";

  const pendingSelected = selected.filter((id) => {
    const bk = bookings.find((b) => b.id === id);
    return bk?.status === "pending";
  });

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-background relative">
      <div className="absolute inset-0 bg-grid-dots opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-[1200px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-black pb-6 gap-4">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary border-4 border-black flex items-center justify-center shadow-hard rotate-3 hover:rotate-0 transition-transform">
              <CalendarCheck className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 hover:text-primary transition-colors">
                ĐẶT CHỖ
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="tim-system bg-black text-white px-3 py-1 text-xs">
                  PORTAL // BOOKINGS
                </span>
                {total > 0 && (
                  <span className="tim-system border-2 border-black px-3 py-1 text-xs">
                    {total} KẾT QUẢ
                  </span>
                )}
              </div>
            </div>
          </div>

          {pendingSelected.length > 0 && (
            <button
              onClick={handleBulkConfirm}
              className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 font-black text-sm uppercase tracking-widest hover:bg-emerald-600 border-4 border-emerald-700 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
            >
              <Check className="w-5 h-5" />
              XÁC NHẬN {pendingSelected.length} BOOKING
            </button>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setStatus((s) => (s === key ? "all" : key))}
                className={`border-4 border-black p-4 text-center transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                  status === key ? "bg-black text-white" : "bg-white"
                }`}
              >
                <p className="text-2xl font-black">
                  {stats.byStatus?.[key] || 0}
                </p>
                <p className="text-[10px] font-mono font-bold mt-1 opacity-70">
                  {cfg.label}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white border-4 border-black p-4 space-y-3 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="TÌM MÃ BOOKING / TÊN KHÁCH..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 border-2 border-black pl-12 pr-4 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary bg-gray-50 placeholder:normal-case"
              />
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-gray-500 shrink-0" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-12 border-2 border-black px-3 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-primary/20 bg-gray-50 w-[145px]"
              />
              <span className="font-mono text-xs text-gray-400">→</span>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-12 border-2 border-black px-3 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-primary/20 bg-gray-50 w-[145px]"
              />
              {(fromDate || toDate) && (
                <button
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                  className="h-12 w-12 flex items-center justify-center border-2 border-black hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              )}
            </div>

            <div className="relative w-full md:w-[260px]">
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

          {/* Status Tabs */}
          <div className="flex gap-2 flex-wrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className={`px-4 py-2 border-2 border-black font-mono text-xs font-bold uppercase tracking-widest transition-colors ${
                  status === tab.value
                    ? "bg-black text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                {tab.label}
                {stats?.byStatus?.[tab.value] !== undefined &&
                  tab.value !== "all" && (
                    <span className="ml-2 opacity-60">
                      {stats.byStatus[tab.value]}
                    </span>
                  )}
              </button>
            ))}
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
                    Pending: {item.pending}
                  </span>
                  <span className="border border-black px-2 py-1">
                    Confirmed: {item.confirmed}
                  </span>
                  <span className="border border-black px-2 py-1">
                    Giá trị: {formatPrice(item.revenue)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Booking List */}
        {loading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center bg-white border-2 border-black border-dashed">
            <div className="w-16 h-16 border-4 border-black border-t-primary rounded-none animate-spin mb-4" />
            <span className="tim-system bg-black text-white px-4 py-2 animate-pulse">
              ĐANG TẢI [ _ ]
            </span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="min-h-[30vh] flex flex-col items-center justify-center bg-white border-2 border-black border-dashed">
            <CalendarCheck className="w-12 h-12 text-gray-300 mb-3" />
            <span className="text-gray-400 font-mono font-bold uppercase tracking-widest">
              KHÔNG CÓ BOOKING NÀO
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedBookings).map(([placeKey, group]) => (
              <PlaceAccordion
                key={placeKey}
                title={group.label}
                subtitle="Theo dõi trạng thái đặt chỗ theo địa điểm"
                count={group.items.length}
                countLabel="booking"
                expanded={expandedPlaces[placeKey] ?? true}
                onToggle={() =>
                  setExpandedPlaces((prev) => ({
                    ...prev,
                    [placeKey]: !(prev[placeKey] ?? true),
                  }))
                }
                preview={[
                  {
                    label: "Pending",
                    value: group.items.filter(
                      (item) => item.status === "pending",
                    ).length,
                  },
                  {
                    label: "Confirmed",
                    value: group.items.filter(
                      (item) => item.status === "confirmed",
                    ).length,
                  },
                ]}
                actions={[
                  <button
                    key="pending-filter"
                    type="button"
                    onClick={() => {
                      if (placeKey !== "none") {
                        setSelectedPlaceId(String(placeKey));
                      }
                      setStatus("pending");
                    }}
                    className="px-3 py-2 border-2 border-black text-xs font-black uppercase tracking-wider bg-white hover:bg-black hover:text-white transition-colors"
                  >
                    Lọc pending địa điểm này
                  </button>,
                  <button
                    key="select-pending"
                    type="button"
                    onClick={() => {
                      const pendingIds = group.items
                        .filter((item) => item.status === "pending")
                        .map((item) => item.id);
                      setSelected((prev) =>
                        Array.from(new Set([...prev, ...pendingIds])),
                      );
                    }}
                    className="px-3 py-2 border-2 border-black text-xs font-black uppercase tracking-wider bg-white hover:bg-black hover:text-white transition-colors"
                  >
                    Chọn pending để xác nhận nhanh
                  </button>,
                ]}
              >
                {group.items.map((bk) => {
                  const cfg = STATUS_CONFIG[bk.status] || STATUS_CONFIG.pending;
                  const isPending = bk.status === "pending";
                  const isConfirmed = bk.status === "confirmed";
                  return (
                    <div
                      key={bk.id}
                      className="bg-white border-4 border-black p-5 relative group hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {isPending && (
                            <input
                              type="checkbox"
                              checked={selected.includes(bk.id)}
                              onChange={() => toggleSelect(bk.id)}
                              className="mt-1 w-5 h-5 border-2 border-black cursor-pointer accent-black shrink-0"
                            />
                          )}
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-black text-lg tracking-tight">
                                {bk.bookingCode}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-[10px] font-mono font-black tracking-widest border ${cfg.bg} ${cfg.border}`}
                              >
                                {cfg.label}
                              </span>
                            </div>
                            <p className="font-mono text-sm font-bold truncate">
                              {bk.user?.fullName || bk.guestName || "—"}{" "}
                              {bk.user?.phone && (
                                <span className="text-gray-400 font-normal">
                                  · {bk.user.phone}
                                </span>
                              )}
                            </p>
                            <p className="font-mono text-xs text-gray-500 truncate">
                              {bk.service?.name} ·{" "}
                              <span className="font-bold text-black">
                                {formatPrice(bk.finalPrice)}
                              </span>
                            </p>
                            <p className="font-mono text-[11px] text-gray-400">
                              Ngày dùng: {formatDate(bk.bookingDate)} · Tạo:{" "}
                              {formatDate(bk.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            title="Xem chi tiết"
                            onClick={() =>
                              navigate(BUSINESS_ROUTES.BOOKING_DETAIL(bk.id))
                            }
                            className="w-10 h-10 flex items-center justify-center border-2 border-black hover:bg-black hover:text-white transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isPending && (
                            <>
                              <button
                                title="Xác nhận"
                                onClick={() => handleConfirm(bk.id)}
                                className="w-10 h-10 flex items-center justify-center border-2 border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                title="Hủy"
                                onClick={() => setCancelModal(bk.id)}
                                className="w-10 h-10 flex items-center justify-center border-2 border-red-500 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {isConfirmed && (
                            <>
                              <button
                                title="Hoàn thành"
                                onClick={() => handleComplete(bk.id)}
                                className="w-10 h-10 flex items-center justify-center border-2 border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                title="Không đến"
                                onClick={() => handleNoShow(bk.id)}
                                className="w-10 h-10 flex items-center justify-center border-2 border-gray-400 bg-gray-50 text-gray-500 hover:bg-gray-400 hover:text-white transition-colors"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </PlaceAccordion>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between bg-white border-4 border-black p-4">
            <span className="font-mono text-xs">
              TRANG {page} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center border-2 border-black hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                )
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "..." ? (
                    <span
                      key={`e-${idx}`}
                      className="w-10 h-10 flex items-center justify-center font-mono text-sm"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-10 h-10 flex items-center justify-center border-2 border-black font-mono text-sm font-bold transition-colors ${
                        p === page
                          ? "bg-black text-white"
                          : "hover:bg-black hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 flex items-center justify-center border-2 border-black hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {cancelModal && (
        <CancelModal
          onConfirm={handleCancelConfirmed}
          onCancel={() => setCancelModal(null)}
        />
      )}
    </div>
  );
};

export default BookingListPage;
