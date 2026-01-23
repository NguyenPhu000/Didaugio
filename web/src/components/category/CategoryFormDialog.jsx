import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import useCategoryStore from "@/stores/categoryStore";
import { useToast } from "@/hooks/use-toast";
import {
  CATEGORY_ICON_MAP,
  CATEGORY_ICON_PRESETS,
  CATEGORY_COLOR_PRESETS,
} from "@/constants/categoryConstants";

/**
 * CATEGORY FORM DIALOG
 * Form tạo/sửa danh mục
 */

export default function CategoryFormDialog({
  open,
  onClose,
  category,
  parentCategory,
}) {
  const { createCategory, updateCategory, fetchCategories } =
    useCategoryStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    icon: "",
    color: "#3B82F6",
    description: "",
    parentId: null,
    order: 0,
  });

  useEffect(() => {
    if (category) {
      // Edit mode
      setFormData({
        name: category.name || "",
        slug: category.slug || "",
        icon: category.icon || "",
        color: category.color || "#3B82F6",
        description: category.description || "",
        parentId: category.parentId || null,
        order: category.order || 0,
      });
    } else if (parentCategory) {
      // Add child mode
      setFormData({
        name: "",
        slug: "",
        icon: "",
        color: "#3B82F6",
        description: "",
        parentId: parentCategory.id,
        order: 0,
      });
    } else {
      // Add root mode
      setFormData({
        name: "",
        slug: "",
        icon: "",
        color: "#3B82F6",
        description: "",
        parentId: null,
        order: 0,
      });
    }
  }, [category, parentCategory, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-generate slug from name
      if (field === "name" && !category) {
        updated.slug = value
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-");
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (category) {
        await updateCategory(category.id, formData);
        toast({
          title: "Thành công",
          description: "Cập nhật danh mục thành công",
        });
      } else {
        await createCategory(formData);
        toast({
          title: "Thành công",
          description: "Tạo danh mục thành công",
        });
      }
      await fetchCategories();
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {category
              ? "Sửa Danh Mục"
              : parentCategory
                ? "Thêm Danh Mục Con"
                : "Thêm Danh Mục"}
          </DialogTitle>
          <DialogDescription>
            {parentCategory && `Danh mục cha: ${parentCategory.name}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tên & Slug */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Tên <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ví dụ: Ẩm thực"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                placeholder="Ví dụ: am-thuc"
                required
              />
            </div>
          </div>

          {/* Icon & Màu */}
          <div className="grid grid-cols-1 gap-4">
            {/* Icon Picker Grid */}
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30">
                {CATEGORY_ICON_PRESETS.map((iconName) => {
                  const IconComponent = CATEGORY_ICON_MAP[iconName];
                  return (
                    <button
                      key={iconName}
                      type="button"
                      className="w-12 h-12 flex items-center justify-center rounded-md border-2 hover:scale-110 transition-all hover:bg-accent"
                      style={{
                        borderColor:
                          formData.icon === iconName
                            ? formData.color
                            : "transparent",
                        backgroundColor:
                          formData.icon === iconName
                            ? `${formData.color}15`
                            : "transparent",
                        color:
                          formData.icon === iconName
                            ? formData.color
                            : "currentColor",
                      }}
                      onClick={() => handleChange("icon", iconName)}
                      title={iconName}
                    >
                      {IconComponent && <IconComponent className="h-6 w-6" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label htmlFor="color">Màu sắc</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                  className="w-20 h-10"
                />
                <div className="flex flex-wrap gap-1 flex-1">
                  {CATEGORY_COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: color,
                        borderColor:
                          formData.color === color ? "#000" : "transparent",
                      }}
                      onClick={() => handleChange("color", color)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mô tả */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Mô tả danh mục..."
              rows={3}
            />
          </div>

          {/* Thứ tự */}
          <div className="space-y-2">
            <Label htmlFor="order">Thứ tự hiển thị</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => handleChange("order", parseInt(e.target.value))}
              min="0"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : category ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
