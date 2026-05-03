import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
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
} from "lucide-react";
import * as bookingApi from "@/apis/bookingService";
import * as ruleApi from "@/apis/bookingAutoRuleApi";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { BOOKING_STATUS } from "@/constants/constants";
import { TIME_SLOT_KEYS, TIME_SLOT_LABELS } from "@/constants/bookingSchedule";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import {
  PageHeader,
  SectionCard,
  EmptyState,
} from "@/components/business/DashboardWidgets";
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
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const SLOT_OPTIONS = [
  TIME_SLOT_KEYS.MORNING,
  TIME_SLOT_KEYS.NOON,
  TIME_SLOT_KEYS.AFTERNOON,
  TIME_SLOT_KEYS.EVENING,
];

const BookingQuickProcessPage = () => {
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
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingApi.getAll({
        status: BOOKING_STATUS.PENDING,
        limit: 100,
        page: 1,
      });
      if (res?.success) setPending(res.data || []);
      else toast.error(res?.message || "Không tải được danh sách");
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
      else toast.error(res?.message || "Không tải được rule");
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

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAll = (checked) => {
    if (checked) setSelected(pending.map((b) => b.id));
    else setSelected([]);
  };

  const handleQuickApprove = async (id) => {
    setBusyId(id);
    try {
      const res = await bookingApi.quickApprove(id);
      if (res?.success) {
        toast.success("Đã duyệt thành công");
        await loadPending();
      } else toast.error(res?.message || "Lỗi xảy ra");
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
        toast.success("Đã từ chối");
        await loadPending();
      } else toast.error(res?.message || "Lỗi xảy ra");
    } catch (e) {
      toastApiErrorIfNeeded(e);
    } finally {
      setBusyId(null);
    }
  };

  const bulkApprove = async () => {
    setBulkActionLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selected) {
      try {
        const res = await bookingApi.quickApprove(id);
        if (res?.success) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    if (successCount > 0) toast.success(`Đã duyệt ${successCount} booking`);
    if (failCount > 0) toast.error(`${failCount} booking bị lỗi`);

    setSelected([]);
    setBulkActionLoading(false);
    await loadPending();
  };

  const bulkReject = async () => {
    setBulkActionLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selected) {
      try {
        const res = await bookingApi.quickReject(id);
        if (res?.success) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    if (successCount > 0) toast.success(`Đã từ chối ${successCount} booking`);
    if (failCount > 0) toast.error(`${failCount} booking bị lỗi`);

    setSelected([]);
    setBulkActionLoading(false);
    await loadPending();
  };

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
      toast.error("Chọn ít nhất một khung giờ hoặc điều kiện số lượng");
      return;
    }

    try {
      const res = await ruleApi.create({
        priority: ruleForm.priority,
        conditions,
        isActive: ruleForm.isActive,
      });
      if (res?.success) {
        toast.success("Đã tạo rule thành công");
        setRuleOpen(false);
        setRuleForm({
          priority: 0,
          timeSlots: [],
          minQuantity: "",
          maxQuantity: "",
          isActive: true,
        });
        await loadRules();
      } else toast.error(res?.message || "Lỗi xảy ra");
    } catch (e) {
      toastApiErrorIfNeeded(e);
    }
  };

  const toggleRuleActive = async (rule) => {
    try {
      const res = await ruleApi.update(rule.id, { isActive: !rule.isActive });
      if (res?.success) {
        await loadRules();
        toast.success(rule.isActive ? "Đã tắt rule" : "Đã bật rule");
      }
    } catch (e) {
      toastApiErrorIfNeeded(e);
    }
  };

  const deleteRule = async (rule) => {
    if (!window.confirm("Bạn có chắc muốn xóa rule này?")) return;
    try {
      const res = await ruleApi.remove(rule.id);
      if (res?.success) {
        toast.success("Đã xóa rule");
        await loadRules();
      }
    } catch (e) {
      toastApiErrorIfNeeded(e);
    }
  };

  const getTimeSlotLabel = (slot) => TIME_SLOT_LABELS[slot] || slot;

  const renderConditions = (conditions) => {
    const parts = [];
    if (conditions?.timeSlots?.length) {
      parts.push(`Khung gio: ${conditions.timeSlots.map(getTimeSlotLabel).join(", ")}`);
    }
    if (conditions?.minQuantity != null) {
      parts.push(`Toi thieu: ${conditions.minQuantity}`);
    }
    if (conditions?.maxQuantity != null) {
      parts.push(`Toi da: ${conditions.maxQuantity}`);
    }
    return parts.join(" | ");
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 min-h-screen bg-muted/30">
      <Link
        to={BUSINESS_ROUTES.BOOKINGS}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách
      </Link>

      <PageHeader
        title="Xử lý đặt chỗ nhanh"
        subtitle="Duyệt hoặc từ chối tức thì và cấu hình auto-duyệt theo rule"
      />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Chờ xử lý
            {pending.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Auto-duyệt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6 space-y-4">
          {selected.length > 0 && (
            <div className="sticky top-20 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {selected.length} được chọn
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={bulkApprove}
                  disabled={bulkActionLoading}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                >
                  {bulkActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Duyệt tất cả
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={bulkReject}
                  disabled={bulkActionLoading}
                  className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                >
                  {bulkActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Từ chối tất cả
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected([])}
                  className="gap-1.5"
                >
                  Bỏ chọn
                </Button>
              </div>
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
          ) : pending.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg">Không có booking chờ xử lý</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Tất cả các đặt chỗ đã được xử lý
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-1">
                <Checkbox
                  checked={pending.length > 0 && selected.length === pending.length}
                  onCheckedChange={selectAll}
                />
                <span className="text-sm text-muted-foreground">
                  Chọn tất cả ({pending.length})
                </span>
              </div>

              {pending.map((b) => (
                <Card
                  key={b.id}
                  className={cn(
                    "transition-all duration-200",
                    selected.includes(b.id) && "ring-2 ring-primary/30 bg-primary/5",
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
                          <h4 className="font-semibold text-base">
                            {b.guestName || "Khách"}
                          </h4>
                          <Badge variant="outline" className="font-mono text-xs">
                            {b.bookingCode}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{b.guestPhone || "-"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDate(b.useDate)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{b.useTime || "-"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span className="font-medium text-foreground">
                              {formatVND(b.finalPrice)}
                            </span>
                          </div>
                        </div>

                        {b.service?.name && (
                          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>{b.service.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleQuickApprove(b.id)}
                          disabled={busyId === b.id}
                          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                        >
                          {busyId === b.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Duyet
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickReject(b.id)}
                          disabled={busyId === b.id}
                          className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                        >
                          {busyId === b.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          Tu choi
                        </Button>
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={BUSINESS_ROUTES.BOOKING_DETAIL(b.id)}>
                            <Eye className="h-4 w-4" />
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

        <TabsContent value="rules" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setRuleOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Tao rule moi
            </Button>
          </div>

          {rulesLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-16 bg-muted rounded-lg" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : rules.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg">Chua co rule auto-duyet</h3>
                <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
                  Tao rule de tu dong duyet cac dat cho theo dieu kien
                </p>
                <Button
                  variant="outline"
                  className="mt-4 gap-2"
                  onClick={() => setRuleOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Tao rule dau tien
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {rules.map((r) => (
                <Card
                  key={r.id}
                  className={cn(
                    "transition-all duration-200",
                    !r.isActive && "opacity-60",
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={r.isActive ? "default" : "secondary"}
                          className="gap-1"
                        >
                          {r.isActive ? (
                            <ToggleRight className="h-3 w-3" />
                          ) : (
                            <ToggleLeft className="h-3 w-3" />
                          )}
                          {r.isActive ? "Dang hoat dong" : "Da tat"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={r.isActive}
                          onCheckedChange={() => toggleRuleActive(r)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Dieu kien</p>
                      <p className="text-sm font-medium">
                        {renderConditions(r.conditions) || "Khong co dieu kien"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Do uu tien: <span className="font-medium">{r.priority}</span>
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteRule(r)}
                        className="gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Xoa
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
              Tao rule auto-duyet
            </DialogTitle>
            <DialogDescription>
              Rule se tu dong duyet cac dat cho thoa man dieu kien
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Do uu tien</Label>
              <p className="text-xs text-muted-foreground">
                Rule co do uu tien cao hon se duoc kiem tra truoc
              </p>
              <Input
                id="priority"
                type="number"
                min="0"
                value={ruleForm.priority}
                onChange={(e) =>
                  setRuleForm((f) => ({
                    ...f,
                    priority: parseInt(e.target.value, 10) || 0,
                  }))
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-3">
              <Label>Khung gio ap dung</Label>
              <p className="text-xs text-muted-foreground">
                Chon mot hoac nhieu khung gio de ap dung rule
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
              <Label>So luong khach</Label>
              <p className="text-xs text-muted-foreground">
                Tay dinh so luong khach de ap dung rule (bo trong la khong gioi han)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Input
                    type="number"
                    min="1"
                    value={ruleForm.minQuantity}
                    onChange={(e) =>
                      setRuleForm((f) => ({ ...f, minQuantity: e.target.value }))
                    }
                    placeholder="Toi thieu"
                  />
                  <p className="text-xs text-muted-foreground">Toi thieu</p>
                </div>
                <div className="space-y-1">
                  <Input
                    type="number"
                    min="1"
                    value={ruleForm.maxQuantity}
                    onChange={(e) =>
                      setRuleForm((f) => ({ ...f, maxQuantity: e.target.value }))
                    }
                    placeholder="Toi da"
                  />
                  <p className="text-xs text-muted-foreground">Toi da</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="text-base">Kich hoat rule</Label>
                <p className="text-xs text-muted-foreground">
                  Tat rule neu ban muon tam dung auto-duyet
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
              Huy
            </Button>
            <Button onClick={submitRule} className="gap-1.5">
              <Check className="h-4 w-4" />
              Tao rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingQuickProcessPage;
