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

export const CATEGORY_CONFIG = {
  1: { color: "#ef4444", bg: "#fef2f2", Icon: Utensils, label: "Ẩm thực" },
  2: { color: "#f97316", bg: "#fff7ed", Icon: Hotel, label: "Lưu trú" },
  3: { color: "#8b5cf6", bg: "#f5f3ff", Icon: Landmark, label: "Tham quan" },
  4: { color: "#06b6d4", bg: "#ecfeff", Icon: ShoppingBag, label: "Mua sắm" },
  5: { color: "#22c55e", bg: "#f0fdf4", Icon: TreePine, label: "Sinh thái" },
  6: { color: "#ec4899", bg: "#fdf2f8", Icon: Coffee, label: "Cafe" },
  7: { color: "#f59e0b", bg: "#fffbeb", Icon: Tent, label: "Homestay" },
  8: { color: "#14b8a6", bg: "#f0fdfa", Icon: Leaf, label: "Khu sinh thái" },
  13: { color: "#ef4444", bg: "#fef2f2", Icon: Utensils, label: "Ẩm thực" },
};

export const DEFAULT_CATEGORY = {
  color: "#6366f1",
  bg: "#eef2ff",
  Icon: MapPin,
  label: "Địa điểm",
};

export const getCategoryConfig = (categoryId) =>
  CATEGORY_CONFIG[categoryId] || DEFAULT_CATEGORY;

export const PRICE_LABELS = {
  FREE: { label: "Miễn phí", color: "#22c55e", cls: "bg-green-100 text-green-700" },
  BUDGET: { label: "Bình dân", color: "#3b82f6", cls: "bg-blue-100 text-blue-700" },
  MODERATE: { label: "Trung bình", color: "#f59e0b", cls: "bg-amber-100 text-amber-700" },
  EXPENSIVE: { label: "Cao cấp", color: "#f97316", cls: "bg-orange-100 text-orange-700" },
  LUXURY: { label: "Sang trọng", color: "#8b5cf6", cls: "bg-purple-100 text-purple-700" },
};
