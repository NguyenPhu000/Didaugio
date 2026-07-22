import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Compass, MapPin, Plus, RefreshCw, Route, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as eventService from "@/apis/eventService";
import * as placeService from "@/apis/placeService";
import { SearchablePlacePicker } from "./SearchablePlacePicker";
import { TripRouteMapPreview } from "./TripRouteMapPreview";
import {
  countInclusiveDays,
  formatDateForViInput,
  getPlaceImage,
  parseViDateInput,
  sortDestinations,
} from "./sampleTripUtils";

const initialForm = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  totalDays: 1,
  travelStyle: "cultural",
  groupSize: 1,
};

const buildInitialForm = (item) =>
  item
    ? {
        title: item.title || "",
        description: item.description || "",
        startDate: item.startDate ? item.startDate.split("T")[0] : "",
        endDate: item.endDate ? item.endDate.split("T")[0] : "",
        totalDays: item.totalDays || 1,
        travelStyle: item.travelStyle || "cultural",
        groupSize: item.groupSize || 1,
      }
    : initialForm;

const buildDraftDestination = (place, index) => ({
  id: `draft-${place.id}`,
  placeId: place.id,
  dayNumber: 1,
  order: index,
  startTime: "",
  endTime: "",
  note: "",
  transportToNext: "",
  place,
});

function PlaceThumb({ place, className = "h-14 w-16" }) {
  const image = getPlaceImage(place);
  if (image) {
    return (
      <img
        src={image}
        alt={place?.name || ""}
        className={`${className} shrink-0 rounded-lg object-cover`}
      />
    );
  }
  return (
    <div className={`${className} flex shrink-0 items-center justify-center rounded-lg bg-violet-50`}>
      <MapPin className="h-5 w-5 text-violet-300" />
    </div>
  );
}

export function TripEditModal({ open, item, ...props }) {
  if (!open) return null;

  return (
    <TripEditModalContent
      key={item?.id ?? "new"}
      open={open}
      item={item}
      {...props}
    />
  );
}

