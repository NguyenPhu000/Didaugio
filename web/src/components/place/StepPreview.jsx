import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { BUSINESS_ROUTES, ADMIN_ROUTES } from "@/constants/routes";
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
  Headphones,
  Compass,
  Star,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import usePlaceStore from "@/stores/placeStore";
import { useCategories } from "@/hooks/queries/useCategoryQueries";
import { useTags } from "@/hooks/queries/useTagQueries";
import { useCreatePlace, useUpdatePlace } from "@/hooks/queries/usePlaceQueries";
import { useDistrictDetail, useWardDetail } from "@/hooks/queries/useDistrictQueries";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { WizardActions, WizardPanel } from "./wizard/PlaceWizardSurface";

const DAY_LABELS = {
  0: "Chủ nhật",
  1: "Thứ hai",
  2: "Thứ ba",
  3: "Thứ tư",
  4: "Thứ năm",
  5: "Thứ sáu",
  6: "Thứ bảy",
  7: "Chủ nhật",
  8: "Chủ nhật",
};

const resolveMediaSrc = (img) => {
  if (!img) return "";
  if (typeof img === "string") return img;
  return (
    img.imageData ||
    img.secureUrl ||
    img.thumbnailUrl ||
    img.url ||
    img.image_data ||
    ""
  );
};

/**
 * STEP 3: PREVIEW & SUBMIT
 * Refined Editorial & Bento Grid Layout
 */
