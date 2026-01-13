import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import usePlaceStore from "@/stores/placeStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import MapPicker from "./MapPicker";
import ImageUploader from "./ImageUploader";
import { useToast } from "@/hooks/use-toast";

/**
 * STEP 2: DETAILS
 * Chi tiết: Mô tả, hình ảnh, vị trí, liên hệ
 */

const StepDetails = () => {
  const { toast } = useToast();
  const { wizardData, updateWizardData, nextStep, prevStep, loading } =
    usePlaceStore();

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!wizardData.latitude || !wizardData.longitude) {
      newErrors.location = "Vui lòng chọn vị trí trên bản đồ";
    }

    if (!wizardData.description?.trim()) {
      newErrors.description = "Vui lòng nhập mô tả chi tiết";
    }

    // Validate phone format (optional)
    if (wizardData.phone && !/^[0-9]{10,11}$/.test(wizardData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Số điện thoại không hợp lệ (10-11 chữ số)";
    }

    // Validate email format (optional)
    if (wizardData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wizardData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    // Validate website URL (optional)
    if (wizardData.website && !/^https?:\/\/.+/.test(wizardData.website)) {
      newErrors.website = "URL website không hợp lệ (cần bắt đầu với http:// hoặc https://)";
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
        title: "Lỗi",
        description: "Vui lòng kiểm tra lại thông tin",
      });
    }
  };

  const handleBack = () => {
    prevStep();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="description">Mô tả</TabsTrigger>
          <TabsTrigger value="images">Hình ảnh</TabsTrigger>
          <TabsTrigger value="location">Vị trí</TabsTrigger>
          <TabsTrigger value="contact">Liên hệ</TabsTrigger>
        </TabsList>

        {/* Tab 1: Description */}
        <TabsContent value="description" className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="description">
              Mô tả chi tiết <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Mô tả chi tiết về địa điểm, đặc điểm nổi bật, không gian, phong cách..."
              rows={8}
              value={wizardData.description}
              onChange={(e) =>
                updateWizardData({ description: e.target.value })
              }
              className={errors.description && "border-red-500"}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Mô tả càng chi tiết càng tốt để giúp người dùng hiểu rõ hơn về
              địa điểm
            </p>
          </div>
        </TabsContent>

        {/* Tab 2: Images */}
        <TabsContent value="images" className="mt-6">
          <ImageUploader
            images={wizardData.images || []}
            onChange={(images) => updateWizardData({ images })}
          />
        </TabsContent>

        {/* Tab 3: Location */}
        <TabsContent value="location" className="mt-6">
          <MapPicker
            latitude={wizardData.latitude}
            longitude={wizardData.longitude}
            onChange={(lat, lng) =>
              updateWizardData({ latitude: lat, longitude: lng })
            }
            error={errors.location}
          />
        </TabsContent>

        {/* Tab 4: Contact Info */}
        <TabsContent value="contact" className="space-y-4 mt-6">
          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0909 123 456"
              value={wizardData.phone}
              onChange={(e) => updateWizardData({ phone: e.target.value })}
              className={errors.phone && "border-red-500"}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="contact@example.com"
              value={wizardData.email}
              onChange={(e) => updateWizardData({ email: e.target.value })}
              className={errors.email && "border-red-500"}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://example.com"
              value={wizardData.website}
              onChange={(e) => updateWizardData({ website: e.target.value })}
              className={errors.website && "border-red-500"}
            />
            {errors.website && (
              <p className="text-sm text-red-500">{errors.website}</p>
            )}
          </div>

          {/* Facebook */}
          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              placeholder="https://facebook.com/yourpage"
              value={wizardData.facebook}
              onChange={(e) => updateWizardData({ facebook: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Link đến trang Facebook của địa điểm
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={loading}
          size="lg"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <Button onClick={handleNext} disabled={loading} size="lg">
          Tiếp theo
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepDetails;
