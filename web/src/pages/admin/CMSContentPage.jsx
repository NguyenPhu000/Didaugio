import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
  ChevronDown,
  Car,
  Bike,
  Footprints,
  Navigation,
  Route,
  ChevronRight,
  ArrowRight,
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

// ─── Trip Card (Beautiful) ─────────────────────────────────────────────────────

const TripContentCard = ({ item, onEdit, onManageDestinations, onDelete }) => {
  const { t } = useTranslation();
  const startDate = item.startDate ? new Date(item.startDate) : null;
  const endDate = item.endDate ? new Date(item.endDate) : null;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <CardContent className="p-4 flex items-start gap-4">
        {/* Icon */}
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-200 flex items-center justify-center shrink-0">
          <Compass className="h-8 w-8 text-purple-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-base truncate group-hover:text-purple-600 transition-colors">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {item.description}
                </p>
              )}
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
                className="h-8 w-8 text-purple-600 hover:text-purple-700"
                onClick={() => onManageDestinations(item)}
                title={t("admin.cms.itineraryDetails")}
              >
                <Link className="h-4 w-4" />
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

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
            {startDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {startDate.toLocaleDateString("vi-VN")}
                {endDate && ` - ${endDate.toLocaleDateString("vi-VN")}`}
              </span>
            )}
            {item.totalDays && (
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">
                {item.totalDays} {t("admin.cms.totalDays")}
              </span>
            )}
            {item.travelStyle && (
              <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                {item.travelStyle}
              </Badge>
            )}
            {item.groupSize && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {t("admin.cms.style")}: {item.groupSize}
              </span>
            )}
            {item.cloneCount !== undefined && (
              <span className="flex items-center gap-1 text-emerald-600">
                <RefreshCw className="h-3.5 w-3.5" />
                {item.cloneCount}
              </span>
            )}
          </div>
        </div>
      </CardContent>
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
      <TripEditModal
        open={inlineTripModal}
        onClose={() => setInlineTripModal(false)}
        item={null}
        onSave={handleInlineTripSave}
        loading={inlineTripSaving}
      />
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

// ─── Trip Edit Modal ──────────────────────────────────────────────────────────

