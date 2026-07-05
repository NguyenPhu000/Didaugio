import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Bar, Doughnut } from "react-chartjs-2";
import "@/lib/chartSetup";
import {
  FileText,
  Image as ImageIcon,
  Bell,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Globe,
  RefreshCw,
  MapPin,
  Users,
  Star,
  Zap,
  CheckCircle,
  Clock,
  XCircle,
  Link,
  Upload,
  X,
  Compass,
} from "lucide-react";
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
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as eventService from "@/apis/eventService";
import * as bannerService from "@/apis/bannerService";
import * as announcementService from "@/apis/announcementService";
import * as placeService from "@/apis/placeService";
import * as categoryService from "@/apis/categoryService";
import * as districtService from "@/apis/districtService";
import { useAuthStore } from "@/stores/authStore";
import {
  TripContentCard as SampleTripContentCard,
  TripEditModal as SampleTripEditModal,
} from "./cms/sample-trips";

// ─── Image Compression ───────────────────────────────────────────────────────

const compressBannerImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1080;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        resolve(dataUrl);
      };
      img.onerror = () => reject("Invalid image format");
    };
    reader.onerror = () => reject("Cannot read file");
  });
};

// ─── Content Types ─────────────────────────────────────────────────────────────

const getContentTypes = (t) => [
  {
    id: "events",
    label: t("admin.cms.tabLabels.events"),
    icon: Calendar,
    description: t("admin.cms.eventsDesc"),
    color: "bg-rose-500",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    id: "trips",
    label: t("admin.cms.tabLabels.sampleTrips"),
    icon: Compass,
    description: t("admin.cms.sampleTripsDesc"),
    color: "bg-purple-500",
    gradient: "from-purple-500 to-indigo-600",
  },
  {
    id: "banners",
    label: t("admin.cms.tabLabels.banners"),
    icon: ImageIcon,
    description: t("admin.cms.bannersDesc"),
    color: "bg-blue-500",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    id: "announcements",
    label: t("admin.cms.tabLabels.notifications"),
    icon: Bell,
    description: t("admin.cms.notificationsDesc"),
    color: "bg-amber-500",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    id: "featured",
    label: t("admin.cms.tabLabels.featured"),
    icon: Star,
    description: t("admin.cms.featuredDesc"),
    color: "bg-emerald-500",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "pages",
    label: t("admin.cms.tabLabels.staticPages"),
    icon: FileText,
    description: t("admin.cms.staticPagesDesc"),
    color: "bg-purple-500",
    gradient: "from-purple-500 to-violet-600",
  },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

const EventStatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const config = {
    active: {
      label: t("admin.cms.ongoing"),
      class: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: <CheckCircle className="h-3 w-3" />,
    },
    inactive: {
      label: t("admin.cms.hiddenTemp"),
      class: "border-slate-200 bg-slate-50 text-slate-500",
      icon: <EyeOff className="h-3 w-3" />,
    },
    completed: {
      label: t("admin.cms.ended"),
      class: "border-blue-200 bg-blue-50 text-blue-600",
      icon: <CheckCircle className="h-3 w-3" />,
    },
  };

  const cfg = config[status] || config.inactive;

  return (
    <Badge variant="outline" className={cn("gap-1 text-xs", cfg.class)}>
      {cfg.icon} {cfg.label}
    </Badge>
  );
};

const StatusBadge = ({ active }) => {
  const { t } = useTranslation();
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1",
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-500"
      )}
    >
      {active ? (
        <>
          <Eye className="h-3 w-3" /> {t("admin.cms.active")}
        </>
      ) : (
        <>
          <EyeOff className="h-3 w-3" /> {t("admin.cms.hidden")}
        </>
      )}
    </Badge>
  );
};

// ─── Event Card (Beautiful) ────────────────────────────────────────────────────

