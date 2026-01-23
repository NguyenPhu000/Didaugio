import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
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
import { Checkbox } from "@/components/ui/checkbox";
import useTagStore from "@/stores/tagStore";
import { useToast } from "@/hooks/use-toast";
import { TAG_TYPES, TAG_COLOR_PRESETS } from "@/constants/tagConstants";

/**
 * TAG FORM DIALOG
 * Form tạo/sửa tag
 */

export default function TagFormDialog({ open, onClose, tag }) {
  const { createTag, updateTag, fetchTags } = useTagStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    tagType: "general",
    icon: "",
    color: "#6B7280",
    isActive: true,
  });

  useEffect(() => {
    if (tag) {
      setFormData({
        name: tag.name || "",
        slug: tag.slug || "",
        tagType: tag.tagType || "general",
        icon: tag.icon || "",
        color: tag.color || "#6B7280",
        isActive: tag.isActive !== undefined ? tag.isActive : true,
      });
    } else {
      setFormData({
        name: "",
        slug: "",
        tagType: "general",
        icon: "",
        color: "#6B7280",
        isActive: true,
      });
    }
  }, [tag, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-generate slug from name
    if (field === "name" && !tag) {
      const slug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (tag) {
        await updateTag(tag.id, formData);
        toast({
          title: "Success",
          description: "Tag updated successfully",
        });
      } else {
        await createTag(formData);
        toast({
          title: "Success",
          description: "Tag created successfully",
        });
      }
      await fetchTags();
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{tag ? "Edit Tag" : "Add Tag"}</DialogTitle>
          <DialogDescription>
            {tag ? "Update tag information" : "Create a new tag"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name & Slug */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Giá rẻ"
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
                placeholder="e.g. gia-re"
                required
              />
            </div>
          </div>

          {/* Tag Type */}
          <div className="space-y-2">
            <Label htmlFor="tagType">
              Tag Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.tagType}
              onValueChange={(val) => handleChange("tagType", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tag type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TAG_TYPES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => handleChange("color", e.target.value)}
                className="w-20 h-10"
              />
              <div className="flex flex-wrap gap-1 flex-1">
                {TAG_COLOR_PRESETS.map((color) => (
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

          {/* Icon (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="icon">Icon (Optional)</Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) => handleChange("icon", e.target.value)}
              placeholder="Lucide icon name"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleChange("isActive", checked)}
              />
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active Status
                </Label>
                <p className="text-xs text-muted-foreground">
                  Inactive tags won't be shown in filters
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : tag ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