const TripEditModal = ({ open, onClose, item, onSave, loading }) => {
  const { t } = useTranslation();
  const isEdit = !!item?.id;

  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    totalDays: 1,
    travelStyle: "cultural",
    groupSize: 1,
  });

  const [places, setPlaces] = useState([]);
  const [selectedPlaceIds, setSelectedPlaceIds] = useState([]);
  const [quickPlaceOpen, setQuickPlaceOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedPlaceIds([]);
    if (item) {
      setForm({
        title: item.title || "",
        description: item.description || "",
        startDate: item.startDate ? item.startDate.split("T")[0] : "",
        endDate: item.endDate ? item.endDate.split("T")[0] : "",
        totalDays: item.totalDays || 1,
        travelStyle: item.travelStyle || "cultural",
        groupSize: item.groupSize || 1,
      });
    } else {
      setForm({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        totalDays: 1,
        travelStyle: "cultural",
        groupSize: 1,
      });
    }

    const fetchPlaces = async () => {
      try {
        const res = await placeService.getAllPlaces({ limit: 100 });
        setPlaces(res.data || []);
      } catch (err) {
        console.error("Lỗi lấy danh sách địa điểm:", err);
      }
    };
    fetchPlaces();
  }, [open, item]);

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error(t("admin.cms.tripName") + " " + t("common.required"));
      return;
    }
    const payload = {
      ...form,
      totalDays: parseInt(form.totalDays, 10) || 1,
      groupSize: parseInt(form.groupSize, 10) || 1,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      ...(!isEdit && { placeIds: selectedPlaceIds }),
    };
    onSave(payload);
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Compass className="h-4 w-4 text-purple-600" />
              </div>
              {isEdit ? t("admin.cms.editSampleTrip") : t("admin.cms.createSampleTrip")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.cms.tripDialogTitle")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("admin.cms.tripNameLabel")}</Label>
              <Input
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder={t("admin.cms.tripNamePlaceholder")}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("admin.cms.tripDescLabel")}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder={t("admin.cms.tripDescPlaceholder")}
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("admin.cms.expectedStartDate")}</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setField("startDate", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("admin.cms.expectedEndDate")}</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>{t("admin.cms.totalDays")}</Label>
                <Input
                  type="number"
                  value={form.totalDays}
                  onChange={(e) => setField("totalDays", e.target.value)}
                  min={1}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("admin.cms.groupSizeLabel")}</Label>
                <Input
                  type="number"
                  value={form.groupSize}
                  onChange={(e) => setField("groupSize", e.target.value)}
                  min={1}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("admin.cms.styleLabel")}</Label>
                <Select
                  value={form.travelStyle}
                  onValueChange={(val) => setField("travelStyle", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cultural">{t("admin.cms.cultural")}</SelectItem>
                    <SelectItem value="nature">{t("admin.cms.nature")}</SelectItem>
                    <SelectItem value="foodie">{t("admin.cms.culinary")}</SelectItem>
                    <SelectItem value="adventure">{t("admin.cms.exploration")}</SelectItem>
                    <SelectItem value="relaxation">{t("admin.cms.resort")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!isEdit && (
              <div className="space-y-1.5 border-t pt-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700">{t("admin.cms.selectPlacesDay1")}</Label>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-emerald-600 font-semibold"
                    onClick={() => setQuickPlaceOpen(true)}
                  >
                    {t("admin.cms.quickCreatePlaceLink")}
                  </Button>
                </div>
                <div className="border rounded-lg p-2 max-h-[140px] overflow-y-auto space-y-1.5 bg-slate-50/50">
                  {places.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">{t("admin.cms.noPlacesAvailable")}</p>
                  ) : (
                    places.map((place) => {
                      const isChecked = selectedPlaceIds.includes(place.id);
                      return (
                        <label key={place.id} className="flex items-center gap-2 text-xs cursor-pointer p-1 rounded hover:bg-slate-100">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedPlaceIds(prev =>
                                isChecked ? prev.filter(id => id !== place.id) : [...prev, place.id]
                              );
                            }}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span className="font-medium">{place.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate">- {place.address}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 border-t pt-4 mt-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white font-medium">
              {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? t("admin.cms.saveChanges") : t("admin.cms.createItinerary")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QuickPlaceCreateModal
        open={quickPlaceOpen}
        onClose={() => setQuickPlaceOpen(false)}
        onSuccess={(newPlace) => {
          setPlaces((prev) => [newPlace, ...prev]);
          setSelectedPlaceIds((prev) => [...prev, newPlace.id]);
        }}
      />
    </>
  );
};

// ─── OSRM Routing Utility ────────────────────────────────────────────────────

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds) {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h} hr ${rem} min` : `${h} hr`;
}

async function calculateLegDistance(fromPlace, toPlace) {
  if (!fromPlace?.latitude || !fromPlace?.longitude || !toPlace?.latitude || !toPlace?.longitude) {
    return null;
  }
  try {
    const url =
      `${OSRM_BASE}/${fromPlace.longitude},${fromPlace.latitude};${toPlace.longitude},${toPlace.latitude}` +
      `?overview=false&steps=false`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return null;
    const r = data.routes[0];
    return {
      distance: r.distance,
      duration: r.duration,
      distanceLabel: formatDistance(r.distance),
      durationLabel: formatDuration(r.duration),
    };
  } catch {
    return null;
  }
}

// ─── Transport Modes ─────────────────────────────────────────────────────────

const getTransportModes = (t) => [
  { value: t("admin.cms.motorbike"), icon: Bike, color: "text-orange-600", bg: "bg-orange-50" },
  { value: t("admin.cms.car"), icon: Car, color: "text-blue-600", bg: "bg-blue-50" },
  { value: t("admin.cms.walking"), icon: Footprints, color: "text-green-600", bg: "bg-green-50" },
  { value: t("admin.cms.bicycle"), icon: Bike, color: "text-teal-600", bg: "bg-teal-50" },
  { value: t("admin.cms.boat"), icon: Navigation, color: "text-cyan-600", bg: "bg-cyan-50" },
  { value: t("admin.cms.bus"), icon: Car, color: "text-indigo-600", bg: "bg-indigo-50" },
];

// ─── Searchable Place Picker ─────────────────────────────────────────────────

const SearchablePlacePicker = ({ places, value, onChange, onCreateQuick }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const selectedPlace = places.find((p) => String(p.id) === String(value));

  // Lấy danh sách categories từ places
  const categories = useMemo(() => {
    const map = new Map();
    places.forEach((p) => {
      if (p.category) {
        map.set(p.category.id, p.category);
      }
    });
    return Array.from(map.values());
  }, [places]);

  // Lọc places theo search + category
  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      const matchSearch =
        !search ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.address?.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        categoryFilter === "all" || String(p.category?.id) === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [places, search, categoryFilter]);

  // Nhóm places theo category
  const groupedPlaces = useMemo(() => {
    const groups = new Map();
    filteredPlaces.forEach((p) => {
      const catName = p.category?.name || t("common.other") || "Other";
      const catId = p.category?.id || "other";
      if (!groups.has(catId)) {
        groups.set(catId, { name: catName, items: [] });
      }
      groups.get(catId).items.push(p);
    });
    return Array.from(groups.values());
  }, [filteredPlaces]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-10 px-3 rounded-lg border border-input bg-white text-sm flex items-center justify-between hover:border-purple-300 transition-colors"
      >
        {selectedPlace ? (
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="h-3.5 w-3.5 text-purple-500 shrink-0" />
            <span className="font-medium truncate">{selectedPlace.name}</span>
            {selectedPlace.category && (
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                {selectedPlace.category.name}
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">{t("admin.cms.selectPlace")}</span>
        )}
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl border shadow-lg overflow-hidden">
          {/* Search + Filter */}
          <div className="p-2 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.cms.searchPlaces")}
                className="h-8 pl-8 text-xs"
                autoFocus
              />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors ${
                  categoryFilter === "all"
                    ? "bg-purple-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {t("admin.cms.allPlaces", { count: places.length })}
              </button>
              {categories.map((cat) => {
                const count = places.filter((p) => p.category?.id === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(String(cat.id))}
                    className={`px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors ${
                      categoryFilter === String(cat.id)
                        ? "bg-purple-600 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Places List */}
          <div className="max-h-[240px] overflow-y-auto">
            {groupedPlaces.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                {t("admin.cms.noPlacesFound")}
              </div>
            ) : (
              groupedPlaces.map((group) => (
                <div key={group.name}>
                  <div className="px-3 py-1.5 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider sticky top-0">
                    {group.name}
                  </div>
                  {group.items.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => {
                        onChange(String(place.id));
                        setOpen(false);
                        setSearch("");
                        setCategoryFilter("all");
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-purple-50 transition-colors flex items-center gap-2 ${
                        String(value) === String(place.id) ? "bg-purple-50" : ""
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{place.name}</p>
                        {place.address && (
                          <p className="text-[10px] text-muted-foreground truncate">{place.address}</p>
                        )}
                      </div>
                      {String(value) === String(place.id) && (
                        <CheckCircle className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Quick create */}
          {onCreateQuick && (
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                onClick={() => {
                  setOpen(false);
                  onCreateQuick();
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                {t("admin.cms.createNewPlace")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Trip Destinations Modal ──────────────────────────────────────────────────

const TripDestinationsModal = ({ open, onClose, tripItem }) => {
  const { t } = useTranslation();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeDay, setActiveDay] = useState(1);
  const [destActionLoading, setDestActionLoading] = useState(false);
  const [quickPlaceOpen, setQuickPlaceOpen] = useState(false);
  const [routeInfoMap, setRouteInfoMap] = useState({});

  // Form thêm chặng đi mới
  const [newDest, setNewDest] = useState({
    placeId: "",
    startTime: "",
    endTime: "",
    note: "",
    transportToNext: t("admin.cms.motorbike"),
  });

  const fetchTripDetail = useCallback(async () => {
    if (!tripItem?.id) return;
    setLoading(true);
    try {
      const res = await eventService.getTripDetail(tripItem.id);
      setTrip(res.data);
    } catch (err) {
      console.error("Lỗi lấy chi tiết chuyến đi:", err);
      toast.error(t("admin.cms.cannotLoadItinerary"));
    } finally {
      setLoading(false);
    }
  }, [tripItem]);

  useEffect(() => {
    if (!open || !tripItem?.id) return;
    fetchTripDetail();

    const fetchPlacesAndCategories = async () => {
      try {
        const [placesRes, catsRes] = await Promise.all([
          placeService.getAllPlaces({ limit: 200 }),
          categoryService.getAllCategories(),
        ]);
        setPlaces(placesRes.data || []);
        setCategories(catsRes || []);
      } catch (err) {
        console.error("Lỗi lấy danh sách địa điểm/danh mục:", err);
      }
    };
    fetchPlacesAndCategories();
    setActiveDay(1);
    setRouteInfoMap({});
  }, [open, tripItem, fetchTripDetail]);

  // Lọc các chặng đi của ngày hiện tại (derived state - phải đặt trước useEffect sử dụng)
  const currentDayDestinations = useMemo(() => {
    if (!trip?.destinations) return [];
    const filtered = trip.destinations.filter((d) => d.dayNumber === activeDay);
    filtered.sort((a, b) => {
      if (a.startTime && b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      return (a.order || 0) - (b.order || 0);
    });
    return filtered;
  }, [trip?.destinations, activeDay]);

  // Tự động tính khoảng cách khi destinations thay đổi
  useEffect(() => {
    if (!currentDayDestinations || currentDayDestinations.length < 2) return;

    const calculateRoutes = async () => {
      const newRouteInfo = { ...routeInfoMap };
      for (let i = 0; i < currentDayDestinations.length - 1; i++) {
        const from = currentDayDestinations[i];
        const to = currentDayDestinations[i + 1];
        const key = `${from.id}-${to.id}`;
        if (newRouteInfo[key]) continue;

        const info = await calculateLegDistance(from.place, to.place);
        if (info) {
          newRouteInfo[key] = info;
        }
      }
      setRouteInfoMap(newRouteInfo);
    };
    calculateRoutes();
  }, [currentDayDestinations?.length]);

  const handleAddDestination = async () => {
    if (!newDest.placeId) {
      toast.error(t("admin.cms.poi") + " " + t("common.required"));
      return;
    }
    setDestActionLoading(true);
    try {
      const payload = {
        placeId: parseInt(newDest.placeId, 10),
        dayNumber: activeDay,
        startTime: newDest.startTime || null,
        endTime: newDest.endTime || null,
        note: newDest.note || null,
        transportToNext: newDest.transportToNext || null,
      };
      await eventService.addDestination(trip.id, payload);
      toast.success(t("common.createdSuccessfully"));
      setNewDest((prev) => ({
        ...prev,
        startTime: "",
        endTime: "",
        note: "",
        transportToNext: t("admin.cms.motorbike"),
      }));
      fetchTripDetail();
    } catch (err) {
      console.error("Lỗi thêm địa điểm:", err);
      const msg = err.response?.data?.message || err.message;
      toast.error(msg || t("common.operationFailed"));
    } finally {
      setDestActionLoading(false);
    }
  };

  const handleDeleteDestination = async (destId) => {
    if (!window.confirm(t("admin.cms.confirmDeleteDestination"))) return;
    setDestActionLoading(true);
    try {
      await eventService.removeDestination(trip.id, destId);
      toast.success(t("common.deletedSuccessfully"));
      fetchTripDetail();
    } catch (err) {
      console.error("Lỗi xóa địa điểm:", err);
      toast.error(t("admin.cms.cannotDeleteDestination"));
    } finally {
      setDestActionLoading(false);
    }
  };

  if (!open) return null;

  const totalDays = trip?.totalDays || 1;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Compass className="h-4 w-4 text-purple-600" />
            </div>
            <span>{t("admin.cms.itineraryDetailTitle", { title: trip?.title })}</span>
          </DialogTitle>
          <DialogDescription>
            {t("admin.cms.itineraryDetailDesc")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <RefreshCw className="h-8 w-8 text-purple-600 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bộ chọn Ngày */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b">
              {Array.from({ length: totalDays }).map((_, idx) => {
                const day = idx + 1;
                return (
                  <Button
                    key={day}
                    variant={activeDay === day ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveDay(day)}
                    className={activeDay === day ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
                  >
                    {t("admin.cms.day", { n: day })}
                  </Button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Cột trái: Timeline lịch trình của ngày */}
              <div className="md:col-span-3 space-y-4">
                <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  {t("admin.cms.itineraryDay", { n: activeDay, count: currentDayDestinations.length })}
                </h3>

                {currentDayDestinations.length === 0 ? (
                  <div className="border border-dashed rounded-xl p-8 text-center text-muted-foreground bg-slate-50/50">
                    <Compass className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    {t("admin.cms.noDestinationsDay")}
                    <p className="text-xs mt-1">{t("admin.cms.useFormToAdd")}</p>
                  </div>
                ) : (
                  <div className="relative pl-6 border-l border-purple-100 space-y-0 py-2 ml-2">
                    {currentDayDestinations.map((dest, idx) => {
                      const isLast = idx === currentDayDestinations.length - 1;
                      const nextDest = !isLast ? currentDayDestinations[idx + 1] : null;
                      const routeKey = nextDest ? `${dest.id}-${nextDest.id}` : null;
                      const routeInfo = routeKey ? routeInfoMap[routeKey] : null;
                      const transportMode = TRANSPORT_MODES.find((m) => m.value === dest.transportToNext);
                      const TransportIcon = transportMode?.icon || Car;

                      return (
                        <div key={dest.id}>
                          {/* Destination Card */}
                          <div className="relative group/item">
                            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-purple-600 bg-white group-hover/item:bg-purple-600 transition-colors" />

                            <div className="bg-card p-3.5 rounded-lg border shadow-sm group-hover/item:border-purple-200 transition-all flex justify-between items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                    {dest.startTime || "00:00"}{dest.endTime ? ` - ${dest.endTime}` : ""}
                                  </span>
                                  <h4 className="font-semibold text-sm truncate">{dest.place?.name || t("admin.cms.defaultPlaceName")}</h4>
                                  {dest.place?.category && (
                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                      {dest.place.category.name}
                                    </span>
                                  )}
                                </div>

                                {dest.place?.address && (
                                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {dest.place.address}
                                  </p>
                                )}

                                {dest.note && (
                                  <p className="text-xs text-muted-foreground mt-1.5 bg-slate-50 p-1.5 rounded border border-slate-100">
                                    {dest.note}
                                  </p>
                                )}

                                {dest.transportToNext && (
                                  <div className={`text-[11px] font-medium mt-1.5 flex items-center gap-1.5 ${transportMode?.color || "text-indigo-600"}`}>
                                    <TransportIcon className="h-3.5 w-3.5" />
                                    <span>{t("admin.cms.transportLabel", { mode: dest.transportToNext })}</span>
                                    {routeInfo && (
                                      <span className="text-muted-foreground">
                                        ({routeInfo.distanceLabel} · {routeInfo.durationLabel})
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={destActionLoading}
                                className="h-7 w-7 text-destructive hover:bg-destructive/5 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                onClick={() => handleDeleteDestination(dest.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Connector line with route info */}
                          {!isLast && (
                            <div className="relative pl-0 py-2">
                              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-purple-100" />
                              <div className="ml-4 flex items-center gap-2">
                                {routeInfo ? (
                                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-purple-50/50 px-2 py-1 rounded-full border border-purple-100">
                                    <Route className="h-3 w-3 text-purple-400" />
                                    <span>{routeInfo.distanceLabel}</span>
                                    <span>·</span>
                                    <span>{routeInfo.durationLabel}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
                                    <ArrowRight className="h-3 w-3" />
                                    <span>{t("admin.cms.calculatingDistance")}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cột phải: Form thêm nhanh */}
              <div className="md:col-span-2">
                <Card className="border-purple-100 bg-purple-50/10 sticky top-0">
                  <CardHeader className="p-4 border-b">
                    <CardTitle className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                      <Plus className="h-4 w-4" /> {t("admin.cms.addDestination")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {/* Place Picker - searchable + categorized */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("admin.cms.poi")} *</Label>
                      <SearchablePlacePicker
                        places={places}
                        value={newDest.placeId}
                        onChange={(val) => setNewDest((p) => ({ ...p, placeId: val }))}
                        onCreateQuick={() => setQuickPlaceOpen(true)}
                      />
                    </div>

                    {/* Time inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("admin.cms.arrivalTime")}</Label>
                        <Input
                          type="time"
                          value={newDest.startTime}
                          onChange={(e) => setNewDest((p) => ({ ...p, startTime: e.target.value }))}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("admin.cms.departureTime")}</Label>
                        <Input
                          type="time"
                          value={newDest.endTime}
                          onChange={(e) => setNewDest((p) => ({ ...p, endTime: e.target.value }))}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    {/* Transport mode selection */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("admin.cms.nextTransport")}</Label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {TRANSPORT_MODES.map((mode) => {
                          const Icon = mode.icon;
                          const isSelected = newDest.transportToNext === mode.value;
                          return (
                            <button
                              key={mode.value}
                              type="button"
                              onClick={() => setNewDest((p) => ({ ...p, transportToNext: mode.value }))}
                              className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-medium transition-all ${
                                isSelected
                                  ? `${mode.bg} ${mode.color} border-current shadow-sm`
                                  : "bg-white border-border text-muted-foreground hover:bg-muted/50"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              {mode.value}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Note */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("admin.cms.activityNotes")}</Label>
                      <Input
                        value={newDest.note}
                        onChange={(e) => setNewDest((p) => ({ ...p, note: e.target.value }))}
                        placeholder={t("admin.cms.activityNotes") + "..."}
                        className="h-9 text-xs"
                      />
                    </div>

                    {/* Route preview hint */}
                    {newDest.placeId && currentDayDestinations.length > 0 && (
                      <div className="text-[10px] text-purple-600 bg-purple-50 p-2 rounded-lg flex items-center gap-1.5">
                        <Route className="h-3 w-3" />
                        {t("admin.cms.distanceAutoCalc")}
                      </div>
                    )}

                    <Button
                      onClick={handleAddDestination}
                      disabled={destActionLoading || !newDest.placeId}
                      className="w-full h-9 text-xs bg-purple-600 hover:bg-purple-700 text-white mt-2"
                    >
                      {destActionLoading && <RefreshCw className="h-3 w-3 mr-2 animate-spin" />}
                      {t("admin.cms.addToItinerary")}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            {t("admin.cms.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <QuickPlaceCreateModal
      open={quickPlaceOpen}
      onClose={() => setQuickPlaceOpen(false)}
      onSuccess={(newPlace) => {
        setPlaces((prev) => [newPlace, ...prev]);
        setNewDest((prev) => ({ ...prev, placeId: String(newPlace.id) }));
      }}
    />
  </>
  );
};

// ─── Generic Edit Modal ────────────────────────────────────────────────────────

const EditModal = ({ open, onClose, item, onSave, type, loading }) => {
  const { t } = useTranslation();
  const uniqueFileId = `generic-file-upload-${type?.id}`;

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    link: "",
    order: 1,
    active: true,
    image: "",
    startDate: "",
    endDate: "",
    location: "Cần Thơ",
    maxParticipants: "",
    broadcastNotice: "",
    status: "active",
  });

  useEffect(() => {
    if (open) {
      if (item) {
        // Map API fields → form fields (banner + announcement)
        const mapped = {
          ...item,
          description: item.description || item.body || "",
          image: item.image || item.imageUrl || "",
          link: item.link || item.linkValue || "",
          order: item.order ?? item.priority ?? 1,
          active: item.active ?? item.isActive ?? true,
        };
        setForm(mapped);
      } else {
        setForm({
          title: "",
          subtitle: "",
          description: "",
          link: "",
          order: 1,
          active: true,
          image: "",
          startDate: "",
          endDate: "",
          location: "Cần Thơ",
          maxParticipants: "",
          broadcastNotice: "",
          status: "active",
        });
      }
    }
  }, [open, item]);

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error(t("admin.cms.titleLabel").replace(" *", ""));
      return;
    }
    onSave(form);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t("common.operationFailed"));
        return;
      }
      try {
        const compressedBase64 = await compressBannerImage(file);
        setForm((prev) => ({ ...prev, image: compressedBase64 }));
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setForm((prev) => ({ ...prev, image: reader.result }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? t("admin.cms.editContent") : t("common.create")} {type?.label}
          </DialogTitle>
          <DialogDescription>
            {t("admin.cms.editContentDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>{t("admin.cms.titleLabel")}</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={t("admin.cms.titlePlaceholder")}
            />
          </div>

          {type?.id !== "pages" && (
            <div className="space-y-1.5">
              <Label>{t("admin.cms.subtitleLabel")}</Label>
              <Input
                value={form.subtitle || ""}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder={t("admin.cms.subtitlePlaceholder")}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{t("admin.cms.descriptionLabel")}</Label>
            <Textarea
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t("admin.cms.descriptionPlaceholder")}
              className="min-h-[100px]"
            />
          </div>

          {type?.id !== "pages" && (
            <>
              <div className="space-y-1.5">
                <Label>{t("admin.cms.linkLabel")}</Label>
                <Input
                  value={form.link || ""}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t("admin.cms.orderLabel")}</Label>
                  <Input
                    type="number"
                    value={form.order || 1}
                    onChange={(e) =>
                      setForm({ ...form, order: parseInt(e.target.value) || 1 })
                    }
                    min={1}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("admin.cms.statusLabel")}</Label>
                  <div className="flex items-center gap-2 h-10">
                    <span className="text-sm text-muted-foreground">
                      {form.active ? t("admin.cms.active") : t("admin.cms.hidden")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, active: !form.active })}
                      className="ml-auto"
                    >
                      {form.active ? (
                        <ToggleRight className="h-6 w-6 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {type?.id === "banners" && (
                <div className="space-y-1.5">
                  <Label>{t("admin.cms.imageLabel", { condition: item?.image ? t("admin.cms.imageUploadToChange") : "*" })}</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors relative bg-muted/20">
                    {form.image ? (
                      <div className="relative group">
                        <img
                          src={form.image}
                          alt="Preview"
                          className="mx-auto max-h-40 rounded-lg object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Label
                            htmlFor={uniqueFileId}
                            className="h-8 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium flex items-center justify-center cursor-pointer transition-colors"
                          >
                            {t("common.edit")}
                          </Label>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setForm((prev) => ({ ...prev, image: "" }));
                            }}
                          >
                            {t("common.delete")}
                          </Button>
                        </div>
                        <input
                          id={uniqueFileId}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <label htmlFor={uniqueFileId} className="cursor-pointer block">
                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {t("common.upload")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("admin.cms.imageMaxSize")}
                        </p>
                        <input
                          id={uniqueFileId}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {type?.id === "announcements" && (
            <div className="space-y-1.5">
              <Label>{t("admin.cms.notificationTypeLabel")}</Label>
              <Select
                value={form.type || "info"}
                onValueChange={(value) => setForm({ ...form, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">{t("admin.cms.infoType")}</SelectItem>
                  <SelectItem value="warning">{t("admin.cms.warningType")}</SelectItem>
                  <SelectItem value="promo">{t("admin.cms.promoType")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {type?.id === "pages" && (
            <>
              <div className="space-y-1.5">
                <Label>{t("admin.cms.slugLabel")}</Label>
                <Input
                  value={form.slug || ""}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder={t("admin.cms.slugPlaceholder")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("admin.cms.contentLabel")}</Label>
                <Textarea
                  value={form.content || ""}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder={t("admin.cms.contentPlaceholder")}
                  className="min-h-[200px]"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            {t("admin.cms.saveBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

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

// ─── Main Page ────────────────────────────────────────────────────────────────

const CMSContentPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("events");
  const [editModal, setEditModal] = useState({ open: false, item: null });
  const [destModal, setDestModal] = useState({ open: false, item: null });
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
        if (editModal.item?.id) {
          const res = await eventService.updateTrip(editModal.item.id, form);
          setItems((prev) =>
            prev.map((i) => (i.id === editModal.item.id ? res.data : i))
          );
          toast.success(t("common.updatedSuccessfully"));
        } else {
          const res = await eventService.createTrip(form);
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

        {/* Stats when on events tab */}
        {activeTab === "events" && !loading && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-0 bg-gradient-to-br from-rose-50 to-pink-50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{items.length}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.cms.events")}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeEventCount}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.cms.active")}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gradient-to-br from-yellow-50 to-amber-50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{featuredBannerCount}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.cms.featuredBanner")}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats when on trips tab */}
        {activeTab === "trips" && !loading && (
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-0 bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Compass className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalTrips}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.cms.sampleTrips")}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalClones}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.cms.sampleTrips")}</p>
                </div>
              </CardContent>
            </Card>
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
                <TripContentCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onManageDestinations={(trip) => setDestModal({ open: true, item: trip })}
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
        <TripEditModal
          open={editModal.open}
          onClose={() => setEditModal({ open: false, item: null })}
          item={editModal.item}
          onSave={handleSave}
          loading={isLoading}
        />
      )}

      {/* Trip Destinations Modal */}
      <TripDestinationsModal
        open={destModal.open}
        onClose={() => setDestModal({ open: false, item: null })}
        tripItem={destModal.item}
      />

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
