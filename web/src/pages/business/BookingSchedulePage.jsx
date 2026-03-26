import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import * as bookingApi from "@/apis/bookingService";
import { BUSINESS_ROUTES } from "@/constants/routes";
import {
  TIME_SLOT_KEYS,
  TIME_SLOT_LABELS,
  buildBookingTimeIsoFromDateAndSlot,
} from "@/constants/bookingSchedule";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import { PageHeader, SectionCard } from "@/components/business/DashboardWidgets";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SLOT_ORDER = [
  TIME_SLOT_KEYS.MORNING,
  TIME_SLOT_KEYS.NOON,
  TIME_SLOT_KEYS.AFTERNOON,
  TIME_SLOT_KEYS.EVENING,
];

const POLL_MS = 15_000;
const RETRIES = 3;

async function fetchWithRetry(fn, attempts = RETRIES) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastErr;
}

function DroppableSlot({ id, label, children, className }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[220px] flex-col gap-2 rounded-xl border border-border bg-muted/30 p-3 transition-colors",
        isOver && "border-primary ring-2 ring-primary/30",
        className,
      )}
    >
      <div className="text-sm font-semibold text-foreground">{label}</div>
      <div className="flex flex-1 flex-col gap-2">{children}</div>
    </div>
  );
}

function BookingCard({ booking }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `b-${booking.id}`,
    });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px,${transform.y}px,0)`,
      }
    : undefined;

  const overbooking = booking.overbooking;
  const title = [
    booking.bookingCode,
    booking.guestName,
    booking.guestPhone,
    booking.service?.name,
    booking.service?.place?.name,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
              "cursor-grab rounded-lg border bg-card px-3 py-2 text-left text-sm shadow-sm active:cursor-grabbing",
              isDragging && "opacity-50",
              overbooking && "border-destructive ring-1 ring-destructive/40",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="line-clamp-2 font-medium">{booking.guestName}</span>
              {overbooking && (
                <Badge variant="destructive" className="shrink-0 text-[10px]">
                  Trùng slot
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
              {booking.service?.name}
            </p>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-sm text-xs">
          <p className="font-mono">{title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const BookingSchedulePage = () => {
  const todayStr = useMemo(
    () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }),
    [],
  );
  const [dateStr, setDateStr] = useState(todayStr);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState(null);
  const [reschedulingId, setReschedulingId] = useState(null);
  const pollRef = useRef(null);
  const debounceRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithRetry(() =>
        bookingApi.getSchedule({ date: dateStr }),
      );
      if (res?.success) setSchedule(res.data);
      else toast.error(res?.message || "Không tải được lịch");
    } catch (e) {
      toastApiErrorIfNeeded(e);
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        bookingApi.getSchedule({ date: dateStr }).then((res) => {
          if (res?.success) setSchedule(res.data);
        }).catch(() => {});
      }, POLL_MS);
    }, 800);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [dateStr]);

  const onDragEnd = async (event) => {
    const { active, over } = event;
    setDraggingId(null);
    if (!over) return;
    const bid = String(active.id).replace(/^b-/, "");
    const slotId = String(over.id);
    if (!slotId.startsWith("slot-")) return;
    const slotKey = slotId.replace("slot-", "");
    if (!SLOT_ORDER.includes(slotKey)) return;

    const bookingTime = buildBookingTimeIsoFromDateAndSlot(dateStr, slotKey);
    setReschedulingId(Number(bid));
    try {
      const res = await bookingApi.reschedule(bid, bookingTime);
      if (res?.success) {
        toast.success("Đã cập nhật khung giờ");
        await load();
      } else {
        toast.error(res?.message || "Không thể đổi lịch");
        await load();
      }
    } catch (e) {
      const status = e?.response?.status ?? e?.status;
      if (status === 409) {
        toast.error("Khung giờ đã đủ — đã hoàn tác trên server");
      } else {
        toastApiErrorIfNeeded(e);
      }
      await load();
    } finally {
      setReschedulingId(null);
    }
  };

  const slots = schedule?.slots || {};

  return (
    <div className="space-y-6 p-6 lg:p-8 min-h-screen">
      <Link
        to={BUSINESS_ROUTES.BOOKINGS}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Danh sách đặt chỗ
      </Link>
      <PageHeader
        title="Lịch đặt chỗ theo khung giờ"
        subtitle="Sáng · Trưa · Chiều · Tối — kéo thả để đổi khung (đồng bộ mỗi 15s)"
      />

      <SectionCard>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Ngày</label>
            <Input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-[200px]"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => load()}
            disabled={loading}
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", loading && "animate-spin")}
            />
            Làm mới
          </Button>
        </div>
      </SectionCard>

      {loading && !schedule ? (
        <p className="text-sm text-muted-foreground">Đang tải lịch…</p>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={({ active }) => setDraggingId(active.id)}
          onDragEnd={onDragEnd}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {SLOT_ORDER.map((key) => (
              <DroppableSlot
                key={key}
                id={`slot-${key}`}
                label={TIME_SLOT_LABELS[key] || key}
              >
                {(slots[key] || []).map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
                {(slots[key] || []).length === 0 && (
                  <p className="text-xs text-muted-foreground">Trống</p>
                )}
              </DroppableSlot>
            ))}
          </div>
          <DragOverlay>
            {draggingId ? (
              <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-lg">
                Đang kéo…
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {reschedulingId ? (
        <p className="text-xs text-muted-foreground">
          Đang cập nhật booking #{reschedulingId}…
        </p>
      ) : null}
    </div>
  );
};

export default BookingSchedulePage;
