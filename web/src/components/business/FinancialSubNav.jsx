import { useLocation, useNavigate } from "react-router-dom";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const FINANCIAL_TABS = [
  {
    key: "earnings",
    label: "Ví & Rút tiền",
    route: BUSINESS_ROUTES.EARNINGS,
  },
  {
    key: "revenue",
    label: "Doanh thu",
    route: BUSINESS_ROUTES.REVENUE,
  },
  {
    key: "cashflow",
    label: "Sổ dòng tiền",
    route: BUSINESS_ROUTES.CASHFLOW,
  },
  {
    key: "invoices",
    label: "Hóa đơn dịch vụ",
    route: BUSINESS_ROUTES.SUBSCRIPTION_INVOICES,
  },
  {
    key: "reports",
    label: "Trung tâm báo cáo",
    route: BUSINESS_ROUTES.REPORTS,
  },
];

export function FinancialSubNav({ activeTab }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-card rounded-[26px] border border-slate-200/80 dark:border-border/80 shadow-sm overflow-x-auto">
      {FINANCIAL_TABS.map((tab) => {
        const isActive = activeTab
          ? activeTab === tab.key
          : location.pathname === tab.route;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => navigate(tab.route)}
            className={cn(
              "px-4 sm:px-5 py-2 rounded-2xl text-xs font-bold transition-all duration-200 shrink-0 select-none",
              isActive
                ? "bg-slate-950 text-white shadow-sm dark:bg-primary dark:text-primary-foreground"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-muted"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default FinancialSubNav;
