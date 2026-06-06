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

const FieldRow = ({ label, value, mono }) => (
  <div className="flex flex-col sm:flex-row sm:gap-3 sm:justify-between py-2.5 border-b border-border/40 last:border-0 first:pt-0 text-sm">
    <span className="text-muted-foreground shrink-0 w-44">{label}</span>
    <span
      className={cn(
        "font-medium text-foreground text-right sm:text-left flex-1 break-words",
        mono && "font-mono text-xs",
      )}
    >
      {value !== undefined && value !== null && value !== ""
        ? String(value)
        : "—"}
    </span>
  </div>
);

/**
 * Thẻ xem nhanh giấy tờ: hỗ trợ URL https, data URI ảnh/PDF, đường dẫn /... ghép origin API.
 */
function DocumentPreviewCard({ title, raw }) {
  const resolved = useMemo(() => resolveMediaUrl(raw), [raw]);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setImgError(false));
    return () => cancelAnimationFrame(id);
  }, [resolved]);

  const isPdf = resolved && isPdfSource(resolved);
  const isImgHint = resolved && isImageSource(resolved);

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
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-md ring-1 ring-black/[0.04] dark:ring-white/10">
      <div className="flex items-center justify-between gap-2 rounded-t-2xl border-b border-border/40 bg-gradient-to-r from-muted/60 to-muted/30 px-4 py-3">
        <p className="truncate text-sm font-semibold text-foreground">
          {title}
        </p>
        <a
          href={resolved}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 text-xs font-medium text-primary shadow-sm ring-1 ring-border/60 transition hover:bg-muted"
        >
          {t("common.viewAll")}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>

      <div className="flex min-h-[220px] flex-1 items-center justify-center rounded-b-2xl bg-muted/20 p-3">
        {(() => {
          if (isPdf) {
            return (
              <div className="w-full space-y-2">
                <iframe
                  title={title}
                  src={resolved}
                  className="h-[min(42vh,300px)] w-full rounded-xl border border-border/50 bg-background shadow-inner"
                />
                <p className="text-center text-[11px] leading-snug text-muted-foreground">
                  {t("common.noData")}
                </p>
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
                    className="max-h-[min(44vh,380px)] w-full rounded-xl border border-border/30 bg-background object-contain shadow-sm"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/70" />
                    <p className="text-xs text-muted-foreground">
                      {t("common.noData")}
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={resolved}
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
              <FileText className="h-10 w-10 text-muted-foreground/70" />
              <p className="text-xs text-muted-foreground">
                {t("common.noData")}
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href={resolved} target="_blank" rel="noopener noreferrer">
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

  useEffect(() => {
    if (!open || !businessId) return;
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
        className={cn(
          "max-h-[min(92vh,920px)] max-w-4xl gap-0 overflow-hidden p-0 flex flex-col",
          "rounded-3xl border-border/50 shadow-2xl ring-1 ring-black/[0.06] dark:ring-white/[0.08]",
          "sm:rounded-3xl",
        )}
      >
        <div className="shrink-0 rounded-t-3xl border-b border-border/40 bg-gradient-to-br from-muted/70 via-muted/40 to-background px-6 pb-4 pt-7">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-3 pr-10 text-xl font-semibold tracking-tight">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5 shrink-0" aria-hidden="true" />
              </span>
              {t("business.approveModal.title")}
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed">
              {t("business.approveModal.confirmApprove")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-5 space-y-6">
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
                  <div className="rounded-2xl border border-border/50 bg-muted/30 p-5 shadow-sm">
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t("business.detailModal.businessName")}
                    </p>
                    <div className="space-y-0">
                      <FieldRow
                        label={t("business.detailModal.businessName")}
                        value={detail.businessName}
                      />
                      <FieldRow label={t("business.detailModal.businessName")} value={typeLabel} />
                      <FieldRow
                        label={t("business.detailModal.taxCode")}
                        value={detail.taxCode}
                        mono
                      />
                      <FieldRow
                        label={t("business.detailModal.idNumber")}
                        value={detail.idCardNumberMasked || detail.idCardNumber}
                        mono
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

                  <div className="rounded-2xl border border-border/50 bg-muted/30 p-5 shadow-sm">
                    <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-background shadow-sm">
                        <User className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      {t("business.detailModal.accountHolder")}
                    </p>
                    <div className="space-y-0">
                      <FieldRow label={t("business.detailModal.email")} value={detail.owner?.email} />
                      <FieldRow label={t("business.detailModal.ownerName")} value={detail.owner?.fullName} />
                      <FieldRow label={t("business.detailModal.bankName")} value={detail.bankName} />
                      <FieldRow
                        label={t("business.detailModal.bankAccount")}
                        value={
                          detail.bankAccountNumberMasked ||
                          detail.bankAccountNumber
                        }
                        mono
                      />
                      <FieldRow
                        label={t("business.detailModal.accountHolder")}
                        value={
                          detail.bankAccountOwnerMasked ||
                          detail.bankAccountOwner
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/50 bg-muted/20 p-5 shadow-sm">
                  <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
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
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/40 bg-background/80 px-3 py-2 text-sm"
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
                    <div className="rounded-2xl border border-border/50 bg-muted/25 p-5 shadow-sm space-y-3">
                      <Label
                        htmlFor="commission-rate"
                        className="text-sm font-medium"
                      >
                        {t("business.approveModal.title")}
                      </Label>
                      <Input
                        id="commission-rate"
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        className="max-w-[200px] rounded-xl border-border/60 font-mono"
                        autoComplete="off"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("business.approveModal.confirmApprove")}
                      </p>
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/60 bg-background/50 p-4 transition-colors hover:bg-muted/40">
                      <Checkbox
                        checked={acknowledged}
                        onCheckedChange={(c) => setAcknowledged(Boolean(c))}
                        className="mt-0.5"
                        id="ack-compare"
                      />
                      <span className="text-sm leading-relaxed">
                        <span className="font-medium text-foreground">
                          {t("business.approveModal.confirmApprove")}
                        </span>{" "}
                        {t("business.approveModal.confirmApprove")}
                      </span>
                    </label>
                  </>
                ) : (
                  <div className="space-y-2 rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-4">
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
                      className="min-h-[120px] rounded-xl border-border/60"
                    />
                  </div>
                )}
              </>
            );
          })()}
        </div>

        <DialogFooter className="shrink-0 gap-2 rounded-b-3xl border-t border-border/40 bg-gradient-to-t from-muted/50 to-background p-4 sm:gap-3 sm:p-6 sm:pt-5">
          {!rejectMode ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange?.(false)}
                disabled={submitting}
              >
                {t("common.close")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setRejectMode(true)}
                disabled={submitting || loading}
              >
                {t("business.approveModal.reject")}
              </Button>
              <Button
                type="button"
                onClick={handleApprove}
                disabled={submitting || loading || !detail || !acknowledged}
                className="gap-1.5"
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
    </Dialog>
  );
};

export default BusinessReviewApproveModal;
