import { useState, useEffect, lazy, Suspense, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  MapPin,
  Phone,
  Mail,
  Globe,
  Facebook,
  DollarSign,
  Tags,
  Clock,
  Info,
  CheckCircle2,
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Lazy load MapPicker (heavy component with maplibre-gl)
const MapPicker = lazy(() => import("./MapPicker"));

const MapSkeleton = () => (
  <div className="w-full h-[400px] rounded-lg bg-muted animate-pulse flex items-center justify-center">
    <MapPin className="h-10 w-10 text-muted-foreground/50" />
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
  }, [wizardData.latitude, wizardData.longitude, toast]);

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-0 bg-muted/50 rounded-lg">
          <TabsTrigger
            value="description"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 gap-2"
          >
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">{t("admin.placeWizard.details.title")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="images"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 gap-2"
          >
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{t("admin.placeWizard.preview.images")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="location"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 gap-2"
          >
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">{t("admin.placeWizard.preview.location")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="contact"
            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 gap-2"
          >
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">{t("admin.placeWizard.preview.phone")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Description */}
        <TabsContent value="description" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5 text-primary" />
                {t("admin.placeWizard.details.title")}
              </CardTitle>
              <CardDescription>
                {t("admin.placeWizard.basicInfo.descriptionPlaceholder")}
              </CardDescription>
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
                    "resize-none",
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

              {/* Price Range */}
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">{t("admin.placeWizard.details.priceRange")}</h4>
                </div>
                <PriceRangeSlider
                  priceRange={wizardData.priceRange}
                  priceFrom={wizardData.priceFrom}
                  priceTo={wizardData.priceTo}
                  onChange={(data) => updateWizardData(data)}
                />
              </div>

              {/* Tags */}
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Tags className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">{t("admin.placeWizard.details.tags")}</h4>
                </div>
                <TagSelector
                  selectedTags={wizardData.tagIds || []}
                  onChange={(tags) => updateWizardData({ tagIds: tags })}
                />
              </div>

              {/* Opening Hours */}
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-primary" />
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImageIcon className="h-5 w-5 text-primary" />
                {t("admin.placeWizard.preview.images")}
              </CardTitle>
              <CardDescription>
                {t("admin.placeWizard.preview.noImages")}
              </CardDescription>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                {t("admin.placeWizard.preview.location")}
              </CardTitle>
              <CardDescription>
                {t("admin.placeWizard.details.selectOnMap")}
              </CardDescription>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5 text-primary" />
                  {t("admin.placeWizard.basicInfo.phone")}
                </CardTitle>
                <CardDescription>
                  {t("admin.placeWizard.basicInfo.email")}
                </CardDescription>
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
                      "h-11",
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
                      "h-11",
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="h-5 w-5 text-primary" />
                  {t("admin.placeWizard.basicInfo.website")}
                </CardTitle>
                <CardDescription>
                  {t("admin.placeWizard.basicInfo.website")}
                </CardDescription>
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
                      "h-11",
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
                    className="h-11"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between pt-6 border-t bg-background/80 backdrop-blur-sm sticky bottom-0 pb-2">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={loading}
          size="lg"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Button>
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

export default StepDetails;
