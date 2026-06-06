export const TRAVEL_STYLES = [
  { id: "food", labelKey: "preferences.travelStyles.food", icon: "restaurant", color: "#F5C842" },
  { id: "history", labelKey: "preferences.travelStyles.history", icon: "account-balance", color: "#8B6914" },
  { id: "nature", labelKey: "preferences.travelStyles.nature", icon: "park", color: "#2D8E6B" },
  { id: "shopping", labelKey: "preferences.travelStyles.shopping", icon: "shopping-bag", color: "#E85D6B" },
  { id: "nightlife", labelKey: "preferences.travelStyles.nightlife", icon: "nightlife", color: "#6366F1" },
  { id: "budget", labelKey: "preferences.travelStyles.budget", icon: "savings", color: "#10B981" },
];

export const GROUP_TYPES = [
  { id: "solo", labelKey: "preferences.groupTypes.solo", icon: "person" },
  { id: "couple", labelKey: "preferences.groupTypes.couple", icon: "favorite" },
  { id: "family", labelKey: "preferences.groupTypes.family", icon: "family-restroom" },
  { id: "group", labelKey: "preferences.groupTypes.group", icon: "group" },
];

export const BUDGET_LEVELS = [
  { id: "low", labelKey: "preferences.budgetLevels.low.label", descriptionKey: "preferences.budgetLevels.low.description" },
  { id: "medium", labelKey: "preferences.budgetLevels.medium.label", descriptionKey: "preferences.budgetLevels.medium.description" },
  { id: "high", labelKey: "preferences.budgetLevels.high.label", descriptionKey: "preferences.budgetLevels.high.description" },
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
