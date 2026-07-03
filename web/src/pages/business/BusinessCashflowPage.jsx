import { useTranslation } from "react-i18next";
import {
  useBusinessCashflow,
  useBusinessCashflowSummary,
} from "@/hooks/queries/useCashflowQueries";
import CashflowLedgerPage from "@/pages/shared/CashflowLedgerPage";

export default function BusinessCashflowPage() {
  const { t } = useTranslation();

  return (
    <CashflowLedgerPage
      title={t("business.cashflow.title")}
      description={t("business.cashflow.description")}
      useSummary={useBusinessCashflowSummary}
      useRows={useBusinessCashflow}
      exportFilename="business_cashflow"
    />
  );
}
