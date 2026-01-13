import { useState, useEffect } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import usePlaceStore from "@/stores/placeStore";
import * as districtService from "@/services/districtService";
import * as wardService from "@/services/wardService";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    updateWizardData({ name });

    // Auto-generate slug if not manually edited
    if (!wizardData.slug || generateSlug(wizardData.name) === wizardData.slug) {
      const newSlug = generateSlug(name);
      updateWizardData({ slug: newSlug });
    }
  };

  const handleSlugChange = async (e) => {
    const slug = e.target.value;
    updateWizardData({ slug });

    // Check if slug exists
    if (slug && slug.length >= 3) {
      setCheckingSlug(true);
      try {
        const exists = await checkSlugExists(slug);
        if (exists) {
          setErrors((prev) => ({
            ...prev,
            slug: "Slug này đã tồn tại",
          }));
        } else {
          setErrors((prev) => ({ ...prev, slug: null }));
        }
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
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Tên địa điểm <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="VD: Quán Cafe Sông Hậu"
            value={wizardData.name}
            onChange={handleNameChange}
            className={errors.name && "border-red-500"}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Slug */}
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
              className={errors.slug && "border-red-500"}
            />
            {checkingSlug && (
              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {errors.slug && (
            <p className="text-sm text-red-500">{errors.slug}</p>
          )}
          <p className="text-sm text-muted-foreground">
            URL sẽ là: /places/{wizardData.slug || "slug"}
          </p>
        </div>

        {/* Category */}
        <CategorySelector
          value={wizardData.categoryId}
          onChange={(categoryId) => updateWizardData({ categoryId })}
          error={errors.categoryId}
        />

        {/* District */}
        <div className="space-y-2">
          <Label htmlFor="district">
            Quận/Huyện <span className="text-red-500">*</span>
          </Label>
          <Select
            value={wizardData.districtId ? wizardData.districtId.toString() : ""}
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tải...
                </div>
              ) : (
                <SelectValue placeholder="Chọn quận/huyện" />
              )}
            </SelectTrigger>
            <SelectContent>
              {districts.map((district) => (
                <SelectItem key={district.id} value={district.id.toString()}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.districtId && (
            <p className="text-sm text-red-500">{errors.districtId}</p>
          )}
        </div>

        {/* Ward */}
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tải...
                </div>
              ) : (
                <SelectValue placeholder="Chọn phường/xã (tùy chọn)" />
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

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address">
            Địa chỉ <span className="text-red-500">*</span>
          </Label>
          <Input
            id="address"
            placeholder="123 Đường Nguyễn Văn Linh"
            value={wizardData.address}
            onChange={(e) => updateWizardData({ address: e.target.value })}
            className={errors.address && "border-red-500"}
          />
          {errors.address && (
            <p className="text-sm text-red-500">{errors.address}</p>
          )}
        </div>

        {/* Short Description */}
        <div className="space-y-2">
          <Label htmlFor="shortDescription">Mô tả ngắn</Label>
          <Textarea
            id="shortDescription"
            placeholder="Mô tả ngắn gọn về địa điểm (hiển thị trong danh sách)"
            rows={3}
            value={wizardData.shortDescription}
            onChange={(e) =>
              updateWizardData({ shortDescription: e.target.value })
            }
            maxLength={200}
          />
          <p className="text-sm text-muted-foreground text-right">
            {wizardData.shortDescription?.length || 0}/200
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={loading} size="lg">
          Tiếp theo
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepBasicInfo;