const StepPreview = ({ isEditMode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { wizardData, prevStep } = usePlaceStore();

  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const createMutation = useCreatePlace();
  const updateMutation = useUpdatePlace();

  // Fetch district/ward details
  const { data: districtRes } = useDistrictDetail(wizardData.districtId);
  const district = districtRes?.data || districtRes;
  const { data: wardRes } = useWardDetail(wizardData.wardId);
  const ward = wardRes?.data || wardRes;

  const submitting = createMutation.isPending || updateMutation.isPending;

  const category = categories.find((cat) => cat.id === wizardData.categoryId);

  const location = useLocation();
  const placesRoute = location.pathname.startsWith("/business")
    ? BUSINESS_ROUTES.PLACES
    : ADMIN_ROUTES.PLACES;

  const images = useMemo(() => wizardData.images || [], [wizardData.images]);
  const coverImage = useMemo(
    () => images.find((img) => img.isCover) || images[0],
    [images],
  );
  const galleryImages = useMemo(
    () => images.filter((img) => img !== coverImage),
    [images, coverImage],
  );

  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);
  const activeHeroSrc = resolveMediaSrc(selectedPreviewImage || coverImage);

  const handleSubmit = async () => {
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
          toast({
            variant: "destructive",
            title: t("common.error", "Lỗi"),
            description: "Thiếu mã định danh địa điểm để cập nhật.",
          });
          return;
        }

        await updateMutation.mutateAsync({ id: updateId, data: placeData });
        toast({
          title: t("common.success", "Thành công"),
          description: t("admin.placeWizard.preview.updateSuccess", "Cập nhật địa điểm thành công!"),
        });
      } else {
        await createMutation.mutateAsync(placeData);
        toast({
          title: t("common.success", "Thành công"),
          description: t("admin.placeWizard.preview.createSuccess", "Tạo địa điểm mới thành công!"),
        });
      }

      navigate(placesRoute);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error", "Lỗi"),
        description: error.message || t("admin.placeWizard.loadFailed", "Không thể lưu dữ liệu"),
      });
    }
  };

  return (
    <div className="space-y-6 pb-28 max-w-[1400px] mx-auto text-slate-900">
      {/* ── 1. Hero Summary Card ── */}
      <div className="rounded-3xl border border-black/[0.06] bg-white p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {category && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white tracking-wide">
                  {category.name}
                </span>
              )}
              {wizardData.slug && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono text-slate-500 bg-slate-100 border border-slate-200">
                  /{wizardData.slug}
                </span>
              )}
              {images.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium text-slate-600 bg-slate-100">
                  {images.length} hình ảnh
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              {wizardData.name || t("common.noData", "Chưa đặt tên")}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  {wizardData.address || "Chưa có địa chỉ"}
                  {district && `, ${district.name}`}
                  {ward && `, ${ward.name}`}
                </span>
              </div>
              {wizardData.latitude && wizardData.longitude && (
                <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                  <Compass className="h-3.5 w-3.5" />
                  <span>
                    {Number(wizardData.latitude).toFixed(4)}, {Number(wizardData.longitude).toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={submitting}
              className="h-11 px-5 rounded-2xl border-slate-200 hover:bg-slate-50 font-bold text-xs cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Chỉnh sửa lại
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="h-11 px-6 rounded-2xl bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-md cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  {isEditMode ? "Lưu thay đổi" : "Xuất bản địa điểm"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. Bento Content Grid (2 Columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (8 Cols): Hình ảnh Showcase & Nội dung chi tiết */}
        <div className="lg:col-span-8 space-y-6">
          {/* Gallery Showcase Card */}
          <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-slate-700" />
                <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                  Bộ sưu tập hình ảnh ({images.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Click vào ảnh nhỏ để xem lớn
              </span>
            </div>

            {images.length > 0 ? (
              <div className="space-y-3">
                {/* Hero Preview Frame */}
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 border border-black/[0.04] shadow-xs group">
                  {activeHeroSrc ? (
                    <img
                      src={activeHeroSrc}
                      alt={wizardData.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <ImageIcon className="h-10 w-10 opacity-30" />
                      <span className="text-xs">Không có dữ liệu ảnh</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {selectedPreviewImage?.isCover || (!selectedPreviewImage && coverImage?.isCover)
                      ? "Ảnh đại diện chính"
                      : "Xem trước"}
                  </div>
                </div>

                {/* Thumbnails Carousel / Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 pt-1">
                  {images.map((img, idx) => {
                    const src = resolveMediaSrc(img);
                    const isSelected = (selectedPreviewImage || coverImage) === img;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPreviewImage(img)}
                        className={cn(
                          "relative aspect-square rounded-xl overflow-hidden border-2 bg-slate-100 transition-all cursor-pointer",
                          isSelected
                            ? "border-slate-950 ring-2 ring-slate-950/20 scale-[1.03] shadow-sm"
                            : "border-transparent opacity-70 hover:opacity-100 hover:scale-[1.02]",
                        )}
                      >
                        {src ? (
                          <img
                            src={src}
                            alt={`Thumb ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                        {img.isCover && (
                          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-white" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <span>Chưa có hình ảnh nào được tải lên cho địa điểm này.</span>
              </div>
            )}
          </div>

          {/* Description & Story */}
          <div className="rounded-3xl border border-black/[0.06] bg-white p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center gap-2 border-b border-black/[0.04] pb-3">
              <Tag className="h-4 w-4 text-slate-700" />
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                Mô tả chi tiết & Giới thiệu
              </h3>
            </div>
            {wizardData.shortDescription && (
              <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 leading-relaxed">
                {wizardData.shortDescription}
              </p>
            )}
            <div className="text-xs sm:text-sm leading-relaxed text-slate-600 whitespace-pre-line space-y-2">
              {wizardData.description || (
                <span className="text-slate-400 italic">Chưa có nội dung mô tả chi tiết.</span>
              )}
            </div>
          </div>

          {/* AI Audio Guide / FAQs */}
          {(wizardData.spokenGuide?.text || wizardData.spokenGuide?.faqs?.length > 0) && (
            <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center justify-between border-b border-black/[0.04] pb-3">
                <div className="flex items-center gap-2">
                  <Headphones className="h-4 w-4 text-slate-700" />
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                    Thuyết minh âm thanh AI & Hỏi đáp
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {wizardData.spokenGuide?.faqs?.length || 0} câu hỏi FAQs
                </span>
              </div>
              {wizardData.spokenGuide?.text && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {wizardData.spokenGuide.text}
                </div>
              )}
              {wizardData.spokenGuide?.faqs?.length > 0 && (
                <div className="space-y-2 pt-1">
                  {wizardData.spokenGuide.faqs.map((faq, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-black/[0.04] text-xs space-y-1"
                    >
                      <p className="font-bold text-slate-900">Q: {faq.question}</p>
                      <p className="text-slate-600">A: {faq.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CỘT PHẢI (4 Cols): Thông số thực tế & Liên hệ */}
        <div className="lg:col-span-4 space-y-6">
          {/* Operating Hours Card */}
          <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center gap-2 border-b border-black/[0.04] pb-3">
              <Clock className="h-4 w-4 text-slate-700" />
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                Giờ hoạt động & Mở cửa
              </h3>
            </div>

            {wizardData.openingHours && wizardData.openingHours.length > 0 ? (
              <div className="divide-y divide-black/[0.03] text-xs">
                {wizardData.openingHours.map((slot, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                  >
                    <span className="font-semibold text-slate-700 w-24">
                      {DAY_LABELS[slot.dayOfWeek] || `Thứ ${slot.dayOfWeek}`}
                    </span>
                    <span
                      className={cn(
                        "font-mono font-medium",
                        slot.isClosed
                          ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md"
                          : "text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md",
                      )}
                    >
                      {slot.isClosed ? "Đóng cửa" : `${slot.openTime} - ${slot.closeTime}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                Chưa cập nhật khung giờ mở cửa.
              </p>
            )}
          </div>

          {/* Pricing & Budget Card */}
          {(() => {
            const PRICE_INFO_MAP = {
              FREE: {
                label: "Miễn phí",
                description: "0 VNĐ (Miễn phí vào cổng / tham quan)",
                badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
              },
              BUDGET: {
                label: "Bình dân",
                description: "Dưới 100.000 VNĐ (~ 20K - 100K)",
                badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
              },
              MODERATE: {
                label: "Trung bình",
                description: "100.000 - 300.000 VNĐ",
                badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
              },
              EXPENSIVE: {
                label: "Cao cấp",
                description: "300.000 - 1.000.000 VNĐ",
                badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
              },
              LUXURY: {
                label: "Sang trọng",
                description: "Trên 1.000.000 VNĐ",
                badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
              },
            };

            const priceRangeKey = String(wizardData.priceRange || "").toUpperCase();
            const priceConfig = PRICE_INFO_MAP[priceRangeKey] || {
              label: wizardData.priceRange || "Tiêu chuẩn",
              description: "Chưa có thông tin khoảng giá",
              badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
            };

            let priceText = "";
            if (wizardData.priceFrom && wizardData.priceTo) {
              priceText = `${Number(wizardData.priceFrom).toLocaleString("vi-VN")} - ${Number(
                wizardData.priceTo,
              ).toLocaleString("vi-VN")} VNĐ`;
            } else if (wizardData.priceFrom) {
              priceText = `Từ ${Number(wizardData.priceFrom).toLocaleString("vi-VN")} VNĐ`;
            } else if (wizardData.priceTo) {
              priceText = `Đến ${Number(wizardData.priceTo).toLocaleString("vi-VN")} VNĐ`;
            } else {
              priceText = priceConfig.description;
            }

            return (
              <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center gap-2 border-b border-black/[0.04] pb-3">
                  <DollarSign className="h-4 w-4 text-slate-700" />
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                    Mức giá & Chi phí tham khảo
                  </h3>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Phân khúc:</span>
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-bold border",
                        priceConfig.badgeColor,
                      )}
                    >
                      {priceConfig.label}
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-sm font-bold text-slate-900">
                      {priceText}
                    </p>
                    {wizardData.priceFrom ? (
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        ({priceConfig.label} • {priceConfig.description})
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Contact & Social Card */}
          <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center gap-2 border-b border-black/[0.04] pb-3">
              <Phone className="h-4 w-4 text-slate-700" />
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                Thông tin liên hệ
              </h3>
            </div>
            <div className="space-y-3 text-xs">
              {wizardData.phone ? (
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <a
                    href={`tel:${wizardData.phone}`}
                    className="font-bold hover:underline hover:text-black font-mono"
                  >
                    {wizardData.phone}
                  </a>
                </div>
              ) : null}

              {wizardData.email ? (
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <a
                    href={`mailto:${wizardData.email}`}
                    className="truncate hover:underline hover:text-black font-medium"
                  >
                    {wizardData.email}
                  </a>
                </div>
              ) : null}

              {wizardData.website ? (
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <a
                    href={wizardData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <span>{wizardData.website}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
              ) : null}

              {!wizardData.phone && !wizardData.email && !wizardData.website && (
                <p className="text-slate-400 italic">Chưa có thông tin liên hệ.</p>
              )}
            </div>
          </div>

          {/* Tags & Amenities Card */}
          <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center gap-2 border-b border-black/[0.04] pb-3">
              <Tag className="h-4 w-4 text-slate-700" />
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                Nhãn & Tiện ích ({wizardData.tagIds?.length || 0})
              </h3>
            </div>
            {wizardData.tagIds && wizardData.tagIds.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {wizardData.tagIds.map((tagId) => {
                  const tag = tags.find((t) => t.id === tagId);
                  return tag ? (
                    <span
                      key={tagId}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60"
                    >
                      #{tag.name}
                    </span>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Chưa gắn nhãn danh mục.</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <WizardActions>
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={submitting}
          size="lg"
          className="gap-2 rounded-2xl border-slate-200 hover:bg-slate-50 font-bold text-xs cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back", "Quay lại")}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          size="lg"
          className="gap-2 rounded-2xl bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-md cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("common.processing", "Đang xử lý...")}
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              {isEditMode ? "Lưu thay đổi địa điểm" : "Tạo & Xuất bản địa điểm"}
            </>
          )}
        </Button>
      </WizardActions>
    </div>
  );
};

export default StepPreview;
