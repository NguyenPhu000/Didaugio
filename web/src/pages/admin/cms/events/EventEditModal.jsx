import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Calendar, CheckCircle, Compass, Eye, EyeOff, FileText, Globe, Image as ImageIcon, Link, MapPin, Plus, RefreshCw, Star, ToggleLeft, ToggleRight, Upload, Users, X, XCircle, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";import * as eventService from "@/apis/eventService";
import { TripEditModal as SampleTripEditModal } from "../sample-trips";
import { compressBannerImage } from "../banners/imageCompression";
import { ImageUploadArea } from "../shared/ImageUploadArea";
export const EventEditModal = ({ open, onClose, item, onSave, loading }) => {
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
                placeholder={`${t("admin.cms.eventName")  }...`}

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

