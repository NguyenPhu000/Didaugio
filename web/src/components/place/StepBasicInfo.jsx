import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  MapPin,
  Globe,
  Type,
  Loader2,
  AlertCircle,
} from "lucide-react";
import usePlaceStore from "@/stores/placeStore";
import { useCheckSlugExists } from "@/hooks/queries/usePlaceQueries";
import { Button, Input, Label } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import ProvinceWardSelect from "@/components/common/ProvinceWardSelect";
import CategorySelector from "./CategorySelector";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { WizardActions, WizardPanel, WizardSectionHeading } from "./wizard/PlaceWizardSurface";

/**
 * STEP 1: BASIC INFO
 * Clean, modern Shadcn/UI style
 */
const StepBasicInfo = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { wizardData, updateWizardData, nextStep, loading } =
    usePlaceStore();

  const { mutateAsync: checkSlug } = useCheckSlugExists();

  const [errors, setErrors] = useState({});
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugError, setSlugError] = useState(null);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    const shouldUpdateSlug =
      !wizardData.slug || generateSlug(wizardData.name) === wizardData.slug;

    if (shouldUpdateSlug) {
      const newSlug = generateSlug(name);
      updateWizardData({ name, slug: newSlug });
    } else {
      updateWizardData({ name });
    }
  };

  const handleSlugChange = async (e) => {
    const slug = e.target.value;
    updateWizardData({ slug });
    setSlugError(null);

    if (slug && slug.length >= 3) {
      setCheckingSlug(true);
      try {
        const result = await checkSlug({ slug });
        const exists = result?.data?.exists || result?.exists || false;
        setSlugError(exists ? "Slug đã tồn tại" : null);
      } catch {
        // Ignore check errors
      } finally {
        setCheckingSlug(false);
      }
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!wizardData.name?.trim()) {
      newErrors.name = t("admin.placeWizard.basicInfo.placeNamePlaceholder");
    }

    if (!wizardData.slug?.trim()) {
      newErrors.slug = t("validation.required", { field: "Slug" });
    } else if (slugError) {
      newErrors.slug = slugError;
    }

    if (!wizardData.categoryId) {
      newErrors.categoryId = t("admin.placeWizard.basicInfo.selectCategory");
    }

    if (!wizardData.provinceCode) {
      newErrors.provinceCode = "Vui lòng chọn tỉnh/thành phố";
    }

    if (!wizardData.address?.trim()) {
      newErrors.address = t("admin.placeWizard.basicInfo.addressPlaceholder");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      nextStep();
    } else {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("common.validationError"),
      });
    }
  };

  return (
    <div className="space-y-6 pb-28">
      <WizardPanel className="p-5 sm:p-6">
        <WizardSectionHeading
          title={t("admin.placeWizard.basicInfo.category")}
          description="Chọn nhóm phù hợp để địa điểm xuất hiện đúng trong hành trình khám phá."
        />
        <div className="mt-5">
        <CategorySelector
          value={wizardData.categoryId}
          onChange={(categoryId) => updateWizardData({ categoryId })}
          error={errors.categoryId}
        />
        {errors.categoryId && (
          <p className="mt-3 flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="h-3 w-3" />
            {errors.categoryId}
          </p>
        )}
        </div>
      </WizardPanel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Basic Details */}
        <WizardPanel className="p-5 sm:p-6">
          <WizardSectionHeading
            icon={Type}
            title={t("admin.placeWizard.basicInfo.title")}
            description="Tên hiển thị, đường dẫn và một mô tả ngắn cho địa điểm."
          />
          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                {t("admin.placeWizard.basicInfo.placeName")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder={t("admin.placeWizard.basicInfo.placeNamePlaceholder")}
                value={wizardData.name}
                onChange={handleNameChange}
                className={cn(
                  "h-11 rounded-xl border-black/15 bg-[#FFFEFB] focus-visible:ring-black",
                  errors.name && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {errors.name && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-sm font-medium">
                Slug <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="slug"
                  placeholder="quan-cafe-song-hau"
                  value={wizardData.slug}
                  onChange={handleSlugChange}
                  className={cn(
                    "h-11 rounded-xl border-black/15 bg-[#FFFEFB] lowercase pr-10 focus-visible:ring-black",
                    (errors.slug || slugError) && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingSlug ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : slugError ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              {errors.slug || slugError ? (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.slug || slugError}
                </p>
              ) : (
                <p className="text-xs text-[#6B675F]">
                  ipointgenie.com/place/{wizardData.slug || "slug-cua-ban"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription" className="text-sm font-medium">
                {t("admin.placeWizard.basicInfo.description")}
              </Label>
              <Textarea
                id="shortDescription"
                placeholder={t("admin.placeWizard.basicInfo.descriptionPlaceholder")}
                rows={3}
                value={wizardData.shortDescription}
                onChange={(e) =>
                  updateWizardData({ shortDescription: e.target.value })
                }
                maxLength={200}
                className="resize-none rounded-xl border-black/15 bg-[#FFFEFB] focus-visible:ring-black"
              />
              <div className="flex justify-end">
                <span className="text-xs text-muted-foreground">
                  {wizardData.shortDescription?.length || 0}/200
                </span>
              </div>
            </div>
          </div>
        </WizardPanel>

        {/* Right Column: Location Details */}
        <WizardPanel className="p-5 sm:p-6">
          <WizardSectionHeading
            icon={MapPin}
            title={t("admin.placeWizard.basicInfo.address")}
            description="Chọn tỉnh/thành và phường/xã; sau đó nhập địa chỉ cụ thể."
          />
          <div className="mt-6 space-y-5">
            <ProvinceWardSelect
              provinceCode={wizardData.provinceCode}
              wardCode={wizardData.wardCode}
              errors={errors}
              onProvinceChange={(provinceCode) =>
                updateWizardData({
                  provinceCode,
                  wardCode: "",
                  districtId: null,
                  wardId: null,
                })
              }
              onWardChange={(wardCode) => updateWizardData({ wardCode })}
            />

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">
                {t("admin.placeWizard.basicInfo.address")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                placeholder={t("admin.placeWizard.basicInfo.addressPlaceholder")}
                value={wizardData.address}
                onChange={(e) =>
                  updateWizardData({ address: e.target.value })
                }
                className={cn(
                  "h-11 rounded-xl border-black/15 bg-[#FFFEFB] focus-visible:ring-black",
                  errors.address && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {errors.address && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.address}
                </p>
              )}
            </div>
          </div>
        </WizardPanel>
      </div>

      {/* Actions */}
      <WizardActions>
        <p className="hidden pl-2 text-sm text-[#6B675F] sm:block">Bước tiếp theo: nội dung, hình ảnh và vị trí.</p>
        <Button
          onClick={handleNext}
          disabled={loading}
          size="lg"
          className="ml-auto gap-2 rounded-xl bg-[#11110F] px-5 text-white hover:bg-black"
        >
          {t("common.next")}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </WizardActions>
    </div>
  );
};

export default StepBasicInfo;
