import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
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
  const [iconSearch, setIconSearch] = useState("");

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

  const filteredIcons = CATEGORY_ICON_PRESETS.filter((icon) =>
    icon.toLowerCase().includes(iconSearch.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-none border border-black p-0 shadow-hard">
        <DialogHeader className="bg-black text-white p-6 border-b border-white/20">
          <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center justify-between">
            <span>
              {category
                ? "CHỈNH SỬA DANH MỤC"
                : parentCategory
                  ? "THÊM DANH MỤC CON"
                  : "TẠO DANH MỤC GỐC"}
            </span>
            <span className="text-[10px] font-mono bg-white text-black px-2 py-0.5">
              {category ? category.id.substring(0, 8) : "NEW"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-gray-400 font-mono text-xs uppercase tracking-wider">
            {parentCategory
              ? `DIRECTORY PARENT: ${parentCategory.name}`
              : "ROOT DIRECTORY SYSTEM"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white">
          {/* Tên & Slug */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="uppercase font-bold text-xs tracking-wider"
              >
                TÊN DANH MỤC <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="VD: TRÀ SỮA..."
                required
                className="rounded-none border-black font-mono text-sm focus-visible:ring-0 focus-visible:border-primary border-b-2 bg-gray-50 h-10"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="slug"
                className="uppercase font-bold text-xs tracking-wider"
              >
                SLUG (URL) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                placeholder="vd: tra-sua"
                required
                className="rounded-none border-black font-mono text-sm focus-visible:ring-0 bg-gray-50 h-10"
              />
            </div>
          </div>

          {/* Icon Picker */}
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-black pb-2">
              <Label className="uppercase font-bold text-xs tracking-wider">
                ICON HIỂN THỊ
              </Label>
              <div className="flex items-center gap-2">
                <Search className="w-3 h-3" />
                <Input
                  placeholder="SEARCH ICON..."
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="h-6 w-32 rounded-none border-none border-b border-gray-200 text-xs font-mono uppercase bg-transparent p-0 focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-[160px] overflow-y-auto p-2 border border-black bg-gray-50 scrollbar-thin">
              {filteredIcons.map((iconName) => {
                const IconComponent = CATEGORY_ICON_MAP[iconName];
                if (!IconComponent) return null;

                const isSelected = formData.icon === iconName;

                return (
                  <button
                    key={iconName}
                    type="button"
                    className={`
                        aspect-square flex items-center justify-center border transition-all
                        ${
                          isSelected
                            ? "bg-black text-white border-black shadow-none scale-90"
                            : "bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black hover:shadow-hard"
                        }
                      `}
                    onClick={() => handleChange("icon", iconName)}
                    title={iconName}
                  >
                    <IconComponent className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color & Order */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="uppercase font-bold text-xs tracking-wider">
                MÃ MÀU
              </Label>
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 border border-black relative"
                  style={{ backgroundColor: formData.color }}
                >
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleChange("color", e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
                <Input
                  value={formData.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                  className="flex-1 rounded-none border-black font-mono uppercase focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="order"
                className="uppercase font-bold text-xs tracking-wider"
              >
                THỨ TỰ (PRIORITY)
              </Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) =>
                  handleChange("order", parseInt(e.target.value))
                }
                min="0"
                className="rounded-none border-black font-mono focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Mô tả */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="uppercase font-bold text-xs tracking-wider"
            >
              MÔ TẢ NGẮN
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="CHI TIẾT..."
              rows={3}
              className="rounded-none border-black font-mono focus-visible:ring-0 bg-gray-50"
            />
          </div>

          <DialogFooter className="border-t border-black pt-6 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-none border-black hover:bg-gray-200 font-mono uppercase"
            >
              HỦY BỎ
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-none bg-black text-white hover:bg-primary hover:text-black hover:shadow-hard font-bold uppercase transition-all"
            >
              {loading
                ? "ĐANG XỬ LÝ..."
                : category
                  ? "LƯU THAY ĐỔI"
                  : "TẠO DANH MỤC"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