function TripEditModalContent({ open, onClose, item, onSave, loading }) {
  const { t } = useTranslation();
  const isEdit = !!item?.id;
  const isDetailMode = item?.__mode === "detail";

  const [form, setForm] = useState(() => buildInitialForm(item));
  const [dateInput, setDateInput] = useState(() => ({
    startDate: formatDateForViInput(item?.startDate),
    endDate: formatDateForViInput(item?.endDate),
  }));
  const [places, setPlaces] = useState([]);
  const [tripDetail, setTripDetail] = useState(item || null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [destinationLoading, setDestinationLoading] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [draftDestinations, setDraftDestinations] = useState([]);

  const totalDays = parseInt(form.totalDays, 10) || 1;
  const rawDestinations = tripDetail?.stops || tripDetail?.destinations || [];
  const savedDestinations = useMemo(
    () => sortDestinations(rawDestinations),
    [rawDestinations],
  );
  const visibleDestinations = isEdit ? savedDestinations : draftDestinations;
  const currentDayDestinations = useMemo(
    () => visibleDestinations.filter((destination) => destination.dayNumber === activeDay),
    [activeDay, visibleDestinations],
  );

  const fetchPlaces = useCallback(async () => {
    try {
      const res = await placeService.getAllPlaces({ limit: 200 });
      setPlaces(res.data || []);
    } catch (err) {
      console.error("Cannot load places for sample trip:", err);
      toast.error(t("admin.cms.cannotLoadContent"));
    }
  }, [t]);

  const fetchTripDetail = useCallback(async () => {
    if (!item?.id) return;
    setDetailLoading(true);
    try {
      const res = await eventService.getTripDetail(item.id);
      setTripDetail(res.data || res);
    } catch (err) {
      console.error("Cannot load sample trip detail:", err);
      toast.error(t("admin.cms.cannotLoadContent"));
    } finally {
      setDetailLoading(false);
    }
  }, [item?.id, t]);

  useEffect(() => {
    fetchPlaces();
    if (isEdit) fetchTripDetail();
  }, [fetchPlaces, fetchTripDetail, isEdit]);

  useEffect(() => {
    if (activeDay > totalDays) setActiveDay(totalDays);
  }, [activeDay, totalDays]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const setDateField = (key, value) => {
    setDateInput((prev) => ({ ...prev, [key]: value }));

    const parsed = parseViDateInput(value);
    if (parsed !== undefined) {
      setForm((prev) => {
        const next = { ...prev, [key]: parsed };
        const calculatedDays = countInclusiveDays(next.startDate, next.endDate);
        return calculatedDays ? { ...next, totalDays: calculatedDays } : next;
      });
    } else if (!value.trim()) {
      setForm((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleAddDraftDestination = () => {
    if (isDetailMode) return;
    const place = places.find((candidate) => String(candidate.id) === String(selectedPlaceId));
    if (!place) {
      toast.error(`${t("admin.cms.poi")} ${t("common.required")}`);
      return;
    }
    if (!isEdit && draftDestinations.some((destination) => String(destination.placeId) === String(place.id))) {
      toast.error(t("admin.cms.placeAlreadyInTrip", "Dia diem da co trong lich trinh"));
      return;
    }

    setDraftDestinations((prev) => [
      ...prev,
      {
        ...buildDraftDestination(place, currentDayDestinations.length + 1),
        dayNumber: activeDay,
      },
    ]);
    setSelectedPlaceId("");
  };

  const handleAddSavedDestination = async () => {
    if (isDetailMode) return;
    const place = places.find((candidate) => String(candidate.id) === String(selectedPlaceId));
    if (!place || !item?.id) {
      toast.error(`${t("admin.cms.poi")} ${t("common.required")}`);
      return;
    }

    setDestinationLoading(true);
    try {
      await eventService.addDestination(item.id, {
        placeId: parseInt(place.id, 10),
        dayNumber: activeDay,
        startTime: null,
        endTime: null,
        note: null,
        transportToNext: null,
      });
      setSelectedPlaceId("");
      await fetchTripDetail();
      toast.success(t("common.createdSuccessfully"));
    } catch (err) {
      console.error("Cannot add destination:", err);
      toast.error(err.response?.data?.message || err.message || t("common.operationFailed"));
    } finally {
      setDestinationLoading(false);
    }
  };

  const handleRemoveDestination = async (destination) => {
    if (isDetailMode) return;
    if (!isEdit) {
      setDraftDestinations((prev) => prev.filter((item) => item.id !== destination.id));
      return;
    }
    if (!window.confirm(t("admin.cms.confirmDeleteDestination"))) return;

    setDestinationLoading(true);
    try {
      await eventService.removeDestination(item.id, destination.id);
      await fetchTripDetail();
      toast.success(t("common.deletedSuccessfully"));
    } catch (err) {
      console.error("Cannot delete destination:", err);
      toast.error(t("admin.cms.cannotDeleteDestination"));
    } finally {
      setDestinationLoading(false);
    }
  };

  const handleSave = () => {
    const parsedStartDate = parseViDateInput(dateInput.startDate);
    const parsedEndDate = parseViDateInput(dateInput.endDate);

    if (parsedStartDate === undefined || parsedEndDate === undefined) {
      toast.error("Vui lòng nhập ngày theo định dạng dd/mm/yyyy");
      return;
    }

    if (!form.title.trim()) {
      toast.error(`${t("admin.cms.tripName")} ${t("common.required")}`);
      return;
    }
    if (parsedStartDate && parsedEndDate && parsedEndDate < parsedStartDate) {
      toast.error(t("admin.cms.endDateError") || "End date cannot be before start date");
      return;
    }

    const finalTotalDays = countInclusiveDays(parsedStartDate, parsedEndDate) || totalDays;

    onSave({
      ...form,
      totalDays: finalTotalDays,
      groupSize: parseInt(form.groupSize, 10) || 1,
      startDate: parsedStartDate || null,
      endDate: parsedEndDate || null,
      ...(!isEdit ? { draftDestinations } : {}),
    });
  };

  const renderItineraryBody = () => {
    if (detailLoading) {
      return (
        <div className="flex justify-center py-10">
          <RefreshCw className="h-7 w-7 animate-spin text-violet-700" />
        </div>
      );
    }

    if (currentDayDestinations.length === 0) {
      return (
        <div className="rounded-xl border border-dashed bg-slate-50 p-8 text-center text-sm text-muted-foreground">
          <Compass className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          {t("admin.cms.noDestinationsDay")}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {currentDayDestinations.map((destination, index) => (
          <div
            key={destination.id}
            className="group flex items-start gap-3 rounded-xl border bg-card p-3 shadow-sm transition-colors hover:border-violet-200"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-700 text-xs font-bold text-white">
              {index + 1}
            </div>
            <PlaceThumb place={destination.place} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="truncate text-sm font-semibold">
                  {destination.place?.name || t("admin.cms.defaultPlaceName")}
                </h4>
                {destination.place?.category ? (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {destination.place.category.name}
                  </span>
                ) : null}
              </div>
              {destination.place?.address ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {destination.place.address}
                </p>
              ) : null}
              {destination.note ? (
                <p className="mt-1 rounded bg-slate-50 p-1.5 text-xs text-muted-foreground">
                  {destination.note}
                </p>
              ) : null}
            </div>
            {!isDetailMode ? (
              <Button
                variant="ghost"
                size="icon"
                disabled={destinationLoading}
                className="h-8 w-8 shrink-0 text-destructive opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                onClick={() => handleRemoveDestination(destination)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
              <Compass className="h-4 w-4 text-violet-700" />
            </div>
            {isDetailMode
              ? t("admin.cms.itineraryDetails")
              : isEdit
                ? t("admin.cms.editSampleTrip")
                : t("admin.cms.createSampleTrip")}
          </DialogTitle>
          <DialogDescription>{t("admin.cms.tripDialogTitle")}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <div className="space-y-4 xl:col-span-2">
            <Card className="border-violet-100">
              <CardHeader className="border-b p-4">
                <CardTitle className="text-sm font-semibold text-violet-800">
                  Thong tin chuyen di mau
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="space-y-1.5">
                  <Label>{t("admin.cms.tripNameLabel")}</Label>
                  <Input
                    value={form.title}
                    disabled={isDetailMode}
                    onChange={(event) => setField("title", event.target.value)}
                    placeholder={t("admin.cms.tripNamePlaceholder")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>{t("admin.cms.tripDescLabel")}</Label>
                  <Textarea
                    value={form.description}
                    disabled={isDetailMode}
                    onChange={(event) => setField("description", event.target.value)}
                    placeholder={t("admin.cms.tripDescPlaceholder")}
                    className="min-h-[88px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>{t("admin.cms.expectedStartDate")}</Label>
                    <Input
                      value={dateInput.startDate}
                      disabled={isDetailMode}
                      onChange={(event) => setDateField("startDate", event.target.value)}
                      placeholder="dd/mm/yyyy"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("admin.cms.expectedEndDate")}</Label>
                    <Input
                      value={dateInput.endDate}
                      disabled={isDetailMode}
                      onChange={(event) => setDateField("endDate", event.target.value)}
                      placeholder="dd/mm/yyyy"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>{t("admin.cms.totalDays")}</Label>
                    <Input
                      type="number"
                      value={form.totalDays}
                      disabled={isDetailMode}
                      onChange={(event) => setField("totalDays", event.target.value)}
                      min={1}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("admin.cms.groupSizeLabel")}</Label>
                    <Input
                      type="number"
                      value={form.groupSize}
                      disabled={isDetailMode}
                      onChange={(event) => setField("groupSize", event.target.value)}
                      min={1}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("admin.cms.styleLabel")}</Label>
                    <Select
                      value={form.travelStyle}
                      onValueChange={(value) => setField("travelStyle", value)}
                      disabled={isDetailMode}
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
              </CardContent>
            </Card>

            {!isDetailMode ? (
              <Card className="border-violet-100 bg-violet-50/20">
                <CardHeader className="border-b p-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-violet-800">
                    <Plus className="h-4 w-4" />
                    Them diem vao lich trinh
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  <SearchablePlacePicker
                    places={places}
                    value={selectedPlaceId}
                    onChange={setSelectedPlaceId}
                  />
                  <Button
                    onClick={isEdit ? handleAddSavedDestination : handleAddDraftDestination}
                    disabled={destinationLoading || !selectedPlaceId}
                    className="w-full bg-violet-700 text-white hover:bg-violet-800"
                  >
                    {destinationLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t("admin.cms.addToItinerary")}
                  </Button>
                  {!isEdit ? (
                    <p className="text-[11px] text-muted-foreground">
                      Diem moi se duoc tao vao ngay dang chon: ngay {activeDay}.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-4 xl:col-span-3">
            <TripRouteMapPreview
              destinations={visibleDestinations}
              activeDay={activeDay}
              className="h-[320px]"
            />

            <div className="flex items-center gap-2 overflow-x-auto border-b pb-2">
              {Array.from({ length: totalDays }).map((_, index) => {
                const day = index + 1;
                return (
                  <Button
                    key={day}
                    variant={activeDay === day ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveDay(day)}
                    className={activeDay === day ? "bg-violet-700 text-white hover:bg-violet-800" : ""}
                  >
                    {t("admin.cms.day", { n: day })}
                  </Button>
                );
              })}
            </div>

            <Card>
              <CardHeader className="border-b p-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Clock className="h-4 w-4 text-violet-700" />
                  {t("admin.cms.itineraryDay", {
                    n: activeDay,
                    count: currentDayDestinations.length,
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">{renderItineraryBody()}</CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="mt-2 gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading || destinationLoading}>
            {isDetailMode ? t("admin.cms.close") : t("common.cancel")}
          </Button>
          {!isDetailMode ? (
            <Button
              onClick={handleSave}
              disabled={loading || destinationLoading}
              className="bg-violet-700 font-medium text-white hover:bg-violet-800"
            >
              {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEdit ? t("admin.cms.saveChanges") : t("admin.cms.createItinerary")}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
