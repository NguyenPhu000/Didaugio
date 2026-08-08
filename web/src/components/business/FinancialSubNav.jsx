import { useLocation, useNavigate } from "react-router-dom";
import { Wallet, TrendingUp, ArrowUpRight, Receipt, BarChart3 } from "lucide-react";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const FINANCIAL_TABS = [
  {
    key: "earnings",
    label: "Ví & Rút tiền",
    route: BUSINESS_ROUTES.EARNINGS,
    icon: Wallet,
  },
  {
    key: "revenue",
    label: "Doanh thu",
    route: BUSINESS_ROUTES.REVENUE,
    icon: TrendingUp,
  },
  {
    key: "cashflow",
    label: "Sổ dòng tiền",
    route: BUSINESS_ROUTES.CASHFLOW,
    icon: ArrowUpRight,
  },
  {
    key: "invoices",
    label: "Hóa đơn dịch vụ",
    route: BUSINESS_ROUTES.SUBSCRIPTION_INVOICES,
    icon: Receipt,
  },
  {
    key: "reports",
    label: "Trung tâm báo cáo",
    route: BUSINESS_ROUTES.REPORTS,
    icon: BarChart3,
  },
];

export function FinancialSubNav({ activeTab }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-zinc-100/80 dark:bg-zinc-900/90 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 mb-6">
      {FINANCIAL_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab
          ? activeTab === tab.key
          : location.pathname === tab.route;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => navigate(tab.route)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-150",
              isActive
                ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white border border-zinc-200/80 dark:border-zinc-700"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-white/60 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/60"
            )}
          >
            <Icon className={cn("h-4 w-4", isActive ? "text-sky-500 dark:text-sky-400" : "text-zinc-400")} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default FinancialSubNav;
