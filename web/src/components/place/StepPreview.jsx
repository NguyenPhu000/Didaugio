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
  Clock,
  Tag,
  DollarSign,
  Loader2,
} from "lucide-react";
import usePlaceStore from "@/stores/placeStore";
import useCategoryStore from "@/stores/categoryStore";
import useTagStore from "@/stores/tagStore";
import * as districtService from "@/services/districtService";
import * as wardService from "@/services/wardService";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/Separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import OpeningHoursEditor from "./OpeningHoursEditor";
import PriceRangeSlider from "./PriceRangeSlider";
import { useToast } from "@/hooks/use-toast";
import * as tagService from "@/services/tagService";

/**
 * STEP 3: PREVIEW & SUBMIT
 * Xem trước thông tin và gửi
 */

const StepPreview = ({ isEditMode }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    wizardData,
    updateWizardData,
    prevStep,
    loading,
    createPlace,
    updatePlace,
    resetWizard,
  } = usePlaceStore();

  const { categories } = useCategoryStore();
  const { tags, fetchTags } = useTagStore();

  const [district, setDistrict] = useState(null);
  const [ward, setWard] = useState(null);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
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
  }, [tags.length]);

  // Load suggested tags by category
  useEffect(() => {
    if (wizardData.categoryId) {
      setLoadingTags(true);
      tagService
        .getSuggestedTagsByCategory(wizardData.categoryId)
        .then((res) => {
          setSuggestedTags(res.data || []);
        })
        .catch(() => {})
        .finally(() => setLoadingTags(false));
    }
  }, [wizardData.categoryId]);

  const category = categories.find((cat) => cat.id === wizardData.categoryId);

  const handleTagToggle = (tagId) => {
    const currentTags = wizardData.tagIds || [];
    if (currentTags.includes(tagId)) {
      updateWizardData({ tagIds: currentTags.filter((id) => id !== tagId) });
    } else {
      updateWizardData({ tagIds: [...currentTags, tagId] });
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const placeData = {
        ...wizardData,
        // Ensure arrays are properly formatted
        images: wizardData.images || [],
        tagIds: wizardData.tagIds || [],
        openingHours: wizardData.openingHours || [],
        amenities: wizardData.amenities || {},
      };

      let result;
      if (isEditMode) {
        // Update existing place
        result = await updatePlace(wizardData.id, placeData);
        toast({
          title: "Thành công",
          description: "Cập nhật địa điểm thành công",
        });
      } else {
        // Create new place
        result = await createPlace(placeData);
        toast({
          title: "Thành công",
          description: "Tạo địa điểm thành công",
        });
      }

      // Reset wizard and navigate
      resetWizard();
      navigate("/admin/places");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể lưu địa điểm",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    prevStep();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview">Xem trước</TabsTrigger>
          <TabsTrigger value="tags">Tags & Giá</TabsTrigger>
          <TabsTrigger value="hours">Giờ mở cửa</TabsTrigger>
        </TabsList>

        {/* Tab 1: Preview */}
        <TabsContent value="preview" className="space-y-4 mt-6">
          <Card className="p-6">
            {/* Images */}
            {wizardData.images && wizardData.images.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-2">
                  {wizardData.images.slice(0, 3).map((image, index) => (
                    <div
                      key={index}
                      className="aspect-video rounded-lg overflow-hidden relative"
                    >
                      <img
                        src={image.url}
                        alt={image.caption || `Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {image.isPrimary && (
                        <Badge className="absolute top-2 left-2">Ảnh chính</Badge>
                      )}
                    </div>
                  ))}
                </div>
                {wizardData.images.length > 3 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    +{wizardData.images.length - 3} ảnh khác
                  </p>
                )}
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{wizardData.name}</h2>
                {category && (
                  <Badge variant="outline" className="mt-2">
                    {category.icon} {category.name}
                  </Badge>
                )}
              </div>

              {wizardData.shortDescription && (
                <p className="text-muted-foreground">
                  {wizardData.shortDescription}
                </p>
              )}

              <Separator />

              {/* Description */}
              {wizardData.description && (
                <div>
                  <h3 className="font-semibold mb-2">Mô tả</h3>
                  <p className="text-sm whitespace-pre-wrap">
                    {wizardData.description}
                  </p>
                </div>
              )}

              <Separator />

              {/* Location */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  Vị trí
                </h3>
                <div className="text-sm space-y-1">
                  <p>{wizardData.address}</p>
                  {district && <p>{district.name}</p>}
                  {ward && <p>{ward.name}</p>}
                  {wizardData.latitude && wizardData.longitude && (
                    <p className="text-muted-foreground">
                      Tọa độ: {wizardData.latitude.toFixed(6)},{" "}
                      {wizardData.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Contact */}
              <div className="space-y-2">
                <h3 className="font-semibold">Liên hệ</h3>
                <div className="text-sm space-y-2">
                  {wizardData.phone && (
                    <p className="flex items-center">
                      <Phone className="mr-2 h-4 w-4" />
                      {wizardData.phone}
                    </p>
                  )}
                  {wizardData.email && (
                    <p className="flex items-center">
                      <Mail className="mr-2 h-4 w-4" />
                      {wizardData.email}
                    </p>
                  )}
                  {wizardData.website && (
                    <p className="flex items-center">
                      <Globe className="mr-2 h-4 w-4" />
                      <a
                        href={wizardData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {wizardData.website}
                      </a>
                    </p>
                  )}
                  {wizardData.facebook && (
                    <p className="flex items-center">
                      <Facebook className="mr-2 h-4 w-4" />
                      <a
                        href={wizardData.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Facebook
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Tags & Price */}
        <TabsContent value="tags" className="space-y-6 mt-6">
          {/* Price Range */}
          <PriceRangeSlider
            priceRange={wizardData.priceRange}
            priceFrom={wizardData.priceFrom}
            priceTo={wizardData.priceTo}
            onChange={({ priceRange, priceFrom, priceTo }) =>
              updateWizardData({ priceRange, priceFrom, priceTo })
            }
          />

          <Separator />

          {/* Tags */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center">
                <Tag className="mr-2 h-4 w-4" />
                Tags
              </h3>
              {loadingTags && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>

            {/* Suggested Tags */}
            {suggestedTags.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Tags gợi ý cho danh mục này:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={
                        wizardData.tagIds?.includes(tag.id)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* All Tags */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Tất cả tags:
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={
                      wizardData.tagIds?.includes(tag.id) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Selected Tags */}
            {wizardData.tagIds && wizardData.tagIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Đã chọn {wizardData.tagIds.length} tag(s)
              </p>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Opening Hours */}
        <TabsContent value="hours" className="mt-6">
          <OpeningHoursEditor
            value={wizardData.openingHours || []}
            onChange={(openingHours) => updateWizardData({ openingHours })}
          />
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={submitting}
          size="lg"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || loading}
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              {isEditMode ? "Cập nhật" : "Tạo địa điểm"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StepPreview;
