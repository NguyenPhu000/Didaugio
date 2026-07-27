import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Ticket, Sparkles, Loader2 } from "lucide-react";
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
      });
    }
  }, [voucher, reset, open]);

  const discountType = watch("discountType");
  const discountValue = watch("discountValue");

  const onSubmit = async (formData) => {
    setSaving(true);
    try {
      const data = {
        ...formData,
        code: formData.code.toUpperCase(),
        discountValue: Number(formData.discountValue),
        minOrderValue: Number(formData.minOrderValue),
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        maxUsage: Number(formData.maxUsage),
        maxUsagePerUser: Number(formData.maxUsagePerUser),
        applicableServices:
          formData.appliesToPlaceId !== "all"
            ? { placeIds: [Number(formData.appliesToPlaceId)] }
            : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      };
      await onSave(data);
      onClose();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.vouchers.toasts.error"));
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center dark:bg-violet-950/40 dark:text-violet-400">
              <Ticket className="h-4 w-4" />
            </div>
            {voucher ? t("business.vouchers.form.editTitle") : t("business.vouchers.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {voucher ? t("business.vouchers.form.editSubtitle") : t("business.vouchers.form.createSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <form id="voucher-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto space-y-6 py-4 pr-1">
          {/* Basic Info */}
          <fieldset className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/30 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
            <legend className="text-sm font-bold text-zinc-950 dark:text-zinc-100 flex items-center gap-2 px-1">
              <Ticket className="h-4 w-4 text-zinc-500" />
              {t("business.vouchers.form.basicInfo")}
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="vc-code">
                    {t("business.vouchers.form.voucherCode")} <span className="text-destructive">*</span>
                  </Label>
                  {!voucher && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleGenerateCode} className="h-6 text-[10px] gap-1">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      {t("business.vouchers.form.generateRandom")}
                    </Button>
                  )}
                </div>
                <Input
                  id="vc-code"
                  {...register("code", { required: true })}
                  disabled={!!voucher}
                  className="uppercase bg-white dark:bg-zinc-950"
                  placeholder="VD: SUMMER2026"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vc-name">{t("business.vouchers.form.voucherName")}</Label>
                <Input
                  id="vc-name"
                  {...register("name")}
                  className="bg-white dark:bg-zinc-950"
                  placeholder="VD: Giảm giá hè rực rỡ"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vc-desc">{t("business.vouchers.form.description")}</Label>
              <Textarea
                id="vc-desc"
                {...register("description")}
                rows={2}
                className="bg-white dark:bg-zinc-950"
                placeholder={t("business.vouchers.form.descriptionPlaceholder")}
              />
            </div>
          </fieldset>

          {/* Discount Settings */}
          <fieldset className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/30 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
            <legend className="text-sm font-bold text-zinc-950 dark:text-zinc-100 flex items-center gap-2 px-1">
              {t("business.vouchers.form.discountRules")}
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("business.vouchers.form.discountType")}</Label>
                <Select value={discountType} onValueChange={(val) => setValue("discountType", val)}>
                  <SelectTrigger className="bg-white dark:bg-zinc-950">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{t("business.vouchers.form.typePercentage")}</SelectItem>
                    <SelectItem value="fixed">{t("business.vouchers.form.typeFixed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vc-value">
                  {t("business.vouchers.form.discountValue")} {discountType === "percentage" ? "(%)" : "(VNĐ)"}
                </Label>
                <Input
                  id="vc-value"
                  type="number"
                  {...register("discountValue", { required: true, min: 1 })}
                  className="bg-white dark:bg-zinc-950"
                />
              </div>
            </div>
          </fieldset>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="voucher-form" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {voucher ? t("common.save") : t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
