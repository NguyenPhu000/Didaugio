import { MAP_TEXT } from "./mapText.constants";

export const QUICK_FILTER_OPTIONS = [
  {
    key: "topRated",
    label: MAP_TEXT.filters.quickOptions.topRated,
    icon: "star",
  },
  {
    key: "trending",
    label: MAP_TEXT.filters.quickOptions.trending,
    icon: "local-fire-department",
  },
  {
    key: "budget",
    label: MAP_TEXT.filters.quickOptions.budget,
    icon: "savings",
  },
  {
    key: "premium",
    label: MAP_TEXT.filters.quickOptions.premium,
    icon: "workspace-premium",
  },
  {
    key: "openNow",
    label: MAP_TEXT.filters.quickOptions.openNow,
    icon: "schedule",
  },
];

export const FILTER_GROUP_OPTIONS = [
  {
    key: "category",
    label: MAP_TEXT.filters.groupOptions.category,
    icon: "apps",
  },
  {
    key: "area",
    label: MAP_TEXT.filters.groupOptions.area,
    icon: "place",
  },
  {
    key: "quick",
    label: MAP_TEXT.filters.groupOptions.quick,
    icon: "tune",
  },
];

export const BUDGET_PRICE_RANGES = new Set(["FREE", "BUDGET", "MODERATE"]);
export const PREMIUM_PRICE_RANGES = new Set(["EXPENSIVE", "LUXURY"]);

export const ALL_AREAS_KEY = "__all_areas__";

export const DEFAULT_QUICK_FILTERS = Object.freeze({
  topRated: false,
  trending: false,
  budget: false,
  premium: false,
  openNow: false,
});
