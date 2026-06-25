import { useTranslation } from "react-i18next";
import {
  useAdminCashflow,
  useAdminCashflowSummary,
} from "@/hooks/queries/useCashflowQueries";
import CashflowLedgerPage from "@/pages/shared/CashflowLedgerPage";

export default function AdminCashflowPage() {
  const { t } = useTranslation();

  return (
    <CashflowLedgerPage
      title={t("admin.cashflow.title")}
      description={t("admin.cashflow.description")}
      useSummary={useAdminCashflowSummary}
      useRows={useAdminCashflow}
      exportFilename="admin_cashflow"
    />
  );
}
