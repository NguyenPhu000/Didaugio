import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Plus, Trash2, X } from "lucide-react";
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
} from "@/components/ui/Dialog";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";
import BulkActionBar from "@/components/business/BulkActionBar";

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
      else toast.error(res?.message || "Không tải rule");
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
        toast.success("Đã duyệt");
        await loadPending();
      } else toast.error(res?.message || "Lỗi");
    } catch (e) {
      toastApiErrorIfNeeded(e);
    } finally {
      setBusyId(null);
    }
  };

  const handleQuickReject = async (id) => {
    const reason = window.prompt("Lý do từ chối (tùy chọn):") || "";
    setBusyId(id);
    try {
      const res = await bookingApi.quickReject(id, reason || undefined);
      if (res?.success) {
        toast.success("Đã từ chối");
        await loadPending();
      } else toast.error(res?.message || "Lỗi");
    } catch (e) {
      toastApiErrorIfNeeded(e);
    } finally {
      setBusyId(null);
    }
  };

  const bulkApprove = async () => {
    for (const id of selected) {
      try {
        await bookingApi.quickApprove(id);
      } catch {
        /* toast below */
      }
    }
    toast.success("Đã xử lý hàng loạt (một số có thể lỗi nếu trùng slot)");
    setSelected([]);
    await loadPending();
  };

  const bulkReject = async () => {
    const reason = window.prompt("Lý do từ chối chung:") || "";
    for (const id of selected) {
      try {
        await bookingApi.quickReject(id, reason || undefined);
      } catch {
        /* ignore */
      }
    }
    toast.success("Đã từ chối hàng loạt");
    setSelected([]);
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
        toast.success("Đã tạo rule");
        setRuleOpen(false);
        setRuleForm({
          priority: 0,
          timeSlots: [],
          minQuantity: "",
          maxQuantity: "",
          isActive: true,
        });
        await loadRules();
      } else toast.error(res?.message || "Lỗi");
    } catch (e) {
      toastApiErrorIfNeeded(e);
    }
  };

  const toggleRuleActive = async (rule) => {
    try {
      const res = await ruleApi.update(rule.id, { isActive: !rule.isActive });
      if (res?.success) await loadRules();
    } catch (e) {
      toastApiErrorIfNeeded(e);
    }
  };

  const deleteRule = async (rule) => {
    if (!window.confirm("Vô hiệu hóa rule này?")) return;
    try {
      const res = await ruleApi.remove(rule.id);
      if (res?.success) await loadRules();
    } catch (e) {
      toastApiErrorIfNeeded(e);
    }
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 min-h-screen">
      <Link
        to={BUSINESS_ROUTES.BOOKINGS}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Danh sách đặt chỗ
      </Link>

      <PageHeader
        title="Xử lý đặt chỗ nhanh"
        subtitle="Duyệt / từ chối tức thì và cấu hình auto-duyệt theo rule"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Chờ xử lý</TabsTrigger>
          <TabsTrigger value="rules">Auto-duyệt</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-4">
          {selected.length > 0 && (
            <div className="sticky bottom-4 z-30 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/95 p-3 shadow-md backdrop-blur">
              <span className="text-sm text-muted-foreground">
                Đã chọn {selected.length}
              </span>
              <Button size="sm" onClick={bulkApprove} className="gap-1">
                <Check className="h-4 w-4" />
                Duyệt đã chọn
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={bulkReject}
                className="gap-1"
              >
                <X className="h-4 w-4" />
                Từ chối đã chọn
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                Bỏ chọn
              </Button>
            </div>
          )}

          {(() => {
            if (loading) {
              return <p className="text-sm text-muted-foreground">Đang tải…</p>;
            }

            if (pending.length === 0) {
              return <EmptyState message="Không có booking chờ xử lý" />;
            }

            return (
              <SectionCard>
                <div className="mb-3 flex items-center gap-2">
                  <Checkbox
                    checked={
                      pending.length > 0 && selected.length === pending.length
                    }
                    onCheckedChange={selectAll}
                  />
                  <span className="text-xs text-muted-foreground">
                    Chọn tất cả
                  </span>
                </div>
                <div className="space-y-2">
                  {pending.map((b) => (
                    <div
                      key={b.id}
                      className={cn(
                        "flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3",
                        selected.includes(b.id) && "ring-1 ring-primary/50",
                      )}
                    >
                      <Checkbox
                        checked={selected.includes(b.id)}
                        onCheckedChange={() => toggleSelect(b.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{b.guestName}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.bookingCode} · {b.guestPhone} · {b.service?.name} ·{" "}
                          {formatDate(b.useDate)} {b.useTime}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatVND(b.finalPrice)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={busyId === b.id}
                          onClick={() => handleQuickApprove(b.id)}
                        >
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === b.id}
                          onClick={() => handleQuickReject(b.id)}
                        >
                          Từ chối
                        </Button>
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={BUSINESS_ROUTES.BOOKING_DETAIL(b.id)}>
                            Chi tiết
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            );
          })()}
        </TabsContent>

        <TabsContent value="rules" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setRuleOpen(true)} className="gap-1">
              <Plus className="h-4 w-4" />
              Thêm rule
            </Button>
          </div>

          {(() => {
            if (rulesLoading) {
              return (
                <p className="text-sm text-muted-foreground">Đang tải rule…</p>
              );
            }

            if (rules.length === 0) {
              return <EmptyState message="Chưa có rule auto-duyệt" />;
            }

            return (
              <SectionCard>
                <div className="space-y-3">
                  {rules.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{`Rule #${r.id} · priority ${r.priority}`}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {JSON.stringify(r.conditions)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">Kích hoạt</span>
                          <Switch
                            checked={r.isActive}
                            onCheckedChange={() => toggleRuleActive(r)}
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteRule(r)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            );
          })()}
        </TabsContent>
      </Tabs>

      <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rule auto-duyệt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Độ ưu tiên (cao hơn xử lý trước)</Label>
              <Input
                type="number"
                value={ruleForm.priority}
                onChange={(e) =>
                  setRuleForm((f) => ({
                    ...f,
                    priority: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Khung giờ áp dụng</Label>
              {SLOT_OPTIONS.map((slot) => (
                <label key={slot} className="flex items-center gap-2 text-sm">
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
                  {TIME_SLOT_LABELS[slot]}
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>min số lượng (tùy chọn)</Label>
                <Input
                  value={ruleForm.minQuantity}
                  onChange={(e) =>
                    setRuleForm((f) => ({ ...f, minQuantity: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>max số lượng (tùy chọn)</Label>
                <Input
                  value={ruleForm.maxQuantity}
                  onChange={(e) =>
                    setRuleForm((f) => ({ ...f, maxQuantity: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={ruleForm.isActive}
                onCheckedChange={(v) =>
                  setRuleForm((f) => ({ ...f, isActive: v }))
                }
              />
              <span className="text-sm">Kích hoạt</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleOpen(false)}>
              Hủy
            </Button>
            <Button onClick={submitRule}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingQuickProcessPage;
