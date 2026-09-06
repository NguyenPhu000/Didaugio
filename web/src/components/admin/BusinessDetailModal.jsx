import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import * as businessApi from "@/apis/businessApi";
import auditLogService from "@/apis/auditLogService";
import { ADMIN_ROUTES } from "@/constants/routes";
import { downloadDocument } from "@/apis/documentApi";
import {
  BUSINESS_STATUS,
  BUSINESS_STATUS_LABELS,
} from "@/constants/businessConstants";
import {
  Building2,
  ExternalLink,
  FileSignature,
  Loader2,
  Mail,
  MapPin,
  ShieldAlert,
  Wallet,
  Phone,
  Eye,
  EyeOff,
  AlertOctagon,
  BellRing,
  Ticket,
  Clock,
  User,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ContractPdfViewer from "@/components/business/ContractPdfViewer";
import { formatMoneyI18n } from "@/utils/formatters";

const getPlaceStatusLabels = (t) => ({
  draft: t("places.statusFilters.draft", "Bản nháp"),
  pending: t("places.statusFilters.pending", "Chờ duyệt"),
  approved: t("places.statusFilters.approved", "Đã duyệt"),
  rejected: t("places.statusFilters.rejected", "Bị từ chối"),
  hidden: t("categories.status.hidden", "Ẩn"),
});

const formatCurrency = (value) => formatMoneyI18n(value, i18n.language);

const getDocumentSource = (detail, type, fallbackField) => {
  const document = (detail?.sensitiveDocuments || []).find((item) => item.type === type);
  return document || fallbackField || null;
};

const ChecklistItem = ({ label, checked, previewUrl, onPreview }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2 text-sm last:border-0">
      <div className="flex items-center gap-2">
        <span>{label}</span>
        {previewUrl && (
          <button 
            onClick={() => onPreview?.(previewUrl, label)} 
            className="text-muted-foreground hover:text-black transition-colors" 
            title={t("common.view", "Xem")}
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <span
        className={cn(
          "font-mono text-[10px] uppercase px-2 py-0.5 border font-bold",
          checked
            ? "bg-emerald-50 border-emerald-500 text-emerald-800"
            : "bg-red-50 border-red-500 text-red-700",
        )}
      >
        {checked ? t("business.detailModal.valid", "HỢP LỆ") : t("business.detailModal.missing", "CHƯA BỔ SUNG")}
      </span>
    </div>
  );
};

export default function BusinessDetailModal({
  open,
  onOpenChange,
  businessId,
}) {
  const { t } = useTranslation();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewPdfOpen, setPreviewPdfOpen] = useState(false);
  const [pdfPreviewBlobUrl, setPdfPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("detail");
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [showPlain, setShowPlain] = useState({
    idCard: false,
    bankAccount: false,
    bankOwner: false,
    taxCode: false,
  });

  const toggleShowPlain = (field) => {
    setShowPlain((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  useEffect(() => {
    if (!previewData?.url) {
      setPdfPreviewBlobUrl(null);
      return;
    }

    const rawUrl = previewData.url;
    const isSecureDocObj = rawUrl && typeof rawUrl === "object" && rawUrl.id != null;

    if (isSecureDocObj) {
      let active = true;
      setPreviewLoading(true);
      setPdfPreviewBlobUrl(null);
      downloadDocument(rawUrl.id)
        .then((res) => {
          if (!active) return;
          const blob = res instanceof Blob ? res : new Blob([res], { type: rawUrl.mimeType });
          const url = URL.createObjectURL(blob);
          setPdfPreviewBlobUrl(url);
          setPreviewLoading(false);
        })
        .catch((err) => {
          console.error("Error downloading secure document in detail modal:", err);
          if (!active) return;
          setPreviewLoading(false);
        });
      return () => {
        active = false;
        if (pdfPreviewBlobUrl) {
          URL.revokeObjectURL(pdfPreviewBlobUrl);
        }
      };
    } else {
      const url = rawUrl.startsWith("http") || rawUrl.startsWith("data:") 
        ? rawUrl 
        : `data:image/jpeg;base64,${rawUrl}`;

      const isPdf = url.startsWith("data:application/pdf") || url.toLowerCase().endsWith(".pdf") || url.toLowerCase().includes(".pdf?");
      if (isPdf && url.startsWith("data:application/pdf;base64,")) {
        try {
          const base64Data = url.split(",")[1];
          const bstr = atob(base64Data);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: "application/pdf" });
          const blobUrl = URL.createObjectURL(blob);
          setPdfPreviewBlobUrl(blobUrl);
          return () => {
            URL.revokeObjectURL(blobUrl);
          };
        } catch (e) {
          console.error("Error converting base64 PDF to blob URL:", e);
        }
      } else {
        setPdfPreviewBlobUrl(null);
      }
    }
  }, [previewData]);

  useEffect(() => {
    if (!open || !businessId) return;
    setShowPlain({ idCard: false, bankAccount: false, bankOwner: false, taxCode: false });
    let cancelled = false;
    setDetail(null);
    setActiveTab("detail");

    (async () => {
      setLoading(true);
      try {
        const res = await businessApi.getById(businessId);
        if (!cancelled) setDetail(res.data);
      } catch (e) {
        if (!cancelled) {
          toast.error(e.message || t("common.operationFailed", "Thao tác thất bại"));
          onOpenChange?.(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, businessId, onOpenChange, t]);

  useEffect(() => {
    if (!open || !businessId || activeTab !== "audit") return;
    let cancelled = false;
    setAuditLoading(true);

    (async () => {
      try {
        const res = await auditLogService.getAll({
          tableName: "businesses",
          recordId: businessId,
          page: 1,
          limit: 50,
        });
        if (!cancelled) setAuditLogs(res.data || []);
      } catch {
        if (!cancelled) setAuditLogs([]);
      } finally {
        if (!cancelled) setAuditLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, businessId, activeTab]);

  const statusLabel =
    detail?.status != null
      ? BUSINESS_STATUS_LABELS[detail.status] || detail.status
      : "—";

  const places = Array.isArray(detail?.places) ? detail.places : [];
  const insights = detail?.adminInsights || {};
  const financial = insights.financialSummary || {};
  const contract = insights.contractSummary || {};
  const operations = insights.operationsSummary || {};
  const compliance = insights.complianceChecklist || {};
  const risks = Array.isArray(insights.riskFlags) ? insights.riskFlags : [];
  const placeStatusCounts = operations.placeStatusCounts || {};
  const idFrontSource = getDocumentSource(detail, "id_card_front", detail?.idCardFront);
  const idBackSource = getDocumentSource(detail, "id_card_back", detail?.idCardBack);
  const licenseSource = getDocumentSource(detail, "business_license", detail?.businessLicense);
  const certSource = getDocumentSource(detail, "certificate", null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92vh,940px)] max-w-5xl overflow-hidden flex flex-col gap-0 rounded-none border-2 border-black p-0 sm:rounded-none">
        <DialogHeader className="shrink-0 border-b-2 border-black bg-[#F4F4F4] px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-tight text-base">
            <Building2 className="h-5 w-5 shrink-0" aria-hidden />
            {t("business.detailModal.title", "Chi tiết doanh nghiệp")}
          </DialogTitle>
          <DialogDescription className="font-mono text-[11px] text-muted-foreground">
            {t("business.detailModal.subtitle", "Hồ sơ xác thực, hợp đồng và hiệu suất kinh doanh")}
          </DialogDescription>
          <div className="flex gap-1 mt-2 border-2 border-black bg-white">
            <button 
              onClick={() => setActiveTab("detail")} 
              className={cn("px-4 py-1.5 font-mono text-[11px] uppercase font-bold transition-colors cursor-pointer", activeTab === "detail" ? "bg-black text-white" : "bg-white text-black hover:bg-muted")}
            >
              {t("business.detailModal.editDetails", "Chi tiết hồ sơ")}
            </button>
            <button 
              onClick={() => setActiveTab("audit")} 
              className={cn("px-4 py-1.5 font-mono text-[11px] uppercase font-bold transition-colors flex items-center gap-1.5 cursor-pointer", activeTab === "audit" ? "bg-black text-white" : "bg-white text-black hover:bg-muted")}
            >
              <Clock className="h-3 w-3" />
              {t("auditLogs.title", "Nhật ký kiểm toán")}
            </button>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {(() => {
            if (loading) {
              return (
                <div className="flex justify-center py-16 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
                </div>
              );
            }

            if (!detail) return null;

            if (activeTab === "audit") {
              return (
                <div className="border border-black bg-white">
                  <div className="border-b border-black bg-[#F4F4F4] px-4 py-2">
                    <p className="font-mono text-[10px] uppercase font-bold text-muted-foreground">
                      {t("auditLogs.title", "Nhật ký kiểm toán")} — #{businessId}
                    </p>
                  </div>
                  {auditLoading ? (
                    <div className="flex justify-center py-12 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-6 text-center">
                      {t("common.noData", "Chưa có dữ liệu")}
                    </p>
                  ) : (
                    <div className="divide-y divide-black/10">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "font-mono text-[10px] uppercase px-2 py-0.5 border font-semibold",
                                log.action === "APPROVE" && "bg-emerald-50 border-emerald-500 text-emerald-800",
                                log.action === "REJECT" && "bg-rose-50 border-rose-500 text-rose-700",
                                log.action === "SUSPEND" && "bg-zinc-100 border-zinc-400 text-zinc-800",
                                log.action === "REACTIVATE" && "bg-blue-50 border-blue-500 text-blue-800",
                                log.action === "TERMINATE" && "bg-rose-100 border-rose-700 text-rose-900",
                                !["APPROVE","REJECT","SUSPEND","REACTIVATE","TERMINATE"].includes(log.action) && "bg-amber-50 border-amber-500 text-amber-800"
                              )}>{log.action}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />{log.user?.email || `User #${log.userId}`}</span>
                            </div>
                            <span className="text-[11px] text-muted-foreground font-mono whitespace-nowrap">{log.createdAt ? new Date(log.createdAt).toLocaleString("vi-VN") : "—"}</span>
                          </div>
                          {(log.newData || log.oldData) && (
                            <div className="mt-2 text-xs space-y-1">
                              {log.newData?.status && <p>{t("common.status", "Trạng thái")}: <strong>{log.oldData?.status || "—"}</strong> → <strong>{log.newData.status}</strong></p>}
                              {log.newData?.suspensionReason && <p className="text-red-700">{log.newData.suspensionReason}</p>}
                              {log.newData?.terminationReason && <p className="text-red-900">{log.newData.terminationReason}</p>}
                              {log.newData?.rejectionReason && <p className="text-red-700">{log.newData.rejectionReason}</p>}
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground font-mono mt-1">IP: {log.ipAddress || "—"} · {log.userAgent?.substring(0, 60) || "—"}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <>
                <div className="border border-black bg-white p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-[10px] uppercase text-muted-foreground">
                        {t("business.detailModal.businessName", "Tên doanh nghiệp")}
                      </p>
                      <p className="font-black text-lg uppercase tracking-tight">
                        {detail.businessName || "—"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "font-mono text-[10px] uppercase px-2 py-1 border border-black font-bold",
                        detail.status === BUSINESS_STATUS.APPROVED &&
                          "bg-[#F3E600] text-black",
                        detail.status === BUSINESS_STATUS.PENDING &&
                          "bg-amber-100 text-amber-900",
                        detail.status === BUSINESS_STATUS.SUSPENDED &&
                          "bg-neutral-200 text-neutral-800",
                        detail.status === BUSINESS_STATUS.REJECTED &&
                          "bg-red-100 text-red-800",
                        detail.status === BUSINESS_STATUS.TERMINATED &&
                          "bg-red-200 text-red-900",
                        detail.status === BUSINESS_STATUS.SUSPICIOUS &&
                          "bg-amber-200 text-amber-900",
                      )}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate" title={detail.owner?.email}>
                        {detail.owner?.email || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {detail.owner?.phone || t("common.noData", "Chưa có")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground min-w-0 lg:col-span-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate" title={detail.owner?.address}>
                        {detail.owner?.address || t("common.noData", "Chưa có")}
                      </span>
                    </div>
                    <div className="col-span-full font-mono text-xs mt-2 border-t border-dashed border-border/50 pt-2 flex flex-wrap gap-x-6 gap-y-2">
                      <span className="flex items-center gap-1.5">
                        CCCD: <strong>{showPlain.idCard ? detail.idCardNumber : detail.idCardNumberMasked || "—"}</strong>
                        {(detail.idCardNumber || detail.idCardNumberMasked) && (
                          <button onClick={() => toggleShowPlain("idCard")} className="text-muted-foreground hover:text-black focus:outline-none cursor-pointer" title={showPlain.idCard ? "Ẩn" : "Xem"}>
                            {showPlain.idCard ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </span>
                      <span className="flex items-center gap-1.5">
                        TK NH: <strong>{showPlain.bankAccount ? detail.bankAccountNumber : detail.bankAccountNumberMasked || "—"}</strong>
                        {(detail.bankAccountNumber || detail.bankAccountNumberMasked) && (
                          <button onClick={() => toggleShowPlain("bankAccount")} className="text-muted-foreground hover:text-black focus:outline-none cursor-pointer" title={showPlain.bankAccount ? "Ẩn" : "Xem"}>
                            {showPlain.bankAccount ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </span>
                      <span className="flex items-center gap-1.5">
                        Chủ TK: <strong>{showPlain.bankOwner ? detail.bankAccountOwner : detail.bankAccountOwnerMasked || "—"}</strong>
                        {(detail.bankAccountOwner || detail.bankAccountOwnerMasked) && (
                          <button onClick={() => toggleShowPlain("bankOwner")} className="text-muted-foreground hover:text-black focus:outline-none cursor-pointer" title={showPlain.bankOwner ? "Ẩn" : "Xem"}>
                            {showPlain.bankOwner ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </span>
                      <span className="flex items-center gap-1.5">
                        MST: <strong>{showPlain.taxCode ? detail.taxCode : detail.taxCodeMasked || "—"}</strong>
                        {(detail.taxCode || detail.taxCodeMasked) && (
                          <button onClick={() => toggleShowPlain("taxCode")} className="text-muted-foreground hover:text-black focus:outline-none cursor-pointer" title={showPlain.taxCode ? "Ẩn" : "Xem"}>
                            {showPlain.taxCode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Cột 1: Doanh thu */}
                  <div className="border border-black bg-white p-4 space-y-2">
                    <p className="font-mono text-[10px] uppercase text-muted-foreground flex items-center gap-1 font-bold">
                      <Wallet className="h-3.5 w-3.5 text-slate-700" /> {t("business.detailModal.revenue", "Doanh thu")}
                    </p>
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center justify-between">
                        <span className="text-slate-600">{t("business.detailModal.totalRevenue", "Tổng doanh thu")}:</span>
                        <strong className="font-mono text-slate-900">{formatCurrency(financial.completedRevenue)}</strong>
                      </p>
                      <p className="flex items-center justify-between">
                        <span className="text-slate-600">{t("business.detailModal.systemCommission", "Hoa hồng hệ thống")}:</span>
                        <strong className="font-mono text-slate-900">{formatCurrency(financial.completedCommission)}</strong>
                      </p>
                      <p className="flex items-center justify-between border-t border-dashed border-slate-200 pt-1">
                        <span className="text-slate-700 font-semibold">{t("business.detailModal.netRevenue", "Doanh thu thực nhận")}:</span>
                        <strong className="font-mono text-emerald-700 font-bold">{formatCurrency(financial.completedNetRevenue)}</strong>
                      </p>
                      <p className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                        <span>{t("business.detailModal.commissionRate", "Tỷ lệ hoa hồng")}:</span>
                        <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {financial.completedCommissionSharePct ?? contract.commissionRate ?? detail.commissionRate ?? 0}%
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Cột 2: Đặt chỗ */}
                  <div className="border border-black bg-white p-4 space-y-2">
                    <p className="font-mono text-[10px] uppercase text-muted-foreground font-bold">
                      {t("business.detailModal.bookings", "Đặt chỗ")}
                    </p>
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center justify-between">
                        <span className="text-slate-600">{t("business.detailModal.bookings", "Đặt chỗ")}:</span>
                        <strong className="font-mono">{financial.totalBookings ?? 0}</strong>
                      </p>
                      <p className="flex items-center justify-between">
                        <span className="text-slate-600">{t("business.bookings.completed", "Hoàn thành")}:</span>
                        <strong className="font-mono text-emerald-700">{financial.completedBookings ?? 0}</strong>
                      </p>
                      <p className="flex items-center justify-between">
                        <span className="text-slate-600">{t("business.bookings.pending", "Chờ xác nhận")}:</span>
                        <strong className="font-mono text-amber-700">{insights.bookingStatusCounts?.pending ?? 0}</strong>
                      </p>
                      <p className="flex items-center justify-between border-t border-dashed border-slate-200 pt-1">
                        <span className="text-slate-600">{t("business.bookingDetail.unpaid", "Chưa thanh toán")}:</span>
                        <strong className="font-mono text-rose-600">{insights.paymentStatusCounts?.unpaid ?? 0}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Cột 3: Trạng thái hợp đồng */}
                  <div className="border border-black bg-white p-4 space-y-2">
                    <p className="font-mono text-[10px] uppercase text-muted-foreground flex items-center gap-1 font-bold">
                      <FileSignature className="h-3.5 w-3.5 text-slate-700" /> {t("business.detailModal.contractStatus", "Trạng thái hợp đồng")}
                    </p>
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center justify-between">
                        <span className="text-slate-600">{t("common.status", "Trạng thái")}:</span>
                        <strong className={cn("font-bold", contract.contractSigned ? "text-emerald-700" : "text-amber-700")}>
                          {contract.contractSigned ? t("business.detailModal.signed", "Đã ký") : t("business.detailModal.unsigned", "Chưa ký")}
                        </strong>
                      </p>
                      <p className="flex items-center justify-between">
                        <span className="text-slate-600">{t("business.profile.contractVersion", "Phiên bản")}:</span>
                        <strong className="font-mono">{contract.contractVersion || "v1"}</strong>
                      </p>
                      <p className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{t("business.profile.signedAt", "Ký lúc")}:</span>
                        <strong className="font-mono">
                          {contract.contractSignedAt
                            ? new Date(contract.contractSignedAt).toLocaleString(
                                i18n.language === "vi" ? "vi-VN" : "en-US",
                              )
                            : "—"}
                        </strong>
                      </p>
                      <p className="flex items-center justify-between text-xs pt-0.5">
                        <span className="text-slate-600">{t("business.detailModal.commissionRate", "Tỷ lệ hoa hồng")}:</span>
                        <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {contract.commissionRate ?? detail.commissionRate ?? 0}%
                        </span>
                      </p>
                    </div>
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full rounded-none border-black font-mono text-[10px] uppercase h-7 gap-1 cursor-pointer"
                        onClick={() => setPreviewPdfOpen(true)}
                      >
                        <FileSignature className="h-3 w-3" /> {t("business.detailModal.viewContractPdf", "Xem hợp đồng PDF")}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Trạng thái KYC */}
                  <div className="border border-black bg-white p-4">
                    <p className="font-mono text-[10px] uppercase text-muted-foreground mb-2 font-bold">
                      {t("business.detailModal.kycStatus", "Trạng thái KYC")}
                    </p>
                    <ChecklistItem
                      label={t("business.detailModal.taxCode", "Mã số thuế")}
                      checked={Boolean(compliance.hasTaxCode)}
                    />
                    <ChecklistItem
                      label={t("business.detailModal.idFront", "Ảnh mặt trước CC/CCCD")}
                      checked={Boolean(compliance.hasIdCardFront)}
                      previewUrl={idFrontSource}
                      onPreview={(url, label) => setPreviewData({ url, title: label })}
                    />
                    <ChecklistItem
                      label={t("business.detailModal.idBack", "Ảnh mặt sau CC/CCCD")}
                      checked={Boolean(compliance.hasIdCardBack)}
                      previewUrl={idBackSource}
                      onPreview={(url, label) => setPreviewData({ url, title: label })}
                    />
                    <ChecklistItem
                      label={t("business.detailModal.businessLicense", "Giấy phép kinh doanh")}
                      checked={Boolean(compliance.hasBusinessLicense)}
                      previewUrl={licenseSource}
                      onPreview={(url, label) => setPreviewData({ url, title: label })}
                    />
                    {certSource && (
                      <ChecklistItem
                        label={t("business.documents.certificate", "Chứng nhận / Giấy tờ khác")}
                        checked={true}
                        previewUrl={certSource}
                        onPreview={(url, label) => setPreviewData({ url, title: label })}
                      />
                    )}
                    <ChecklistItem
                      label={t("business.detailModal.bankName", "Tên ngân hàng")}
                      checked={Boolean(compliance.hasBankInfo)}
                    />
                    <ChecklistItem
                      label={t("business.detailModal.contractStatus", "Trạng thái hợp đồng")}
                      checked={Boolean(compliance.hasSignedContract)}
                    />
                  </div>

                  {/* Rủi ro cần rà soát */}
                  <div className="border border-black bg-white p-4 space-y-2">
                    <p className="font-mono text-[10px] uppercase text-muted-foreground flex items-center gap-1 font-bold">
                      <ShieldAlert className="h-3.5 w-3.5 text-slate-700" /> {t("business.detailModal.highRiskReview", "Rủi ro cần rà soát")}
                    </p>
                    {risks.length === 0 ? (
                      <p className="text-sm text-emerald-700 font-medium py-1">
                        ✓ Không ghi nhận cảnh báo rủi ro nào
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {risks.map((risk, index) => (
                          <li
                            key={index}
                            className="text-xs border border-red-200 bg-red-50 text-red-800 px-2.5 py-1 font-medium"
                          >
                            {risk}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="pt-2 border-t border-black/20 text-xs space-y-1">
                      <p className="flex justify-between">
                        <span>{t("business.detailModal.services", "Dịch vụ")}:</span>
                        <span><strong>{operations.activeServiceCount ?? 0}</strong> hoạt động / <strong>{operations.inactiveServiceCount ?? 0}</strong> tạm dừng</span>
                      </p>
                      <p className="flex justify-between">
                        <span>{t("business.detailModal.vouchers", "Voucher")}:</span>
                        <span><strong>{operations.activeVoucherCount ?? 0}</strong> khả dụng / <strong>{operations.expiredVoucherCount ?? 0}</strong> hết hạn</span>
                      </p>
                      <p className="flex justify-between">
                        <span>{t("business.detailModal.places", "Địa điểm")}:</span>
                        <span><strong>{placeStatusCounts.approved ?? 0}</strong> đã duyệt · Chờ duyệt: <strong>{placeStatusCounts.pending ?? 0}</strong></span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="border border-black bg-[#F4F4F4] p-4 flex flex-wrap gap-3 items-center justify-between">
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("common.actions", "Hành động")}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("common.status", "Trạng thái")}: <span className={cn(
                        "font-mono text-[10px] uppercase px-1.5 py-0.5 border font-bold",
                        detail.status === BUSINESS_STATUS.APPROVED && "bg-[#F3E600] text-black border-black",
                        detail.status === BUSINESS_STATUS.PENDING && "bg-amber-100 text-amber-950 border-amber-400",
                        detail.status === BUSINESS_STATUS.SUSPENDED && "bg-zinc-200 text-zinc-900 border-zinc-400",
                        detail.status === BUSINESS_STATUS.REJECTED && "bg-rose-100 text-rose-900 border-rose-400",
                        detail.status === BUSINESS_STATUS.TERMINATED && "bg-rose-200 text-rose-950 border-rose-600",
                        detail.status === BUSINESS_STATUS.SUSPICIOUS && "bg-amber-200 text-amber-950 border-amber-600"
                      )}>{statusLabel}</span>
                      {detail.suspensionReason && <span className="ml-2 text-red-700 text-[11px]">{detail.suspensionReason}</span>}
                      {detail.terminationReason && <span className="ml-2 text-red-900 text-[11px]">{detail.terminationReason}</span>}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" className="rounded-none border-black font-mono text-[10px] uppercase gap-1 cursor-pointer" onClick={() => toast.success(t("common.savedSuccessfully", "Thành công"))}>
                      <BellRing className="h-3 w-3" /> {t("common.add", "Thông báo")}
                    </Button>
                    {(detail.status === BUSINESS_STATUS.APPROVED || detail.status === BUSINESS_STATUS.SUSPICIOUS) && (
                      <Button variant="outline" size="sm" className="rounded-none border-amber-600 text-amber-900 hover:bg-amber-50 font-mono text-[10px] uppercase gap-1 cursor-pointer" onClick={async () => {
                        const reason = window.prompt(t("admin.business.suspendPrompt", "Nhập lý do tạm khóa doanh nghiệp:"));
                        if (!reason || reason.trim().length < 10) { if (reason !== null) toast.error(t("admin.business.reasonMinLength", "Lý do phải từ 10 ký tự trở lên")); return; }
                        try { await businessApi.suspend(businessId, reason.trim()); toast.success(t("admin.business.businessSuspended", "Doanh nghiệp đã bị tạm khóa")); onOpenChange?.(false); } catch (e) { toast.error(e.message || t("common.operationFailed", "Lỗi")); }
                      }}>
                        <AlertOctagon className="h-3 w-3" /> {t("admin.business.lock", "Khóa")}
                      </Button>
                    )}
                    {detail.status === BUSINESS_STATUS.SUSPENDED && (
                      <Button variant="outline" size="sm" className="rounded-none border-emerald-600 text-emerald-900 hover:bg-emerald-50 font-mono text-[10px] uppercase gap-1 cursor-pointer" onClick={async () => {
                        if (!window.confirm(t("admin.business.reactivateConfirm", "Xác nhận mở khóa lại doanh nghiệp này?"))) return;
                        try { await businessApi.reactivate(businessId); toast.success(t("admin.business.businessReactivated", "Đã mở khóa doanh nghiệp")); onOpenChange?.(false); } catch (e) { toast.error(e.message || t("common.operationFailed", "Lỗi")); }
                      }}>
                        <RotateCcw className="h-3 w-3" /> {t("admin.business.reactivate", "Mở khóa")}
                      </Button>
                    )}
                    {(detail.status === BUSINESS_STATUS.APPROVED || detail.status === BUSINESS_STATUS.SUSPENDED) && (
                      <Button variant="destructive" size="sm" className="rounded-none font-mono text-[10px] uppercase gap-1 cursor-pointer" onClick={async () => {
                        const step1 = window.confirm(t("admin.business.terminateStep1Confirm", "Bạn có chắc chắn muốn chấm dứt hợp tác vĩnh viễn với doanh nghiệp này?"));
                        if (!step1) return;
                        const confirm = window.prompt(t("admin.business.terminateStep2Prompt", "Gõ CONFIRM để xác nhận chấm dứt hợp đồng:"));
                        if (confirm !== "CONFIRM") { toast.error(t("admin.business.confirmMismatch", "Mã xác nhận không đúng")); return; }
                        const reason = window.prompt(t("admin.business.terminateReasonPrompt", "Nhập lý do chấm dứt hợp tác:"));
                        if (!reason || reason.trim().length < 10) { if (reason !== null) toast.error(t("admin.business.reasonMinLength", "Lý do phải từ 10 ký tự trở lên")); return; }
                        try { await businessApi.terminate(businessId, reason.trim()); toast.success(t("admin.business.businessTerminated", "Đã chấm dứt hợp đồng")); onOpenChange?.(false); } catch (e) { toast.error(e.message || t("common.operationFailed", "Lỗi")); }
                      }}>
                        <XCircle className="h-3 w-3" /> {t("admin.business.terminateContract", "Chấm dứt hợp đồng")}
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {t("business.detailModal.places", "Địa điểm")} ({places.length})
                  </p>
                  {places.length === 0 ? (
                    <p className="text-sm text-muted-foreground border border-dashed border-black/30 p-6 text-center">
                      {t("common.noData", "Chưa có địa điểm nào")}
                    </p>
                  ) : (
                    <div className="border border-black divide-y divide-black">
                      {places.map((p) => (
                        <div
                          key={p.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-white hover:bg-muted/40 transition-colors"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <p className="font-semibold text-sm truncate">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {[p.category?.name, p.district?.name]
                                .filter(Boolean)
                                .join(" · ") ||
                                p.address ||
                                "—"}
                            </p>
                            <span className="inline-block font-mono text-[10px] uppercase border border-black/20 px-1.5 py-0.5">
                              {getPlaceStatusLabels(t)[p.status] || p.status}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="rounded-none border-black shrink-0 font-mono text-[10px] uppercase cursor-pointer"
                          >
                            <Link
                              to={ADMIN_ROUTES.PLACES_EDIT(p.id)}
                              onClick={() => onOpenChange?.(false)}
                            >
                              {t("common.edit", "Chỉnh sửa")}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    <Link
                      to={`${ADMIN_ROUTES.PLACES}?businessId=${businessId}`}
                      className="underline font-medium text-foreground hover:text-primary"
                      onClick={() => onOpenChange?.(false)}
                    >
                      {t("common.viewAll", "Xem tất cả địa điểm")}
                    </Link>
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      </DialogContent>

      <Dialog open={!!previewData} onOpenChange={(open) => !open && setPreviewData(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none flex items-center justify-center">
          <div className="relative bg-white p-4 w-full max-h-[90vh] overflow-auto flex flex-col">
            <h3 className="font-semibold text-lg border-b pb-2 mb-4">{previewData?.title}</h3>
            <div className="flex-1 flex items-center justify-center min-h-[50vh] w-full">
              {previewLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : previewData?.url && (() => {
                const rawUrl = previewData.url;
                const isSecureDocObj = rawUrl && typeof rawUrl === "object" && rawUrl.id != null;

                if (isSecureDocObj) {
                  const isPdf = rawUrl.mimeType === "application/pdf" || rawUrl.mimeType?.includes("pdf");
                  if (isPdf) {
                    return (
                      <iframe
                        src={pdfPreviewBlobUrl}
                        title={previewData.title}
                        className="w-full min-h-[60vh] border border-black"
                      />
                    );
                  }
                  return (
                    <img 
                      src={pdfPreviewBlobUrl}
                      alt={previewData.title}
                      className="max-w-full max-h-full object-contain"
                    />
                  );
                }

                const resolvedUrl = rawUrl.startsWith("http") || rawUrl.startsWith("data:") 
                  ? rawUrl 
                  : `data:image/jpeg;base64,${rawUrl}`;
                
                const isPdf = resolvedUrl.startsWith("data:application/pdf") || resolvedUrl.toLowerCase().endsWith(".pdf") || resolvedUrl.toLowerCase().includes(".pdf?");
                
                if (isPdf) {
                  return (
                    <iframe
                      src={pdfPreviewBlobUrl || resolvedUrl}
                      title={previewData.title}
                      className="w-full min-h-[60vh] border border-black"
                    />
                  );
                }

                return (
                  <img 
                    src={resolvedUrl}
                    alt={previewData.title}
                    className="max-w-full max-h-full object-contain"
                  />
                );
              })()}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setPreviewData(null)} variant="outline">{t("common.close", "Đóng")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewPdfOpen} onOpenChange={setPreviewPdfOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col gap-0 rounded-none border-2 border-black sm:rounded-none max-h-[90vh]">
          <div className="shrink-0 border-b-2 border-black bg-[#F4F4F4] px-5 py-4 text-left">
            <DialogHeader className="space-y-1">
              <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-tight text-base">
                <FileSignature className="h-5 w-5 shrink-0" aria-hidden="true" />
                {t("business.documents.contractPreview", "Xem hợp đồng")}
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto p-5 bg-white min-h-[60vh] flex flex-col justify-stretch">
            {previewPdfOpen && (
              <ContractPdfViewer
                businessId={businessId}
                className="w-full flex-1"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
