import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useTransition,
} from "react";
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
  CalendarRange,
  Clock,
  CheckCheck,
  XCircle,
  UserX,
} from "lucide-react";
import * as bookingApi from "@/apis/bookingService";
import { getMyPlaces } from "@/apis/businessApi";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { BOOKING_STATUS } from "@/constants/constants";
import {
  SectionCard,
  PageHeader,
  EmptyState,
  PageNav,
  DESIGN,
  StatCardSkeleton,
  StatusBadge,
  formatVND,
  formatDate,
} from "@/components/business/DashboardWidgets";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";

// ─── Status Tabs Config ──────────────────────────────────────────────────────

const STATUS_TABS = [
  { value: "all", label: "Tất cả" },
  { value: BOOKING_STATUS.PENDING, label: "Chờ xác nhận" },
  { value: BOOKING_STATUS.CONFIRMED, label: "Đã xác nhận" },
  { value: BOOKING_STATUS.COMPLETED, label: "Hoàn thành" },
  { value: BOOKING_STATUS.CANCELLED, label: "Đã hủy" },
];

const PAGE_SIZE = 20;

// ─── Cancel Modal ─────────────────────────────────────────────────────────────

const CancelModal = ({ open, onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Hủy đặt chỗ
          </DialogTitle>
          <DialogDescription>
            Vui lòng cung cấp lý do hủy (ít nhất 5 ký tự).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Lý do hủy</Label>
          <Textarea
            autoFocus
            placeholder="Nhập lý do hủy..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Quay lại
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (reason.trim().length < 5) {
                toast.error("Lý do phải có ít nhất 5 ký tự");
                return;
              }
              onConfirm(reason.trim());
            }}
          >
            Xác nhận hủy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Booking Item ─────────────────────────────────────────────────────────────

