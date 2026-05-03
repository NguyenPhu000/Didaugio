import { useState, useEffect, useCallback } from "react";
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
import * as districtService from "@/apis/districtService";
import * as wardService from "@/apis/wardService";
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
  const { toast } = useToast();
  const { wizardData, updateWizardData, nextStep, loading, checkSlugExists } =
    usePlaceStore();

  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [errors, setErrors] = useState({});
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugError, setSlugError] = useState(null);

  const loadDistricts = useCallback(async () => {
    setLoadingDistricts(true);
    try {
      const response = await districtService.getAllDistricts();
      setDistricts(response.data || []);
    } catch {
      toast({
        variant: "destructive",
        title: "Lỗi hệ thống",
        description: "Không thể tải dữ liệu quận/huyện.",
      });
    } finally {
      setLoadingDistricts(false);
    }
  }, [toast]);

  const loadWards = useCallback(async (districtId) => {
    setLoadingWards(true);
    try {
      const response = await wardService.getWardsByDistrict(districtId);
      setWards(response.data || []);
    } catch {
      toast({
        variant: "destructive",
        title: "Lỗi hệ thống",
        description: "Không thể tải dữ liệu phường/xã.",
      });
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDistricts();
  }, [loadDistricts]);

  useEffect(() => {
    if (wizardData.districtId) {
      loadWards(wizardData.districtId);
    } else {
      setWards([]);
      if (wizardData.wardId !== null) {
        updateWizardData({ wardId: null });
      }
    }
  }, [wizardData.districtId, wizardData.wardId, loadWards, updateWizardData]);

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
        const exists = await checkSlugExists(slug);
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
      newErrors.name = "Vui lòng nhập tên địa điểm";
    }

    if (!wizardData.slug?.trim()) {
      newErrors.slug = "Vui lòng nhập đường dẫn";
    } else if (slugError) {
      newErrors.slug = slugError;
    }

    if (!wizardData.categoryId) {
      newErrors.categoryId = "Vui lòng chọn danh mục";
    }

    if (!wizardData.districtId) {
      newErrors.districtId = "Vui lòng chọn quận/huyện";
    }

    if (!wizardData.address?.trim()) {
      newErrors.address = "Vui lòng nhập địa chỉ";
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
        title: "Dữ liệu không hợp lệ",
        description: "Vui lòng kiểm tra các trường bắt buộc.",
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-12">
      {/* Category Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-primary rounded-full" />
          <h3 className="text-base font-semibold">Danh mục địa điểm</h3>
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
              Thông tin cơ bản
            </CardTitle>
            <CardDescription>
              Nhập tên và mô tả ngắn cho địa điểm của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Tên địa điểm <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="VD: Quán Cafe Sông Hậu"
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
                Đường dẫn (Slug) <span className="text-destructive">*</span>
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
                Mô tả ngắn
              </Label>
              <Textarea
                id="shortDescription"
                placeholder="Mô tả ngắn gọn cho thẻ danh sách..."
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
              Vị trí địa điểm
            </CardTitle>
            <CardDescription>
              Chọn địa chỉ chính xác để hiển thị trên bản đồ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="district" className="text-sm font-medium">
                  Quận/Huyện <span className="text-destructive">*</span>
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
                        <span className="text-sm">Đang tải...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Chọn quận" />
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
                  Phường/Xã
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
                        <span className="text-sm">Đang tải...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Chọn phường" />
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
                Số nhà, tên đường <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                placeholder="VD: 123 Nguyễn Văn Linh"
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
          Tiếp tục
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepBasicInfo;
