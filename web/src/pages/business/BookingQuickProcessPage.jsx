import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  X,
  Clock,
  Users,
  Phone,
  Calendar,
  DollarSign,
  Eye,
  CheckCircle2,
  XCircle,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Loader2,
  MapPin,
} from "lucide-react";
import * as bookingApi from "@/apis/bookingService";
import * as ruleApi from "@/apis/bookingAutoRuleApi";
import { getMyPlaces } from "@/apis/businessApi";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { BOOKING_STATUS } from "@/constants/constants";
import { TIME_SLOT_KEYS, TIME_SLOT_LABELS } from "@/constants/bookingSchedule";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import {
  BusinessPageHeader,
  BusinessSectionCard,
  BusinessEmptyState,
} from "@/components/business/ui";
import {
  formatDate,
  formatVND,
} from "@/components/business/dashboardWidgetHelpers";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SLOT_OPTIONS = [
  TIME_SLOT_KEYS.MORNING,
  TIME_SLOT_KEYS.NOON,
  TIME_SLOT_KEYS.AFTERNOON,
  TIME_SLOT_KEYS.EVENING,
];

const BookingQuickProcessPage = memo(() => {
  const { t } = useTranslation();
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    priority: 0,
    timeSlots: [],
    minQuantity: "",
    maxQuantity: "",
    isActive: true,
  });
  const [guestOption, setGuestOption] = useState("all");
  const [places, setPlaces] = useState([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState("all");
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [confirmDeleteRule, setConfirmDeleteRule] = useState(null);

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingApi.getAll({
        status: BOOKING_STATUS.PENDING,
        limit: 100,
        page: 1,
      });
      if (res?.success) setPending(res.data || []);
      else toast.error(res?.message || t("business.quickProcess.loadListFailed"));
    } catch (e) {
      toastApiErrorIfNeeded(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRules = useCallback(async () => {
    setRulesLoading(true);
    try {
      const res = await ruleApi.list();
      if (res?.success) setRules(res.data || []);
      else toast.error(res?.message || t("business.quickProcess.loadRuleFailed"));
    } catch (e) {
      toastApiErrorIfNeeded(e);
    } finally {
      setRulesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  useEffect(() => {
    if (tab === "rules") loadRules();
  }, [tab, loadRules]);

  useEffect(() => {
    getMyPlaces()
      .then((res) => {
        setPlaces(res?.data || []);
      })
      .catch((err) => console.error("Failed to load places in quick process page:", err));
  }, []);

  const filteredPending = useMemo(() => {
    if (selectedPlaceId === "all") return pending;
    return pending.filter((b) => {
      const place = b.service?.place || b.place;
      return place && String(place.id) === selectedPlaceId;
    });
  }, [pending, selectedPlaceId]);

  const toggleSelect = useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const selectAll = useCallback((checked) => {
    if (checked) setSelected(filteredPending.map((b) => b.id));
    else setSelected([]);
  }, [filteredPending]);

  const handleQuickApprove = async (id) => {
    setBusyId(id);
    try {
      const res = await bookingApi.quickApprove(id);
      if (res?.success) {
        toast.success(t("business.bookings.confirmedSuccess"));
        await loadPending();
      } else toast.error(res?.message || t("common.operationFailed"));
    } catch (e) {
      toastApiErrorIfNeeded(e);
    } finally {
      setBusyId(null);
    }
  };

  const handleQuickReject = async (id) => {
    setBusyId(id);
    try {
      const res = await bookingApi.quickReject(id);
      if (res?.success) {
        toast.success(t("business.bookings.rejectedSuccess"));
        await loadPending();
      } else toast.error(res?.message || t("common.operationFailed"));
    } catch (e) {
      toastApiErrorIfNeeded(e);
    } finally {
      setBusyId(null);
    }
  };

  const bulkApprove = useCallback(async () => {
    setBulkActionLoading(true);
    try {
      const results = await Promise.allSettled(
        selected.map((id) => bookingApi.quickApprove(id))
      );
      const successCount = results.filter((r) => r.status === "fulfilled" && r.value?.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) toast.success(`${t("business.bookings.confirmedSuccess")} ${successCount}`);
      if (failCount > 0) toast.error(`${failCount} ${t("common.operationFailed")}`);

      setSelected([]);
      await loadPending();
    } finally {
      setBulkActionLoading(false);
    }
  }, [selected, t, loadPending]);

  const bulkReject = useCallback(async () => {
    setBulkActionLoading(true);
    try {
      const results = await Promise.allSettled(
        selected.map((id) => bookingApi.quickReject(id))
      );
      const successCount = results.filter((r) => r.status === "fulfilled" && r.value?.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) toast.success(`${t("business.bookings.rejectedSuccess")} ${successCount}`);
      if (failCount > 0) toast.error(`${failCount} ${t("common.operationFailed")}`);

      setSelected([]);
      await loadPending();
    } finally {
      setBulkActionLoading(false);
    }
  }, [selected, t, loadPending]);

  const submitRule = async () => {
    const conditions = {};
    if (ruleForm.timeSlots.length) conditions.timeSlots = ruleForm.timeSlots;
    if (ruleForm.minQuantity !== "")
      conditions.minQuantity = parseInt(ruleForm.minQuantity, 10);
    if (ruleForm.maxQuantity !== "")
      conditions.maxQuantity = parseInt(ruleForm.maxQuantity, 10);

    if (
      !conditions.timeSlots?.length &&
      conditions.minQuantity == null &&
      conditions.maxQuantity == null
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      const res = await ruleApi.create({
        priority: ruleForm.priority,
        conditions,
        isActive: ruleForm.isActive,
      });
      if (res?.success) {
        toast.success(t("common.createdSuccessfully"));
        setRuleOpen(false);
        setRuleForm({
          priority: 0,
          timeSlots: [],
          minQuantity: "",
          maxQuantity: "",
          isActive: true,
        });
        await loadRules();
      } else toast.error(res?.message || t("business.quickProcess.errorOccurred"));
    } catch (e) {
      toastApiErrorIfNeeded(e);
    }
  };

  const toggleRuleActive = async (rule) => {
    try {
      const res = await ruleApi.update(rule.id, { isActive: !rule.isActive });
      if (res?.success) {
        await loadRules();
        toast.success(rule.isActive ? t("common.disabled") : t("common.enabled"));
      }
    } catch (e) {
      toastApiErrorIfNeeded(e);
    }
  };

  const deleteRule = (rule) => {
    setConfirmDeleteRule(rule);
  };

  const handleConfirmDeleteRule = async () => {
    const rule = confirmDeleteRule;
    setConfirmDeleteRule(null);
    if (!rule) return;
    try {
      const res = await ruleApi.remove(rule.id);
      if (res?.success) {
        toast.success(t("common.deletedSuccessfully"));
        await loadRules();
      }
    } catch (e) {
      toastApiErrorIfNeeded(e);
    }
  };

  const getTimeSlotLabel = (slot) => TIME_SLOT_LABELS[slot] || slot;

  const renderConditions = useCallback((conditions) => {
    const parts = [];
    if (conditions?.timeSlots?.length) {
      parts.push(`${t("business.quickProcess.timeSlot")}: ${conditions.timeSlots.map(getTimeSlotLabel).join(", ")}`);
    }
    if (conditions?.minQuantity != null) {
      parts.push(`${t("business.quickProcess.minGuests")}: ${conditions.minQuantity}`);
    }
    if (conditions?.maxQuantity != null) {
      parts.push(`${t("business.quickProcess.maxGuests")}: ${conditions.maxQuantity}`);
    }
    return parts.join(" | ");
  }, [t]);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4 md:p-6 lg:p-8 space-y-6">
      <Link
        to={BUSINESS_ROUTES.BOOKINGS}
        className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200/85 hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-800/80 transition-all duration-300 w-fit text-zinc-600 dark:text-zinc-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("common.back")}
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-150 pb-5 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent dark:from-white dark:to-zinc-400">
            {t("business.quickProcess.title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1 dark:text-zinc-400">
            Quản lý xử lý nhanh đặt chỗ chờ duyệt & thiết lập quy tắc tự động hóa
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-zinc-100/80 dark:bg-zinc-900 p-1 rounded-xl grid w-full grid-cols-2 max-w-md shadow-sm border border-zinc-200/30 dark:border-zinc-800/30">
          <TabsTrigger
            value="pending"
            className={cn(
              "gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
              "data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm",
              "dark:data-[state=active]:bg-zinc-950 dark:data-[state=active]:text-white"
            )}
          >
            <Clock className="h-4 w-4 text-zinc-500" />
            {t("business.schedule.pending")}
            {pending.length > 0 && (
              <Badge className="ml-1.5 bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-foreground border-none px-2 py-0.5 text-xs font-bold font-mono">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="rules"
            className={cn(
              "gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
              "data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm",
              "dark:data-[state=active]:bg-zinc-950 dark:data-[state=active]:text-white"
            )}
          >
            <Sparkles className="h-4 w-4 text-zinc-500" />
            {t("business.schedule.processing")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6 space-y-4 animate-in fade-in duration-200">
          {selected.length > 0 && (
            <div className="sticky top-20 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-250/80 bg-white/95 dark:bg-zinc-950/95 p-4 shadow-xl backdrop-blur animate-in fade-in slide-in-from-top-3 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <Badge className="text-xs px-3 py-1.5 bg-primary/10 text-primary border-none font-bold">
                  {t("business.bookingDetail.selectedCount", { count: selected.length })}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={bulkApprove}
                  disabled={bulkActionLoading}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                >
                  {bulkActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {t("business.bookings.bulkConfirm")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={bulkReject}
                  disabled={bulkActionLoading}
                  className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 font-semibold shadow-sm dark:border-rose-950 dark:hover:bg-rose-950/40"
                >
                  {bulkActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {t("business.bookings.reject")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected([])}
                  className="gap-1.5 text-zinc-500 font-semibold"
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          )}

          {places.length > 0 && (
            <div className="flex items-center gap-2 max-w-xs bg-white p-2 rounded-lg border dark:bg-zinc-950 dark:border-zinc-800 shadow-sm mb-4">
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap px-1">Lọc theo Địa điểm:</span>
              <Select value={selectedPlaceId} onValueChange={setSelectedPlaceId}>
                <SelectTrigger className="h-8 text-xs border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Tất cả địa điểm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả địa điểm</SelectItem>
                  {places.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-20 bg-muted rounded-lg" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPending.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg">{t("business.bookings.noBookings")}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Hiện tại không có đặt chỗ nào phù hợp đang chờ duyệt
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-1">
                <Checkbox
                  checked={filteredPending.length > 0 && selected.length === filteredPending.length}
                  onCheckedChange={selectAll}
                />
                <span className="text-sm text-muted-foreground font-semibold">
                  Chọn tất cả ({filteredPending.length})
                </span>
              </div>

              {filteredPending.map((b) => (
                <Card
                  key={b.id}
                  className={cn(
                    "transition-all duration-200 border-zinc-200/80 shadow-sm dark:border-zinc-800/80",
                    selected.includes(b.id) && "ring-2 ring-primary/30 bg-primary/5 border-primary/45",
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <Checkbox
                        checked={selected.includes(b.id)}
                        onCheckedChange={() => toggleSelect(b.id)}
                        className="shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className="font-semibold text-zinc-950 dark:text-zinc-50 text-base">
                            {b.guestName || t("business.bookingDetail.guestLabel")}
                          </h4>
                          <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
                            {b.bookingCode}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-zinc-400" />
                            <span>{b.guestPhone || "-"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                            <span>{formatDate(b.useDate)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-zinc-400" />
                            <span>{b.useTime || "-"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                              {formatVND(b.finalPrice)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-dashed border-zinc-150 pt-2.5 dark:border-zinc-800">
                          {b.service?.name && (
                            <div className="flex items-center gap-1">
                              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                              <span className="font-medium text-zinc-700 dark:text-zinc-300">{b.service.name}</span>
                            </div>
                          )}
                          {(b.service?.place?.name || b.place?.name) && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                              <span>{b.service?.place?.name || b.place?.name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleQuickApprove(b.id)}
                          disabled={busyId === b.id}
                          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {busyId === b.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          {t("business.bookings.confirm")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickReject(b.id)}
                          disabled={busyId === b.id}
                          className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-950 dark:hover:bg-rose-950/40"
                        >
                          {busyId === b.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          {t("business.bookings.reject")}
                        </Button>
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={BUSINESS_ROUTES.BOOKING_DETAIL(b.id)}>
                            <Eye className="h-4 w-4 text-zinc-500" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rules" className="mt-6 space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-end">
            <Button
              onClick={() => setRuleOpen(true)}
              className="gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold shadow-sm dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950"
            >
              <Plus className="h-4 w-4" />
              Tạo quy tắc mới
            </Button>
          </div>

          {rulesLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse border-zinc-200/60 dark:border-zinc-800">
                  <CardContent className="p-5 space-y-3">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-8 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : rules.length === 0 ? (
            <Card className="border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/30 rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-primary/10 p-4 mb-4 text-primary animate-pulse">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-lg">Chưa thiết lập quy tắc tự động</h3>
                <p className="text-sm text-zinc-500 mt-1.5 text-center max-w-sm dark:text-zinc-400">
                  Quy tắc tự động giúp hệ thống tự phê duyệt các đặt chỗ đáp ứng các tiêu chuẩn về giờ giấc và số khách mà không cần duyệt thủ công.
                </p>
                <Button
                  variant="outline"
                  className="mt-6 gap-2 border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  onClick={() => setRuleOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  {t("common.create")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {rules.map((r) => (
                <Card
                  key={r.id}
                  className={cn(
                    "transition-all duration-300 shadow-sm border border-zinc-250/80 dark:border-zinc-800/80 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700",
                    !r.isActive && "bg-zinc-50/50 dark:bg-zinc-950/20 opacity-70",
                    r.isActive && "bg-white dark:bg-zinc-950 border-l-4 border-l-emerald-500"
                  )}
                >
                  <CardHeader className="pb-2 pt-4 px-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={r.isActive ? "default" : "secondary"}
                          className={cn(
                            "gap-1 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5",
                            r.isActive ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
                          )}
                        >
                          {r.isActive ? (
                            <ToggleRight className="h-3 w-3" />
                          ) : (
                            <ToggleLeft className="h-3 w-3" />
                          )}
                          {r.isActive ? t("common.active") : t("common.inactive")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={r.isActive}
                          onCheckedChange={() => toggleRuleActive(r)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 px-5 pb-5">
                    <div className="bg-zinc-50/50 p-3 rounded-lg border border-zinc-150 dark:bg-zinc-900/30 dark:border-zinc-900">
                      <p className="text-[11px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-1">
                        {t("business.quickProcess.conditionLabel")}
                      </p>
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        {renderConditions(r.conditions) || t("business.quickProcess.noCondition")}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-zinc-150 pt-3 dark:border-zinc-800">
                      <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                        {t("business.quickProcess.priorityLabel")}: <span className="font-bold text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded ml-1">{r.priority}</span>
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteRule(r)}
                        className="gap-1 h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50/70 dark:text-rose-400 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t("common.delete")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Tạo quy tắc tự động
            </DialogTitle>
            <DialogDescription>
              Thiết lập quy tắc xử lý tự động cho đặt chỗ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Độ ưu tiên</Label>
              <p className="text-xs text-muted-foreground">
                Quy tắc có độ ưu tiên cao sẽ được áp dụng trước
              </p>
              <Select
                value={String(ruleForm.priority)}
                onValueChange={(v) => setRuleForm((f) => ({ ...f, priority: Number(v) || 0 }))}
              >
                <SelectTrigger id="priority" className="bg-white dark:bg-zinc-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Thấp (Độ ưu tiên 0)</SelectItem>
                  <SelectItem value="1">Trung bình (Độ ưu tiên 1)</SelectItem>
                  <SelectItem value="2">Cao (Độ ưu tiên 2)</SelectItem>
                  <SelectItem value="3">Rất cao (Độ ưu tiên 3)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Khung giờ áp dụng</Label>
              <p className="text-xs text-muted-foreground">
                Chọn khung giờ quy tắc này có hiệu lực
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SLOT_OPTIONS.map((slot) => (
                  <label
                    key={slot}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50",
                      ruleForm.timeSlots.includes(slot)
                        ? "border-primary bg-primary/5"
                        : "border-border",
                    )}
                  >
                    <Checkbox
                      checked={ruleForm.timeSlots.includes(slot)}
                      onCheckedChange={(ck) => {
                        setRuleForm((f) => ({
                          ...f,
                          timeSlots: ck
                            ? [...f.timeSlots, slot]
                            : f.timeSlots.filter((s) => s !== slot),
                        }));
                      }}
                    />
                    <span className="text-sm font-medium">
                      {getTimeSlotLabel(slot)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Số lượng khách hàng</Label>
              <p className="text-xs text-muted-foreground">
                Quy tắc áp dụng cho nhóm khách hàng quy mô nào
              </p>
              <Select
                value={guestOption}
                onValueChange={(val) => {
                  setGuestOption(val);
                  if (val === "all") {
                    setRuleForm((f) => ({ ...f, minQuantity: "", maxQuantity: "" }));
                  } else if (val === "1-4") {
                    setRuleForm((f) => ({ ...f, minQuantity: "1", maxQuantity: "4" }));
                  } else if (val === "5-10") {
                    setRuleForm((f) => ({ ...f, minQuantity: "5", maxQuantity: "10" }));
                  } else if (val === "10-above") {
                    setRuleForm((f) => ({ ...f, minQuantity: "10", maxQuantity: "" }));
                  }
                }}
              >
                <SelectTrigger className="bg-white dark:bg-zinc-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả số khách (Mặc định)</SelectItem>
                  <SelectItem value="1-4">Nhóm nhỏ (1 - 4 khách)</SelectItem>
                  <SelectItem value="5-10">Nhóm vừa (5 - 10 khách)</SelectItem>
                  <SelectItem value="10-above">Nhóm lớn (Từ 10 khách trở lên)</SelectItem>
                  <SelectItem value="custom">Tùy chỉnh (Tự nhập khoảng)</SelectItem>
                </SelectContent>
              </Select>

              {guestOption === "custom" && (
                <div className="grid grid-cols-2 gap-3 pt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="space-y-1">
                    <Label className="text-xs">Số khách tối thiểu</Label>
                    <Input
                      type="number"
                      min="1"
                      value={ruleForm.minQuantity}
                      onChange={(e) =>
                        setRuleForm((f) => ({ ...f, minQuantity: e.target.value }))
                      }
                      placeholder="0"
                      className="bg-white dark:bg-zinc-950"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Số khách tối đa</Label>
                    <Input
                      type="number"
                      min="1"
                      value={ruleForm.maxQuantity}
                      onChange={(e) =>
                        setRuleForm((f) => ({ ...f, maxQuantity: e.target.value }))
                      }
                      placeholder="0"
                      className="bg-white dark:bg-zinc-950"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="text-base">Kích hoạt</Label>
                <p className="text-xs text-muted-foreground">
                  Bật/tắt quy tắc này
                </p>
              </div>
              <Switch
                checked={ruleForm.isActive}
                onCheckedChange={(v) =>
                  setRuleForm((f) => ({ ...f, isActive: v }))
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRuleOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={submitRule} className="gap-1.5">
              <Check className="h-4 w-4" />
              {t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDeleteRule} onOpenChange={(open) => { if (!open) setConfirmDeleteRule(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              {t("common.confirmDelete")}
            </DialogTitle>
            <DialogDescription>
              {t("common.confirmDelete")}{" "}
              <span className="font-semibold text-foreground">
                "{confirmDeleteRule?.id}"
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteRule(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteRule}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

BookingQuickProcessPage.displayName = "BookingQuickProcessPage";

export default BookingQuickProcessPage;
