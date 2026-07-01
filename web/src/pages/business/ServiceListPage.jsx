import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import {
  Ticket,
  Plus,
  Pencil,
  Trash2,
  Search,
  AlertTriangle,
  Clock,
  Tag,
  Users,
  CalendarCheck,
  Image as ImageIcon,
} from "lucide-react";
import * as businessOfferingApi from "@/apis/businessOfferingApi";
import { getMyPlaces } from "@/apis/businessApi";
import { SERVICE_TYPE_LABELS } from "@/constants/businessConstants";
import {
  PageNav,
} from "@/components/business/DashboardWidgets";
import {
  BusinessSectionCard,
  BusinessPageHeader,
  BusinessEmptyState,
  BusinessStatCard,
  BusinessStatCardSkeleton,
  BusinessFilterBar,
} from "@/components/business/ui";
import { formatVND } from "@/components/business/dashboardWidgetHelpers";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import FileUploader from "@/components/business/FileUploader";
import { cn } from "@/lib/utils";

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => {
      toast.error("Không thể đọc tệp ảnh");
      reject(new Error("Không thể đọc tệp ảnh"));
    };
    reader.readAsDataURL(file);
  });

const filesToDataUrls = async (files = []) => {
  const results = await Promise.all(
    files.map((file) => readFileAsDataUrl(file)),
  );
  return results.filter(Boolean);
};

const buildInitialServiceForm = (service, initialPlaceId = "") => ({
  name: service?.name || "",
  description: service?.description || "",
  serviceType: service?.serviceType || "service",
  price: service?.price || 0,
  discountPrice: service?.discountPrice || "",
  duration: service?.duration || "",
  maxCapacity: service?.maxCapacity || "",
  placeId: initialPlaceId,
  isActive: service?.isActive ?? true,
  requireDeposit: service?.requireDeposit ?? false,
  depositType: service?.depositType || "PERCENT",
  depositAmount:
    service?.depositAmount !== null && service?.depositAmount !== undefined
      ? String(service.depositAmount)
      : "",
  depositRefundable: service?.depositRefundable ?? true,
  depositRefundPercent:
    service?.depositRefundPercent !== null &&
    service?.depositRefundPercent !== undefined
      ? String(service.depositRefundPercent)
      : "50",
});

// ─── Service Form Modal ─────────────────────────────────────────────────────

