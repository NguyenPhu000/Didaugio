export const TRAVEL_STYLES = [
  { id: "food", label: "Ẩm thực", icon: "restaurant", color: "#F5C842" },
  { id: "history", label: "Lịch sử", icon: "account-balance", color: "#8B6914" },
  { id: "nature", label: "Thiên nhiên", icon: "park", color: "#2D8E6B" },
  { id: "shopping", label: "Mua sắm", icon: "shopping-bag", color: "#E85D6B" },
  { id: "nightlife", label: "Về đêm", icon: "nightlife", color: "#6366F1" },
  { id: "budget", label: "Tiết kiệm", icon: "savings", color: "#10B981" },
];

export const GROUP_TYPES = [
  { id: "solo", label: "Một mình", icon: "person" },
  { id: "couple", label: "Đôi", icon: "favorite" },
  { id: "family", label: "Gia đình", icon: "family-restroom" },
  { id: "group", label: "Nhóm bạn", icon: "group" },
];

export const BUDGET_LEVELS = [
  { id: "low", label: "Tiết kiệm", description: "< 500.000 VND/ngày" },
  { id: "medium", label: "Vừa phải", description: "500k - 1.5 triệu/ngày" },
  { id: "high", label: "Cao cấp", description: "> 1.5 triệu/ngày" },
];

export const PREFERENCES_DEFAULT = {
  travelStyles: [],
  groupType: null,
  visitedCanTho: false,
  budgetLevel: "medium",
};

export const PLACE_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  DRAFT: "draft",
};
