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
import { toast } from "sonner";import { compressBannerImage } from "../banners/imageCompression";
import { ImageUploadArea } from "../shared/ImageUploadArea";
import { StatusBadge } from "../shared/StatusBadge";
export const EditModal = ({ open, onClose, item, onSave, type, loading }) => {
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
