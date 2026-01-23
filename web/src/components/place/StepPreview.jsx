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
  Clock
} from "lucide-react";
import usePlaceStore from "@/stores/placeStore";
import useCategoryStore from "@/stores/categoryStore";
import useTagStore from "@/stores/tagStore";
import * as districtService from "@/apis/districtService";
import * as wardService from "@/apis/wardService";
import { 
  Button, 
  Card, 
  Badge, 
  Separator,
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui";
import OpeningHoursEditor from "./OpeningHoursEditor";
import PriceRangeSlider from "./PriceRangeSlider";
import { useToast } from "@/hooks/use-toast";
import * as tagService from "@/apis/tagService";

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
        amenities: wizardData.amenities || [],
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 flex items-start gap-3">
         <div className="bg-blue-100 p-2 rounded-full text-blue-600 mt-1">
           <Check className="h-4 w-4" />
         </div>
         <div>
           <h3 className="font-semibold text-slate-800">Kiểu tra lại thông tin</h3>
           <p className="text-sm text-slate-600">
             Vui lòng xem lại thông tin địa điểm trước khi lưu. Bạn có thể quay lại các bước trước để chỉnh sửa nếu cần.
           </p>
         </div>
      </div>

      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 p-1 rounded-xl">
          <TabsTrigger value="preview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Xem trước</TabsTrigger>
          <TabsTrigger value="tags" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Tags & Giá</TabsTrigger>
          <TabsTrigger value="hours" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Giờ mở cửa</TabsTrigger>
        </TabsList>

        {/* Tab 1: Preview */}
        <TabsContent value="preview" className="space-y-6 mt-6">
          
            {/* Header / Hero */}
            <div className="space-y-4">
               <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{wizardData.name}</h2>
                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                       {category && (
                         <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200">
                           {category.icon} {category.name}
                         </Badge>
                       )}
                       <span className="flex items-center gap-1">
                         <MapPin className="h-3 w-3" /> 
                         {district?.name}, {ward?.name}
                       </span>
                    </div>
                  </div>
                  <Badge variant={isEditMode ? "outline" : "default"} className={isEditMode ? "text-slate-500" : "bg-primary hover:bg-primary/90"}>
                    {isEditMode ? "Chế độ chỉnh sửa" : "Đang tạo mới"}
                  </Badge>
               </div>
            </div>

            {/* Images Grid */}
            {wizardData.images && wizardData.images.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-64 md:h-80 rounded-xl overflow-hidden">
                 <div className="col-span-2 row-span-2 relative h-full">
                    <img 
                      src={wizardData.images[0]?.url || wizardData.images[0]?.imageData} 
                      alt="Main" 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                 </div>
                 <div className="hidden md:block col-span-1 row-span-1 relative h-full">
                    {wizardData.images[1] ? (
                      <img src={wizardData.images[1]?.url || wizardData.images[1]?.imageData} alt="Gallery 1" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">No Image</div>
                    )}
                 </div>
                 <div className="hidden md:block col-span-1 row-span-1 relative h-full">
                    {wizardData.images[2] ? (
                      <img src={wizardData.images[2]?.url || wizardData.images[2]?.imageData} alt="Gallery 2" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">No Image</div>
                    )}
                 </div>
                 <div className="hidden md:block col-span-1 row-span-1 relative h-full">
                    {wizardData.images[3] ? (
                      <img src={wizardData.images[3]?.url || wizardData.images[3]?.imageData} alt="Gallery 3" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">No Image</div>
                    )}
                 </div>
                 <div className="hidden md:block col-span-1 row-span-1 relative h-full">
                     {wizardData.images[4] ? (
                       <div className="relative w-full h-full">
                          <img src={wizardData.images[4]?.url || wizardData.images[4]?.imageData} alt="Gallery 4" className="w-full h-full object-cover" />
                          {wizardData.images.length > 5 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">
                              +{wizardData.images.length - 5}
                            </div>
                          )}
                       </div>
                     ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">No Image</div>
                     )}
                 </div>
               </div>
            ) : (
               <div className="h-48 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                  Chưa có hình ảnh nào
               </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Left Column: Content */}
               <div className="lg:col-span-2 space-y-6">
                  {/* Short Description */}
                  {wizardData.shortDescription && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-700 italic">
                      "{wizardData.shortDescription}"
                    </div>
                  )}

                  {/* Full Description */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-slate-800">Giới thiệu</h3>
                    <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {wizardData.description || "Chưa có mô tả chi tiết."}
                    </div>
                  </div>

                  {/* Amenities/Tags Preview */}
                  {wizardData.tagIds && wizardData.tagIds.length > 0 && (
                     <div>
                       <h3 className="text-lg font-semibold mb-3 text-slate-800">Tiện ích & Đặc điểm</h3>
                       <div className="flex flex-wrap gap-2">
                         {wizardData.tagIds.map(tagId => {
                           const tag = tags.find(t => t.id === tagId);
                           return tag ? (
                             <Badge key={tagId} variant="outline" className="bg-white px-3 py-1 font-normal text-slate-600">
                               {tag.name}
                             </Badge>
                           ) : null
                         })}
                       </div>
                     </div>
                  )}
               </div>

               {/* Right Column: Info Card */}
               <div className="space-y-6">
                  <Card className="p-5 shadow-sm border-slate-200">
                     <h3 className="font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">Thông tin liên hệ</h3>
                     <div className="space-y-4 text-sm">
                        <div className="flex gap-3">
                           <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
                           <div>
                              <p className="font-medium text-slate-700">Địa chỉ</p>
                              <p className="text-slate-600">{wizardData.address}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {district?.name}, {ward?.name}
                              </p>
                           </div>
                        </div>

                        {wizardData.phone && (
                          <div className="flex gap-3">
                             <Phone className="h-5 w-5 text-slate-400 shrink-0" />
                             <div>
                                <p className="font-medium text-slate-700">Điện thoại</p>
                                <p className="text-primary">{wizardData.phone}</p>
                             </div>
                          </div>
                        )}

                        {wizardData.email && (
                          <div className="flex gap-3">
                             <Mail className="h-5 w-5 text-slate-400 shrink-0" />
                             <div>
                                <p className="font-medium text-slate-700">Email</p>
                                <p className="text-slate-600 break-all">{wizardData.email}</p>
                             </div>
                          </div>
                        )}

                        {(wizardData.website || wizardData.facebook) && (
                           <div className="pt-2 flex gap-2">
                              {wizardData.website && (
                                <a href={wizardData.website} target="_blank" rel="noreferrer" className="flex-1">
                                  <Button variant="outline" size="sm" className="w-full text-xs">
                                    <Globe className="h-3 w-3 mr-2" /> Website
                                  </Button>
                                </a>
                              )}
                              {wizardData.facebook && (
                                <a href={wizardData.facebook} target="_blank" rel="noreferrer" className="flex-1">
                                  <Button variant="outline" size="sm" className="w-full text-xs">
                                    <Facebook className="h-3 w-3 mr-2" /> Facebook
                                  </Button>
                                </a>
                              )}
                           </div>
                        )}
                     </div>
                  </Card>

                  {/* Opening Hours Preview (Simple) */}
                  <Card className="p-5 shadow-sm border-slate-200 bg-slate-50/50">
                     <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                       <Clock className="w-4 h-4 text-slate-500" /> Giờ mở cửa
                     </h3>
                     <div className="text-sm text-slate-600">
                       {wizardData.openingHours && wizardData.openingHours.length > 0 ? (
                         <p className="text-primary font-medium">Đã cấu hình {wizardData.openingHours.length} khung giờ</p>
                       ) : (
                         <p className="italic text-slate-400">Chưa cập nhật giờ mở cửa</p>
                       )}
                       <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-slate-500" onClick={() => document.querySelector('[value="hours"]').click()}>
                         Chỉnh sửa
                       </Button>
                     </div>
                  </Card>
               </div>
            </div>
        </TabsContent>

        {/* Tab 2: Tags & Price */}
        <TabsContent value="tags" className="space-y-6 mt-6">
          <Card className="p-6 border-slate-200">
             {/* Price Range */}
             <div className="mb-8">
               <h3 className="text-base font-semibold text-slate-800 mb-4">Mức giá trung bình</h3>
               <PriceRangeSlider
                 priceRange={wizardData.priceRange}
                 priceFrom={wizardData.priceFrom}
                 priceTo={wizardData.priceTo}
                 onChange={({ priceRange, priceFrom, priceTo }) =>
                   updateWizardData({ priceRange, priceFrom, priceTo })
                 }
               />
             </div>

             <Separator className="my-6" />

             {/* Tags */}
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <h3 className="font-semibold flex items-center text-slate-800">
                   <Tag className="mr-2 h-4 w-4" />
                   Tags & Tiện ích
                 </h3>
                 {loadingTags && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
               </div>
               
               <p className="text-sm text-slate-500">
                  Chọn các từ khóa mô tả đúng nhất về địa điểm của bạn để người dùng dễ dàng tìm kiếm.
               </p>

               {/* Suggested Tags */}
               {suggestedTags.length > 0 && (
                 <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                   <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                     Gợi ý cho danh mục này
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
                         className={`cursor-pointer transition-all ${
                            wizardData.tagIds?.includes(tag.id) 
                              ? "bg-primary hover:bg-primary/90" 
                              : "bg-white hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                         }`}
                         onClick={() => handleTagToggle(tag.id)}
                       >
                         {tag.name}
                       </Badge>
                     ))}
                   </div>
                 </div>
               )}

               {/* All Tags */}
               <div className="pt-2">
                 <p className="text-sm font-medium text-slate-700 mb-3">
                   Tất cả tags khác
                 </p>
                 <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-1">
                   {tags.filter(t => !suggestedTags.find(st => st.id === t.id)).map((tag) => (
                     <Badge
                       key={tag.id}
                       variant={
                         wizardData.tagIds?.includes(tag.id) ? "default" : "outline"
                       }
                       className="cursor-pointer hover:bg-slate-100"
                       onClick={() => handleTagToggle(tag.id)}
                     >
                       {tag.name}
                     </Badge>
                   ))}
                 </div>
               </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: Opening Hours */}
        <TabsContent value="hours" className="mt-6">
          <Card className="p-6 border-slate-200">
             <div className="mb-6">
               <h3 className="text-base font-semibold text-slate-800 mb-1 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" /> Cấu hình giờ mở cửa
               </h3>
               <p className="text-sm text-slate-500">
                  Thiết lập giờ mở cửa để người dùng biết khi nào địa điểm hoạt động.
               </p>
             </div>
             <OpeningHoursEditor
               value={wizardData.openingHours || []}
               onChange={(openingHours) => updateWizardData({ openingHours })}
             />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between pt-6 border-t border-dashed">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={submitting}
          size="lg"
          className="border-slate-300 hover:bg-slate-50 text-slate-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || loading}
          size="lg"
          className="bg-primary hover:bg-primary/90 min-w-[160px] shadow-lg shadow-primary/20"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              {isEditMode ? "Cập nhật địa điểm" : "Hoàn tất & Tạo mới"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StepPreview;
