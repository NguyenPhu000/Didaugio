import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Badge,
  Button,
  ScrollArea,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Clock from "lucide-react/dist/esm/icons/clock";
import Phone from "lucide-react/dist/esm/icons/phone";
import Globe from "lucide-react/dist/esm/icons/globe";
import Star from "lucide-react/dist/esm/icons/star";
import Eye from "lucide-react/dist/esm/icons/eye";
import Edit from "lucide-react/dist/esm/icons/edit";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import Facebook from "lucide-react/dist/esm/icons/facebook";
import GridIcon from "lucide-react/dist/esm/icons/grid";
import Tag from "lucide-react/dist/esm/icons/tag";
import Info from "lucide-react/dist/esm/icons/info";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import User from "lucide-react/dist/esm/icons/user";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Mail from "lucide-react/dist/esm/icons/mail";
import { PRICE_RANGE_LABELS } from "@/constants/constants";
import CanThoMap from "@/components/map/CanThoMap";
import { cn } from "@/lib/utils";

/**
 * PlaceDetailDialog Component - T.I.M Style
 * Technical Industrial Minimalism - Vietnamese Version
 */
const PlaceDetailDialog = ({
  place,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!place) return null;

  const labels = {
    draft: "NHÁP",
    pending: "CHỜ DUYỆT",
    approved: "ĐÃ DUYỆT",
    rejected: "TỪ CHỐI",
    hidden: "ẨN",
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: "bg-gray-100 text-gray-600 border-gray-400",
      pending: "bg-yellow-50 text-yellow-700 border-yellow-400",
      approved: "bg-green-50 text-green-700 border-green-400",
      rejected: "bg-red-50 text-red-700 border-red-400",
      hidden: "bg-gray-200 text-gray-500 border-gray-400",
    };

    return (
      <Badge
        className={cn(
          "rounded-none border font-mono uppercase text-[10px] px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]",
          statusConfig[status] || statusConfig.draft,
        )}
      >
        {labels[status]}
      </Badge>
    );
  };

  // Helper to get user display info
  const creatorData = place.createdByUser || place.user;
  const creatorProfile = creatorData?.profile;

  // Preferred Name: Profile FullName > User FullName > Username > Email > ID
  const creatorName =
    creatorProfile?.fullName ||
    creatorData?.fullName ||
    creatorData?.username ||
    creatorData?.email ||
    `USER #${place.createdBy}`;
  const creatorAvatar = creatorProfile?.avatar || creatorData?.avatar;
  const creatorInitial = creatorName
    ? creatorName.charAt(0).toUpperCase()
    : "?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full h-[85vh] max-h-[85vh] p-0 gap-0 overflow-hidden rounded-none border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
        <div className="flex flex-1 min-h-0 flex-col md:flex-row overflow-hidden">
          {/* Left Side - Image Gallery */}
          <div className="w-full md:w-1/2 bg-gray-100 relative flex flex-col border-r-2 border-black overflow-hidden">
            {place.images && place.images.length > 0 ? (
              <>
                {/* Main Image */}
                <div className="flex-1 relative bg-black/5 overflow-hidden group min-h-0">
                  <img
                    src={place.images[currentImageIndex]?.imageData}
                    alt={place.name}
                    className="w-full h-full object-contain"
                  />

                  {/* Status & Featured Badges Overlay */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {getStatusBadge(place.status)}
                    {place.isFeatured && (
                      <Badge className="bg-black text-white border border-black rounded-none font-mono uppercase text-[10px] w-max shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)]">
                        <Star className="w-3 h-3 mr-1 fill-white" />
                        NỔI BẬT
                      </Badge>
                    )}
                  </div>

                  {/* Image Counter */}
                  <div className="absolute top-4 right-4 bg-black text-white px-2 py-1 text-[10px] font-mono border border-white">
                    IMG: {currentImageIndex + 1}/{place.images.length}
                  </div>
                </div>

                {/* Thumbnail Strip */}
                {place.images.length > 1 && (
                  <div className="h-24 p-2 bg-white border-t-2 border-black grid grid-rows-1">
                    <ScrollArea className="h-full w-full">
                      <div className="flex gap-2 h-full items-center px-1">
                        {place.images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={cn(
                              "relative flex-shrink-0 w-20 h-16 border-2 transition-all",
                              currentImageIndex === idx
                                ? "border-black brightness-100 ring-1 ring-black ring-offset-1"
                                : "border-gray-200 brightness-75 hover:border-black hover:brightness-90",
                            )}
                          >
                            <img
                              src={img.imageData}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-gray-50 border-r border-black">
                <div className="border-2 border-black border-dashed p-8 rounded-full mb-4 opacity-20">
                  <MapPin className="w-12 h-12 text-black" />
                </div>
                <p className="text-gray-400 font-mono text-xs uppercase">
                  CHƯA CÓ HÌNH ẢNH
                </p>
              </div>
            )}
          </div>

          {/* Right Side - Information */}
          <div className="w-full md:w-1/2 flex flex-col bg-white h-full overflow-hidden">
            {/* Header */}
            <DialogHeader className="p-6 border-b-2 border-black bg-white shrink-0">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 w-full">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-black text-white hover:bg-black rounded-none font-mono text-[10px] uppercase px-2 py-0.5">
                        {place.category?.name || "CHƯA PHÂN LOẠI"}
                      </Badge>
                      {place.isVerified && (
                        <Badge className="bg-blue-600 text-white hover:bg-blue-700 rounded-none font-mono text-[10px] uppercase px-2 py-0.5 border-0 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          ĐÃ XÁC MINH
                        </Badge>
                      )}
                    </div>
                    <DialogTitle className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-tight break-words pr-8">
                      {place.name}
                    </DialogTitle>
                    {place.shortDescription && (
                      <div className="font-mono text-sm text-gray-500 italic mt-1 border-l-2 border-black pl-2">
                        "{place.shortDescription}"
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs font-mono text-gray-500 uppercase mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-black">
                          {place.ratingAvg
                            ? parseFloat(place.ratingAvg).toFixed(1)
                            : "0.0"}
                        </span>
                        <span>({place.ratingCount || 0} ĐÁNH GIÁ)</span>
                      </div>
                      <div className="w-[1px] h-4 bg-gray-300"></div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{place.viewCount || 0} LƯỢT XEM</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons Toolbar */}
                <div className="flex gap-2 pt-2 border-t border-dashed border-gray-200 mt-2">
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-black rounded-none hover:bg-black hover:text-white font-mono uppercase text-xs"
                      onClick={() => onEdit(place)}
                    >
                      <Edit className="w-3 h-3 mr-2" /> SỬA
                    </Button>
                  )}
                  {onApprove && place.status === "pending" && (
                    <Button
                      size="sm"
                      className="h-8 bg-green-600 hover:bg-green-700 text-white border border-black rounded-none font-mono uppercase text-xs"
                      onClick={() => onApprove(place)}
                    >
                      <CheckCircle className="w-3 h-3 mr-2" /> DUYỆT
                    </Button>
                  )}
                  {onReject && place.status === "pending" && (
                    <Button
                      size="sm"
                      className="h-8 bg-black hover:bg-red-700 text-white border border-black rounded-none font-mono uppercase text-xs"
                      onClick={() => onReject(place)}
                    >
                      <XCircle className="w-3 h-3 mr-2" /> TỪ CHỐI
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 border-black rounded-none hover:bg-red-600 hover:text-white hover:border-red-600 ml-auto"
                      onClick={() => onDelete(place)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </DialogHeader>

            {/* Content - Scrollable */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-6 space-y-8">
                {/* 1. Metadata Grid - Redesigned */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-0 border border-black divide-y sm:divide-y-0 sm:divide-x divide-black bg-gray-50">
                  {/* Category */}
                  <div className="p-4 hover:bg-white transition-colors">
                    <span className="text-[10px] font-bold uppercase text-gray-500 block mb-2 tracking-wider">
                      DANH MỤC
                    </span>
                    <div className="font-mono text-sm font-bold flex items-center gap-2">
                      {place.category?.icon ? (
                        <span className="text-lg">{place.category.icon}</span>
                      ) : (
                        <GridIcon className="w-4 h-4 text-gray-400" />
                      )}
                      <span
                        className="break-words leading-tight"
                        title={place.category?.name}
                      >
                        {place.category?.name || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* District */}
                  <div className="p-4 hover:bg-white transition-colors">
                    <span className="text-[10px] font-bold uppercase text-gray-500 block mb-2 tracking-wider">
                      KHU VỰC
                    </span>
                    <div className="font-mono text-sm font-bold break-words leading-tight">
                      {place.district?.name || "N/A"}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="p-4 hover:bg-white transition-colors">
                    <span className="text-[10px] font-bold uppercase text-gray-500 block mb-2 tracking-wider">
                      MỨC GIÁ
                    </span>
                    <div className="font-mono text-sm font-bold flex flex-col">
                      <div className="flex items-center gap-1 text-green-700">
                        <span className="font-sans">₫</span>
                        {place.priceRange
                          ? PRICE_RANGE_LABELS[place.priceRange]
                          : "CHƯA CẬP NHẬT"}
                      </div>
                      {(place.priceFrom || place.priceTo) && (
                        <div className="text-[10px] text-gray-500 font-normal mt-1 border-t border-dashed border-gray-300 pt-1">
                          {place.priceFrom
                            ? new Intl.NumberFormat("vi-VN").format(
                                place.priceFrom,
                              )
                            : "0"}
                          {" - "}
                          {place.priceTo
                            ? new Intl.NumberFormat("vi-VN").format(
                                place.priceTo,
                              )
                            : "∞"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Creator */}
                  <div className="p-4 hover:bg-white transition-colors">
                    <span className="text-[10px] font-bold uppercase text-gray-500 block mb-2 tracking-wider">
                      NGƯỜI ĐĂNG
                    </span>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-black rounded-none shrink-0">
                        <AvatarImage src={creatorAvatar} />
                        <AvatarFallback className="rounded-none bg-black text-white font-mono text-xs">
                          {creatorInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className="font-mono text-sm font-bold break-words leading-tight"
                        title={creatorName}
                      >
                        {creatorName}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Description & Price */}
                <div>
                  <div className="flex items-center gap-2 mb-3 border-b-2 border-black pb-1 w-max">
                    <Info className="w-4 h-4" />
                    <h3 className="font-bold font-mono text-sm uppercase">
                      MÔ TẢ
                    </h3>
                  </div>

                  {/* Price Info */}
                  {(place.priceRange || place.priceFrom || place.priceTo) && (
                    <div className="mb-4 flex items-center gap-2 text-sm font-mono bg-yellow-50 border border-yellow-200 p-2 text-yellow-800">
                      <span className="font-bold uppercase">Mức giá:</span>
                      {place.priceRange ? (
                        <span>{place.priceRange}</span>
                      ) : (
                        <span>
                          {place.priceFrom?.toLocaleString()}đ -{" "}
                          {place.priceTo?.toLocaleString()}đ
                        </span>
                      )}
                    </div>
                  )}

                  <div className="text-sm text-gray-800 font-mono leading-relaxed whitespace-pre-line bg-gray-50 border border-gray-200 p-4">
                    {place.description ||
                      place.shortDescription ||
                      "[CHƯA CÓ NỘI DUNG MÔ TẢ]"}
                  </div>
                </div>

                {/* 3. Contact & Location */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Contact Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3 border-b-2 border-black pb-1 w-max">
                      <Phone className="w-4 h-4" />
                      <h3 className="font-bold font-mono text-sm uppercase">
                        LIÊN HỆ
                      </h3>
                    </div>
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex gap-3 items-start">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="break-words font-medium">
                          {place.address}
                          {place.ward && `, ${place.ward.name}`}
                          {place.district && `, ${place.district.name}`}
                        </span>
                      </div>
                      {place.phoneNumber && (
                        <div className="flex gap-3 items-center">
                          <Phone className="w-4 h-4 shrink-0" />
                          <a
                            href={`tel:${place.phoneNumber}`}
                            className="hover:underline hover:text-blue-600 font-bold"
                          >
                            {place.phoneNumber}
                          </a>
                        </div>
                      )}
                      {place.email && (
                        <div className="flex gap-3 items-center">
                          <Mail className="w-4 h-4 shrink-0" />
                          <a
                            href={`mailto:${place.email}`}
                            className="hover:underline hover:text-blue-600 truncate max-w-[200px]"
                          >
                            {place.email}
                          </a>
                        </div>
                      )}
                      {place.website && (
                        <div className="flex gap-3 items-center">
                          <Globe className="w-4 h-4 shrink-0" />
                          <a
                            href={place.website}
                            target="_blank"
                            className="hover:underline hover:text-blue-600 truncate max-w-[200px]"
                          >
                            {place.website}
                          </a>
                        </div>
                      )}
                      {place.facebookUrl && (
                        <div className="flex gap-3 items-center">
                          <Facebook className="w-4 h-4 shrink-0" />
                          <a
                            href={place.facebookUrl}
                            target="_blank"
                            className="hover:underline hover:text-blue-600 truncate max-w-[200px]"
                          >
                            Facebook Page
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Opening Hours */}
                  <div>
                    <div className="flex items-center gap-2 mb-3 border-b-2 border-black pb-1 w-max">
                      <Clock className="w-4 h-4" />
                      <h3 className="font-bold font-mono text-sm uppercase">
                        GIỜ HOẠT ĐỘNG
                      </h3>
                    </div>
                    {place.openingHours && place.openingHours.length > 0 ? (
                      <div className="space-y-1">
                        {[...place.openingHours]
                          .sort((a, b) => {
                            const d1 = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
                            const d2 = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
                            return d1 - d2;
                          })
                          .map((hour, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between text-xs font-mono border-b border-dashed border-gray-200 pb-1 last:border-0 hover:bg-gray-50 px-1"
                            >
                              <span className="font-bold w-12">
                                {
                                  ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][
                                    hour.dayOfWeek
                                  ]
                                }
                              </span>
                              <span
                                className={
                                  hour.isClosed
                                    ? "text-red-500 font-bold"
                                    : "text-black"
                                }
                              >
                                {hour.isClosed
                                  ? "ĐÓNG CỬA"
                                  : `${hour.openTime?.slice(0, 5)} - ${hour.closeTime?.slice(0, 5)}`}
                              </span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <span className="text-xs font-mono italic text-gray-400">
                        -- CHƯA CẬP NHẬT GIỜ --
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. Map */}
                {place.latitude && place.longitude && (
                  <div className="border-2 border-black p-1 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                    <div className="h-[200px] grayscale hover:grayscale-0 transition-all duration-500 border border-gray-200">
                      <CanThoMap
                        places={[place]}
                        showMarkers={true}
                        interactive={false}
                        initialViewState={{
                          latitude: place.latitude,
                          longitude: place.longitude,
                          zoom: 14,
                        }}
                      />
                    </div>
                    <div className="bg-black text-white px-2 py-1.5 text-[10px] font-mono flex justify-between items-center mt-1">
                      <span className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-white" />
                        TỌA ĐỘ: {Number(place.latitude).toFixed(4)},{" "}
                        {Number(place.longitude).toFixed(4)}
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline flex items-center gap-1 hover:text-yellow-400 transition-colors"
                      >
                        MỞ GOOGLE MAPS <ExternalLink className="w-2 h-2" />
                      </a>
                    </div>
                  </div>
                )}

                {/* 5. Amenities & Tags */}
                <div className="space-y-6">
                  {place.amenities && place.amenities.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase text-gray-500 block mb-2 tracking-wider">
                        TIỆN ÍCH (AMENITIES)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {place.amenities.map((amenity, idx) => (
                          <div
                            key={idx}
                            className="border border-black px-3 py-1 text-[10px] font-mono uppercase bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span className="font-bold">
                              {amenity.amenityType}
                            </span>
                            : {amenity.amenityValue}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(place.tagLinks?.length > 0 || place.tags?.length > 0) && (
                    <div>
                      <span className="text-[10px] font-bold uppercase text-gray-500 block mb-2 tracking-wider">
                        THẺ (TAGS)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(place.tagLinks
                          ? place.tagLinks.map((link) => link.tag)
                          : place.tags || []
                        )
                          .filter(Boolean)
                          .map((tag, idx) => (
                            <span
                              key={idx}
                              className="bg-black text-white px-2 py-1 text-[10px] font-mono uppercase border border-black hover:bg-white hover:text-black transition-colors cursor-default"
                            >
                              #{tag.name}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Metadata */}
                <div className="pt-6 border-t-2 border-black border-dashed mt-8">
                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 uppercase">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      NGÀY TẠO:{" "}
                      {new Date(place.createdAt).toLocaleString("vi-VN")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      CẬP NHẬT:{" "}
                      {new Date(place.updatedAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlaceDetailDialog;
