import { useState, useEffect, lazy, Suspense, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  MapPin,
  Phone,
  Globe,
  DollarSign,
  Tags,
  Clock,
  Info,
  AlertCircle,
} from "lucide-react";
import usePlaceStore from "@/stores/placeStore";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import ImageUploader from "./ImageUploader";
import PriceRangeSlider from "./PriceRangeSlider";
import TagSelector from "./TagSelector";
import OpeningHoursEditor from "./OpeningHoursEditor";
import SpokenGuideEditor from "./SpokenGuideEditor";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { WizardActions } from "./wizard/PlaceWizardSurface";

// Lazy load MapPicker (heavy component with maplibre-gl)
const MapPicker = lazy(() => import("./MapPicker"));

const MapSkeleton = () => (
  <div className="flex h-[400px] w-full animate-pulse items-center justify-center rounded-2xl bg-zinc-100">
    <MapPin className="h-10 w-10 text-black/30" />
  </div>
);

const TAB_ITEMS = [
  { value: "description", icon: Info, labelKey: "admin.placeWizard.details.title" },
  { value: "images", icon: ImageIcon, labelKey: "admin.placeWizard.preview.images" },
  { value: "location", icon: MapPin, labelKey: "admin.placeWizard.preview.location" },
  { value: "contact", icon: Phone, labelKey: "admin.placeWizard.preview.phone" },
];

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-950">
        <Icon className="h-5 w-5 text-black" />
        {title}
      </CardTitle>
      {description && (
        <CardDescription className="mt-1 text-sm text-zinc-500">
          {description}
        </CardDescription>
      )}
    </div>
  </div>
);

/**
 * STEP 2: DETAILS
 * Clean, modern Shadcn/UI style
 */
