import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { SERVICE_TYPE_LABELS, EMPTY_FORM } from "./servicesConstants";

export const ServiceFormModal = ({ service, open, onClose, onSave, places }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name || "",
        description: service.description || "",
        price: service.price ?? "",
        discountPrice: service.discountPrice ?? "",
        duration: service.duration ?? "",
        maxCapacity: service.maxCapacity ?? "",
        serviceType: service.serviceType || "tour",
        placeId: service.placeId ? String(service.placeId) : "",
        isActive: service.isActive ?? true,
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        placeId: places.length > 0 ? String(places[0].id) : "",
      });
    }
  }, [service, open, places]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên dịch vụ");
      return;
    }
    if (!form.price || Number(form.price) < 0) {
      toast.error("Vui lòng nhập giá niêm yết hợp lệ");
      return;
    }
    if (!form.placeId) {
      toast.error("Vui lòng chọn cơ sở áp dụng dịch vụ");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        duration: form.duration ? Number(form.duration) : null,
        maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : null,
        serviceType: form.serviceType,
        placeId: Number(form.placeId),
        isActive: form.isActive,
      };

      await onSave(payload, service?.id);
      onClose();
    } catch {
      // Handled in parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[38px] p-6 sm:p-8 border border-slate-200/80 dark:border-border/80 shadow-2xl bg-white dark:bg-card">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {service ? "Chỉnh Sửa Gói Dịch Vụ" : "Tạo Gói Dịch Vụ Mới"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-muted-foreground">
            Thiết lập thông tin gói trải nghiệm, mức giá, thời lượng và cơ sở áp dụng.
          </DialogDescription>
        </DialogHeader>

        <form id="service-form" onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Section 1: Thông tin cơ bản */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-muted/40 border border-slate-100 dark:border-border/60 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Thông Tin Dịch Vụ & Cơ Sở
            </h4>

            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tên dịch vụ *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Tour chèo SUP ngắm bình minh Cần Thơ"
                className="rounded-2xl text-xs h-10 bg-white dark:bg-card border-slate-200/80"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cơ sở áp dụng *</Label>
                <Select
                  value={form.placeId ? String(form.placeId) : ""}
                  onValueChange={(val) => setForm({ ...form, placeId: val })}
                >
                  <SelectTrigger className="rounded-2xl text-xs h-10 bg-white dark:bg-card border-slate-200/80">
                    <SelectValue placeholder="Chọn địa điểm kinh doanh" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {places.map((place) => (
                      <SelectItem key={place.id} value={String(place.id)} className="text-xs">
                        {place.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Loại hình dịch vụ</Label>
                <Select
                  value={form.serviceType}
                  onValueChange={(val) => setForm({ ...form, serviceType: val })}
                >
                  <SelectTrigger className="rounded-2xl text-xs h-10 bg-white dark:bg-card border-slate-200/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {Object.entries(SERVICE_TYPE_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 2: Thiết lập giá & Thời lượng */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-muted/40 border border-slate-100 dark:border-border/60 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Mức Giá & Thời Lượng Phục Vụ
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Giá niêm yết (VNĐ) *</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="VD: 150000"
                  className="rounded-2xl text-xs h-10 bg-white dark:bg-card border-slate-200/80 font-bold"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Giá khuyến mãi (VNĐ)</Label>
                <Input
                  type="number"
                  value={form.discountPrice}
                  onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                  placeholder="VD: 120000"
                  className="rounded-2xl text-xs h-10 bg-white dark:bg-card border-slate-200/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Thời lượng (phút)</Label>
                <Input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="VD: 60"
                  className="rounded-2xl text-xs h-10 bg-white dark:bg-card border-slate-200/80"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sức chứa tối đa (người)</Label>
                <Input
                  type="number"
                  value={form.maxCapacity}
                  onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })}
                  placeholder="VD: 10"
                  className="rounded-2xl text-xs h-10 bg-white dark:bg-card border-slate-200/80"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mô tả tiện ích dịch vụ</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả các tiện ích, lịch trình và ưu đãi bao gồm..."
                rows={3}
                className="rounded-2xl text-xs bg-white dark:bg-card border-slate-200/80"
              />
            </div>
          </div>

          {/* Section 3: Trạng thái mở bán */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-muted/40 border border-slate-100 dark:border-border/60">
            <Checkbox
              id="svc-active"
              checked={form.isActive}
              onCheckedChange={(checked) =>
                setForm({ ...form, isActive: !!checked })
              }
              className="rounded-lg"
            />
            <Label htmlFor="svc-active" className="cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
              Mở bán dịch vụ này trên hệ thống đặt chỗ
            </Label>
          </div>
        </form>

        <DialogFooter className="gap-2 border-t border-slate-100 dark:border-border/60 pt-3 flex-row justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-2xl h-10 px-4 text-xs font-bold border-slate-200 dark:border-border/80"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            form="service-form"
            disabled={saving}
            className="rounded-2xl h-10 px-5 text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground shadow-xs gap-1.5"
          >
            {saving ? "Đang lưu..." : service ? "Lưu thay đổi" : "Tạo dịch vụ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceFormModal;
