import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  FileText,
  ImageIcon,
  Loader2,
  MapPin,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { ADMIN_ROUTES } from "@/constants/routes";
import * as businessApi from "@/apis/businessApi";
import { BUSINESS_TYPE_LABELS } from "@/constants/businessConstants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { resolveMediaUrl, isPdfSource, isImageSource } from "@/utils/mediaUrl";
import ContractPdfViewer from "@/components/business/ContractPdfViewer";

const FieldRow = ({ label, value, mono, isSensitive, showSensitive, onToggle }) => (
  <div className="flex flex-col sm:flex-row sm:gap-3 sm:justify-between py-2.5 border-b border-border/40 last:border-0 first:pt-0 text-sm">
    <span className="text-muted-foreground shrink-0 w-44">{label}</span>
    <div className="flex items-center gap-1.5 justify-end sm:justify-start flex-1 min-w-0">
      <span
        className={cn(
          "font-medium text-foreground text-right sm:text-left break-all",
          mono && "font-mono text-xs",
        )}
      >
        {typeof value === "object" && value !== null 
          ? value 
          : (value !== undefined && value !== null && value !== "" ? String(value) : "—")}
      </span>
      {isSensitive && value && value !== "—" && (
        <button
          type="button"
          onClick={onToggle}
          className="text-slate-400 hover:text-slate-600 transition focus:outline-none shrink-0"
          title={showSensitive ? "Ẩn" : "Xem"}
        >
          {showSensitive ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  </div>
);

/**
 * Thẻ xem nhanh giấy tờ: hỗ trợ URL https, data URI ảnh/PDF, đường dẫn /... ghép origin API.
 */
function DocumentPreviewCard({ title, raw }) {
  const { t } = useTranslation();
  const resolved = useMemo(() => resolveMediaUrl(raw), [raw]);
  const [imgError, setImgError] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setImgError(false));
    return () => cancelAnimationFrame(id);
  }, [resolved]);

  const isPdf = resolved && isPdfSource(resolved);
  const isImgHint = resolved && isImageSource(resolved);

  useEffect(() => {
    if (isPdf && resolved && resolved.startsWith("data:application/pdf;base64,")) {
      try {
        const base64Data = resolved.split(",")[1];
        const bstr = atob(base64Data);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (e) {
        console.error("Error converting base64 PDF to blob URL:", e);
      }
    } else {
      setBlobUrl(null);
    }
  }, [isPdf, resolved]);

  const previewUrl = blobUrl || resolved;

  if (!resolved) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-muted-foreground/25 bg-muted/20 p-5 text-center shadow-inner">
        <FileText
          className="mb-2 h-10 w-10 text-muted-foreground/45"
          aria-hidden="true"
        />
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("common.noData")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-none border border-black bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-black bg-[#F4F4F4] px-4 py-2">
        <p className="truncate text-xs font-bold uppercase tracking-wider text-black">
          {title}
        </p>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-none border border-black bg-white px-2 py-1 text-[10px] font-mono uppercase text-black hover:bg-muted"
        >
          {t("common.viewAll")}
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>

      <div className="flex min-h-[220px] flex-1 items-center justify-center bg-white p-3">
        {(() => {
          if (isPdf) {
            return (
              <div className="w-full space-y-2">
                <iframe
                  title={title}
                  src={previewUrl}
                  className="h-[min(42vh,300px)] w-full rounded-none border border-black bg-background"
                />
              </div>
            );
          }

          const canPreviewImage = isImgHint || (!isPdf && !imgError);
          if (canPreviewImage) {
            return (
              <div className="relative flex w-full justify-center">
                {!imgError ? (
                  <img
                    src={resolved}
                    alt={`${title} — đối chiếu`}
                    className="max-h-[min(44vh,380px)] w-full rounded-none border border-black bg-background object-contain"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {t("common.noData")}
                    </p>
                    <Button variant="outline" size="sm" className="rounded-none border-black font-mono text-[10px] uppercase" asChild>
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t("common.download")}
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            );
          }

          return (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {t("common.noData")}
              </p>
              <Button variant="outline" size="sm" className="rounded-none border-black font-mono text-[10px] uppercase" asChild>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  {t("common.download")}
                </a>
              </Button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

/**
 * Modal đối chiếu đầy đủ trước khi admin duyệt / từ chối doanh nghiệp (trạng thái pending).
 */
const BusinessReviewApproveModal = ({
  open,
  onOpenChange,
  businessId,
  onApproved,
  onRejected,
}) => {
  const { t } = useTranslation();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [commissionRate, setCommissionRate] = useState("10");
  const [previewPdfOpen, setPreviewPdfOpen] = useState(false);
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
    if (!open || !businessId) return;
    setShowPlain({ idCard: false, bankAccount: false, bankOwner: false, taxCode: false });
    let cancelled = false;
    setRejectMode(false);
    setRejectReason("");
    setAcknowledged(false);
    setDetail(null);
    (async () => {
      setLoading(true);
      try {
        const res = await businessApi.getById(businessId);
        if (cancelled) return;
        const data = res.data;
        setDetail(data);
        if (data?.commissionRate != null && data.commissionRate !== "") {
          setCommissionRate(String(Number(data.commissionRate)));
        } else {
          setCommissionRate("10");
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(e.message || t("common.operationFailed"));
          onOpenChange?.(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, businessId, onOpenChange]);

  const handleApprove = async () => {
    if (!acknowledged) {
      toast.error(t("business.approveModal.confirmApprove"));
      return;
    }
    const rate = Number(commissionRate);
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      toast.error(t("business.approveModal.actionFailed"));
      return;
    }
    setSubmitting(true);
    try {
      await onApproved?.(businessId, { commissionRate: rate });
      toast.success(t("business.approveModal.approveSuccess"));
      onOpenChange?.(false);
    } catch (e) {
      toast.error(e.message || t("business.approveModal.actionFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (rejectReason.trim().length < 10) {
      toast.error(t("business.approveModal.rejectReason"));
      return;
    }
    setSubmitting(true);
    try {
      await onRejected?.(businessId, rejectReason.trim());
      toast.success(t("business.approveModal.rejectSuccess"));
      onOpenChange?.(false);
    } catch (e) {
      toast.error(e.message || t("business.approveModal.actionFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const typeLabel =
    BUSINESS_TYPE_LABELS[detail?.businessType] || detail?.businessType || "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[min(92vh,940px)] max-w-5xl overflow-hidden flex flex-col gap-0 rounded-none border-2 border-black p-0 sm:rounded-none"
      >
        <div className="shrink-0 border-b-2 border-black bg-[#F4F4F4] px-5 py-4 text-left">
          <DialogHeader className="space-y-1">
            <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-tight text-base">
              <FileText className="h-5 w-5 shrink-0" aria-hidden="true" />
              {t("business.approveModal.title")}
            </DialogTitle>
            <DialogDescription className="font-mono text-[11px] uppercase text-muted-foreground">
              {t("business.approveModal.confirmApprove")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {(() => {
            if (loading) {
              return (
                <div className="flex justify-center py-20 text-muted-foreground">
                  <Loader2
                    className="h-9 w-9 animate-spin"
                    aria-hidden="true"
                  />
                </div>
              );
            }

            if (!detail) return null;

            return (
              <>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="border border-black bg-white p-4 space-y-1 rounded-none">
                    <p className="font-mono text-[10px] uppercase text-muted-foreground mb-2">
                      {t("business.detailModal.businessName")}
                    </p>
                    <div className="space-y-0">
                      <FieldRow
                        label={t("business.detailModal.businessName")}
                        value={detail.businessName}
                      />
                      <FieldRow label={t("business.detailModal.businessType")} value={typeLabel} />
                      <FieldRow
                        label={t("business.detailModal.taxCode")}
                        value={showPlain.taxCode ? detail.taxCode : detail.taxCodeMasked || "—"}
                        mono
                        isSensitive={true}
                        showSensitive={showPlain.taxCode}
                        onToggle={() => toggleShowPlain("taxCode")}
                      />
                      <FieldRow
                        label={t("business.detailModal.idNumber")}
                        value={showPlain.idCard ? detail.idCardNumber : detail.idCardNumberMasked || "—"}
                        mono
                        isSensitive={true}
                        showSensitive={showPlain.idCard}
                        onToggle={() => toggleShowPlain("idCard")}
                      />
                      <FieldRow
                        label={t("business.detailModal.createdAt")}
                        value={
                          detail.createdAt
                            ? new Date(detail.createdAt).toLocaleString(i18n.language === "vi" ? "vi-VN" : "en-US")
                            : null
                        }
                      />
                      <FieldRow
                        label={`${t("business.detailModal.places")} · ${t("business.detailModal.services")} · ${t("business.detailModal.vouchers")} · ${t("business.detailModal.bookings")}`}
                        value={`${detail._count?.places ?? 0} · ${detail._count?.services ?? 0} · ${detail._count?.vouchers ?? 0} · ${detail._count?.bookings ?? 0}`}
                      />
                    </div>
                  </div>

                  <div className="border border-black bg-white p-4 space-y-1 rounded-none">
                    <p className="font-mono text-[10px] uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("business.detailModal.accountHolder")}
                    </p>
                    <div className="space-y-0">
                      <FieldRow label={t("business.detailModal.email")} value={detail.owner?.email} />
                      <FieldRow label={t("business.detailModal.ownerName")} value={detail.owner?.fullName} />
                      <FieldRow label={t("business.detailModal.bankName")} value={detail.bankName} />
                      <FieldRow
                        label={t("business.detailModal.bankAccount")}
                        value={showPlain.bankAccount ? detail.bankAccountNumber : detail.bankAccountNumberMasked || "—"}
                        mono
                        isSensitive={true}
                        showSensitive={showPlain.bankAccount}
                        onToggle={() => toggleShowPlain("bankAccount")}
                      />
                      <FieldRow
                        label={t("business.detailModal.accountHolder")}
                        value={showPlain.bankOwner ? detail.bankAccountOwner : detail.bankAccountOwnerMasked || "—"}
                        isSensitive={true}
                        showSensitive={showPlain.bankOwner}
                        onToggle={() => toggleShowPlain("bankOwner")}
                      />
                      <FieldRow
                        label={t("business.detailModal.contractStatus")}
                        value={
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-primary font-bold hover:underline flex items-center gap-1"
                            onClick={() => setPreviewPdfOpen(true)}
                          >
                            {detail.contractSigned ? "Đã ký (Xem PDF)" : "Chưa ký (Xem bản nháp)"}
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-black bg-white p-4 rounded-none">
                  <p className="font-mono text-[10px] uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {t("business.detailModal.places")}
                  </p>
                  {!Array.isArray(detail.places) ||
                  detail.places.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t("common.noData")}
                    </p>
                  ) : (
                    <ul className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {detail.places.map((p) => (
                        <li
                          key={p.id}
                          className="flex flex-wrap items-center justify-between gap-2 border border-black bg-white px-3 py-2 text-sm rounded-none"
                        >
                          <span className="font-medium truncate">{p.name}</span>
                          <Link
                            to={ADMIN_ROUTES.PLACES_EDIT(p.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0"
                            onClick={() => onOpenChange?.(false)}
                          >
                            {t("common.edit")}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-foreground">
                        {t("business.detailModal.documents")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("business.approveModal.confirmApprove")}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    <DocumentPreviewCard
                      title={t("business.detailModal.idFront")}
                      raw={detail.idCardFront}
                    />
                    <DocumentPreviewCard
                      title={t("business.detailModal.idBack")}
                      raw={detail.idCardBack}
                    />
                    <DocumentPreviewCard
                      title={t("business.detailModal.businessLicense")}
                      raw={detail.businessLicense}
                    />
                  </div>
                </div>

                {!rejectMode ? (
                  <>
                    <div className="border border-black bg-white p-4 space-y-3 rounded-none">
                      <Label
                        htmlFor="commission-rate"
                        className="text-sm font-medium"
                      >
                        Tỷ lệ hoa hồng (%)
                      </Label>
                      <Input
                        id="commission-rate"
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        className="max-w-[200px] rounded-none border-black font-mono"
                        autoComplete="off"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("business.approveModal.confirmApprove")}
                      </p>
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 border border-black bg-white p-4 hover:bg-muted/40 rounded-none">
                      <Checkbox
                        checked={acknowledged}
                        onCheckedChange={(c) => setAcknowledged(Boolean(c))}
                        className="mt-0.5"
                        id="ack-compare"
                      />
                      <span className="text-sm leading-relaxed">
                        <span className="font-bold text-foreground">
                          {t("business.approveModal.confirmApprove")}
                        </span>{" "}
                        Xác nhận thông tin hồ sơ doanh nghiệp đã khớp với các giấy tờ đính kèm.
                      </span>
                    </label>
                  </>
                ) : (
                  <div className="space-y-2 border border-red-500 bg-red-50/20 p-4 rounded-none">
                    <Label
                      htmlFor="reject-reason-admin"
                      className="font-medium"
                    >
                      {t("business.approveModal.rejectReason")}
                    </Label>
                    <Textarea
                      id="reject-reason-admin"
                      placeholder={t("business.approveModal.rejectReasonPlaceholder")}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="min-h-[120px] rounded-none border-black"
                    />
                  </div>
                )}
              </>
            );
          })()}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t-2 border-black bg-[#F4F4F4] p-4 sm:gap-3">
          {!rejectMode ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="rounded-none border-black font-mono text-[10px] uppercase"
                onClick={() => onOpenChange?.(false)}
                disabled={submitting}
              >
                {t("common.close")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="rounded-none font-mono text-[10px] uppercase"
                onClick={() => setRejectMode(true)}
                disabled={submitting || loading}
              >
                {t("business.approveModal.reject")}
              </Button>
              <Button
                type="button"
                className="rounded-none border-black font-mono text-[10px] uppercase gap-1.5"
                onClick={handleApprove}
                disabled={submitting || loading || !detail || !acknowledged}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {t("business.approveModal.approve")}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="rounded-none border-black font-mono text-[10px] uppercase"
                onClick={() => {
                  setRejectMode(false);
                  setRejectReason("");
                }}
                disabled={submitting}
              >
                {t("common.back")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="rounded-none font-mono text-[10px] uppercase"
                onClick={handleReject}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {t("business.approveModal.reject")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>

      <Dialog open={previewPdfOpen} onOpenChange={setPreviewPdfOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col gap-0 rounded-none border-2 border-black sm:rounded-none max-h-[90vh]">
          <div className="shrink-0 border-b-2 border-black bg-[#F4F4F4] px-5 py-4 text-left">
            <DialogHeader className="space-y-1">
              <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-tight text-base">
                <FileText className="h-5 w-5 shrink-0" aria-hidden="true" />
                {t("business.documents.contractPreview")}
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto p-5 bg-white min-h-[60vh] flex flex-col justify-stretch">
            {previewPdfOpen && (
              <ContractPdfViewer
                businessId={businessId}
                className="w-full flex-1"
                adminSigned={acknowledged}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default BusinessReviewApproveModal;
