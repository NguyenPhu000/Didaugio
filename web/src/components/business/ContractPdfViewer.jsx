import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, ExternalLink, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { downloadContract } from "@/apis/businessApi";

const PDF_MIME_TYPE = "application/pdf";

async function resolvePdfBlob(rawResponse, fallbackMessage) {
  const blob = rawResponse?.data || rawResponse;

  if (blob instanceof Blob) {
    const contentType = blob.type || PDF_MIME_TYPE;

    if (contentType.includes("application/json")) {
      try {
        const json = JSON.parse(await blob.text());
        throw new Error(json.message || fallbackMessage);
      } catch (error) {
        throw new Error(error.message || fallbackMessage);
      }
    }

    if (!contentType.includes(PDF_MIME_TYPE)) {
      return new Blob([blob], { type: PDF_MIME_TYPE });
    }

    return blob;
  }

  if (blob instanceof ArrayBuffer) {
    return new Blob([blob], { type: PDF_MIME_TYPE });
  }

  if (typeof blob === "string") {
    const trimmed = blob.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const json = JSON.parse(trimmed);
        throw new Error(json.message || fallbackMessage);
      } catch (error) {
        throw new Error(error.message || fallbackMessage);
      }
    }
  }

  return new Blob([blob], { type: PDF_MIME_TYPE });
}

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
      const rawRes = await downloadContract(businessId, adminSigned ? { adminSigned: true } : {});
      const blob = await resolvePdfBlob(rawRes, t("business.documents.loadFailed"));
      const url = URL.createObjectURL(blob);
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

  const handleOpenInNewTab = useCallback(() => {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  }, [pdfUrl]);

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

    const title = t("business.documents.contractPreview");

    return (
      <object
        data={`${pdfUrl}#toolbar=1&navpanes=0`}
        type={PDF_MIME_TYPE}
        title={title}
        className="block min-h-[560px] w-full"
      >
        <iframe
          src={pdfUrl}
          title={title}
          className="block min-h-[560px] w-full border-0"
        />
      </object>
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenInNewTab}
            disabled={!pdfUrl || loading}
            className="gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("business.documents.openPdf", { defaultValue: "Mo PDF" })}
          </Button>
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
      </div>

      <div className="min-h-[560px] overflow-hidden rounded-xl border border-border/60 bg-muted/20">
        {content}
      </div>
    </div>
  );
});

ContractPdfViewer.displayName = "ContractPdfViewer";

export default ContractPdfViewer;
