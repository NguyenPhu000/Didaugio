import { useState, useEffect } from "react";
import { ArrowRight, Loader2, MapPin } from "lucide-react";
import AnimatedIcon from "@/components/ui/animated-icon";
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
import { Card } from "@/components/ui/Card";
import CategorySelector from "./CategorySelector";
import { useToast } from "@/hooks/use-toast";

/**
 * STEP 1: BASIC INFO
 * Thông tin cơ bản: Tên, danh mục, địa chỉ
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

  // Load districts on mount
  useEffect(() => {
    loadDistricts();
  }, []);

  // Load wards when district changes
  useEffect(() => {
    if (wizardData.districtId) {
      loadWards(wizardData.districtId);
    } else {
      setWards([]);
      // Only reset wardId if it's currently set to avoid infinite loop
      if (wizardData.wardId !== null) {
        updateWizardData({ wardId: null });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardData.districtId, wizardData.wardId]);

  const loadDistricts = async () => {
    setLoadingDistricts(true);
    try {
      const response = await districtService.getAllDistricts();
      setDistricts(response.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách quận/huyện",
      });
    } finally {
      setLoadingDistricts(false);
    }
  };

  const loadWards = async (districtId) => {
    setLoadingWards(true);
    try {
      const response = await wardService.getWardsByDistrict(districtId);
      setWards(response.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách phường/xã",
      });
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
  };

  // Auto-generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (e) => {
    const name = e.target.value;

    // Auto-generate slug if not manually edited
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

    // Check if slug exists (debounced)
    if (slug && slug.length >= 3) {
      setCheckingSlug(true);
      try {
        const exists = await checkSlugExists(slug);
        setErrors((prev) => ({
          ...prev,
          slug: exists ? "Slug này đã tồn tại" : null,
        }));
      } catch (error) {
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
      newErrors.slug = "Vui lòng nhập slug";
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
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* Category Section - Full Width */}
      <section className="space-y-4">
        <CategorySelector
          value={wizardData.categoryId}
          onChange={(categoryId) => updateWizardData({ categoryId })}
          error={errors.categoryId}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Basic Details */}
        <section className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base">
              Tên địa điểm <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="VD: Quán Cafe Sông Hậu"
              value={wizardData.name}
              onChange={handleNameChange}
              className={errors.name && "border-red-500 bg-red-50"}
            />
            {errors.name && (
              <p className="text-sm text-red-500 font-medium">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug (URL thân thiện) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="slug"
                placeholder="quan-cafe-song-hau"
                value={wizardData.slug}
                onChange={handleSlugChange}
                className={`pr-10 ${errors.slug && "border-red-500 bg-red-50"}`}
              />
              {checkingSlug && (
                <div className="absolute right-3 top-3">
                    <AnimatedIcon icon={Loader2} className="h-4 w-4 animate-spin text-muted-foreground" type="none" />
                </div>
              )}
            </div>
            {errors.slug && (
              <p className="text-sm text-red-500 font-medium">{errors.slug}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Địa chỉ trang web sẽ là:{" "}
              <span className="font-mono bg-slate-100 px-1 rounded">
                didaugio.com/place/{wizardData.slug || "slug-cua-ban"}
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription" className="text-base">
              Mô tả ngắn
            </Label>
            <Textarea
              id="shortDescription"
              placeholder="Mô tả súc tích về địa điểm này để hiển thị trên thẻ danh sách..."
              rows={4}
              value={wizardData.shortDescription}
              onChange={(e) =>
                updateWizardData({ shortDescription: e.target.value })
              }
              maxLength={200}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right font-medium">
              {wizardData.shortDescription?.length || 0}/200
            </p>
          </div>
        </section>

        {/* Right Column: Location Details */}
        <section className="space-y-5">
          <Card className="p-5 bg-slate-50/50 border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-slate-700 font-semibold">
              <AnimatedIcon icon={MapPin} className="h-5 w-5 text-primary" type="pulse" />
              <span>Khu vực & Địa chỉ</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="district">
                  Quận/Huyện <span className="text-red-500">*</span>
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
                    className={errors.districtId && "border-red-500"}
                  >
                    {loadingDistricts ? (
                      <div className="flex items-center">
                        <AnimatedIcon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" type="none" />
                        <span className="ml-2">Đang tải...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Chọn quận/huyện" />
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
                  <p className="text-sm text-red-500">{errors.districtId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ward">Phường/Xã</Label>
                <Select
                  value={wizardData.wardId ? wizardData.wardId.toString() : ""}
                  onValueChange={(val) =>
                    updateWizardData({ wardId: parseInt(val) })
                  }
                  disabled={!wizardData.districtId || loadingWards}
                >
                  <SelectTrigger>
                    {loadingWards ? (
                      <div className="flex items-center">
                        <AnimatedIcon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" type="none" />
                        <span className="ml-2">Đang tải...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Chọn phường/xã" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {wards.map((ward) => (
                      <SelectItem key={ward.id} value={ward.id.toString()}>
                        {ward.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                Số nhà, Tên đường <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                placeholder="VD: 123 Đường Nguyễn Văn Linh"
                value={wizardData.address}
                onChange={(e) => updateWizardData({ address: e.target.value })}
                className={errors.address && "border-red-500 bg-red-50"}
              />
              {errors.address && (
                <p className="text-sm text-red-500 font-medium">
                  {errors.address}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                * Địa chỉ chính xác giúp việc tìm kiếm trên bản đồ dễ dàng hơn ở
                bước sau.
              </p>
            </div>
          </Card>
        </section>
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-4 border-t border-dashed">
        <Button
          onClick={handleNext}
          disabled={loading}
          size="lg"
          className="bg-primary hover:bg-primary/90 min-w-[140px]"
        >
          Tiếp theo
          <AnimatedIcon icon={ArrowRight} className="ml-2 h-4 w-4" type="hover" />
        </Button>
      </div>
    </div>
  );
};

export default StepBasicInfo;
