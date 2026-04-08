import { useState, useEffect, useCallback } from "react";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Globe from "lucide-react/dist/esm/icons/globe";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Type from "lucide-react/dist/esm/icons/type";
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
import CategorySelector from "./CategorySelector";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * STEP 1: BASIC INFO
 * Technical Industrial Minimalism Redesign
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

  const loadDistricts = useCallback(async () => {
    setLoadingDistricts(true);
    try {
      const response = await districtService.getAllDistricts();
      setDistricts(response.data || []);
    } catch {
      toast({
        variant: "destructive",
        title: "LỖI HỆ THỐNG",
        description: "Không thể tải dữ liệu quận/huyện.",
      });
    } finally {
      setLoadingDistricts(false);
    }
  }, [toast]);

  const loadWards = useCallback(
    async (districtId) => {
      setLoadingWards(true);
      try {
        const response = await wardService.getWardsByDistrict(districtId);
        setWards(response.data || []);
      } catch {
        toast({
          variant: "destructive",
          title: "LỖI HỆ THỐNG",
          description: "Không thể tải dữ liệu phường/xã.",
        });
        setWards([]);
      } finally {
        setLoadingWards(false);
      }
    },
    [toast],
  );

  // Load districts on mount
  useEffect(() => {
    loadDistricts();
  }, [loadDistricts]);

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
  }, [wizardData.districtId, wizardData.wardId, loadWards, updateWizardData]);

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
          slug: exists ? "SLUG ĐÃ TỒN TẠI" : null,
        }));
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
      newErrors.name = "VUI LÒNG NHẬP TÊN ĐỊA ĐIỂM";
    }

    if (!wizardData.slug?.trim()) {
      newErrors.slug = "VUI LÒNG NHẬP SLUG";
    }

    if (!wizardData.categoryId) {
      newErrors.categoryId = "VUI LÒNG CHỌN DANH MỤC";
    }

    if (!wizardData.districtId) {
      newErrors.districtId = "VUI LÒNG CHỌN QUẬN/HUYỆN";
    }

    if (!wizardData.address?.trim()) {
      newErrors.address = "VUI LÒNG NHẬP ĐỊA CHỈ";
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
        title: "DỮ LIỆU KHÔNG HỢP LỆ",
        description: "Vui lòng kiểm tra các trường bắt buộc màu đỏ.",
      });
    }
  };

  // Shared Styles
  const labelStyle =
    "text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5 font-mono block";
  const inputStyle =
    "rounded-none border-black focus:ring-1 focus:ring-black font-mono text-sm";
  const errorStyle =
    "text-xs text-red-600 font-bold uppercase mt-1 font-mono flex items-center gap-1";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-12">
      {/* Category Section - Full Width */}
      <section className="space-y-4">
        <CategorySelector
          value={wizardData.categoryId}
          onChange={(categoryId) => updateWizardData({ categoryId })}
          error={errors.categoryId}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Basic Details */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b-2 border-black pb-2 mb-4">
            <Type className="w-5 h-5" />
            <h3 className="text-lg font-black uppercase tracking-widest">
              THÔNG TIN CHUNG
            </h3>
          </div>

          <div className="space-y-1">
            <label htmlFor="name" className={labelStyle}>
              TÊN ĐỊA ĐIỂM <span className="text-red-600">*</span>
            </label>
            <div className="relative group">
              <Input
                id="name"
                placeholder="VD: CAFE SÔNG HẬU"
                value={wizardData.name}
                onChange={handleNameChange}
                className={cn(
                  inputStyle,
                  errors.name && "border-red-600 bg-red-50",
                )}
              />
            </div>
            {errors.name && <p className={errorStyle}>⚠ {errors.name}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="slug" className={labelStyle}>
              ĐƯỜNG DẪN (SLUG) <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Input
                id="slug"
                placeholder="quan-cafe-song-hau"
                value={wizardData.slug}
                onChange={handleSlugChange}
                className={cn(
                  inputStyle,
                  "pr-10 lowercase",
                  errors.slug && "border-red-600 bg-red-50",
                )}
              />
              <div className="absolute right-3 top-2.5">
                {checkingSlug ? (
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                ) : (
                  <Globe className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </div>
            {errors.slug && <p className={errorStyle}>⚠ {errors.slug}</p>}
            <div className="text-[10px] text-slate-500 font-mono mt-1 w-full truncate border border-dashed border-slate-300 p-1 bg-slate-50">
              didaugio.com/place/{wizardData.slug || "slug-cua-ban"}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="shortDescription" className={labelStyle}>
              MÔ TẢ NGẮN
            </label>
            <Textarea
              id="shortDescription"
              placeholder="MÔ TẢ NGẮN GỌN CHO THẺ DANH SÁCH..."
              rows={4}
              value={wizardData.shortDescription}
              onChange={(e) =>
                updateWizardData({ shortDescription: e.target.value })
              }
              maxLength={200}
              className={cn(inputStyle, "resize-none min-h-[120px]")}
            />
            <div className="flex justify-end border-t border-black/10">
              <span className="text-[10px] font-mono font-bold text-slate-400">
                {wizardData.shortDescription?.length || 0}/200 KÝ TỰ
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Location Details */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b-2 border-black pb-2 mb-4">
            <MapPin className="w-5 h-5" />
            <h3 className="text-lg font-black uppercase tracking-widest">
              THÔNG TIN VỊ TRÍ
            </h3>
          </div>

          <div className="p-1 border border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-slate-50 border border-slate-200 p-4 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="district" className={labelStyle}>
                    QUẬN/HUYỆN <span className="text-red-600">*</span>
                  </label>
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
                        inputStyle,
                        errors.districtId && "border-red-600 bg-red-50",
                      )}
                    >
                      {loadingDistricts ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-xs">ĐANG TẢI...</span>
                        </div>
                      ) : (
                        <SelectValue placeholder="CHỌN QUẬN" />
                      )}
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-black">
                      {districts.map((district) => (
                        <SelectItem
                          key={district.id}
                          value={district.id.toString()}
                          className="font-mono text-xs focus:bg-black focus:text-white rounded-none"
                        >
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.districtId && <p className={errorStyle}>BẮT BUỘC</p>}
                </div>

                <div className="space-y-1">
                  <label htmlFor="ward" className={labelStyle}>
                    PHƯỜNG/XÃ
                  </label>
                  <Select
                    value={
                      wizardData.wardId ? wizardData.wardId.toString() : ""
                    }
                    onValueChange={(val) =>
                      updateWizardData({ wardId: parseInt(val) })
                    }
                    disabled={!wizardData.districtId || loadingWards}
                  >
                    <SelectTrigger className={inputStyle}>
                      {loadingWards ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-xs">ĐANG TẢI...</span>
                        </div>
                      ) : (
                        <SelectValue placeholder="CHỌN PHƯỜNG" />
                      )}
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-black h-[200px]">
                      {wards.map((ward) => (
                        <SelectItem
                          key={ward.id}
                          value={ward.id.toString()}
                          className="font-mono text-xs focus:bg-black focus:text-white rounded-none"
                        >
                          {ward.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="address" className={labelStyle}>
                  SỐ NHÀ, TÊN ĐƯỜNG <span className="text-red-600">*</span>
                </label>
                <Input
                  id="address"
                  placeholder="VD: 123 Nguyễn Văn Linh"
                  value={wizardData.address}
                  onChange={(e) =>
                    updateWizardData({ address: e.target.value })
                  }
                  className={cn(
                    inputStyle,
                    errors.address && "border-red-600 bg-red-50",
                  )}
                />
                {errors.address && (
                  <p className={errorStyle}>⚠ {errors.address}</p>
                )}
              </div>
            </div>
            <div className="bg-black text-white p-2 text-[10px] font-mono text-center uppercase">
              Đảm bảo chính xác để hiển thị trên bản đồ
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-6 border-t-2 border-black border-dashed mt-8">
        <Button
          onClick={handleNext}
          disabled={loading}
          className="rounded-none border border-black bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all min-w-[160px] h-12 text-sm font-bold uppercase tracking-wider"
        >
          TIẾP TỤC ĐẾN CHI TIẾT
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepBasicInfo;
