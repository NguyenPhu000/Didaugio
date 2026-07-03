import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Globe,
  Type,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import usePlaceStore from "@/stores/placeStore";
import { useDistricts, useWards } from "@/hooks/queries/useDistrictQueries";
import { useCheckSlugExists } from "@/hooks/queries/usePlaceQueries";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import CategorySelector from "./CategorySelector";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * STEP 1: BASIC INFO
 * Clean, modern Shadcn/UI style
 */
const StepBasicInfo = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { wizardData, updateWizardData, nextStep, loading } =
    usePlaceStore();

  // TanStack Query for districts and wards
  const { data: districtsRes, isLoading: loadingDistricts } = useDistricts();
  const districts = districtsRes?.data || districtsRes || [];
  const { data: wardsRes, isLoading: loadingWards } = useWards(wizardData.districtId);
  const wards = wardsRes?.data || wardsRes || [];

  const { mutateAsync: checkSlug } = useCheckSlugExists();

  const [errors, setErrors] = useState({});
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugError, setSlugError] = useState(null);

  // Reset ward when district changes
  useEffect(() => {
    if (!wizardData.districtId && wizardData.wardId !== null) {
      updateWizardData({ wardId: null });
    }
  }, [wizardData.districtId, wizardData.wardId, updateWizardData]);

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

    if (!wizardData.districtId) {
      newErrors.districtId = t("admin.placeWizard.basicInfo.selectDistrict");
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-12">
      {/* Category Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-primary rounded-full" />
          <h3 className="text-base font-semibold">{t("admin.placeWizard.basicInfo.category")}</h3>
        </div>
        <CategorySelector
          value={wizardData.categoryId}
          onChange={(categoryId) => updateWizardData({ categoryId })}
          error={errors.categoryId}
        />
        {errors.categoryId && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.categoryId}
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Basic Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Type className="h-5 w-5 text-primary" />
              {t("admin.placeWizard.basicInfo.title")}
            </CardTitle>
            <CardDescription>
              {t("admin.placeWizard.basicInfo.descriptionPlaceholder")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
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
                  "h-11",
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
                    "h-11 lowercase pr-10",
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
                <p className="text-xs text-muted-foreground">
                  didaugio.com/place/{wizardData.slug || "slug-cua-ban"}
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
                className="resize-none"
              />
              <div className="flex justify-end">
                <span className="text-xs text-muted-foreground">
                  {wizardData.shortDescription?.length || 0}/200
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Location Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              {t("admin.placeWizard.basicInfo.address")}
            </CardTitle>
            <CardDescription>
              {t("admin.placeWizard.basicInfo.addressPlaceholder")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="district" className="text-sm font-medium">
                  {t("admin.placeWizard.basicInfo.district")} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={
                    wizardData.districtId
                      ? wizardData.districtId.toString()
                      : ""
                  }
                  onValueChange={(val) =>
                    updateWizardData({ districtId: parseInt(val) })
                  }
                  disabled={loadingDistricts}
                >
                  <SelectTrigger
                    className={cn(
                      "h-11",
                      errors.districtId && "border-destructive focus-visible:ring-destructive"
                    )}
                  >
                    {loadingDistricts ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">{t("common.loading")}</span>
                      </div>
                    ) : (
                      <SelectValue placeholder={t("admin.placeWizard.basicInfo.selectDistrict")} />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem
                        key={district.id}
                        value={district.id.toString()}
                      >
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.districtId && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.districtId}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ward" className="text-sm font-medium">
                  {t("admin.placeWizard.basicInfo.ward")} ({t("common.optional").toLowerCase()})
                </Label>
                <Select
                  value={
                    wizardData.wardId ? wizardData.wardId.toString() : ""
                  }
                  onValueChange={(val) =>
                    updateWizardData({ wardId: parseInt(val) })
                  }
                  disabled={!wizardData.districtId || loadingWards}
                >
                  <SelectTrigger className="h-11">
                    {loadingWards ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">{t("common.loading")}</span>
                      </div>
                    ) : (
                      <SelectValue placeholder={t("admin.placeWizard.basicInfo.selectWard")} />
                    )}
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {wards.map((ward) => (
                      <SelectItem
                        key={ward.id}
                        value={ward.id.toString()}
                      >
                        {ward.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

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
                  "h-11",
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
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-6 border-t">
        <Button
          onClick={handleNext}
          disabled={loading}
          size="lg"
          className="gap-2"
        >
          {t("common.next")}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepBasicInfo;
