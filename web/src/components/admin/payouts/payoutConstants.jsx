import { Clock, ArrowUpRight, CheckCircle2, XCircle } from "lucide-react";
import { formatMoney } from "@/utils/formatters";

export { formatMoney };

export const STATUS_TABS = [
  { value: "pending", label: "Chờ duyệt", icon: Clock },
  { value: "approved", label: "Đang xử lý", icon: ArrowUpRight },
  { value: "transferred", label: "Hoàn thành", icon: CheckCircle2 },
  { value: "rejected", label: "Từ chối", icon: XCircle },
];

export const STATUS_BADGE_MAP = {
  pending: {
    label: "Chờ duyệt",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  approved: {
    label: "Đã duyệt",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  transferred: {
    label: "Đã chuyển",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Từ chối",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
};
