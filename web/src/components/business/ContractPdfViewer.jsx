import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { downloadContract } from "@/apis/businessApi";

const ContractPdfViewer = memo(({ businessId, className, adminSigned = false }) => {
  const { t } = useTranslation();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pdfUrlRef = useRef(null);

  const fetchContract = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const blob = await downloadContract(businessId, adminSigned ? { adminSigned: true } : {});
      const url = URL.createObjectURL(blob);
      // Revoke URL cũ trước khi set URL mới
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = url;
      setPdfUrl(url);
    } catch (err) {
      setError(err?.message || t("business.documents.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [businessId, adminSigned, t]);

  useEffect(() => {
    fetchContract();
    return () => {
      // Dùng ref để revoke URL mới nhất, tránh stale closure
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
        pdfUrlRef.current = null;
      }
    };
  }, [fetchContract]);

  const handleDownload = useCallback(() => {
    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `contract-${businessId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t("business.documents.downloadStarted"));
  }, [pdfUrl, businessId, t]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchContract}>
            {t("common.retry")}
          </Button>
        </div>
      );
    }

    if (!pdfUrl) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t("business.documents.noContract")}
          </p>
        </div>
      );
    }

    return (
      <iframe
        src={pdfUrl}
        title={t("business.documents.contractPreview")}
        className="w-full rounded-lg border-0"
        style={{ minHeight: 500 }}
      />
    );
  }, [loading, error, pdfUrl, t, fetchContract]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {t("business.documents.contractPdf")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={!pdfUrl || loading}
          className="gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          {t("common.download")}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
        {content}
      </div>
    </div>
  );
});

ContractPdfViewer.displayName = "ContractPdfViewer";

export default ContractPdfViewer;
