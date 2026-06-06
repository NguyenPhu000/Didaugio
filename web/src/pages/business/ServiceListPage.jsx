import { useEffect, useState, useCallback, useMemo } from "react";
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
  SectionCard,
  PageHeader,
  EmptyState,
  PageNav,
  StatCard,
  StatCardSkeleton,
  SectionCardSkeleton,
  TableRowSkeleton,
} from "@/components/business/DashboardWidgets";
import {
  DESIGN,
  formatVND,
} from "@/components/business/dashboardWidgetHelpers";
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
    reader.onerror = () => reject(new Error("Không thể đọc tệp ảnh"));
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
            {service ? t("business.services.updateSuccess") : t("business.services.createSuccess")}
          </DialogTitle>
          <DialogDescription>
            {t("common.submit")}
          </DialogDescription>
        </DialogHeader>

        <form
          id="service-form"
          onSubmit={handleSubmit}
          className="space-y-4 overflow-y-auto py-2 pr-1"
        >
          <div className="space-y-1.5">
            <Label htmlFor="svc-name">
              {t("business.services.title")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="svc-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              minLength={2}
              placeholder={t("business.services.title")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="svc-desc">{t("common.edit")}</Label>
            <Textarea
              id="svc-desc"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder={t("business.services.title")}
              className="min-h-[80px]"
            />
          </div>

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
                <SelectTrigger id="svc-place">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("business.services.title")}</Label>
              <Select
                value={form.serviceType}
                onValueChange={(v) => setForm({ ...form, serviceType: v })}
              >
                <SelectTrigger>
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

            <div className="space-y-1.5">
              <Label htmlFor="svc-price">
                {t("business.revenue.totalRevenue")} (VND) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="svc-price"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                min="0"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="svc-discount">{t("business.revenue.totalRevenue")} (VND)</Label>
              <Input
                id="svc-discount"
                type="number"
                value={form.discountPrice}
                onChange={(e) =>
                  setForm({ ...form, discountPrice: e.target.value })
                }
                min="0"
                placeholder={t("common.optional")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="svc-duration">{t("business.schedule.title")}</Label>
              <Input
                id="svc-duration"
                type="number"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                min="1"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="svc-capacity">{t("business.bookings.guests")}</Label>
              <Input
                id="svc-capacity"
                type="number"
                value={form.maxCapacity}
                onChange={(e) =>
                  setForm({ ...form, maxCapacity: e.target.value })
                }
                min="1"
                placeholder={t("common.optional")}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border/60 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="svc-require-deposit" className="font-medium">
                  {t("business.services.title")}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("common.optional")}
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

            {form.requireDeposit ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t("business.services.title")}</Label>
                  <Select
                    value={form.depositType}
                    onValueChange={(v) => setForm({ ...form, depositType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENT">
                        {t("business.services.title")}
                      </SelectItem>
                      <SelectItem value="FIXED">
                        {t("business.services.title")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="svc-deposit-amount">
                    {form.depositType === "PERCENT"
                      ? t("business.services.title")
                      : t("business.services.title")}
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
                    placeholder={
                      form.depositType === "PERCENT"
                        ? "30"
                        : "200000"
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="svc-refundable">{t("business.services.title")}</Label>
                  <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                    <Checkbox
                      id="svc-refundable"
                      checked={form.depositRefundable}
                      onCheckedChange={(checked) =>
                        setForm({ ...form, depositRefundable: !!checked })
                      }
                    />
                    <Label htmlFor="svc-refundable" className="cursor-pointer">
                      {t("business.services.title")}
                    </Label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="svc-refund-percent">{t("business.services.title")}</Label>
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
                  />
                </div>
              </div>
            ) : null}

            {form.requireDeposit && depositPreview != null ? (
              <div className="text-xs rounded-md bg-primary/10 border border-primary/20 px-3 py-2">
                <span className="text-muted-foreground">
                  {t("business.services.title")}
                </span>
                <span className="font-semibold text-foreground">
                  {formatVND(depositPreview)}
                </span>
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <FileUploader
              label={t("business.services.title")}
              hint={t("common.optional")}
              maxFiles={1}
              maxFileSize={5 * 1024 * 1024}
              acceptTypes={["image/jpeg", "image/png", "image/webp"]}
              value={thumbnailFiles}
              onChange={setThumbnailFiles}
              disabled={saving}
            />
            {!thumbnailFiles.length && !!service?.thumbnail && (
              <div className="rounded-lg border border-border/60 p-2">
                <p className="text-[11px] text-muted-foreground mb-1">
                  {t("business.services.title")}
                </p>
                <img
                  src={service.thumbnail}
                  alt={service.name || "thumbnail"}
                  className="h-28 w-full object-cover rounded-md"
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <FileUploader
              label={t("business.services.title")}
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
                <div className="rounded-lg border border-border/60 p-2">
                  <p className="text-[11px] text-muted-foreground mb-2">
                    {t("business.services.title")} ({service.images.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {service.images.slice(0, 6).map((image, idx) => (
                      <img
                        key={`${idx}-${image.slice(0, 24)}`}
                        src={image}
                        alt={`service-${idx + 1}`}
                        className="h-20 w-full object-cover rounded-md"
                      />
                    ))}
                  </div>
                </div>
              )}
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
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

const ServiceItem = ({ svc, onEdit, onDelete }) => {
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
                {t("business.services.title")}
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
                {svc.duration} {t("business.schedule.title")}
              </div>
            )}
            {svc.maxCapacity && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {svc.maxCapacity} {t("business.bookings.guests")}
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
          className="h-8 w-8 p-0"
          aria-label={`${t("common.edit")} ${svc.name}`}
          onClick={() => onEdit(svc)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          aria-label={`${t("common.delete")} ${svc.name}`}
          onClick={() => onDelete(svc)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

// ─── Place Overview Card ─────────────────────────────────────────────────────

const PlaceOverviewCard = ({ item, isSelected, onClick }) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        DESIGN.card,
        "p-4 text-left w-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        isSelected && "ring-2 ring-primary border-primary/50",
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
          {t("business.services.title")}:{" "}
          <strong className="text-amber-600">{item.discountedCount}</strong>
        </span>
        <span>
          {t("business.bookings.bookings")}: <strong className="text-blue-600">{item.bookingCount}</strong>
        </span>
      </div>
    </button>
  );
};

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

  const handleCreate = async (data) => {
    await businessOfferingApi.create(data);
    toast.success(t("business.services.createSuccess"));
    loadServices();
  };

  const handleUpdate = async (data) => {
    await businessOfferingApi.update(editService.id, data);
    toast.success(t("business.services.updateSuccess"));
    setEditService(null);
    loadServices();
  };

  const handleDeleteConfirmed = async () => {
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
  };

  const openCreate = (placeKey) => {
    setEditService(null);
    setDraftPlaceId(placeKey && placeKey !== "none" ? String(placeKey) : "");
    setShowForm(true);
  };

  const openEdit = (svc) => {
    setEditService(svc);
    setDraftPlaceId("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditService(null);
    setDraftPlaceId("");
  };

  // Stat summary
  const totalActive = services.filter((s) => s.isActive).length;
  const totalDiscounted = services.filter((s) => s.discountPrice).length;

  return (
    <div className="space-y-6 p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <PageHeader
        title={t("business.services.title")}
        subtitle={t("business.services.title")}
        badge={total > 0 ? total : undefined}
        action={
          <Button onClick={() => openCreate("")} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("business.services.createSuccess")}
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title={t("business.services.title")}
              value={total}
              icon={Ticket}
              iconColor="blue"
            />
            <StatCard
              title={t("common.active")}
              value={totalActive}
              icon={CalendarCheck}
              iconColor="emerald"
            />
            <StatCard
              title={t("business.services.title")}
              value={totalDiscounted}
              icon={Tag}
              iconColor="amber"
            />
            <StatCard
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
        <SectionCard title={t("business.services.title")} titleIcon={Ticket}>
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
        </SectionCard>
      )}

      {/* Toolbar + List */}
      <SectionCard
        title={t("business.services.title")}
        titleIcon={Ticket}
        action={
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={t("common.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-sm w-52"
              />
            </div>
            <Select value={selectedPlaceId} onValueChange={setSelectedPlaceId}>
              <SelectTrigger className="h-8 text-sm w-44">
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
          </div>
        }
      >
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
              <EmptyState
                icon={Ticket}
                message={t("business.services.loadFailed")}
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
                        {group.items.length} {t("business.services.title")}
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
      </SectionCard>

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
