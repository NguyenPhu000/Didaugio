import { useEffect, useMemo, useRef } from "react";
import { buildTripDays } from "../utils/tripHelpers";
import {
  scheduleLocalNotificationAt,
  cancelScheduledNotification,
} from "../../../lib/local-notifications";

/** Khoảng thời gian nhắc nhở trước giờ di chuyển (phút). */
const LEAD_MINUTES = 10;

/**
 * Tạo Date theo múi giờ địa phương từ chuỗi ngày YYYY-MM-DD và giờ HH:mm.
 * Tránh việc new Date("YYYY-MM-DD") bị hiểu là UTC gây lệch múi giờ.
 */
function buildLocalDateTime(ymd, hhmm) {
  if (!ymd || !hhmm) return null;
  const [year, month, day] = String(ymd).split("-").map(Number);
  const [hours, minutes] = String(hhmm).split(":").map(Number);
  if ([year, month, day, hours, minutes].some((n) => Number.isNaN(n))) {
    return null;
  }
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Lên lịch nhắc nhở di chuyển thông minh cho chuyến đi đang chạy.
 *
 * Dựa vào giờ kết thúc của điểm đến hiện tại (điểm vừa điểm danh gần nhất)
 * để nhắc người dùng chuẩn bị xuất phát sang điểm tiếp theo trước 10 phút.
 *
 * @param {{ activeTrip?, visitedIds?: number[], nextDestination?, enabled?: boolean }} params
 */
export function useDepartureAlerts({
  activeTrip,
  visitedIds = [],
  nextDestination,
  enabled = true,
}) {
  const scheduledRef = useRef({ key: null, identifier: null });

  const dayDateMap = useMemo(() => {
    const map = new Map();
    if (!activeTrip) return map;
    for (const day of buildTripDays(activeTrip)) {
      map.set(day.dayNumber, day.dateYmd);
    }
    return map;
  }, [activeTrip]);

  // Điểm đến hiện tại = điểm vừa điểm danh gần nhất (theo ngày + order) có giờ kết thúc.
  const currentDestination = useMemo(() => {
    if (!activeTrip?.destinations?.length) return null;
    const visited = activeTrip.destinations
      .filter((d) => visitedIds.includes(d.id) && d.endTime)
      .sort((a, b) => {
        if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
        return a.order - b.order;
      });
    return visited.length ? visited[visited.length - 1] : null;
  }, [activeTrip, visitedIds]);

  useEffect(() => {
    if (!enabled || !currentDestination || !nextDestination) return;

    const ymd = dayDateMap.get(currentDestination.dayNumber);
    const endAt = buildLocalDateTime(ymd, currentDestination.endTime);
    if (!endAt) return;

    const fireAt = new Date(endAt.getTime() - LEAD_MINUTES * 60 * 1000);
    const nextName = nextDestination.place?.name || "địa điểm tiếp theo";
    const key = `${currentDestination.id}->${nextDestination.id}@${fireAt.getTime()}`;

    if (scheduledRef.current.key === key) return;

    let cancelled = false;

    const reschedule = async () => {
      if (scheduledRef.current.identifier) {
        await cancelScheduledNotification(scheduledRef.current.identifier);
      }
      const identifier = await scheduleLocalNotificationAt({
        title: "Sắp đến giờ di chuyển",
        body: `Đã sắp đến giờ di chuyển sang địa điểm tiếp theo ${nextName}. Hãy chuẩn bị xuất phát nhé!`,
        date: fireAt,
        data: { tripId: activeTrip?.id, destId: nextDestination.id },
      });
      if (!cancelled) {
        scheduledRef.current = { key, identifier };
      }
    };

    void reschedule();

    return () => {
      cancelled = true;
    };
  }, [enabled, currentDestination, nextDestination, dayDateMap, activeTrip?.id]);

  // Dọn dẹp thông báo đã lên lịch khi hook unmount / tắt active mode.
  useEffect(() => {
    if (enabled) return;
    if (scheduledRef.current.identifier) {
      void cancelScheduledNotification(scheduledRef.current.identifier);
      scheduledRef.current = { key: null, identifier: null };
    }
  }, [enabled]);
}