const StepDetails = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { wizardData, updateWizardData, nextStep, prevStep, loading } =
    usePlaceStore();

  const [errors, setErrors] = useState({});
  const lastLookupRef = useRef({ lat: null, lng: null });

  const validate = () => {
    const newErrors = {};

    if (!wizardData.latitude || !wizardData.longitude) {
      newErrors.location = t("admin.placeWizard.details.selectOnMap");
    }

    if (!wizardData.description?.trim()) {
      newErrors.description = t("admin.placeWizard.basicInfo.descriptionPlaceholder");
    }

    if (
      wizardData.priceFrom &&
      wizardData.priceTo &&
      Number(wizardData.priceTo) < Number(wizardData.priceFrom)
    ) {
      newErrors.priceRange = t("admin.placeWizard.price.maxLessThanMin", {
        defaultValue: "Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu.",
      });
    }

    if (
      wizardData.phone &&
      !/^[0-9]{10,11}$/.test(wizardData.phone.replace(/\s/g, ""))
    ) {
      newErrors.phone = t("validation.phoneFormat");
    }

    if (
      wizardData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wizardData.email)
    ) {
      newErrors.email = t("validation.emailInvalid");
    }

    if (
      wizardData.website &&
      wizardData.website.trim() !== "" &&
      !/^https?:\/\/.+/.test(wizardData.website)
    ) {
      newErrors.website = t("validation.websiteInvalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Auto-lookup location when map marker changes
  useEffect(() => {
    const lat = wizardData.latitude;
    const lng = wizardData.longitude;

    if (!lat || !lng) return;
    if (wizardData.provinceCode) return;
    if (wizardData.districtId) return;

    if (
      lastLookupRef.current.lat === lat &&
      lastLookupRef.current.lng === lng
    ) {
      return;
    }

    const timer = setTimeout(async () => {
      const { lookupLocation } = usePlaceStore.getState();
      const district = await lookupLocation(lat, lng);

      if (district) {
        lastLookupRef.current = { lat, lng };
        toast({
          title: t("common.success"),
          description: `${district.name}`,
          className: "border-green-200 bg-green-50 text-green-800",
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [wizardData.latitude, wizardData.longitude, wizardData.provinceCode, wizardData.districtId, toast, t]);

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

  const handleBack = () => {
    prevStep();
  };

  return (
    <div className="space-y-6 pb-28">
      <Tabs defaultValue="description" className="w-full">
        <div className="rounded-[22px] border border-black/10 bg-[#FFFEFB] p-2 shadow-[0_16px_48px_rgba(32,28,20,0.06)]">
          <TabsList className="grid h-auto w-full grid-cols-4 gap-2 bg-transparent p-0">
            {TAB_ITEMS.map(({ value, icon: Icon, labelKey }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="min-h-14 rounded-[16px] border border-transparent px-2 py-3 text-[#6B675F] transition-all data-[state=active]:border-black data-[state=active]:bg-[#11110F] data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                <span className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
                  <Icon className="h-4 w-4 text-black" />
                  <span className="text-xs font-semibold sm:text-sm">
                    {t(labelKey)}
                  </span>
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab 1: Description */}
        <TabsContent value="description" className="space-y-6 mt-6">
          <Card className="overflow-hidden rounded-[24px] border-black/10 bg-[#FFFEFB] shadow-[0_24px_70px_rgba(32,28,20,0.08)]">
            <CardHeader>
              <SectionHeader
                icon={Info}
                title={t("admin.placeWizard.details.title")}
                description={t("admin.placeWizard.basicInfo.descriptionPlaceholder")}
              />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  {t("admin.placeWizard.basicInfo.description")} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder={t("admin.placeWizard.basicInfo.descriptionPlaceholder")}
                  rows={6}
                  value={wizardData.description}
                  onChange={(e) =>
                    updateWizardData({ description: e.target.value })
                  }
                  className={cn(
                    "min-h-36 resize-none rounded-xl border-black/15 bg-[#FFFEFB] p-4 focus-visible:ring-black",
                    errors.description && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {errors.description && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.description}
                  </p>
                )}
              </div>

              <SpokenGuideEditor
                value={wizardData.spokenGuide}
                onChange={(spokenGuide) => updateWizardData({ spokenGuide })}
              />

              {/* Price Range */}
              <div className="rounded-2xl border border-black/10 bg-[#FFFEFB] p-4">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5 text-black" />
                  <h4 className="font-semibold">{t("admin.placeWizard.details.priceRange")}</h4>
                </div>
                <PriceRangeSlider
                  priceRange={wizardData.priceRange}
                  priceFrom={wizardData.priceFrom}
                  priceTo={wizardData.priceTo}
                  onChange={(data) => updateWizardData(data)}
                  error={errors.priceRange}
                />
              </div>

              {/* Tags */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Tags className="h-5 w-5 text-black" />
                  <h4 className="font-semibold">{t("admin.placeWizard.details.tags")}</h4>
                </div>
                <TagSelector
                  selectedTags={wizardData.tagIds || []}
                  onChange={(tags) => updateWizardData({ tagIds: tags })}
                />
              </div>

              {/* Opening Hours */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-black" />
                  <h4 className="font-semibold">{t("admin.placeWizard.details.openingHours")}</h4>
                </div>
                <OpeningHoursEditor
                  value={wizardData.openingHours || []}
                  onChange={(hours) => updateWizardData({ openingHours: hours })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Images */}
        <TabsContent value="images" className="mt-6">
          <Card className="overflow-hidden rounded-3xl border-zinc-200 shadow-sm">
            <CardHeader>
              <SectionHeader
                icon={ImageIcon}
                title={t("admin.placeWizard.preview.images")}
                description={t("admin.placeWizard.preview.noImages")}
              />
            </CardHeader>
            <CardContent>
              <ImageUploader
                images={wizardData.images || []}
                onChange={(images) => updateWizardData({ images })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Location */}
        <TabsContent value="location" className="mt-6">
          <Card className="overflow-hidden rounded-3xl border-zinc-200 shadow-sm">
            <CardHeader>
              <SectionHeader
                icon={MapPin}
                title={t("admin.placeWizard.preview.location")}
                description={t("admin.placeWizard.details.selectOnMap")}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.location && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {errors.location}
                </div>
              )}
              <Suspense fallback={<MapSkeleton />}>
                <MapPicker
                  latitude={wizardData.latitude}
                  longitude={wizardData.longitude}
                  districtId={wizardData.districtId}
                  onChange={(lat, lng) =>
                    updateWizardData({ latitude: lat, longitude: lng })
                  }
                  error={errors.location}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Contact Info */}
        <TabsContent value="contact" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-3xl border-zinc-200 shadow-sm">
              <CardHeader>
                <SectionHeader
                  icon={Phone}
                  title={t("admin.placeWizard.basicInfo.phone")}
                  description={t("admin.placeWizard.basicInfo.email")}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    {t("admin.placeWizard.basicInfo.phone")}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0909 123 456"
                    value={wizardData.phone}
                    onChange={(e) =>
                      updateWizardData({ phone: e.target.value })
                    }
                    className={cn(
                      "h-11 rounded-xl border-zinc-200",
                      errors.phone && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    {t("admin.placeWizard.basicInfo.email")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@example.com"
                    value={wizardData.email}
                    onChange={(e) =>
                      updateWizardData({ email: e.target.value })
                    }
                    className={cn(
                      "h-11 rounded-xl border-zinc-200",
                      errors.email && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-zinc-200 shadow-sm">
              <CardHeader>
                <SectionHeader
                  icon={Globe}
                  title={t("admin.placeWizard.basicInfo.website")}
                  description={t("admin.placeWizard.details.onlinePresence", {
                    defaultValue: "Website, Facebook",
                  })}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-sm font-medium">
                    {t("admin.placeWizard.basicInfo.website")}
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    value={wizardData.website}
                    onChange={(e) =>
                      updateWizardData({ website: e.target.value })
                    }
                    className={cn(
                      "h-11 rounded-xl border-zinc-200",
                      errors.website && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {errors.website && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.website}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook" className="text-sm font-medium">
                    Facebook
                  </Label>
                  <Input
                    id="facebook"
                    placeholder="https://facebook.com/yourpage"
                    value={wizardData.facebook}
                    onChange={(e) =>
                      updateWizardData({ facebook: e.target.value })
                    }
                    className="h-11 rounded-xl border-zinc-200"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <WizardActions>
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={loading}
          size="lg"
          className="gap-2 rounded-xl border-black/20 bg-transparent text-[#11110F] hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Button>
        <Button
          onClick={handleNext}
          disabled={loading}
          size="lg"
          className="gap-2 rounded-xl bg-[#11110F] text-white hover:bg-black"
        >
          {t("common.next")}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </WizardActions>
    </div>
  );
};

export default StepDetails;
