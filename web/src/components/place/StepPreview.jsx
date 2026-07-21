import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  MapPin,
  Phone,
  Mail,
  Globe,
  Tag,
  Loader2,
  Clock,
  DollarSign,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Headphones,
} from "lucide-react";
import usePlaceStore from "@/stores/placeStore";
import { useCategories } from "@/hooks/queries/useCategoryQueries";
import { useTags } from "@/hooks/queries/useTagQueries";
import { useCreatePlace, useUpdatePlace } from "@/hooks/queries/usePlaceQueries";
import { useDistrictDetail, useWardDetail } from "@/hooks/queries/useDistrictQueries";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from "@/components/ui";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { WizardActions, WizardPanel } from "./wizard/PlaceWizardSurface";

/**
 * STEP 3: PREVIEW & SUBMIT
 * Clean, modern Shadcn/UI style
 */
const StepPreview = ({ isEditMode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { wizardData, prevStep } =
    usePlaceStore();

  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const createMutation = useCreatePlace();
  const updateMutation = useUpdatePlace();

  // Fetch district/ward details
  const { data: districtRes } = useDistrictDetail(wizardData.districtId);
  const district = districtRes?.data || districtRes;
  const { data: wardRes } = useWardDetail(wizardData.wardId);
  const ward = wardRes?.data || wardRes;

  const submitting = createMutation.isPending || updateMutation.isPending;

  const category = categories.find((cat) => cat.id === wizardData.categoryId);

  const handleSubmit = async () => {
    try {
      const placeData = {
        ...wizardData,
        images: wizardData.images || [],
        tagIds: wizardData.tagIds || [],
        openingHours: wizardData.openingHours || [],
        amenities: wizardData.amenities || [],
      };

      if (isEditMode) {
        const updateId = wizardData.id;

        if (!updateId) {
          console.error("Missing ID in wizardData", wizardData);
          toast({
            variant: "destructive",
            title: t("common.error"),
            description: t("admin.placeWizard.error"),
          });
          return;
        }

        await updateMutation.mutateAsync({ id: updateId, data: placeData });
        toast({
          title: t("common.success"),
          description: t("admin.placeWizard.preview.updateSuccess"),
        });
      } else {
        await createMutation.mutateAsync(placeData);
        toast({
          title: t("common.success"),
          description: t("admin.placeWizard.preview.createSuccess"),
        });
      }

      navigate("/admin/places");
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || t("admin.placeWizard.loadFailed"),
      });
    }
  };

  const handleBack = () => {
    prevStep();
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Summary Header */}
      <WizardPanel className="overflow-hidden">
        <div className="border-b border-black/10 bg-[#FFFEFB] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              {category && (
                <Badge variant="outline" className="border-black/15 bg-[#F4F0E8] text-xs text-[#11110F]">
                  {category.name}
                </Badge>
              )}
              <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                {wizardData.name || t("common.noData")}
              </h2>
              <div className="flex items-center gap-2 text-sm text-[#6B675F]">
                <MapPin className="h-4 w-4 text-[#11110F]" />
                <span>
                  {wizardData.address}
                  {district && `, ${district.name}`}
                  {ward && `, ${ward.name}`}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {wizardData.images?.length || 0} {t("admin.placeWizard.preview.images")}
              </Badge>
              {wizardData.slug && (
                <Badge variant="outline" className="text-xs font-mono lowercase">
                  /{wizardData.slug}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </WizardPanel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images Gallery */}
          <Card className="rounded-[24px] border-black/10 bg-[#FFFEFB] shadow-[0_24px_70px_rgba(32,28,20,0.08)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-5 w-5 text-[#11110F]" />
                {t("admin.placeWizard.preview.images")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {wizardData.images && wizardData.images.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {wizardData.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-square border rounded-lg bg-muted overflow-hidden relative group"
                    >
                      <img
                        src={img.imageData}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      {img.isCover && (
                        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-medium px-1.5 py-0.5 rounded">
                          Cover
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t("admin.placeWizard.preview.noImages")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="rounded-[24px] border-black/10 bg-[#FFFEFB] shadow-[0_24px_70px_rgba(32,28,20,0.08)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="h-5 w-5 text-[#11110F]" />
                {t("admin.placeWizard.preview.description")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {wizardData.description || t("common.noData")}
              </p>
            </CardContent>
          </Card>

          {(wizardData.spokenGuide?.text || wizardData.spokenGuide?.faqs?.length > 0) && (
          <Card className="rounded-[24px] border-black/10 bg-[#FFFEFB] shadow-[0_24px_70px_rgba(32,28,20,0.08)]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Headphones className="h-5 w-5 text-[#11110F]" />
                  Thuyết minh địa điểm
                </CardTitle>
                <CardDescription>
                  {wizardData.spokenGuide?.faqs?.length || 0}/5 câu hỏi thường gặp
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {wizardData.spokenGuide?.text || "Chỉ có nội dung câu hỏi thường gặp."}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tags & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="rounded-[24px] border-black/10 bg-[#FFFEFB] shadow-[0_24px_70px_rgba(32,28,20,0.08)]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tag className="h-5 w-5 text-[#11110F]" />
                  {t("admin.placeWizard.preview.tags")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {wizardData.tagIds && wizardData.tagIds.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {wizardData.tagIds.map((tagId) => {
                      const tag = tags.find((t) => t.id === tagId);
                      return tag ? (
                        <Badge key={tagId} variant="secondary" className="text-xs">
                          #{tag.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("common.noData")}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[24px] border-black/10 bg-[#FFFEFB] shadow-[0_24px_70px_rgba(32,28,20,0.08)]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-5 w-5 text-[#11110F]" />
                  {t("admin.placeWizard.preview.priceRange")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {wizardData.priceRange ? (
                  <Badge variant="outline">{wizardData.priceRange}</Badge>
                ) : null}
                <p className="text-sm text-muted-foreground">
                  {wizardData.priceFrom
                    ? `${Number(wizardData.priceFrom).toLocaleString("vi-VN")} - ${Number(wizardData.priceTo || wizardData.priceFrom).toLocaleString("vi-VN")} VND`
                    : t("common.noData")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="rounded-[24px] border-black/10 bg-[#FFFEFB] shadow-[0_24px_70px_rgba(32,28,20,0.08)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-[#11110F]" />
                {t("admin.placeWizard.preview.openingHours")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {wizardData.openingHours && wizardData.openingHours.length > 0 ? (
                <div className="space-y-2">
                  {wizardData.openingHours.map((slot, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="font-medium w-12">
                        {slot.dayOfWeek === 8 ? "CN" : `T${slot.dayOfWeek}`}
                      </span>
                      <span
                        className={cn(
                          "text-muted-foreground",
                          slot.isClosed && "text-destructive"
                        )}
                      >
                        {slot.isClosed
                          ? t("common.disabled")
                          : `${slot.openTime} - ${slot.closeTime}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("common.noData")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border-black/10 bg-[#FFFEFB] shadow-[0_24px_70px_rgba(32,28,20,0.08)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="h-5 w-5 text-[#11110F]" />
                {t("admin.placeWizard.preview.phone")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {wizardData.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{wizardData.phone}</span>
                </div>
              )}
              {wizardData.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{wizardData.email}</span>
                </div>
              )}
              {wizardData.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{wizardData.website}</span>
                </div>
              )}
              {!wizardData.phone && !wizardData.email && !wizardData.website && (
                <p className="text-sm text-muted-foreground">
                  {t("common.noData")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <WizardActions>
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={submitting}
          size="lg"
          className="gap-2 rounded-xl border-black/20 bg-transparent text-[#11110F] hover:bg-[#F4F0E8]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          size="lg"
          className="gap-2 rounded-xl bg-[#11110F] text-white hover:bg-black"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("common.processing")}
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              {isEditMode ? t("admin.placeWizard.preview.save") : t("common.create")}
            </>
          )}
        </Button>
      </WizardActions>
    </div>
  );
};

export default StepPreview;