const EventContentCard = ({ item, onEdit, onToggle, onDelete }) => {
  const { t } = useTranslation();
  const isActive = item.status === "active";
  const startDate = item.startDate ? new Date(item.startDate) : null;
  const endDate = item.endDate ? new Date(item.endDate) : null;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className="flex">
        {/* Thumbnail */}
        <div className="w-32 h-full shrink-0 relative overflow-hidden bg-gradient-to-br from-rose-100 to-pink-200">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover"
              style={{ minHeight: "120px" }}
            />
          ) : (
            <div className="w-full flex items-center justify-center" style={{ minHeight: "120px" }}>
              <Calendar className="h-10 w-10 text-rose-300" />
            </div>
          )}
          {item.isFeaturedBanner && (
            <div className="absolute top-2 left-2">
              <span className="px-1.5 py-0.5 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded">
                BANNER
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-base truncate">{item.title}</h3>
                <EventStatusBadge status={item.status} />
              </div>

              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {item.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {item.location && (
                  <span className="flex items-center gap-1 text-rose-600">
                    <MapPin className="h-3 w-3" />
                    {item.location}
                  </span>
                )}
                {startDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {startDate.toLocaleDateString("vi-VN")}
                    {endDate && ` - ${endDate.toLocaleDateString("vi-VN")}`}
                  </span>
                )}
                {item._count?.participants !== undefined && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Users className="h-3 w-3" />
                    {t("admin.cms.participating", { count: item._count.participants, max: item.maxParticipants || "" })}
                  </span>
                )}
                {item.totalCheckIns > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Zap className="h-3 w-3" />
                    {item.totalCheckIns} check-in
                  </span>
                )}
                {item.tripId && (
                  <span className="flex items-center gap-1 text-purple-600">
                    <Link className="h-3 w-3" />
                    {t("admin.cms.sampleTripItinerary")}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(item)}
                title={t("common.edit")}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onToggle(item)}
                title={isActive ? t("admin.cms.temporaryHide") : t("admin.cms.activate")}
              >
                {isActive ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(item)}
                title={t("common.delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

// ─── Generic Content Card ────────────────────────────────────────────────────

const ContentCard = ({ item, onEdit, onToggle, onDelete }) => {
  const { t } = useTranslation();
  const Icon = item.icon || FileText;

  return (
    <Card className="group hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {item.image || item.thumbnail || item.imageUrl || item.imageData ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
              <img
                src={item.image || item.thumbnail || item.imageUrl || item.imageData}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className={cn(
              "w-16 h-16 rounded-lg flex items-center justify-center shrink-0 text-white",
              item.color || "bg-muted"
            )}>
              <Icon className="h-8 w-8" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{item.title}</h3>
                {item.subtitle && (
                  <p className="text-sm text-muted-foreground truncate">
                    {item.subtitle}
                  </p>
                )}
              </div>
              <StatusBadge active={item.active ?? item.isActive ?? item.status === "active"} />
            </div>

            {item.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {item.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
              {item.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {isNaN(Date.parse(item.startDate))
                    ? item.startDate
                    : new Date(item.startDate).toLocaleDateString("vi-VN")}
                </span>
              )}
              {(item.views ?? item.viewCount) !== undefined && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {item.views ?? item.viewCount}
                </span>
              )}
              {(item.order ?? item.priority) !== undefined && (
                <span className="flex items-center gap-1">
                  #{item.order ?? item.priority}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(item)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggle(item)}
            >
              {(item.active ?? item.isActive) ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Image Upload Area ─────────────────────────────────────────────────────────

const ImageUploadArea = ({ value, onChange, label, hint }) => {
  const { t } = useTranslation();
  const uniqueId = `file-upload-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="border-2 border-dashed border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors relative bg-muted/20">
        {value ? (
          <div className="relative group">
            <img
              src={value}
              alt="Preview"
              className="w-full h-44 object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <Label
                htmlFor={uniqueId}
                className="h-9 px-4 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-sm font-medium flex items-center justify-center cursor-pointer transition-colors"
              >
                {t("common.edit")}
              </Label>
              <button
                type="button"
                className="h-9 px-4 rounded-lg bg-destructive hover:bg-destructive/90 text-white text-sm font-medium transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange("");
                }}
              >
                {t("common.delete")}
              </button>
            </div>
            <input
              id={uniqueId}
              type="file"
              accept="image/*"
              onChange={onChange}
              className="hidden"
            />
          </div>
        ) : (
          <label htmlFor={uniqueId} className="p-6 text-center cursor-pointer block">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground">
              {t("common.upload")}
            </p>
            {hint && (
              <p className="text-xs text-muted-foreground mt-1">{hint}</p>
            )}
            <input
              id={uniqueId}
              type="file"
              accept="image/*"
              onChange={onChange}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
};

// ─── Event Edit Modal ─────────────────────────────────────────────────────────

const EventEditModal = ({ open, onClose, item, onSave, loading }) => {
  const { t } = useTranslation();
  const isEdit = !!item?.id;

  const [form, setForm] = useState({
    title: "",
    description: "",
    thumbnail: "",
    thumbnailPublicId: null,
    startDate: "",
    endDate: "",
    location: "Cần Thơ",
    maxParticipants: "",
    isFeaturedBanner: false,
    tripId: "none",
    broadcastNotice: "",
    status: "active",
  });

  const [trips, setTrips] = useState([]);
  const [tripLoading, setTripLoading] = useState(false);
  const [inlineTripModal, setInlineTripModal] = useState(false);
  const [inlineTripSaving, setInlineTripSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (item) {
      setForm({
        title: item.title || "",
        description: item.description || "",
        thumbnail: item.thumbnail || "",
        thumbnailPublicId: item.thumbnailPublicId || null,
        startDate: item.startDate ? item.startDate.split("T")[0] : "",
        endDate: item.endDate ? item.endDate.split("T")[0] : "",
        location: item.location || "Cần Thơ",
        maxParticipants: item.maxParticipants || "",
        isFeaturedBanner: !!item.isFeaturedBanner,
        tripId: item.tripId ? String(item.tripId) : "none",
        broadcastNotice: item.broadcastNotice || "",
        status: item.status || "active",
      });
    } else {
      setForm({
        title: "",
        description: "",
        thumbnail: "",
        thumbnailPublicId: null,
        startDate: "",
        endDate: "",
        location: "Cần Thơ",
        maxParticipants: "",
        isFeaturedBanner: false,
        tripId: "none",
        broadcastNotice: "",
        status: "active",
      });
    }
  }, [open, item]);

  const fetchTripsForEvent = useCallback(async () => {
    setTripLoading(true);
    try {
      const res = await eventService.getAdminTrips();
      setTrips(res.data || []);
    } catch (err) {
      console.error("Loi lay danh sach trips:", err);
    } finally {
      setTripLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchTripsForEvent();
  }, [open, fetchTripsForEvent]);

  const handleInlineTripSave = async (tripForm) => {
    setInlineTripSaving(true);
    try {
      const res = await eventService.createTrip(tripForm);
      toast.success(t("common.createdSuccessfully"));
      setInlineTripModal(false);
      // Refresh danh sach trips va tu dong chon trip vua tao
      await fetchTripsForEvent();
      if (res.data?.id) {
        setForm((prev) => ({ ...prev, tripId: String(res.data.id) }));
      }
    } catch (err) {
      console.error("Loi tao lich trinh:", err);
      const msg = err.response?.data?.message || err.message;
      toast.error(msg || t("admin.cms.createItineraryError"));
    } finally {
      setInlineTripSaving(false);
    }
  };

  const handleImageChange = async (e) => {
    if (typeof e === "string") {
      setForm((prev) => ({ ...prev, thumbnail: e, thumbnailPublicId: null }));
      return;
    }
    const file = e.target?.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("common.operationFailed"));
      return;
    }
    try {
      toast.loading(t("admin.cms.imageCompressing"), { id: "compress" });
      const compressed = await compressBannerImage(file);
      toast.dismiss("compress");
      setForm((prev) => ({ ...prev, thumbnail: compressed, thumbnailPublicId: null }));
      toast.success(t("common.savedSuccessfully"));
    } catch (err) {
      toast.dismiss("compress");
      toast.error(t("admin.cms.imageProcessError"));
    }
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error(t("admin.cms.eventName"));
      return;
    }
    if (!form.startDate) {
      toast.error(t("admin.cms.startDate"));
      return;
    }
    if (!form.endDate) {
      toast.error(t("admin.cms.endDate"));
      return;
    }
    if (new Date(form.startDate) > new Date(form.endDate)) {
      toast.error(t("admin.cms.endDate"));
      return;
    }

    const payload = {
      ...form,
      tripId: form.tripId === "none" || !form.tripId ? null : parseInt(form.tripId, 10),
      maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants, 10) : null,
    };
    onSave(payload);
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-rose-600" />
            </div>
            {isEdit ? t("admin.cms.editEvent") : t("admin.cms.createEvent")}
          </DialogTitle>
          <DialogDescription>
            {t("admin.cms.editDescription", { action: isEdit ? t("admin.cms.editAction") : t("admin.cms.createAction") })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Section: {t("admin.cms.basicInfo")} */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t("admin.cms.basicInfo")}
            </h3>

            <div className="space-y-1.5">
              <Label htmlFor="ev-title">
                {t("admin.cms.eventName")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ev-title"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder={t("admin.cms.eventName") + "..."}

                className="text-base"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ev-desc">{t("admin.cms.eventDescriptionLabel")}</Label>
              <Textarea
                id="ev-desc"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder={t("admin.cms.eventDescriptionPlaceholder")}
                className="min-h-[90px] resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.description.length}/2000
              </p>
            </div>

            {/* Ảnh banner */}
            <ImageUploadArea
              value={form.thumbnail}
              onChange={handleImageChange}
              label={t("admin.cms.eventBannerLabel")}
              hint={t("admin.cms.eventBannerHint")}
            />
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Section: Thời gian & địa điểm */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t("admin.cms.timeAndLocation")}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ev-start">
                  {t("admin.cms.startDateLabel")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ev-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setField("startDate", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-end">
                  {t("admin.cms.endDateLabel")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ev-end"
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ev-location">{t("admin.cms.venueLabel")}</Label>
                <Input
                  id="ev-location"
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                  placeholder="Cần Thơ"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-max">{t("admin.cms.maxAttendeesLabel")}</Label>
                <Input
                  id="ev-max"
                  type="number"
                  value={form.maxParticipants}
                  onChange={(e) => setField("maxParticipants", e.target.value)}
                  placeholder={t("admin.cms.unlimited")}
                  min={1}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Section: Cấu hình */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t("admin.cms.eventConfig")}
            </h3>

            {/* Lich trinh mau */}
            <div className="space-y-2">
              <Label>{t("admin.cms.linkedTripItinerary")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("admin.cms.linkedTripHint")}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Select
                    value={form.tripId || "none"}
                    onValueChange={(value) => setField("tripId", value)}
                    disabled={tripLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={tripLoading ? t("admin.cms.loadingTrips") : t("admin.cms.selectLinkedItinerary")} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      <SelectItem value="none">{t("admin.cms.noLinkedItinerary")}</SelectItem>
                      {trips.map((trip) => (
                        <SelectItem key={trip.id} value={String(trip.id)}>
                          {trip.title} ({t("admin.cms.daysCount", { count: trip.totalDays || 1 })})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0 border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
                  onClick={() => setInlineTripModal(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("common.create")}
                </Button>
              </div>
              {form.tripId && form.tripId !== "none" && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-purple-50 border border-purple-100">
                  <Compass className="h-4 w-4 text-purple-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-purple-800 truncate">
                      {trips.find((tr) => String(tr.id) === form.tripId)?.title || t("admin.cms.selectedItinerary")}
                    </p>
                    <p className="text-[11px] text-purple-600">
                      {t("admin.cms.daysCount", { count: trips.find((tr) => String(tr.id) === form.tripId)?.totalDays || 1 })}
                      {trips.find((tr) => String(tr.id) === form.tripId)?.travelStyle
                        ? ` - ${trips.find((tr) => String(tr.id) === form.tripId).travelStyle}`
                        : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-purple-400 hover:text-destructive"
                    onClick={() => setField("tripId", "none")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {trips.length === 0 && !tripLoading && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  {t("admin.cms.noSampleItineraries")}
                </p>
              )}
            </div>

            {/* Trạng thái + Banner toggle */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("admin.cms.eventStatusLabel")}</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setField("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                        {t("admin.cms.activeStatus")}
                      </span>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <span className="flex items-center gap-1.5">
                        <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                        {t("admin.cms.inactiveStatus")}
                      </span>
                    </SelectItem>
                    <SelectItem value="completed">
                      <span className="flex items-center gap-1.5">
                        <XCircle className="h-3.5 w-3.5 text-blue-500" />
                        {t("admin.cms.completedStatus")}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Featured Banner Toggle */}
              <div className="space-y-1.5">
                <Label>{t("admin.cms.featuredBanner")}</Label>
                <button
                  type="button"
                  onClick={() => setField("isFeaturedBanner", !form.isFeaturedBanner)}
                  className={cn(
                    "w-full h-10 px-4 rounded-lg border text-sm font-medium flex items-center gap-2 transition-all",
                    form.isFeaturedBanner
                      ? "bg-yellow-50 border-yellow-300 text-yellow-800"
                      : "bg-muted border-border text-muted-foreground hover:bg-muted/60"
                  )}
                >
                  <Star className={cn("h-4 w-4", form.isFeaturedBanner ? "text-yellow-500 fill-yellow-400" : "")} />
                  {form.isFeaturedBanner ? t("admin.cms.showOnExplore") : t("admin.cms.hideBanner")}
                  <div className="ml-auto">
                    {form.isFeaturedBanner ? (
                      <ToggleRight className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>
                {form.isFeaturedBanner && (
                  <p className="text-xs text-yellow-600">
                    {t("admin.cms.bannerWillAppear")}
                  </p>
                )}
              </div>
            </div>

            {/* Thông báo khẩn cấp */}
            <div className="space-y-1.5">
              <Label htmlFor="ev-broadcast">
                {t("admin.cms.broadcastLabel")}{" "}
                <span className="text-muted-foreground font-normal">{t("admin.cms.broadcastOptional")}</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("admin.cms.broadcastHint")}
              </p>
              <Textarea
                id="ev-broadcast"
                value={form.broadcastNotice}
                onChange={(e) => setField("broadcastNotice", e.target.value)}
                placeholder={t("admin.cms.broadcastPlaceholder")}
                className="min-h-[70px] resize-none"
                maxLength={255}
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.broadcastNotice.length}/255
              </p>
            </div>
          </div>

          {/* Preview mini */}
          {form.title && (
            <>
              <div className="border-t" />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("admin.cms.previewEventCard")}
                </h3>
                <div className="rounded-xl overflow-hidden border bg-white shadow-sm">
                  <div className="flex">
                    <div className="w-24 shrink-0 bg-gradient-to-br from-rose-100 to-pink-200 flex items-center justify-center" style={{ minHeight: "80px" }}>
                      {form.thumbnail ? (
                        <img src={form.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Calendar className="h-8 w-8 text-rose-400" />
                      )}
                    </div>
                    <div className="p-3 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-semibold text-sm truncate">{form.title}</span>
                        {form.isFeaturedBanner && (
                          <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[9px] font-bold rounded shrink-0">
                            BANNER
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {form.location && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5" />
                            {form.location}
                          </span>
                        )}
                        {form.startDate && (
                          <span className="flex items-center gap-0.5">
                            <Calendar className="h-2.5 w-2.5" />
                            {new Date(form.startDate).toLocaleDateString("vi-VN")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={loading} className="min-w-[100px]">
            {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? t("admin.cms.saveChanges") : t("admin.cms.createEventBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Inline Trip Create Modal */}
      <SampleTripEditModal
        open={inlineTripModal}
        onClose={() => setInlineTripModal(false)}
        item={null}
        onSave={handleInlineTripSave}
        loading={inlineTripSaving}
      />
    </Dialog>
  );
};

const toDateInputValue = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const getGenericInitialForm = (item) => ({
  title: item?.title || "",
  subtitle: item?.subtitle || "",
  description: item?.description || item?.body || item?.message || "",
  image: item?.image || item?.imageUrl || item?.imageData || item?.thumbnail || "",
  link: item?.link || item?.linkValue || "",
  linkType: item?.linkType || (item?.link || item?.linkValue ? "url" : "none"),
  position: item?.position || "home",
  order: item?.order ?? item?.priority ?? 0,
  type: item?.type || "info",
  active: item?.active ?? item?.isActive ?? true,
  startDate: toDateInputValue(item?.startDate),
  endDate: toDateInputValue(item?.endDate),
});

const EditModal = ({ open, onClose, item, onSave, type, loading }) => {
  if (!open) return null;

  return (
    <EditModalContent
      key={`${type?.id || "content"}-${item?.id || "new"}`}
      open={open}
      onClose={onClose}
      item={item}
      onSave={onSave}
      type={type}
      loading={loading}
    />
  );
};

const EditModalContent = ({ open, onClose, item, onSave, type, loading }) => {
  const { t } = useTranslation();
  const Icon = type?.icon || FileText;
  const isEdit = !!item?.id;
  const isBanner = type?.id === "banners";
  const isAnnouncement = type?.id === "announcements";
  const isPage = type?.id === "pages";
  const isFeatured = type?.id === "featured";
  const [form, setForm] = useState(() => getGenericInitialForm(item));

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleImageChange = async (e) => {
    if (typeof e === "string") {
      setField("image", e);
      return;
    }

    const file = e.target?.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("common.operationFailed"));
      return;
    }

    try {
      toast.loading(t("admin.cms.imageCompressing"), { id: "generic-compress" });
      const compressed = await compressBannerImage(file);
      toast.dismiss("generic-compress");
      setField("image", compressed);
      toast.success(t("common.savedSuccessfully"));
    } catch (err) {
      toast.dismiss("generic-compress");
      toast.error(t("admin.cms.imageProcessError"));
    }
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error(t("admin.cms.titleRequired", "Vui lòng nhập tiêu đề"));
      return;
    }

    if (isAnnouncement && !form.description.trim()) {
      toast.error("Vui lòng nhập nội dung thông báo");
      return;
    }

    if (isBanner && form.startDate && form.endDate && new Date(form.startDate) > new Date(form.endDate)) {
      toast.error(t("admin.cms.endDate"));
      return;
    }

    onSave({
      ...form,
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      description: form.description.trim(),
      order: Number(form.order) || 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", type?.color || "bg-primary")}>
              <Icon className="h-4 w-4" />
            </div>
            {isEdit ? t("common.edit") : t("common.create")} {type?.label || t("admin.cms.createContent")}
          </DialogTitle>
          <DialogDescription>
            {isBanner
              ? "Cấu hình banner hiển thị trong app và thời gian hoạt động."
              : isAnnouncement
                ? "Tạo hoặc cập nhật thông báo gửi tới người dùng."
                : "Quản lý thông tin nội dung hiển thị trong CMS."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t("admin.cms.basicInfo")}
            </h3>

            <div className="space-y-1.5">
              <Label htmlFor="generic-title">
                {t("common.title", "Tiêu đề")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="generic-title"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Nhập tiêu đề..."
                className="text-base"
              />
            </div>

            {!isBanner && !isAnnouncement && (
              <div className="space-y-1.5">
                <Label htmlFor="generic-subtitle">Mô tả ngắn</Label>
                <Input
                  id="generic-subtitle"
                  value={form.subtitle}
                  onChange={(e) => setField("subtitle", e.target.value)}
                  placeholder="Nhập mô tả ngắn..."
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="generic-description">
                {isAnnouncement ? "Nội dung thông báo" : t("common.description", "Mô tả")}
                {isAnnouncement && <span className="text-destructive"> *</span>}
              </Label>
              <Textarea
                id="generic-description"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder={isAnnouncement ? "Nhập nội dung thông báo..." : "Nhập mô tả..."}
                className="min-h-[100px] resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.description.length}/2000
              </p>
            </div>

            <ImageUploadArea
              value={form.image}
              onChange={handleImageChange}
              label={isAnnouncement ? "Ảnh thông báo" : isBanner ? "Ảnh banner" : "Ảnh đại diện"}
              hint="Hỗ trợ JPG, PNG, WebP. Ảnh sẽ được nén trước khi lưu."
            />
          </div>

          <div className="border-t" />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {isBanner ? "Hiển thị và điều hướng" : "Trạng thái"}
            </h3>

            {isBanner && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Vị trí hiển thị</Label>
                    <Select value={form.position} onValueChange={(value) => setField("position", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">Trang chủ</SelectItem>
                        <SelectItem value="explore">Khám phá</SelectItem>
                        <SelectItem value="top">Đầu trang</SelectItem>
                        <SelectItem value="bottom">Cuối trang</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Loại liên kết</Label>
                    <Select value={form.linkType} onValueChange={(value) => setField("linkType", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không có</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="place">Địa điểm</SelectItem>
                        <SelectItem value="event">Sự kiện</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {form.linkType !== "none" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="generic-link">Giá trị liên kết</Label>
                    <Input
                      id="generic-link"
                      value={form.link}
                      onChange={(e) => setField("link", e.target.value)}
                      placeholder="Nhập URL, ID địa điểm hoặc ID sự kiện..."
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="generic-order">Thứ tự ưu tiên</Label>
                    <Input
                      id="generic-order"
                      type="number"
                      min="0"
                      value={form.order}
                      onChange={(e) => setField("order", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="generic-start">Ngày bắt đầu</Label>
                    <Input
                      id="generic-start"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setField("startDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="generic-end">Ngày kết thúc</Label>
                    <Input
                      id="generic-end"
                      type="date"
                      min={form.startDate}
                      value={form.endDate}
                      onChange={(e) => setField("endDate", e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {isAnnouncement && (
              <div className="space-y-1.5">
                <Label>Loại thông báo</Label>
                <Select value={form.type} onValueChange={(value) => setField("type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Thông tin</SelectItem>
                    <SelectItem value="success">Thành công</SelectItem>
                    <SelectItem value="warning">Cảnh báo</SelectItem>
                    <SelectItem value="error">Khẩn cấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(isFeatured || isPage) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="generic-order-simple">Thứ tự</Label>
                  <Input
                    id="generic-order-simple"
                    type="number"
                    min="0"
                    value={form.order}
                    onChange={(e) => setField("order", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="generic-link-simple">Liên kết</Label>
                  <Input
                    id="generic-link-simple"
                    value={form.link}
                    onChange={(e) => setField("link", e.target.value)}
                    placeholder="/slug hoặc URL..."
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setField("active", !form.active)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left",
                form.active
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-border bg-muted/30 text-muted-foreground"
              )}
            >
              {form.active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
              <span className="font-medium">
                {form.active ? "Đang hiển thị" : "Đang ẩn"}
              </span>
              <span className="ml-auto text-xs">
                {form.active ? "Người dùng có thể nhìn thấy" : "Tạm tắt hiển thị"}
              </span>
            </button>
          </div>

          {form.title && (
            <>
              <div className="border-t" />
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="flex">
                  <div className="w-28 bg-muted shrink-0 flex items-center justify-center">
                    {form.image ? (
                      <img src={form.image} alt="" className="w-full h-full min-h-24 object-cover" />
                    ) : (
                      <Icon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-4 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold truncate">{form.title}</h4>
                      <StatusBadge active={form.active} />
                    </div>
                    {(form.subtitle || form.description) && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {form.subtitle || form.description}
                      </p>
                    )}
                    {isBanner && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {form.position} / {form.linkType}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={loading} className="min-w-[100px]">
            {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? t("admin.cms.saveChanges") : t("admin.cms.createContent")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const QuickPlaceCreateModal = ({ open, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setAddress("");
    setCategoryId("");
    setDistrictId("");

    const loadData = async () => {
      try {
        const [catRes, distRes] = await Promise.all([
          categoryService.getAllCategories(),
          districtService.getAllDistricts(),
        ]);
        const cats = catRes.data || catRes;
        const dists = distRes.data || distRes;
        setCategories(cats || []);
        setDistricts(dists || []);

        if (cats && cats.length > 0) setCategoryId(String(cats[0].id));
        if (dists && dists.length > 0) setDistrictId(String(dists[0].id));
      } catch (err) {
        console.error("Lỗi tải danh mục/quận huyện:", err);
      }
    };
    loadData();
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t("admin.cms.placeName") + " " + t("common.required"));
      return;
    }
    if (!address.trim()) {
      toast.error(t("admin.cms.address") + " " + t("common.required"));
      return;
    }
    if (!categoryId) {
      toast.error(t("admin.cms.category") + " " + t("common.required"));
      return;
    }
    if (!districtId) {
      toast.error(t("admin.cms.district") + " " + t("common.required"));
      return;
    }

    setLoading(true);
    try {
      const generateSlug = (str) => {
        return str
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");
      };

      const slug = `${generateSlug(name)}-${Date.now()}`;
      const placeholderImage = {
        imageData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        isCover: true,
        order: 0,
        caption: "Default image",
      };

      const payload = {
        name: name.trim(),
        slug,
        address: address.trim(),
        categoryId: parseInt(categoryId, 10),
        districtId: parseInt(districtId, 10),
        latitude: 10.03711,
        longitude: 105.78825,
        images: [placeholderImage],
      };

      const res = await placeService.createPlace(payload);
      try {
        await placeService.approvePlace(res.id);
      } catch (approveErr) {
        console.warn("Lỗi auto approve địa điểm:", approveErr);
      }

      toast.success(t("common.createdSuccessfully"));
      onSuccess({
        id: res.id,
        name: res.name || name,
        address: res.address || address,
      });
      onClose();
    } catch (err) {
      console.error("Lỗi tạo địa điểm nhanh:", err);
      const msg = err.response?.data?.message || err.message;
      toast.error(msg || t("common.operationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-emerald-600" />
            </div>
            {t("admin.cms.quickCreateDialogTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("admin.cms.quickCreateDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>{t("admin.cms.placeNameLabel")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("admin.cms.placeNamePlaceholder")}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("admin.cms.addressLabel")}</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("admin.cms.addressPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("admin.cms.categoryLabel")}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.cms.selectCategory")} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("admin.cms.districtLabel")}</Label>
              <Select value={districtId} onValueChange={setDistrictId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.cms.selectDistrict")} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t pt-4 mt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
            {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            {t("admin.cms.createPlace")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const getMockData = (t) => ({
  banners: [
    {
      id: 1,
      title: t("admin.cms.mockBanner1Title"),
      subtitle: t("admin.cms.mockBanner1Subtitle"),
      description: t("admin.cms.mockBanner1Desc"),
      image: "https://picsum.photos/400/200?random=1",
      link: "/promo/summer",
      order: 1,
      active: true,
      views: 12500,
      startDate: "2024-06-01",
    },
    {
      id: 2,
      title: "Grand Opening",
      subtitle: t("admin.cms.mockBanner2Subtitle"),
      description: t("admin.cms.mockBanner2Desc"),
      image: "https://picsum.photos/400/200?random=2",
      link: "/new",
      order: 2,
      active: true,
      views: 8200,
      startDate: "2024-06-15",
    },
  ],
  announcements: [
    {
      id: 1,
      title: t("admin.cms.mockAnnouncementTitle"),
      subtitle: t("admin.cms.mockAnnouncementSubtitle"),
      description: t("admin.cms.mockAnnouncementDesc"),
      type: "warning",
      order: 1,
      active: true,
      startDate: "2024-06-24",
    },
  ],
  featured: [
    {
      id: 1,
      title: t("admin.cms.mockFeaturedTitle"),
      subtitle: t("admin.cms.mockFeaturedSubtitle"),
      description: t("admin.cms.mockFeaturedDesc"),
      order: 1,
      active: true,
      startDate: "2024-06-01",
    },
  ],
  pages: [
    {
      id: 1,
      title: t("admin.cms.mockPage1Title"),
      subtitle: t("admin.cms.mockPage1Subtitle"),
      description: t("admin.cms.mockPage1Desc"),
      order: 1,
      active: true,
      views: 3500,
    },
    {
      id: 2,
      title: t("admin.cms.mockPage2Title"),
      subtitle: "Terms of Service",
      description: t("admin.cms.mockPage2Desc"),
      order: 2,
      active: true,
      views: 2100,
    },
  ],
});

const StatCard = ({ title, value, icon: Icon, tone = "default", subtitle }) => {
  const toneMap = {
    danger: { iconBg: "bg-rose-50 dark:bg-rose-950/30 text-rose-500" },
    warning: { iconBg: "bg-amber-50 dark:bg-amber-950/30 text-amber-500" },
    success: { iconBg: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500" },
    default: { iconBg: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400" },
  };
  const config = toneMap[tone] || toneMap.default;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className={cn("p-3 rounded-xl shrink-0", config.iconBg)}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const CMSContentPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("events");
  const [editModal, setEditModal] = useState({ open: false, item: null });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [initialized, setInitialized] = useState(false);

  const user = useAuthStore((state) => state.user);
  const userRole = user?.roleId || 5;

  const CONTENT_TYPES = [
    {
      id: "events",
      label: t("admin.cms.tabLabels.events", "Sự kiện"),
      icon: Calendar,
      color: "bg-rose-500",
    },
    {
      id: "trips",
      label: t("admin.cms.tabLabels.sampleTrips", "Chuyến đi mẫu"),
      icon: Compass,
      color: "bg-purple-500",
    },
    {
      id: "banners",
      label: t("admin.cms.tabLabels.banners", "Banner"),
      icon: ImageIcon,
      color: "bg-blue-500",
    },
    {
      id: "announcements",
      label: t("admin.cms.tabLabels.notifications", "Thông báo"),
      icon: Bell,
      color: "bg-amber-500",
    },
    {
      id: "featured",
      label: t("admin.cms.tabLabels.featured", "Nổi bật"),
      icon: Star,
      color: "bg-yellow-500",
    },
    {
      id: "pages",
      label: t("admin.cms.tabLabels.staticPages", "Trang tĩnh"),
      icon: FileText,
      color: "bg-emerald-500",
    },
  ];

  const allowedContentTypes = CONTENT_TYPES.filter((type) => {
    if (type.id === "trips" || type.id === "events" || type.id === "banners" || type.id === "announcements") {
      // Chỉ cho phép admin (2), super admin (1) và staff hệ thống (4)
      return userRole === 1 || userRole === 2 || userRole === 4;
    }
    return true;
  });

  const selectedType = allowedContentTypes.find((t) => t.id === activeTab);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "events") {
        const res = await eventService.getEvents({ limit: 50 });
        setItems(res.data || []);
      } else if (activeTab === "trips") {
        const res = await eventService.getAdminTrips();
        setItems(res.data || []);
      } else if (activeTab === "banners") {
        const res = await bannerService.getBanners({ limit: 50 });
        setItems(res.data || []);
      } else if (activeTab === "announcements") {
        const res = await announcementService.getAnnouncements({ limit: 50 });
        setItems(res.data || []);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setItems(getMockData(t)[activeTab] || []);
      }
    } catch (error) {
      console.error("Failed to fetch items:", error);
      toast.error(t("admin.cms.cannotLoadContent"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, t]);

  useEffect(() => {
    // Nếu activeTab hiện tại bị loại bỏ do phân quyền, tự động đổi về tab hợp lệ đầu tiên
    const isValidTab = allowedContentTypes.some(t => t.id === activeTab);
    if (!isValidTab && allowedContentTypes.length > 0) {
      setActiveTab(allowedContentTypes[0].id);
      return;
    }

    if (activeTab === "events" || activeTab === "trips" || activeTab === "banners" || activeTab === "announcements") {
      fetchItems();
    } else if (!initialized) {
      setItems(getMockData(t)[activeTab] || []);
      setInitialized(true);
    } else {
      fetchItems();
    }
  }, [activeTab, initialized, fetchItems, userRole]);

  const filteredItems = items.filter((item) => {
    const titleMatch = item.title?.toLowerCase().includes(search.toLowerCase());
    const descMatch = item.description?.toLowerCase().includes(search.toLowerCase());
    const locMatch = item.location?.toLowerCase().includes(search.toLowerCase());
    const matchesSearch = !search || titleMatch || descMatch || locMatch;

    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (activeTab === "events") {
        matchesStatus = statusFilter === item.status;
      } else if (activeTab === "trips") {
        // trips lọc theo status nếu cần (planned, upcoming...)
        matchesStatus = statusFilter === item.status;
      } else {
        const isActive = item.active ?? item.isActive;
        matchesStatus =
          (statusFilter === "active" && isActive) ||
          (statusFilter === "inactive" && !isActive);
      }
    }
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (item) => {
    setEditModal({ open: true, item });
  };

  const handleTripDetail = (item) => {
    setEditModal({ open: true, item: { ...item, __mode: "detail" } });
  };

  const handleToggle = async (item) => {
    if (activeTab === "events") {
      setIsLoading(true);
      try {
        const newStatus = item.status === "active" ? "inactive" : "active";
        await eventService.updateEvent(item.id, { status: newStatus });
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
        );
        toast.success(t(newStatus === "active" ? "admin.cms.activated" : "admin.cms.hiddenItem", { title: item.title }));
      } catch (err) {
        console.error("Lỗi thay đổi trạng thái event:", err);
        toast.error(t("common.operationFailed"));
      } finally {
        setIsLoading(false);
      }
    } else if (activeTab === "banners") {
      setIsLoading(true);
      try {
        const newIsActive = !item.isActive;
        await bannerService.updateBanner(item.id, { isActive: newIsActive });
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isActive: newIsActive } : i))
        );
        toast.success(t(newIsActive ? "admin.cms.activated" : "admin.cms.hiddenItem", { title: item.title }));
      } catch (err) {
        console.error("Lỗi thay đổi trạng thái banner:", err);
        toast.error(t("common.operationFailed"));
      } finally {
        setIsLoading(false);
      }
    } else {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, active: !i.active } : i))
      );
      toast.success(t(item.active ? "admin.cms.hiddenItem" : "admin.cms.activated", { title: item.title }));
    }
  };

  const handleDelete = async (item) => {
    const itemType = activeTab === "events" ? t("admin.cms.events") : activeTab === "trips" ? t("admin.cms.sampleTrips") : activeTab === "banners" ? "banner" : activeTab === "announcements" ? "thông báo" : t("admin.cms.events");
    if (!window.confirm(t("admin.cms.deleteConfirmItem", { type: itemType, title: item.title }))) return;

    setIsLoading(true);
    try {
      if (activeTab === "events") {
        await eventService.deleteEvent(item.id);
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        toast.success(t("common.deletedSuccessfully"));
      } else if (activeTab === "trips") {
        await eventService.deleteTrip(item.id);
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        toast.success(t("common.deletedSuccessfully"));
      } else if (activeTab === "banners") {
        await bannerService.deleteBanner(item.id);
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        toast.success(t("common.deletedSuccessfully"));
      } else if (activeTab === "announcements") {
        await announcementService.deleteAnnouncement(item.id);
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        toast.success(t("common.deletedSuccessfully"));
      } else {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        toast.success(t("common.deletedSuccessfully"));
      }
    } catch (err) {
      console.error("Lỗi xóa nội dung:", err);
      toast.error(err.response?.data?.message || t("admin.cms.cannotDeleteContent"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (form) => {
    setIsLoading(true);
    try {
      if (activeTab === "events") {
        if (editModal.item?.id) {
          const res = await eventService.updateEvent(editModal.item.id, form);
          setItems((prev) =>
            prev.map((i) => (i.id === editModal.item.id ? res.data : i))
          );
          toast.success(t("common.updatedSuccessfully"));
        } else {
          const res = await eventService.createEvent(form);
          setItems((prev) => [res.data, ...prev]);
          toast.success(t("common.createdSuccessfully"));
        }
        setEditModal({ open: false, item: null });
        setTimeout(() => fetchItems(), 500);
      } else if (activeTab === "trips") {
        const { draftDestinations = [], ...tripForm } = form;
        if (editModal.item?.id) {
          const res = await eventService.updateTrip(editModal.item.id, tripForm);
          setItems((prev) =>
            prev.map((i) => (i.id === editModal.item.id ? res.data : i))
          );
          toast.success(t("common.updatedSuccessfully"));
        } else {
          const res = await eventService.createTrip(tripForm);
          const createdTrip = res.data;

          if (createdTrip?.id && draftDestinations.length > 0) {
            for (const [index, destination] of draftDestinations.entries()) {
              await eventService.addDestination(createdTrip.id, {
                placeId: parseInt(destination.placeId, 10),
                dayNumber: parseInt(destination.dayNumber, 10) || 1,
                order: destination.order || index + 1,
                startTime: destination.startTime || null,
                endTime: destination.endTime || null,
                note: destination.note || null,
                transportToNext: destination.transportToNext || null,
              });
            }
          }

          setItems((prev) => [res.data, ...prev]);
          toast.success(t("common.createdSuccessfully"));
        }
        setEditModal({ open: false, item: null });
        setTimeout(() => fetchItems(), 500);
      } else if (activeTab === "banners") {
        // Banner modal không có field ngày → set default: now → 1 năm sau
        const now = new Date();
        const oneYearLater = new Date(now);
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

        const payload = {
          title: form.title,
          description: form.description || null,
          image: form.image || undefined,
          linkType: form.linkType || "none",
          linkValue: form.link || null,
          position: form.position || "home",
          priority: form.order || 0,
          startDate: form.startDate
            ? new Date(form.startDate).toISOString()
            : now.toISOString(),
          endDate: form.endDate
            ? new Date(form.endDate).toISOString()
            : oneYearLater.toISOString(),
          isActive: form.active !== false,
        };

        if (editModal.item?.id) {
          const res = await bannerService.updateBanner(editModal.item.id, payload);
          setItems((prev) =>
            prev.map((i) => (i.id === editModal.item.id ? res.data : i))
          );
          toast.success(t("common.updatedSuccessfully"));
        } else {
          const res = await bannerService.createBanner(payload);
          setItems((prev) => [res.data, ...prev]);
          toast.success(t("common.createdSuccessfully"));
        }
        setEditModal({ open: false, item: null });
        setTimeout(() => fetchItems(), 500);
      } else if (activeTab === "announcements") {
        const payload = {
          title: form.title,
          body: form.description || form.subtitle || form.title,
          imageUrl: form.image || null,
        };

        if (editModal.item?.id) {
          const res = await announcementService.updateAnnouncement(editModal.item.id, payload);
          setItems((prev) =>
            prev.map((i) => (i.id === editModal.item.id ? res.data : i))
          );
          toast.success("Đã cập nhật thông báo");
        } else {
          const res = await announcementService.createAnnouncement(payload);
          setItems((prev) => [res.data, ...prev]);
          toast.success("Đã gửi thông báo đến tất cả người dùng");
        }
        setEditModal({ open: false, item: null });
        setTimeout(() => fetchItems(), 500);
      } else {
        if (editModal.item?.id) {
          setItems((prev) =>
            prev.map((i) => (i.id === editModal.item.id ? { ...i, ...form } : i))
          );
          toast.success(t("common.updatedSuccessfully"));
        } else {
          const newItem = {
            ...form,
            id: Math.max(...items.map((i) => i.id), 0) + 1,
            views: 0,
          };
          setItems((prev) => [newItem, ...prev]);
          toast.success(t("common.createdSuccessfully"));
        }
        setEditModal({ open: false, item: null });
      }
    } catch (err) {
      console.error("Lỗi lưu nội dung:", err);
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message;
      toast.error(msg || t("admin.cms.cannotSaveContent"));
    } finally {
      setIsLoading(false);
    }
  };

  const getContentCount = (typeId) => {
    if (typeId === "events" || typeId === "trips" || typeId === "banners" || typeId === "announcements") {
      return activeTab === typeId ? items.length : "...";
    }
    return getMockData(t)[typeId]?.length || 0;
  };

  const activeEventCount = items.filter((i) => i.status === "active").length;
  const featuredBannerCount = items.filter((i) => i.isFeaturedBanner && i.status === "active").length;
  const totalTrips = items.length;
  const totalClones = items.reduce((acc, curr) => acc + (curr.cloneCount || 0), 0);

  const eventsChartData = useMemo(() => {
    if (activeTab !== "events") return null;
    const topEvents = [...items]
      .sort((a, b) => (b.totalCheckIns || 0) - (a.totalCheckIns || 0))
      .slice(0, 5);

    if (topEvents.length === 0) return null;

    return {
      labels: topEvents.map((e) => e.title.substring(0, 15) + (e.title.length > 15 ? "..." : "")),
      datasets: [
        {
          label: "Lượt check-in",
          data: topEvents.map((e) => e.totalCheckIns || 0),
          backgroundColor: "hsl(var(--primary))",
          borderRadius: 6,
        },
      ],
    };
  }, [items, activeTab]);

  const tripsChartData = useMemo(() => {
    if (activeTab !== "trips") return null;
    const topTrips = [...items]
      .sort((a, b) => (b.cloneCount || 0) - (a.cloneCount || 0))
      .slice(0, 5);

    if (topTrips.length === 0) return null;

    return {
      labels: topTrips.map((t) => t.title.substring(0, 15) + (t.title.length > 15 ? "..." : "")),
      datasets: [
        {
          label: "Lượt clone",
          data: topTrips.map((t) => t.cloneCount || 0),
          backgroundColor: "#a855f7",
          borderRadius: 6,
        },
      ],
    };
  }, [items, activeTab]);

  const bannersChartData = useMemo(() => {
    if (activeTab !== "banners") return null;
    const positions = {};
    items.forEach((b) => {
      const pos = b.position || "Home";
      positions[pos] = (positions[pos] || 0) + 1;
    });

    if (Object.keys(positions).length === 0) return null;

    return {
      labels: Object.keys(positions),
      datasets: [
        {
          data: Object.values(positions),
          backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"],
        },
      ],
    };
  }, [items, activeTab]);

  const announcementsChartData = useMemo(() => {
    if (activeTab !== "announcements") return null;
    const withImage = items.filter((a) => a.imageUrl || a.image).length;
    const noImage = items.length - withImage;

    if (items.length === 0) return null;

    return {
      labels: ["Có ảnh minh họa", "Không có ảnh"],
      datasets: [
        {
          data: [withImage, noImage],
          backgroundColor: ["#10b981", "#ef4444"],
        },
      ],
    };
  }, [items, activeTab]);

  const featuredChartData = useMemo(() => {
    if (activeTab !== "featured" && activeTab !== "pages") return null;
    const topItems = [...items]
      .sort((a, b) => (b.views || b.viewCount || 0) - (a.views || a.viewCount || 0))
      .slice(0, 5);

    if (topItems.length === 0) return null;

    return {
      labels: topItems.map((i) => i.title.substring(0, 15) + (i.title.length > 15 ? "..." : "")),
      datasets: [
        {
          label: "Lượt xem",
          data: topItems.map((i) => i.views || i.viewCount || 0),
          backgroundColor: "#10b981",
          borderRadius: 6,
        },
      ],
    };
  }, [items, activeTab]);

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.cms.events")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("admin.cms.eventsDesc")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => fetchItems()} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button
              className={cn(
                "gap-2 text-white font-medium",
                activeTab === "trips" ? "bg-purple-600 hover:bg-purple-700" : ""
              )}
              onClick={() => setEditModal({ open: true, item: null })}
            >
              <Plus className="h-4 w-4" />
              {activeTab === "events" ? t("admin.cms.createEventBtn") : activeTab === "trips" ? t("admin.cms.createSampleTrip") : t("common.create")}
            </Button>
          </div>
        </div>

        {/* Dynamic Analytics (Stats & Charts) */}
        {!loading && (
          <div className="space-y-6">
            {/* Stats Row */}
            {activeTab === "events" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Tổng sự kiện" value={items.length} icon={Calendar} tone="default" subtitle="Tất cả sự kiện" />
                <StatCard title="Đang hoạt động" value={activeEventCount} icon={CheckCircle} tone="success" subtitle="Sự kiện đang diễn ra" />
                <StatCard title="Banner nổi bật" value={featuredBannerCount} icon={Star} tone="warning" subtitle="Hiển thị trên banner" />
              </div>
            )}
            {activeTab === "trips" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard title="Tổng lịch trình mẫu" value={totalTrips} icon={Compass} tone="default" subtitle="Lịch trình hệ thống" />
                <StatCard title="Tổng số lượt clone" value={totalClones} icon={RefreshCw} tone="success" subtitle="Người dùng lưu lại" />
              </div>
            )}
            {activeTab === "banners" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Tổng banner" value={items.length} icon={ImageIcon} tone="default" subtitle="Tất cả quảng cáo" />
                <StatCard title="Đang hiển thị" value={items.filter((b) => b.isActive || b.active).length} icon={CheckCircle} tone="success" subtitle="Đang hoạt động" />
                <StatCard title="Tổng lượt xem" value={items.reduce((acc, curr) => acc + (curr.views || 0), 0)} icon={Eye} tone="warning" subtitle="Lượt click & xem" />
              </div>
            )}
            {activeTab === "announcements" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard title="Tổng thông báo" value={items.length} icon={Bell} tone="default" subtitle="Tất cả thông báo" />
                <StatCard title="Đang hoạt động" value={items.filter((a) => a.active).length} icon={CheckCircle} tone="success" subtitle="Thông báo khả dụng" />
              </div>
            )}
            {activeTab === "featured" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard title="Tổng nổi bật" value={items.length} icon={Star} tone="default" subtitle="Địa điểm nổi bật" />
                <StatCard title="Đang kích hoạt" value={items.filter((f) => f.active).length} icon={CheckCircle} tone="success" subtitle="Hiển thị trang chủ" />
              </div>
            )}
            {activeTab === "pages" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Tổng trang tĩnh" value={items.length} icon={FileText} tone="default" subtitle="Trang hệ thống" />
                <StatCard title="Đang kích hoạt" value={items.filter((p) => p.active).length} icon={CheckCircle} tone="success" subtitle="Khả dụng công khai" />
                <StatCard title="Tổng lượt xem" value={items.reduce((acc, curr) => acc + (curr.views || 0), 0)} icon={Eye} tone="warning" subtitle="Tổng số lượt đọc" />
              </div>
            )}

            {/* Charts Row */}
            {items.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {activeTab === "events" && eventsChartData && (
                  <Card className="lg:col-span-3">
                    <CardHeader className="pb-4 border-b">
                      <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Zap className="h-4 w-4" /> Thống kê Check-in các sự kiện hàng đầu
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 pt-4">
                      <Bar
                        data={eventsChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
                            x: { grid: { display: false } },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

                {activeTab === "trips" && tripsChartData && (
                  <Card className="lg:col-span-3">
                    <CardHeader className="pb-4 border-b">
                      <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Compass className="h-4 w-4" /> Top lịch trình mẫu được Clone nhiều nhất
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 pt-4">
                      <Bar
                        data={tripsChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
                            x: { grid: { display: false } },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

                {activeTab === "banners" && bannersChartData && (
                  <Card className="lg:col-span-3">
                    <CardHeader className="pb-4 border-b">
                      <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" /> Cơ cấu phân phối Banner quảng cáo theo vị trí
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 pt-4 flex items-center justify-center">
                      <Doughnut
                        data={bannersChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "bottom",
                              labels: { usePointStyle: true, padding: 15 },
                            },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

                {activeTab === "announcements" && announcementsChartData && (
                  <Card className="lg:col-span-3">
                    <CardHeader className="pb-4 border-b">
                      <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Bell className="h-4 w-4" /> Cơ cấu thông báo hệ thống (Có ảnh vs Không ảnh)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 pt-4 flex items-center justify-center">
                      <Doughnut
                        data={announcementsChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "bottom",
                              labels: { usePointStyle: true, padding: 15 },
                            },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

                {(activeTab === "featured" || activeTab === "pages") && featuredChartData && (
                  <Card className="lg:col-span-3">
                    <CardHeader className="pb-4 border-b">
                      <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Eye className="h-4 w-4" /> Top nội dung có lượt xem nhiều nhất
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 pt-4">
                      <Bar
                        data={featuredChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
                            x: { grid: { display: false } },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content Type Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {allowedContentTypes.map((type) => {
            const Icon = type.icon;
            const count = getContentCount(type.id);
            const isActive = activeTab === type.id;

            return (
              <button
                key={type.id}
                onClick={() => {
                  setActiveTab(type.id);
                  setSearch("");
                  setStatusFilter("all");
                }}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                  isActive
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                    : "border-border bg-card hover:bg-muted/50"
                )}
              >
                <div className={cn("p-2 rounded-lg shrink-0 text-white", type.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.cms.items", { count })}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Search & Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.cms.searchPlaceholder", { type: selectedType?.label?.toLowerCase() || "" })}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t("admin.cms.statusPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.cms.allStatuses")}</SelectItem>
                  {activeTab === "events" ? (
                    <>
                      <SelectItem value="active">{t("admin.cms.activeStatus")}</SelectItem>
                      <SelectItem value="inactive">{t("admin.cms.inactiveStatus")}</SelectItem>
                      <SelectItem value="completed">{t("admin.cms.completedStatus")}</SelectItem>
                    </>
                  ) : activeTab === "trips" ? (
                    <>
                      <SelectItem value="planned">{t("admin.cms.planned")}</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="active">{t("admin.cms.active")}</SelectItem>
                      <SelectItem value="inactive">{t("admin.cms.hidden")}</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {(search || statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSearch(""); setStatusFilter("all"); }}
                  className="gap-1 text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  {t("admin.cms.clearFilter")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content List */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-24 h-24 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  {activeTab === "events" ? (
                    <Calendar className="h-8 w-8 text-muted-foreground/50" />
                  ) : activeTab === "trips" ? (
                    <Compass className="h-8 w-8 text-muted-foreground/50" />
                  ) : (
                    <Globe className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                <p className="text-lg font-medium">
                  {search || statusFilter !== "all"
                    ? t("admin.cms.noResults")
                    : t("admin.cms.noContentYet", { type: selectedType?.label?.toLowerCase() || "" })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search || statusFilter !== "all"
                    ? t("admin.cms.noResultsHint")
                    : t("admin.cms.createFirstHint", { type: selectedType?.label?.toLowerCase() || "" })}
                </p>
                {!(search || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    className="mt-4 gap-2"
                    onClick={() => setEditModal({ open: true, item: null })}
                  >
                    <Plus className="h-4 w-4" />
                    {t("admin.cms.createContent")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredItems.map((item) =>
              activeTab === "events" ? (
                <EventContentCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ) : activeTab === "trips" ? (
                <SampleTripContentCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onManageDestinations={handleTripDetail}
                  onDelete={handleDelete}
                />
              ) : (
                <ContentCard
                  key={item.id}
                  item={{ ...item, icon: selectedType?.icon, color: selectedType?.color }}
                  onEdit={handleEdit}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              )
            )
          )}
        </div>
      </div>

      {/* Event Modal */}
      {activeTab === "events" && (
        <EventEditModal
          open={editModal.open}
          onClose={() => setEditModal({ open: false, item: null })}
          item={editModal.item}
          onSave={handleSave}
          loading={isLoading}
        />
      )}

      {/* Trip Modal */}
      {activeTab === "trips" && (
        <SampleTripEditModal
          open={editModal.open}
          onClose={() => setEditModal({ open: false, item: null })}
          item={editModal.item}
          onSave={handleSave}
          loading={isLoading}
        />
      )}

      {/* Generic Modal */}
      {activeTab !== "events" && activeTab !== "trips" && (
        <EditModal
          open={editModal.open}
          onClose={() => setEditModal({ open: false, item: null })}
          item={editModal.item}
          onSave={handleSave}
          type={selectedType}
          loading={isLoading}
        />
      )}
    </div>
  );
};

export default CMSContentPage;
