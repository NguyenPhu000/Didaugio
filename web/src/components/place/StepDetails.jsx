import { useState, useEffect, lazy, Suspense, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  Info,
  MapPin,
  Phone,
} from "lucide-react";
import usePlaceStore from "@/stores/placeStore";
import {
  Button,
  Input,
  Label,
  Card,
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

// Lazy load MapPicker (heavy component with maplibre-gl)
const MapPicker = lazy(() => import("./MapPicker"));

const MapSkeleton = () => (
  <div className="w-full h-[500px] rounded-lg bg-slate-100 animate-pulse flex items-center justify-center">
    <MapPin className="h-12 w-12 text-slate-300" />
  </div>
);

/**
 * STEP 2: DETAILS
 * Chi tiết: Mô tả, hình ảnh, vị trí, liên hệ
 */

const StepDetails = () => {
  const { toast } = useToast();
  const { wizardData, updateWizardData, nextStep, prevStep, loading } =
    usePlaceStore();

  const [errors, setErrors] = useState({});
  const lastLookupRef = useRef({ lat: null, lng: null });

  const validate = () => {
    const newErrors = {};

    if (!wizardData.latitude || !wizardData.longitude) {
      newErrors.location = "Vui lòng chọn vị trí trên bản đồ";
    }

    if (!wizardData.description?.trim()) {
      newErrors.description = "Vui lòng nhập mô tả chi tiết";
    }

    // Validate phone format (optional)
    if (
      wizardData.phone &&
      !/^[0-9]{10,11}$/.test(wizardData.phone.replace(/\s/g, ""))
    ) {
      newErrors.phone = "Số điện thoại không hợp lệ (10-11 chữ số)";
    }

    // Validate email format (optional)
    if (
      wizardData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wizardData.email)
    ) {
      newErrors.email = "Email không hợp lệ";
    }

    // Validate website URL (optional)
    if (wizardData.website && !/^https?:\/\/.+/.test(wizardData.website)) {
      newErrors.website =
        "URL website không hợp lệ (cần bắt đầu với http:// hoặc https://)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Auto-lookup location when map marker changes
  useEffect(() => {
    const lat = wizardData.latitude;
    const lng = wizardData.longitude;

    if (!lat || !lng) return;

    // Check if this is the same location as last lookup
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
        // Update ref to prevent duplicate lookups
        lastLookupRef.current = { lat, lng };

        toast({
          title: "Đã xác định khu vực",
          description: `Vị trí thuộc ${district.name}, TP. Cần Thơ`,
          variant: "success",
          className: "bg-green-50 border-green-200 text-green-800",
        });
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [wizardData.latitude, wizardData.longitude, toast]);

  const handleNext = () => {
    if (validate()) {
      nextStep();
    } else {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng kiểm tra lại thông tin",
      });
    }
  };

  const handleBack = () => {
    prevStep();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white border border-black p-0 rounded-none h-auto">
          <TabsTrigger
            value="description"
            className="rounded-none border-r border-black font-mono uppercase text-xs py-3 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none transition-all"
          >
            <Info className="w-3 h-3 mr-2" /> MÔ TẢ & TAGS
          </TabsTrigger>
          <TabsTrigger
            value="images"
            className="rounded-none border-r border-black font-mono uppercase text-xs py-3 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none transition-all"
          >
            <ImageIcon className="w-3 h-3 mr-2" /> HÌNH ẢNH
          </TabsTrigger>
          <TabsTrigger
            value="location"
            className="rounded-none border-r border-black font-mono uppercase text-xs py-3 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none transition-all"
          >
            <MapPin className="w-3 h-3 mr-2" /> VỊ TRÍ
          </TabsTrigger>
          <TabsTrigger
            value="contact"
            className="rounded-none font-mono uppercase text-xs py-3 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none transition-all"
          >
            <Phone className="w-3 h-3 mr-2" /> LIÊN HỆ
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Description */}
        <TabsContent value="description" className="space-y-6 mt-6">
          <Card className="p-8 border border-black shadow-hard bg-white rounded-none">
            <div className="space-y-8">
              <div>
                <Label
                  htmlFor="description"
                  className="text-xs font-bold uppercase tracking-wider mb-2 block"
                >
                  MÔ TẢ CHI TIẾT <span className="text-red-500">*</span>
                </Label>
                <div className="bg-gray-50 border border-black p-4 mb-4">
                  <p className="text-[10px] font-mono text-gray-500 uppercase leading-relaxed mb-4">
                    * GIỚI THIỆU VỀ KHÔNG GIAN, PHONG CÁCH, VÀ NHỮNG ĐIỂM ĐẶC
                    BIỆT CỦA ĐỊA ĐIỂM. INFORMATION SHOULD BE DETAILED TO IMPROVE
                    SEO AND USER EXPERIENCE.
                  </p>
                  <Textarea
                    id="description"
                    placeholder="TYPE YOUR DESCRIPTION HERE..."
                    rows={8}
                    value={wizardData.description}
                    onChange={(e) =>
                      updateWizardData({ description: e.target.value })
                    }
                    className={`bg-white rounded-none border-black focus-visible:ring-0 font-mono text-sm resize-none ${errors.description ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.description && (
                  <div className="flex items-center gap-2 mt-2 text-red-500 text-xs font-mono uppercase">
                    <Info className="h-3 w-3" /> {errors.description}
                  </div>
                )}
              </div>

              <div className="border-t border-black border-dashed"></div>

              {/* Price Range */}
              <PriceRangeSlider
                priceRange={wizardData.priceRange}
                priceFrom={wizardData.priceFrom}
                priceTo={wizardData.priceTo}
                onChange={(data) => updateWizardData(data)}
              />

              <div className="border-t border-black border-dashed"></div>

              {/* Tags */}
              <TagSelector
                selectedTags={wizardData.tagIds || []} // Assuming tagIds is the field
                onChange={(tags) => updateWizardData({ tagIds: tags })}
              />

              <div className="border-t border-black border-dashed"></div>

              {/* Opening Hours */}
              <OpeningHoursEditor
                value={wizardData.openingHours || []}
                onChange={(hours) => updateWizardData({ openingHours: hours })}
              />
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Images */}
        <TabsContent value="images" className="mt-6">
          <Card className="p-6 border-slate-200 shadow-sm bg-slate-50/30">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-800">
                Hình ảnh địa điểm
              </h3>
              <p className="text-sm text-slate-500">
                Đăng tải hình ảnh đẹp nhất để thu hút khách hàng. Ảnh bìa sẽ
                được hiển thị đầu tiên.
              </p>
            </div>
            <ImageUploader
              images={wizardData.images || []}
              onChange={(images) => updateWizardData({ images })}
            />
          </Card>
        </TabsContent>

        {/* Tab 3: Location */}
        <TabsContent value="location" className="mt-6">
          <div className="space-y-2">
            <div className="flex justify-between items-end mb-2">
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  Ghim vị trí trên bản đồ
                </h3>
                <p className="text-sm text-slate-500">
                  Kéo marker đến vị trí chính xác của địa điểm
                </p>
              </div>
              {errors.location && (
                <span className="text-sm font-medium text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                  {errors.location}
                </span>
              )}
            </div>
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
          </div>
        </TabsContent>

        {/* Tab 4: Contact Info */}
        <TabsContent value="contact" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 border-slate-200 bg-white">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" /> Thông tin chính
              </h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0909 123 456"
                    value={wizardData.phone}
                    onChange={(e) =>
                      updateWizardData({ phone: e.target.value })
                    }
                    className={errors.phone && "border-red-500"}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500">{errors.phone}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@example.com"
                    value={wizardData.email}
                    onChange={(e) =>
                      updateWizardData({ email: e.target.value })
                    }
                    className={errors.email && "border-red-500"}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-5 border-slate-200 bg-white">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" /> Mạng xã hội & Web
              </h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    value={wizardData.website}
                    onChange={(e) =>
                      updateWizardData({ website: e.target.value })
                    }
                    className={errors.website && "border-red-500"}
                  />
                  {errors.website && (
                    <p className="text-xs text-red-500">{errors.website}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    placeholder="https://facebook.com/yourpage"
                    value={wizardData.facebook}
                    onChange={(e) =>
                      updateWizardData({ facebook: e.target.value })
                    }
                  />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between pt-6 border-t border-dashed">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={loading}
          size="lg"
          className="border-slate-300 hover:bg-slate-50 text-slate-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <Button
          onClick={handleNext}
          disabled={loading}
          size="lg"
          className="bg-primary hover:bg-primary/90 min-w-[140px]"
        >
          Tiếp theo
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepDetails;
