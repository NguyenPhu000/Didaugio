import {
  MapPin,
  Utensils,
  Hotel,
  TreePine,
  ShoppingBag,
  Landmark,
  Coffee,
  Tent,
  Leaf,
} from "lucide-react";
import i18n from "@/i18n";

const CATEGORY_LABELS = {
  1: "map.categories.cuisine",
  2: "map.categories.lodging",
  3: "map.categories.tourism",
  4: "map.categories.shopping",
  5: "map.categories.ecology",
  6: "map.categories.cafe",
  7: "map.categories.homestay",
  8: "map.categories.ecoArea",
  13: "map.categories.cuisine",
};

const DEFAULT_CATEGORY_KEY = "map.categories.place";

export const CATEGORY_CONFIG = {
  1: { color: "#ef4444", bg: "#fef2f2", Icon: Utensils },
  2: { color: "#f97316", bg: "#fff7ed", Icon: Hotel },
  3: { color: "#8b5cf6", bg: "#f5f3ff", Icon: Landmark },
  4: { color: "#06b6d4", bg: "#ecfeff", Icon: ShoppingBag },
  5: { color: "#22c55e", bg: "#f0fdf4", Icon: TreePine },
  6: { color: "#ec4899", bg: "#fdf2f8", Icon: Coffee },
  7: { color: "#f59e0b", bg: "#fffbeb", Icon: Tent },
  8: { color: "#14b8a6", bg: "#f0fdfa", Icon: Leaf },
  13: { color: "#ef4444", bg: "#fef2f2", Icon: Utensils },
};

export const DEFAULT_CATEGORY = {
  color: "#6366f1",
  bg: "#eef2ff",
  Icon: MapPin,
};

export const getCategoryConfig = (categoryId) =>
  CATEGORY_CONFIG[categoryId] || DEFAULT_CATEGORY;

export const getCategoryLabel = (categoryId) =>
  i18n.t(CATEGORY_LABELS[categoryId] || DEFAULT_CATEGORY_KEY);

export const PRICE_LABELS = {
  FREE: { labelKey: "map.prices.free", color: "#22c55e", cls: "bg-green-100 text-green-700" },
  BUDGET: { labelKey: "map.prices.budget", color: "#3b82f6", cls: "bg-blue-100 text-blue-700" },
  MODERATE: { labelKey: "map.prices.moderate", color: "#f59e0b", cls: "bg-amber-100 text-amber-700" },
  EXPENSIVE: { labelKey: "map.prices.expensive", color: "#f97316", cls: "bg-orange-100 text-orange-700" },
  LUXURY: { labelKey: "map.prices.luxury", color: "#8b5cf6", cls: "bg-purple-100 text-purple-700" },
};

export const getPriceLabel = (priceKey) =>
  PRICE_LABELS[priceKey] ? i18n.t(PRICE_LABELS[priceKey].labelKey) : priceKey;
