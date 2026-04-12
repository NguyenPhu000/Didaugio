export const FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Đang lên kế hoạch" },
  { key: "done", label: "Đã hoàn thành" },
];

export const STATUS_THEME = {
  draft: {
    label: "Nháp",
    bg: "#FFF4D6",
    text: "#B45309",
    accent: "#F59E0B",
    icon: "edit-calendar",
  },
  active: {
    label: "Đang diễn ra",
    bg: "#DBEAFE",
    text: "#1D4ED8",
    accent: "#2563EB",
    icon: "flight-takeoff",
  },
  completed: {
    label: "Đã hoàn thành",
    bg: "#DCFCE7",
    text: "#047857",
    accent: "#10B981",
    icon: "task-alt",
  },
  cancelled: {
    label: "Đã hủy",
    bg: "#FEE2E2",
    text: "#B91C1C",
    accent: "#EF4444",
    icon: "event-busy",
  },
};

export function formatDate(dateStr) {
  if (!dateStr) return null;

  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function getDateRangeLabel(trip) {
  if (trip.startDate && trip.endDate) {
    return `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`;
  }

  if (trip.startDate) {
    return `Từ ${formatDate(trip.startDate)}`;
  }

  return "Chưa chọn ngày";
}

export function getDaysUntil(dateStr) {
  if (!dateStr) return null;

  const now = new Date();
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );

  return Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function getTimelineLabel(trip) {
  if (trip.status === "completed") return "Đã kết thúc";
  if (trip.status === "cancelled") return "Không còn hiệu lực";

  const daysUntil = getDaysUntil(trip.startDate);
  if (daysUntil === null) return "Có thể bổ sung sau";
  if (daysUntil < 0) return "Đang trong hành trình";
  if (daysUntil === 0) return "Bắt đầu hôm nay";
  if (daysUntil === 1) return "Bắt đầu ngày mai";

  return `Còn ${daysUntil} ngày`;
}

export function getHeroTrip(trips) {
  const candidates = trips
    .filter((trip) => trip.status !== "completed" && trip.status !== "cancelled")
    .sort((a, b) => {
      const aDate = a.startDate ? new Date(a.startDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.startDate ? new Date(b.startDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });

  return candidates[0] || trips[0] || null;
}

export function buildSummary(trips) {
  const activeCount = trips.filter(
    (trip) => trip.status === "active" || trip.status === "draft",
  ).length;
  const completedCount = trips.filter(
    (trip) => trip.status === "completed" || trip.status === "cancelled",
  ).length;
  const totalDestinations = trips.reduce(
    (sum, trip) => sum + (trip.destinations?.length || 0),
    0,
  );

  return [
    {
      key: "trips",
      icon: "luggage",
      value: String(trips.length),
      label: "Chuyến đi",
      tone: "blue",
    },
    {
      key: "active",
      icon: "bolt",
      value: String(activeCount),
      label: "Đang xử lý",
      tone: "amber",
    },
    {
      key: "places",
      icon: "place",
      value: String(totalDestinations),
      label: "Điểm đến",
      tone: "green",
    },
    {
      key: "done",
      icon: "task-alt",
      value: String(completedCount),
      label: "Đã xong",
      tone: "red",
    },
  ];
}

export function getSectionCopy(activeFilter, count) {
  if (activeFilter === "active") {
    return `${count} hành trình đang được theo dõi sát sao.`;
  }

  if (activeFilter === "done") {
    return `${count} hành trình đã đóng lại để bạn xem nhanh hồ sơ cũ.`;
  }

  return `${count} hành trình trong một bảng điều khiển gọn gàng.`;
}