const BookingItem = ({
  bk,
  selected,
  onSelect,
  onConfirm,
  onCancel,
  onComplete,
  onNoShow,
  onView,
}) => {
  const isPending = bk.status === BOOKING_STATUS.PENDING;
  const isConfirmed = bk.status === BOOKING_STATUS.CONFIRMED;

  return (
    <div className="[content-visibility:auto] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-b border-border/60 last:border-0 hover:bg-muted/30 px-2 -mx-2 rounded-lg transition-colors">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {isPending && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(bk.id)}
            className="mt-1 h-4 w-4 rounded border-border cursor-pointer shrink-0 accent-primary"
          />
        )}
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-semibold text-sm tracking-tight">
              {bk.bookingCode}
            </span>
            <StatusBadge status={bk.status} />
          </div>
          <p className="text-sm font-medium text-foreground truncate">
            {bk.user?.fullName || bk.guestName || "—"}
            {bk.user?.phone && (
              <span className="text-muted-foreground font-normal ml-1.5">
                · {bk.user.phone}
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {bk.service?.name}
            {" · "}
            <span className="font-medium text-foreground">
              {formatVND(bk.finalPrice)}
            </span>
          </p>
          <p className="text-xs text-muted-foreground/70">
            Ngày dùng: {formatDate(bk.bookingDate)} · Tạo:{" "}
            {formatDate(bk.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="Xem chi tiết"
          onClick={() => onView(bk.id)}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>

        {isPending && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              title="Xác nhận"
              onClick={() => onConfirm(bk.id)}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
              title="Hủy"
              onClick={() => onCancel(bk.id)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        )}

        {isConfirmed && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              title="Đánh dấu hoàn thành"
              onClick={() => onComplete(bk.id)}
            >
              <CheckCircle className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted"
              title="Không đến"
              onClick={() => onNoShow(bk.id)}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

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
  const [cancelModal, setCancelModal] = useState(null);
  const [isPendingTransition, startTransition] = useTransition();

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
      toast.error("Không thể tải danh sách đặt chỗ");
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
  useEffect(() => {
    setPage(1);
  }, [search, status, fromDate, toDate, selectedPlaceId]);

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
      toast.success("Hủy đặt chỗ thành công");
      setCancelModal(null);
      refresh();
    } catch (error) {
      toast.error(error.message || "Không thể hủy");
    }
  };

  const handleComplete = async (id) => {
    try {
      await bookingApi.complete(id);
      toast.success("Hoàn thành đặt chỗ");
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
      toast.success(`Đã xác nhận ${selected.length} đặt chỗ`);
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

  const pendingSelected = selected.filter((id) => {
    const bk = bookings.find((b) => b.id === id);
    return bk?.status === BOOKING_STATUS.PENDING;
  });

  const handleStatusChange = (nextStatus) => {
    startTransition(() => {
      setStatus(nextStatus);
    });
  };

  // Stat cards dữ liệu
  const statCards = [
    {
      key: BOOKING_STATUS.PENDING,
      label: "Chờ xác nhận",
      icon: Clock,
      iconColor: "amber",
    },
    {
      key: BOOKING_STATUS.CONFIRMED,
      label: "Đã xác nhận",
      icon: CheckCheck,
      iconColor: "blue",
    },
    {
      key: BOOKING_STATUS.COMPLETED,
      label: "Hoàn thành",
      icon: CheckCircle,
      iconColor: "emerald",
    },
    {
      key: BOOKING_STATUS.CANCELLED,
      label: "Đã hủy",
      icon: XCircle,
      iconColor: "rose",
    },
    {
      key: BOOKING_STATUS.NO_SHOW,
      label: "Không đến",
      icon: UserX,
      iconColor: "primary",
    },
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <PageHeader
        title="Quản lý đặt chỗ"
        subtitle="Theo dõi, xác nhận và quản lý các đặt chỗ của khách hàng"
        badge={total > 0 ? total : undefined}
        action={
          pendingSelected.length > 0 && (
            <Button onClick={handleBulkConfirm} className="gap-2">
              <Check className="h-4 w-4" />
              Xác nhận {pendingSelected.length} đặt chỗ
            </Button>
          )
        }
      />

      {/* Status Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map(({ key, label, icon, iconColor }) =>
          loading ? (
            <StatCardSkeleton key={key} />
          ) : (
            <button
              key={key}
              type="button"
              onClick={() => handleStatusChange(status === key ? "all" : key)}
              className={cn(
                "rounded-xl border border-border/60 shadow-sm bg-card p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5",
                status === key && "ring-2 ring-primary border-primary/50",
              )}
            >
              <p className="text-2xl font-bold text-foreground">
                {stats?.byStatus?.[key] || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </button>
          ),
        )}
      </div>

      {/* Toolbar + List trong Tabs */}
      <SectionCard
        title="Danh sách đặt chỗ"
        titleIcon={CalendarCheck}
        bodyClassName="p-0"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Date range */}
            <div className="flex items-center gap-1.5">
              <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8 border border-border rounded-md px-2 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary w-32"
              />
              <span className="text-muted-foreground text-xs">→</span>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-8 border border-border rounded-md px-2 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary w-32"
              />
              {(fromDate || toDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Place filter */}
            <Select value={selectedPlaceId} onValueChange={setSelectedPlaceId}>
              <SelectTrigger className="h-8 text-xs w-40">
                <SelectValue placeholder="Tất cả địa điểm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả địa điểm</SelectItem>
                {places.map((place) => (
                  <SelectItem key={place.id} value={String(place.id)}>
                    {place.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Tìm mã / tên khách..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs w-48"
              />
            </div>
          </div>
        }
      >
        <Tabs value={status} onValueChange={handleStatusChange}>
          <div className="px-5 border-b border-border/60">
            <TabsList className="h-10 bg-transparent gap-1 p-0">
              {STATUS_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={DESIGN.tabUnderlineTrigger}
                >
                  {tab.label}
                  {stats?.byStatus?.[tab.value] !== undefined &&
                    tab.value !== "all" && (
                      <span className="ml-1.5 text-muted-foreground">
                        ({stats.byStatus[tab.value]})
                      </span>
                    )}
                </TabsTrigger>
              ))}
            </TabsList>
            {isPendingTransition && (
              <p className="py-1 text-[11px] text-muted-foreground">
                Đang cập nhật danh sách...
              </p>
            )}
          </div>

          {STATUS_TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              <div className="px-5 py-2">
                {loading ? (
                  <div className="space-y-0">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 py-4 border-b border-border/50 last:border-0"
                      >
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-3.5 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-8 w-20 rounded-md" />
                      </div>
                    ))}
                  </div>
                ) : bookings.length === 0 ? (
                  <EmptyState
                    icon={CalendarCheck}
                    message="Không có đặt chỗ nào."
                  />
                ) : (
                  <div>
                    {bookings.map((bk) => (
                      <BookingItem
                        key={bk.id}
                        bk={bk}
                        selected={selected.includes(bk.id)}
                        onSelect={toggleSelect}
                        onConfirm={handleConfirm}
                        onCancel={(id) => setCancelModal(id)}
                        onComplete={handleComplete}
                        onNoShow={handleNoShow}
                        onView={(id) =>
                          navigate(BUSINESS_ROUTES.BOOKING_DETAIL(id))
                        }
                      />
                    ))}
                    {totalPages > 1 && (
                      <div className="border-t border-border/60 mt-2 pt-2">
                        <PageNav
                          page={page}
                          totalPages={totalPages}
                          total={total}
                          onPageChange={setPage}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </SectionCard>

      <CancelModal
        open={!!cancelModal}
        onConfirm={handleCancelConfirmed}
        onCancel={() => setCancelModal(null)}
      />
    </div>
  );
};

export default BookingListPage;