const ServiceFormModal = ({
  open,
  service,
  places = [],
  initialPlaceId = "",
  onSave,
  onClose,
}) => {
  const { t } = useTranslation();
  let initialFormPlaceId = "";
  if (service?.place?.id) {
    initialFormPlaceId = String(service.place.id);
  } else if (initialPlaceId) {
    initialFormPlaceId = String(initialPlaceId);
  }

  const [form, setForm] = useState(() =>
    buildInitialServiceForm(service, initialFormPlaceId),
  );
  const [saving, setSaving] = useState(false);
  const [thumbnailFiles, setThumbnailFiles] = useState([]);
  const [galleryFiles, setGalleryFiles] = useState([]);

  useEffect(() => {
    if (!open) return;
    setForm(buildInitialServiceForm(service, initialFormPlaceId));
    setThumbnailFiles([]);
    setGalleryFiles([]);
  }, [open, service, initialFormPlaceId]);

  const effectivePrice = Number(form.discountPrice || form.price || 0);
  const depositPreview = useMemo(() => {
    if (!form.requireDeposit) return null;

    const amount = Number(form.depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) return null;

    if (form.depositType === "PERCENT") {
      return Math.round((effectivePrice * amount) / 100);
    }

    return Math.round(amount);
  }, [
    form.requireDeposit,
    form.depositAmount,
    form.depositType,
    effectivePrice,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        duration: form.duration ? Number(form.duration) : null,
        maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : null,
        placeId: form.placeId ? Number(form.placeId) : undefined,
        requireDeposit: !!form.requireDeposit,
        depositType: form.requireDeposit ? form.depositType : null,
        depositAmount:
          form.requireDeposit && form.depositAmount !== ""
            ? Number(form.depositAmount)
            : null,
        depositRefundable: form.requireDeposit
          ? !!form.depositRefundable
          : true,
        depositRefundPercent:
          form.requireDeposit && form.depositRefundable
            ? Number(form.depositRefundPercent || 50)
            : null,
      };

      if (thumbnailFiles.length > 0) {
        data.thumbnail = await readFileAsDataUrl(thumbnailFiles[0]);
      }

      if (galleryFiles.length > 0) {
        data.images = await filesToDataUrls(galleryFiles);
      }

      await onSave(data);
      onClose();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("common.operationFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            {service ? "Chỉnh sửa dịch vụ" : "Tạo dịch vụ mới"}
          </DialogTitle>
          <DialogDescription>
            Điền thông tin dịch vụ bên dưới
          </DialogDescription>
        </DialogHeader>

        <form
          id="service-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto space-y-6 py-4 pr-1"
        >
          {/* Group 1: Basic Info */}
          <fieldset className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/30 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
            <legend className="text-sm font-bold text-zinc-950 dark:text-zinc-100 flex items-center gap-2 px-1">
              <Ticket className="h-4 w-4 text-zinc-500" />
              Thông tin cơ bản
            </legend>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="svc-name">
                  Tên dịch vụ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="svc-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  minLength={2}
                  placeholder="Nhập tên dịch vụ"
                  className="bg-white dark:bg-zinc-950"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="svc-desc">Mô tả</Label>
                <Textarea
                  id="svc-desc"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Nhập mô tả chi tiết về dịch vụ..."
                  className="min-h-[80px] bg-white dark:bg-zinc-950"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="svc-place">
                    {t("business.places.title")} <span className="text-destructive">*</span>
                  </Label>
                  {places.length === 0 ? (
                    <div className="flex items-center gap-2 h-10 border border-destructive/50 rounded-md px-3 bg-destructive/5 text-sm text-destructive">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {t("business.places.noPlacesYet")}
                    </div>
                  ) : (
                    <Select
                      value={form.placeId}
                      onValueChange={(v) => setForm({ ...form, placeId: v })}
                      required
                    >
                      <SelectTrigger id="svc-place" className="bg-white dark:bg-zinc-950">
                        <SelectValue placeholder={t("business.bookings.allPlaces")} />
                      </SelectTrigger>
                      <SelectContent>
                        {places.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Loại dịch vụ</Label>
                  <Select
                    value={form.serviceType}
                    onValueChange={(v) => setForm({ ...form, serviceType: v })}
                  >
                    <SelectTrigger className="bg-white dark:bg-zinc-950">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Group 2: Pricing & Duration */}
          <fieldset className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/30 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
            <legend className="text-sm font-bold text-zinc-950 dark:text-zinc-100 flex items-center gap-2 px-1">
              <Clock className="h-4 w-4 text-zinc-500" />
              Thiết lập giá & Quy mô
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="svc-price">
                  Giá bán (VND) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="svc-price"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  min="0"
                  required
                  className="bg-white dark:bg-zinc-950"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="svc-discount">Giá khuyến mãi (VND)</Label>
                <Input
                  id="svc-discount"
                  type="number"
                  value={form.discountPrice}
                  onChange={(e) =>
                    setForm({ ...form, discountPrice: e.target.value })
                  }
                  min="0"
                  placeholder={t("common.optional")}
                  className="bg-white dark:bg-zinc-950"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="svc-duration">Thời lượng</Label>
                <Select
                  value={form.duration ? String(form.duration) : "60"}
                  onValueChange={(v) => setForm({ ...form, duration: v })}
                >
                  <SelectTrigger id="svc-duration" className="bg-white dark:bg-zinc-950">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 phút</SelectItem>
                    <SelectItem value="30">30 phút</SelectItem>
                    <SelectItem value="45">45 phút</SelectItem>
                    <SelectItem value="60">1 giờ (60 phút)</SelectItem>
                    <SelectItem value="90">1.5 giờ (90 phút)</SelectItem>
                    <SelectItem value="120">2 giờ (120 phút)</SelectItem>
                    <SelectItem value="180">3 giờ (180 phút)</SelectItem>
                    <SelectItem value="240">4 giờ (240 phút)</SelectItem>
                    <SelectItem value="360">6 giờ (360 phút)</SelectItem>
                    <SelectItem value="1440">Cả ngày (24 giờ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="svc-capacity">Sức chứa tối đa</Label>
                <Select
                  value={form.maxCapacity ? String(form.maxCapacity) : "unlimited"}
                  onValueChange={(v) => setForm({ ...form, maxCapacity: v === "unlimited" ? "" : v })}
                >
                  <SelectTrigger id="svc-capacity" className="bg-white dark:bg-zinc-950">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unlimited">Không giới hạn</SelectItem>
                    <SelectItem value="1">1 người (Cá nhân)</SelectItem>
                    <SelectItem value="2">2 người</SelectItem>
                    <SelectItem value="5">Nhóm nhỏ (Tối đa 5 người)</SelectItem>
                    <SelectItem value="10">Nhóm trung bình (Tối đa 10 người)</SelectItem>
                    <SelectItem value="20">Nhóm lớn (Tối đa 20 người)</SelectItem>
                    <SelectItem value="50">Sự kiện nhỏ (Tối đa 50 người)</SelectItem>
                    <SelectItem value="100">Sự kiện lớn (Tối đa 100 người)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </fieldset>

          {/* Group 3: Deposit Settings */}
          <fieldset className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/30 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
            <legend className="text-sm font-bold text-zinc-950 dark:text-zinc-100 flex items-center gap-2 px-1">
              <CalendarCheck className="h-4 w-4 text-zinc-500" />
              Đặt cọc & Đảm bảo
            </legend>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white border border-zinc-150 dark:bg-zinc-950 dark:border-zinc-800 shadow-sm">
                <div>
                  <Label htmlFor="svc-require-deposit" className="font-semibold cursor-pointer">
                    Yêu cầu khách hàng đặt cọc trước
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hạn chế việc khách hủy đặt chỗ không báo trước
                  </p>
                </div>
                <Checkbox
                  id="svc-require-deposit"
                  checked={form.requireDeposit}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, requireDeposit: !!checked })
                  }
                />
              </div>

              {form.requireDeposit && (
                <div className="space-y-4 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Loại đặt cọc</Label>
                      <Select
                        value={form.depositType}
                        onValueChange={(v) => setForm({ ...form, depositType: v })}
                      >
                        <SelectTrigger className="bg-white dark:bg-zinc-950">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENT">Theo phần trăm (%)</SelectItem>
                          <SelectItem value="FIXED">Số tiền cố định (VND)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="svc-deposit-amount">
                        {form.depositType === "PERCENT"
                          ? "Phần trăm đặt cọc (%)"
                          : "Số tiền đặt cọc (VND)"}
                      </Label>
                      <Input
                        id="svc-deposit-amount"
                        type="number"
                        min="0"
                        max={form.depositType === "PERCENT" ? "100" : undefined}
                        value={form.depositAmount}
                        onChange={(e) =>
                          setForm({ ...form, depositAmount: e.target.value })
                        }
                        placeholder={form.depositType === "PERCENT" ? "30" : "200000"}
                        className="bg-white dark:bg-zinc-950"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-1.5">
                      <Label htmlFor="svc-refundable">Chính sách hoàn cọc</Label>
                      <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 h-10 dark:border-zinc-800 dark:bg-zinc-950">
                        <Checkbox
                          id="svc-refundable"
                          checked={form.depositRefundable}
                          onCheckedChange={(checked) =>
                            setForm({ ...form, depositRefundable: !!checked })
                          }
                        />
                        <Label htmlFor="svc-refundable" className="cursor-pointer text-sm">
                          Cho phép hoàn cọc
                        </Label>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="svc-refund-percent">Phần trăm hoàn trả (%)</Label>
                      <Input
                        id="svc-refund-percent"
                        type="number"
                        min="0"
                        max="100"
                        disabled={!form.depositRefundable}
                        value={form.depositRefundPercent}
                        onChange={(e) =>
                          setForm({ ...form, depositRefundPercent: e.target.value })
                        }
                        placeholder="50"
                        className="bg-white dark:bg-zinc-950"
                      />
                    </div>
                  </div>

                  {depositPreview != null && (
                    <div className="text-xs rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 flex justify-between items-center dark:bg-emerald-950/30 dark:border-emerald-900/30 dark:text-emerald-400">
                      <span>Mức tiền đặt cọc tính toán dự kiến:</span>
                      <span className="font-bold text-sm">{formatVND(depositPreview)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </fieldset>

          {/* Group 4: Media Uploads */}
          <fieldset className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/30 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
            <legend className="text-sm font-bold text-zinc-950 dark:text-zinc-100 flex items-center gap-2 px-1">
              <ImageIcon className="h-4 w-4 text-zinc-500" />
              Hình ảnh & Thư viện
            </legend>
            <div className="space-y-4">
              <div className="space-y-3">
                <FileUploader
                  label="Ảnh đại diện dịch vụ"
                  hint={t("common.optional")}
                  maxFiles={1}
                  maxFileSize={5 * 1024 * 1024}
                  acceptTypes={["image/jpeg", "image/png", "image/webp"]}
                  value={thumbnailFiles}
                  onChange={setThumbnailFiles}
                  disabled={saving}
                />
                {!thumbnailFiles.length && !!service?.thumbnail && (
                  <div className="rounded-lg border border-zinc-200 p-3 bg-white dark:bg-zinc-950 dark:border-zinc-800">
                    <p className="text-[11px] text-muted-foreground mb-1.5">Ảnh đại diện hiện tại</p>
                    <img
                      src={service.thumbnail}
                      alt={service.name || "thumbnail"}
                      className="h-28 w-full object-cover rounded-md border"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <FileUploader
                  label="Thư viện ảnh chi tiết"
                  hint={t("common.optional")}
                  maxFiles={6}
                  maxFileSize={5 * 1024 * 1024}
                  acceptTypes={["image/jpeg", "image/png", "image/webp"]}
                  value={galleryFiles}
                  onChange={setGalleryFiles}
                  disabled={saving}
                />
                {!galleryFiles.length &&
                  Array.isArray(service?.images) &&
                  service.images.length > 0 && (
                    <div className="rounded-lg border border-zinc-200 p-3 bg-white dark:bg-zinc-950 dark:border-zinc-800">
                      <p className="text-[11px] text-muted-foreground mb-2">
                        Ảnh hiện tại trong thư viện ({service.images.length})
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {service.images.slice(0, 6).map((image, idx) => (
                          <img
                            key={`${idx}-${image.slice(0, 24)}`}
                            src={image}
                            alt="Gallery preview"
                            className="h-20 w-full object-cover rounded-md border"
                          />
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </fieldset>

          {/* Active status */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 border border-zinc-150 shadow-sm dark:bg-zinc-900/30 dark:border-zinc-800">
            <Checkbox
              id="svc-active"
              checked={form.isActive}
              onCheckedChange={(checked) =>
                setForm({ ...form, isActive: !!checked })
              }
            />
            <Label htmlFor="svc-active" className="cursor-pointer font-medium">
              {t("common.active")}
            </Label>
          </div>
        </form>

        <DialogFooter className="shrink-0 gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="service-form" disabled={saving}>
            {saving ? t("common.processing") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────

const ConfirmDeleteModal = ({ name, open, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            {t("common.confirmDelete")}
          </DialogTitle>
          <DialogDescription>
            {t("common.confirmDelete")}{" "}
            <span className="font-semibold text-foreground">"{name}"</span>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Service Item ─────────────────────────────────────────────────────────────

const ServiceItem = memo(({ svc, onEdit, onDelete }) => {
  const { t } = useTranslation();
  return (
    <div className="[content-visibility:auto] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-b border-border/60 last:border-0 group hover:bg-muted/30 px-1 -mx-1 rounded-lg transition-colors">
      <div className="flex-1 min-w-0 flex items-start gap-3">
        <div className="h-14 w-14 rounded-lg border border-border/60 overflow-hidden bg-muted shrink-0 flex items-center justify-center">
          {svc.thumbnail ? (
            <img
              src={svc.thumbnail}
              alt={svc.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground text-sm leading-tight">
              {svc.name}
            </h3>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {SERVICE_TYPE_LABELS[svc.serviceType] || svc.serviceType}
            </span>
            {!svc.isActive && (
              <Badge
                variant="outline"
                className="text-[10px] text-destructive border-destructive/30"
              >
                {t("common.inactive")}
              </Badge>
            )}
            {svc.requireDeposit && (
              <Badge variant="secondary" className="text-[10px]">
                Đặt cọc
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1 font-semibold">
              {svc.discountPrice ? (
                <>
                  <span className="line-through text-muted-foreground/60">
                    {formatVND(svc.price)}
                  </span>
                  <span className="text-emerald-600">
                    {formatVND(svc.discountPrice)}
                  </span>
                </>
              ) : (
                <span className="text-foreground">{formatVND(svc.price)}</span>
              )}
            </div>
            {svc.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {svc.duration} phút
              </div>
            )}
            {svc.maxCapacity && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {svc.maxCapacity} khách
              </div>
            )}
            {svc._count?.bookings > 0 && (
              <div className="flex items-center gap-1">
                <CalendarCheck className="h-3 w-3" />
                {svc._count.bookings} {t("business.bookings.bookings")}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 md:h-8 md:w-8 p-0 min-h-[44px] md:min-h-0"
          aria-label={`${t("common.edit")} ${svc.name}`}
          onClick={() => onEdit(svc)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 md:h-8 md:w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[44px] md:min-h-0"
          aria-label={`${t("common.delete")} ${svc.name}`}
          onClick={() => onDelete(svc)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
});
ServiceItem.displayName = "ServiceItem";

// ─── Place Overview Card ─────────────────────────────────────────────────────

const PlaceOverviewCard = memo(({ item, isSelected, onClick }) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border border-zinc-200/80 bg-white p-4 text-left w-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 min-h-[44px]",
        isSelected && "ring-2 ring-zinc-950 border-zinc-950/50",
      )}
    >
      <p className="font-semibold text-sm text-foreground truncate">
        {item.placeName}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>
          {t("business.places.total")}: <strong className="text-foreground">{item.total}</strong>
        </span>
        <span>
          {t("common.active")}:{" "}
          <strong className="text-emerald-600">{item.activeCount}</strong>
        </span>
        <span>
          Giảm giá:{" "}
          <strong className="text-amber-600">{item.discountedCount}</strong>
        </span>
        <span>
          {t("business.bookings.bookings")}: <strong className="text-blue-600">{item.bookingCount}</strong>
        </span>
      </div>
    </button>
  );
});
PlaceOverviewCard.displayName = "PlaceOverviewCard";

// ─── PAGE SIZE ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ─── Main Page ────────────────────────────────────────────────────────────────

const ServiceListPage = () => {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editService, setEditService] = useState(null);
  const [draftPlaceId, setDraftPlaceId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [expandedPlaces, setExpandedPlaces] = useState({});

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await businessOfferingApi.getAll({
        search,
        page,
        limit: PAGE_SIZE,
        ...(selectedPlaceId !== "all" && { placeId: selectedPlaceId }),
      });
      setServices(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || 0);
    } catch {
      toast.error(t("business.services.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [search, page, selectedPlaceId, t]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);
  useEffect(() => {
    getMyPlaces()
      .then((res) => setPlaces(res.data || []))
      .catch(() => {});
  }, []);
  useEffect(() => {
    setPage(1);
  }, [search, selectedPlaceId]);

  const groupedServices = useMemo(() => {
    return services.reduce((acc, svc) => {
      const key = svc.place?.id || "none";
      const label = svc.place?.name || t("business.places.noPlacesYet");
      if (!acc[key]) acc[key] = { label, items: [] };
      acc[key].items.push(svc);
      return acc;
    }, {});
  }, [services, t]);

  const placeOverview = useMemo(() => {
    return Object.entries(groupedServices).map(([placeKey, group]) => {
      const activeCount = group.items.filter((i) => i.isActive).length;
      const discountedCount = group.items.filter((i) => i.discountPrice).length;
      const bookingCount = group.items.reduce(
        (s, i) => s + (i._count?.bookings || 0),
        0,
      );
      return {
        placeKey,
        placeName: group.label,
        total: group.items.length,
        activeCount,
        discountedCount,
        bookingCount,
      };
    });
  }, [groupedServices]);

  const handleCreate = useCallback(async (data) => {
    await businessOfferingApi.create(data);
    toast.success(t("business.services.createSuccess"));
    loadServices();
  }, [t, loadServices]);

  const handleUpdate = useCallback(async (data) => {
    await businessOfferingApi.update(editService.id, data);
    toast.success(t("business.services.updateSuccess"));
    setEditService(null);
    loadServices();
  }, [editService, t, loadServices]);

  const handleDeleteConfirmed = useCallback(async () => {
    const { id } = confirmDelete;
    setConfirmDelete(null);
    try {
      await businessOfferingApi.remove(id);
      toast.success(t("business.services.deleteSuccess"));
      if (services.length === 1 && page > 1) setPage((p) => p - 1);
      else loadServices();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("common.operationFailed"));
    }
  }, [confirmDelete, services.length, page, t, loadServices]);

  const openCreate = useCallback((placeKey) => {
    setEditService(null);
    setDraftPlaceId(placeKey && placeKey !== "none" ? String(placeKey) : "");
    setShowForm(true);
  }, []);

  const openEdit = useCallback((svc) => {
    setEditService(svc);
    setDraftPlaceId("");
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditService(null);
    setDraftPlaceId("");
  }, []);

  // Stat summary
  const totalActive = services.filter((s) => s.isActive).length;
  const totalDiscounted = services.filter((s) => s.discountPrice).length;

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <BusinessPageHeader
        title={t("business.services.title")}
        description={t("business.services.subtitle")}
        badge={total > 0 ? total : undefined}
        action={
          <Button
            onClick={() => openCreate("")}
            className="gap-2 bg-zinc-950 text-white hover:bg-zinc-900"
          >
            <Plus className="h-4 w-4" />
            Tạo dịch vụ
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <BusinessStatCardSkeleton key={i} />)
        ) : (
          <>
            <BusinessStatCard
              title={t("business.services.title")}
              value={total}
              icon={Ticket}
              iconColor="blue"
            />
            <BusinessStatCard
              title={t("common.active")}
              value={totalActive}
              icon={CalendarCheck}
              iconColor="emerald"
            />
            <BusinessStatCard
              title="Giảm giá"
              value={totalDiscounted}
              icon={Tag}
              iconColor="amber"
            />
            <BusinessStatCard
              title={t("business.places.title")}
              value={places.length}
              icon={Users}
              iconColor="violet"
            />
          </>
        )}
      </div>

      {/* Place Overview */}
      {!loading && placeOverview.length > 0 && (
        <BusinessSectionCard title={t("business.services.title")} titleIcon={Ticket}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {placeOverview.map((item) => (
              <PlaceOverviewCard
                key={item.placeKey}
                item={item}
                isSelected={selectedPlaceId === String(item.placeKey)}
                onClick={() =>
                  setSelectedPlaceId((prev) => {
                    const nextPlaceKey = String(item.placeKey);
                    if (prev === nextPlaceKey) return "all";
                    if (item.placeKey === "none") return "all";
                    return nextPlaceKey;
                  })
                }
              />
            ))}
          </div>
        </BusinessSectionCard>
      )}

      {/* Toolbar + List */}
      <BusinessFilterBar
        searchPlaceholder={t("common.search")}
        onSearch={setSearch}
        value={search}
      >
        <Select value={selectedPlaceId} onValueChange={setSelectedPlaceId}>
          <SelectTrigger className="h-9 text-xs w-full sm:w-44 border-zinc-200">
            <SelectValue placeholder={t("business.bookings.allPlaces")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("business.bookings.allPlaces")}</SelectItem>
            {places.map((place) => (
              <SelectItem key={place.id} value={String(place.id)}>
                {place.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </BusinessFilterBar>

      <BusinessSectionCard title={t("business.services.list")} titleIcon={Ticket}>
        {(() => {
          if (loading) {
            return (
              <div className="space-y-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 py-4 border-b border-border/50 last:border-0"
                  >
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-16 rounded-md" />
                  </div>
                ))}
              </div>
            );
          }

          if (services.length === 0) {
            return (
              <BusinessEmptyState
                icon={Ticket}
                message="Chưa có dịch vụ"
                action={
                  <Button
                    size="sm"
                    onClick={() => openCreate("")}
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> {t("common.create")}
                  </Button>
                }
              />
            );
          }

          return (
            <div className="space-y-0">
              {Object.entries(groupedServices).map(([placeKey, group]) => (
                <div key={placeKey}>
                  {/* Place Group Header */}
                  <div
                    className="flex items-center justify-between py-2 mb-1 cursor-pointer"
                    onClick={() =>
                      setExpandedPlaces((prev) => ({
                        ...prev,
                        [placeKey]: !(prev[placeKey] ?? true),
                      }))
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {group.label}
                      </span>
                      <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-medium">
                        {group.items.length} dịch vụ
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCreate(placeKey);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                      {t("common.add")}
                    </Button>
                  </div>

                  {(expandedPlaces[placeKey] ?? true) && (
                    <div className="pl-2 border-l-2 border-border/60 ml-1 mb-4">
                      {group.items.map((svc) => (
                        <ServiceItem
                          key={svc.id}
                          svc={svc}
                          onEdit={openEdit}
                          onDelete={(s) =>
                            setConfirmDelete({ id: s.id, name: s.name })
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}

        {!loading && totalPages > 1 && (
          <>
            <div className="border-t border-border/60 mt-2 pt-2">
              <PageNav
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </BusinessSectionCard>

      {/* Modals */}
      <ServiceFormModal
        open={showForm}
        service={editService}
        places={places}
        initialPlaceId={draftPlaceId}
        onSave={editService ? handleUpdate : handleCreate}
        onClose={closeForm}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.name}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default ServiceListPage;
