import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";

export function VoucherFormModal({ open, onClose, voucher, places = [], onSave }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      code: "",
      name: "",
      description: "",
      discountType: "percentage",
      discountValue: "10",
      minOrderValue: "0",
      maxDiscount: "",
      maxUsage: "100",
      maxUsagePerUser: "1",
      appliesToPlaceId: "all",
      startDate: "",
      endDate: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (voucher) {
      reset({
        code: voucher.code || "",
        name: voucher.name || "",
        description: voucher.description || "",
        discountType: voucher.discountType || "percentage",
        discountValue: String(voucher.discountValue ?? 10),
        minOrderValue: String(voucher.minOrderValue ?? 0),
        maxDiscount: voucher.maxDiscount ? String(voucher.maxDiscount) : "",
        maxUsage: String(voucher.maxUsage ?? 100),
        maxUsagePerUser: String(voucher.maxUsagePerUser ?? 1),
        appliesToPlaceId: voucher.applicableServices?.placeIds?.[0]
          ? String(voucher.applicableServices.placeIds[0])
          : "all",
        startDate: voucher.startDate ? voucher.startDate.slice(0, 10) : "",
        endDate: voucher.endDate ? voucher.endDate.slice(0, 10) : "",
        isActive: voucher.isActive ?? true,
      });
    } else {
      reset({
        code: "",
        name: "",
        description: "",
        discountType: "percentage",
        discountValue: "10",
        minOrderValue: "0",
        maxDiscount: "",
        maxUsage: "100",
        maxUsagePerUser: "1",
        appliesToPlaceId: "all",
        startDate: "",
        endDate: "",
        isActive: true,
      });
    }
  }, [voucher, reset, open]);

  const discountType = watch("discountType");
  const isActive = watch("isActive");

  const onSubmit = async (formData) => {
    setSaving(true);
    try {
      const data = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        discountValue: Number(formData.discountValue),
        minOrderValue: Number(formData.minOrderValue || 0),
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        maxUsage: Number(formData.maxUsage || 100),
        maxUsagePerUser: Number(formData.maxUsagePerUser || 1),
        applicableServices:
          formData.appliesToPlaceId !== "all"
            ? { placeIds: [Number(formData.appliesToPlaceId)] }
            : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        isActive: formData.isActive ?? true,
      };
      await onSave(data);
      onClose();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.vouchers.toasts.error", { defaultValue: "Lưu mã giảm giá thất bại" }));
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "VC";
    for (let i = 0; i < 6; i += 1) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue("code", code);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col rounded-[38px] p-6 sm:p-8 border border-slate-200/80 dark:border-border/80 shadow-2xl bg-white dark:bg-card">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {voucher ? "Chỉnh Sửa Mã Khuyến Mãi" : "Tạo Mã Khuyến Mãi Mới"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-muted-foreground">
            Thiết lập mã giảm giá, mức chiết khấu và điều kiện áp dụng cho khách du lịch.
          </DialogDescription>
        </DialogHeader>

        <form id="voucher-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Thông Tin Mã */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-muted/40 border border-slate-100 dark:border-border/60 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Thông Tin Cơ Bản
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <Label htmlFor="vc-code" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mã khuyến mãi *
                  </Label>
                  {!voucher && (
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Tạo ngẫu nhiên
                    </button>
                  )}
                </div>
                <Input
                  id="vc-code"
                  {...register("code", { required: true })}
                  disabled={!!voucher}
                  className="rounded-2xl uppercase text-xs h-10 font-mono font-bold bg-white dark:bg-card border-slate-200/80"
                  placeholder="VD: CANTHO2026"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <Label htmlFor="vc-name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tên chương trình ưu đãi
                </Label>
                <Input
                  id="vc-name"
                  {...register("name")}
                  className="rounded-2xl text-xs h-10 bg-white dark:bg-card border-slate-200/80"
                  placeholder="VD: Ưu đãi du lịch mùa hè"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <Label htmlFor="vc-desc" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Mô tả chi tiết
              </Label>
              <Textarea
                id="vc-desc"
                {...register("description")}
                rows={2}
                className="rounded-2xl text-xs bg-white dark:bg-card border-slate-200/80"
                placeholder="Điều kiện áp dụng, đối tượng khách hàng..."
              />
            </div>
          </div>

          {/* Mức Giảm & Giá Trị */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-muted/40 border border-slate-100 dark:border-border/60 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Mức Chiết Khấu & Giới Hạn
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Hình thức giảm giá
                </Label>
                <Select value={discountType} onValueChange={(val) => setValue("discountType", val)}>
                  <SelectTrigger className="rounded-2xl text-xs h-10 bg-white dark:bg-card border-slate-200/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="percentage" className="text-xs">Theo phần trăm (%)</SelectItem>
                    <SelectItem value="fixed" className="text-xs">Số tiền cố định (VNĐ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 text-left">
                <Label htmlFor="vc-value" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Mức giảm {discountType === "percentage" ? "(%)" : "(VNĐ)"} *
                </Label>
                <Input
                  id="vc-value"
                  type="number"
                  {...register("discountValue", { required: true, min: 1 })}
                  className="rounded-2xl text-xs h-10 bg-white dark:bg-card border-slate-200/80 font-bold"
                  placeholder={discountType === "percentage" ? "10" : "50000"}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="vc-min" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Đơn hàng tối thiểu (VNĐ)
                </Label>
                <Input
                  id="vc-min"
                  type="number"
                  {...register("minOrderValue")}
                  className="rounded-2xl text-xs h-10 bg-white dark:bg-card border-slate-200/80"
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <Label htmlFor="vc-max" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Giảm tối đa (VNĐ, nếu theo %)
                </Label>
                <Input
                  id="vc-max"
                  type="number"
                  {...register("maxDiscount")}
                  className="rounded-2xl text-xs h-10 bg-white dark:bg-card border-slate-200/80"
                  placeholder="Không giới hạn"
                />
              </div>
            </div>
          </div>

          {/* Phạm Vi & Thời Gian */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-muted/40 border border-slate-100 dark:border-border/60 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              3. Phạm Vi & Thời Hạn Áp Dụng
            </h4>

            {places.length > 0 && (
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Cơ sở áp dụng
                </Label>
                <Select
                  value={watch("appliesToPlaceId")}
                  onValueChange={(val) => setValue("appliesToPlaceId", val)}
                >
                  <SelectTrigger className="rounded-2xl text-xs h-10 bg-white dark:bg-card border-slate-200/80">
                    <SelectValue placeholder="Tất cả cơ sở" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="all" className="text-xs">Tất cả cơ sở của doanh nghiệp</SelectItem>
                    {places.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="vc-start" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ngày bắt đầu
                </Label>
                <Input
                  id="vc-start"
                  type="date"
                  {...register("startDate")}
                  className="rounded-2xl text-xs h-10 bg-white dark:bg-card border-slate-200/80"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <Label htmlFor="vc-end" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ngày kết thúc
                </Label>
                <Input
                  id="vc-end"
                  type="date"
                  {...register("endDate")}
                  className="rounded-2xl text-xs h-10 bg-white dark:bg-card border-slate-200/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="vc-usage" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tổng lượt sử dụng
                </Label>
                <Input
                  id="vc-usage"
                  type="number"
                  {...register("maxUsage")}
                  className="rounded-2xl text-xs h-10 bg-white dark:bg-card border-slate-200/80"
                  placeholder="100"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <Label htmlFor="vc-user-usage" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Giới hạn / Khách
                </Label>
                <Input
                  id="vc-user-usage"
                  type="number"
                  {...register("maxUsagePerUser")}
                  className="rounded-2xl text-xs h-10 bg-white dark:bg-card border-slate-200/80"
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          {/* Trạng thái kích hoạt */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-muted/40 border border-slate-100 dark:border-border/60">
            <Checkbox
              id="vc-active"
              checked={isActive}
              onCheckedChange={(checked) => setValue("isActive", !!checked)}
              className="rounded-lg"
            />
            <Label htmlFor="vc-active" className="cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
              Kích hoạt mở sử dụng mã khuyến mãi này ngay
            </Label>
          </div>
        </form>

        <DialogFooter className="pt-3 gap-2 flex-row justify-end border-t border-slate-100 dark:border-border/60">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="rounded-2xl h-10 px-4 text-xs font-bold border-slate-200 dark:border-border/80"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            form="voucher-form"
            disabled={saving}
            className="rounded-2xl h-10 px-5 text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground shadow-xs gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {voucher ? "Lưu thay đổi" : "Tạo mã khuyến mãi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
