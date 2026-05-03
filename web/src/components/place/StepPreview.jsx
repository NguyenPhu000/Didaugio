import { useState, useEffect } from "react";
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
} from "lucide-react";
import usePlaceStore from "@/stores/placeStore";
import useCategoryStore from "@/stores/categoryStore";
import useTagStore from "@/stores/tagStore";
import * as districtService from "@/apis/districtService";
import * as wardService from "@/apis/wardService";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from "@/components/ui";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * STEP 3: PREVIEW & SUBMIT
 * Clean, modern Shadcn/UI style
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

  useEffect(() => {
    if (tags.length === 0) {
      fetchTags();
    }
  }, [tags.length, fetchTags]);

  const category = categories.find((cat) => cat.id === wizardData.categoryId);

  const handleSubmit = async () => {
    setSubmitting(true);
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
            title: "Lỗi",
            description: "Không xác định được ID địa điểm",
          });
          return;
        }

        await updatePlace(updateId, placeData);
        toast({
          title: "Thành công",
          description: "Cập nhật địa điểm thành công",
        });
      } else {
        await createPlace(placeData);
        toast({
          title: "Thành công",
          description: "Tạo địa điểm mới thành công",
        });
      }

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
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              {category && (
                <Badge variant="secondary" className="text-xs">
                  {category.name}
                </Badge>
              )}
              <h2 className="text-2xl sm:text-3xl font-bold">
                {wizardData.name || "Chưa có tên"}
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {wizardData.address}
                  {district && `, ${district.name}`}
                  {ward && `, ${ward.name}`}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {wizardData.images?.length || 0} hình ảnh
              </Badge>
              {wizardData.slug && (
                <Badge variant="outline" className="text-xs font-mono lowercase">
                  /{wizardData.slug}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images Gallery */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-5 w-5 text-primary" />
                Thư viện ảnh
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
                          Bìa
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Chưa có hình ảnh
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="h-5 w-5 text-primary" />
                Mô tả
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {wizardData.description || "Chưa có mô tả"}
              </p>
            </CardContent>
          </Card>

          {/* Tags & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tag className="h-5 w-5 text-primary" />
                  Tags
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
                    Chưa có tags
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Giá cả
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {wizardData.priceRange ? (
                  <Badge variant="outline">{wizardData.priceRange}</Badge>
                ) : null}
                <p className="text-sm text-muted-foreground">
                  {wizardData.priceFrom
                    ? `${Number(wizardData.priceFrom).toLocaleString("vi-VN")} - ${Number(wizardData.priceTo || wizardData.priceFrom).toLocaleString("vi-VN")} VND`
                    : "Chưa có thông tin giá"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-primary" />
                Giờ mở cửa
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
                          ? "Đóng cửa"
                          : `${slot.openTime} - ${slot.closeTime}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có lịch mở cửa
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="h-5 w-5 text-primary" />
                Liên hệ
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
                  Chưa có thông tin liên hệ
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-6 border-t bg-background/80 backdrop-blur-sm sticky bottom-0 pb-2">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={submitting}
          size="lg"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || loading}
          size="lg"
          className="gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              {isEditMode ? "Cập nhật" : "Tạo địa điểm"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StepPreview;
