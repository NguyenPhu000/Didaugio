import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import {
  useCreateTag,
  useCreateTagGroup,
  useTagGroups,
  useUpdateTag,
} from "@/hooks/queries/useTagQueries";
import { useToast } from "@/hooks/use-toast";
import { TAG_COLOR_PRESETS } from "@/constants/tagConstants";

/**
 * TAG FORM DIALOG
 * Form tạo/sửa tag
 */

export default function TagFormDialog({ open, onClose, tag }) {
  const { t } = useTranslation();
  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const createGroupMutation = useCreateTagGroup();
  const { data: tagGroups = [] } = useTagGroups();
  const { toast } = useToast();
  const loading = createMutation.isPending || updateMutation.isPending;
  const [newGroupName, setNewGroupName] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    tagGroupId: "",
    color: "#6B7280",
    isActive: true,
  });

  useEffect(() => {
    if (tag) {
      setFormData({
        name: tag.name || "",
        slug: tag.slug || "",
        tagGroupId: String(tag.tagGroupId || tag.tagGroup?.id || ""),
        color: tag.color || "#6B7280",
        isActive: tag.isActive !== undefined ? tag.isActive : true,
      });
    } else {
      setFormData({
        name: "",
        slug: "",
        tagGroupId: "",
        color: "#6B7280",
        isActive: true,
      });
    }
  }, [tag, open]);

  useEffect(() => {
    if (tag || formData.tagGroupId) return;
    const firstActiveGroup = tagGroups.find((group) => group.isActive);
    if (firstActiveGroup) {
      setFormData((prev) => ({ ...prev, tagGroupId: String(firstActiveGroup.id) }));
    }
  }, [tag, tagGroups, formData.tagGroupId]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "name" && !tag) {
      const slug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const tagGroupId = Number(formData.tagGroupId);
    if (!Number.isInteger(tagGroupId) || tagGroupId <= 0) {
      toast({ variant: "destructive", title: t("tags.error"), description: "Vui lòng chọn nhóm tag." });
      return;
    }

    try {
      const payload = { ...formData, tagGroupId };
      if (tag) {
        await updateMutation.mutateAsync({ id: tag.id, data: payload });
        toast({
          title: t("tags.success"),
          description: t("tags.tagUpdated"),
        });
      } else {
        await createMutation.mutateAsync(payload);
        toast({
          title: t("tags.success"),
          description: t("tags.tagCreated"),
        });
      }
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("tags.error"),
        description: error.response?.data?.message || error.message,
      });
    }
  };

  const handleCreateGroup = async () => {
    const nameVi = newGroupName.trim();
    if (!nameVi) return;
    const slug = nameVi
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\u0111/g, "d")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    try {
      const group = await createGroupMutation.mutateAsync({ nameVi, slug });
      setFormData((prev) => ({ ...prev, tagGroupId: String(group.id) }));
      setNewGroupName("");
    } catch (error) {
      toast({ variant: "destructive", title: t("tags.error"), description: error.response?.data?.message || error.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{tag ? t("tags.editTag") : t("tags.addTag")}</DialogTitle>
          <DialogDescription>
            {tag ? t("tags.updateTagInfo") : t("tags.createNewTag")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name & Slug */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {t("tags.name")} <span className="text-destructive">*</span>
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
                {t("tags.slug")} <span className="text-destructive">*</span>
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

          {/* Tag group */}
          <div className="space-y-2">
            <Label htmlFor="tagGroupId">
              Nhóm tag <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.tagGroupId}
              onValueChange={(value) => handleChange("tagGroupId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn nhóm tag" />
              </SelectTrigger>
              <SelectContent>
                {tagGroups.filter((group) => group.isActive).map((group) => (
                  <SelectItem key={group.id} value={String(group.id)}>
                    {group.nameVi}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Tạo nhóm mới" />
              <Button type="button" variant="outline" onClick={handleCreateGroup} disabled={!newGroupName.trim() || createGroupMutation.isPending}>
                Tạo nhóm
              </Button>
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label htmlFor="color">{t("tags.color")}</Label>
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
                  {t("tags.activeStatus")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("tags.inactiveNote")}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            {(() => {
              let submitLabel = t("tags.create");
              if (loading) {
                submitLabel = t("tags.saving");
              } else if (tag) {
                submitLabel = t("tags.update");
              }

              return (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {submitLabel}
                  </Button>
                </>
              );
            })()}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
