import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  MapPin,
  Phone,
  Mail,
  Globe,
  Facebook,
  Tag,
  Loader2,
  Calendar,
  Clock,
  Info,
  DollarSign,
  ImageIcon,
} from "lucide-react";
import usePlaceStore from "@/stores/placeStore";
import useCategoryStore from "@/stores/categoryStore";
import useTagStore from "@/stores/tagStore";
import * as districtService from "@/apis/districtService";
import * as wardService from "@/apis/wardService";
import { Button, Card, Badge, Separator } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * STEP 3: PREVIEW & SUBMIT
 * Xem trước thông tin và gửi
 * T.I.M Style Redesign
 */

const StepPreview = ({ isEditMode }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { wizardData, prevStep, loading, createPlace, updatePlace } =
    usePlaceStore();

  const { categories } = useCategoryStore();
  const { tags, fetchTags } = useTagStore();

  const [district, setDistrict] = useState(null);
  const [ward, setWard] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load district and ward info
  useEffect(() => {
    if (wizardData.districtId) {
      districtService
        .getDistrictById(wizardData.districtId)
        .then((res) => setDistrict(res.data))
        .catch(() => {});
    }

    if (wizardData.wardId) {
      wardService
        .getWardById(wizardData.wardId)
        .then((res) => setWard(res.data))
        .catch(() => {});
    }
  }, [wizardData.districtId, wizardData.wardId]);

  // Load tags if not loaded
  useEffect(() => {
    if (tags.length === 0) {
      fetchTags();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const category = categories.find((cat) => cat.id === wizardData.categoryId);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const placeData = {
        ...wizardData,
        // Ensure arrays are properly formatted
        images: wizardData.images || [],
        tagIds: wizardData.tagIds || [],
        openingHours: wizardData.openingHours || [],
        amenities: wizardData.amenities || [],
      };

      let result;
      if (isEditMode) {
        // Update existing place
        let updateId = wizardData.id;

        if (!updateId) {
          console.error("Missing ID in wizardData", wizardData);
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Không xác định được ID địa điểm",
          });
          return;
        }

        result = await updatePlace(updateId, placeData);
        toast({
          title: "Thành công",
          description: "Cập nhật địa điểm thành công",
        });
      } else {
        // Create new place
        result = await createPlace(placeData);
        toast({
          title: "Thành công",
          description: "Tạo địa điểm mới thành công",
        });
      }

      // Navigate back to list
      navigate("/admin/places");
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi lưu địa điểm",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    prevStep();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-20">
      {/* Summary Header */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-black text-white hover:bg-black rounded-none font-mono text-xs uppercase px-2 py-1">
                {category?.name || "CHƯA PHÂN LOẠI"}
              </Badge>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight">
              {wizardData.name || "UNTITLED_PLACE"}
            </h2>
            <div className="flex items-center gap-2 text-sm font-mono text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>
                {wizardData.address}
                {district && `, ${district.name}`}
                {ward && `, ${ward.name}`}
              </span>
            </div>
          </div>

          {/* Thumbnail Preview Removed - Moved to Gallery */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content Review */}
        <div className="md:col-span-2 space-y-6">
          {/* Images Gallery */}
          <Card className="border-2 border-gray-200 rounded-sm p-4 bg-white">
            <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
              <ImageIcon className="w-4 h-4 text-gray-400" />
              <span className="font-mono font-bold uppercase text-xs text-gray-500">
                THƯ VIỆN ẢNH ({wizardData.images?.length || 0})
              </span>
            </div>
            {wizardData.images && wizardData.images.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {wizardData.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="aspect-square border border-gray-200 bg-gray-50 relative group"
                  >
                    <img
                      src={img.imageData}
                      alt={`Preview ${idx}`}
                      className="w-full h-full object-cover transition-all"
                    />
                    {img.isCover && (
                      <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-[1px] font-mono">
                        COVER
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic font-mono text-center py-4">
                -- CHƯA CÓ HÌNH ẢNH --
              </p>
            )}
          </Card>

          {/* Description */}
          <Card className="border-2 border-gray-200 rounded-sm p-4 bg-white">
            <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="font-mono font-bold uppercase text-xs text-gray-500">
                MÔ TẢ
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line font-mono">
              {wizardData.description || "[CHƯA CÓ DỮ LIỆU]"}
            </p>
          </Card>

          {/* Tags & Price Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-gray-200 rounded-sm p-4 bg-white h-auto">
              <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="font-mono font-bold uppercase text-xs text-gray-500">
                  TAGS & THUỘC TÍNH
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {wizardData.tagIds && wizardData.tagIds.length > 0 ? (
                  wizardData.tagIds.map((tagId) => {
                    const tag = tags.find((t) => t.id === tagId);
                    return tag ? (
                      <span
                        key={tagId}
                        className="px-2 py-1 bg-gray-100 text-gray-600 font-mono text-[10px] uppercase border border-gray-200"
                      >
                        #{tag.name}
                      </span>
                    ) : null;
                  })
                ) : (
                  <span className="text-xs text-gray-400 italic font-mono">
                    -- KHÔNG --
                  </span>
                )}
              </div>
            </Card>

            <Card className="border-2 border-gray-200 rounded-sm p-4 bg-white h-auto">
              <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="font-mono font-bold uppercase text-xs text-gray-500">
                  GIÁ CẢ
                </span>
              </div>
              <div className="space-y-1">
                {wizardData.priceRange ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-500">
                      PHÂN KHÚC:
                    </span>
                    <span className="text-sm font-bold">
                      {wizardData.priceRange}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-mono text-gray-500">
                    KHOẢNG:
                  </span>
                  <span className="text-sm font-mono">
                    {wizardData.priceFrom
                      ? Number(wizardData.priceFrom).toLocaleString("vi-VN")
                      : "0"}
                    {" - "}
                    {wizardData.priceTo
                      ? Number(wizardData.priceTo).toLocaleString("vi-VN")
                      : "0"}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-2 border-gray-200 rounded-sm p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3 border-b border-gray-200 pb-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="font-mono font-bold uppercase text-xs text-gray-500">
                LỊCH TRÌNH
              </span>
            </div>
            <div className="space-y-2">
              {wizardData.openingHours && wizardData.openingHours.length > 0 ? (
                wizardData.openingHours.map((slot, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs font-mono"
                  >
                    <span className="font-bold w-6">
                      {slot.dayOfWeek === 8 ? "CN" : `T${slot.dayOfWeek}`}
                    </span>
                    <span
                      className={cn(
                        slot.isClosed ? "text-red-500" : "text-emerald-600",
                        "flex-1 text-right",
                      )}
                    >
                      {slot.isClosed
                        ? "ĐÓNG"
                        : `${slot.openTime} - ${slot.closeTime}`}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-gray-400 italic font-mono block text-center py-4">
                  -- CHƯA CÓ LỊCH --
                </span>
              )}
            </div>
          </Card>

          <Card className="border-2 border-gray-200 rounded-sm p-4 bg-white">
            <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="font-mono font-bold uppercase text-xs text-gray-500">
                LIÊN HỆ
              </span>
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex gap-2 items-center">
                <Phone className="w-3 h-3 text-gray-400" />
                <span>{wizardData.phone || "--"}</span>
              </div>
              <div className="flex gap-2 items-center">
                <Mail className="w-3 h-3 text-gray-400" />
                <span className="break-all">{wizardData.email || "--"}</span>
              </div>
              <div className="flex gap-2 items-center">
                <Globe className="w-3 h-3 text-gray-400" />
                <span className="truncate max-w-[150px]">
                  {wizardData.website || "--"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-6 border-t-2 border-black border-dashed mt-8">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={submitting}
          size="lg"
          className="rounded-none border-2 border-black hover:bg-gray-100 font-mono font-bold uppercase"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          QUAY LẠI
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || loading}
          size="lg"
          className="rounded-none bg-black text-white hover:bg-gray-900 min-w-[200px] font-mono font-bold uppercase shadow-[4px_4px_0px_0px_rgba(200,200,200,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ĐANG XỬ LÝ...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              {isEditMode ? "CẬP NHẬT NGAY" : "TẠO ĐỊA ĐIỂM"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StepPreview;
