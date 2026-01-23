import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Badge, Button, Separator, ScrollArea } from "@/components/ui";
import {
  MapPin,
  Clock,
  DollarSign,
  Phone,
  Globe,
  Star,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Facebook,
  X,
} from "lucide-react";
import AnimatedIcon from "@/components/ui/animated-icon";
import { PRICE_RANGE_LABELS } from "@/constants/constants";
import CanThoMap from "@/components/map/CanThoMap";

/**
 * PlaceDetailDialog Component - Premium Design
 * Comprehensive place information display with modern UI
 */
const PlaceDetailDialog = ({ place, open, onOpenChange, onEdit, onDelete, onApprove, onReject }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!place) return null;

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { className: "bg-slate-100 text-slate-700 border-slate-200" },
      pending: { className: "bg-amber-50 text-amber-700 border-amber-200" },
      approved: { className: "bg-green-50 text-green-700 border-green-200" },
      rejected: { className: "bg-red-50 text-red-700 border-red-200" },
      hidden: { className: "bg-gray-50 text-gray-600 border-gray-200" },
    };

    const labels = {
      draft: "Nháp",
      pending: "Chờ duyệt",
      approved: "Đã duyệt",
      rejected: "Từ chối",
      hidden: "Ẩn",
    };

    const config = statusConfig[status] || statusConfig.draft;
    
    return (
      <Badge className={`${config.className} border font-medium`}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 overflow-hidden">
        <div className="flex h-full">
          {/* Left Side - Image Gallery */}
          <div className="w-1/2 bg-gray-50 relative">
            {place.images && place.images.length > 0 ? (
              <>
                {/* Main Image */}
                <div className="h-3/4 relative">
                  <img
                    src={place.images[currentImageIndex]?.imageData}
                    alt={place.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status & Featured Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {getStatusBadge(place.status)}
                    {place.isFeatured && (
                      <Badge className="bg-yellow-500 text-white border-0 shadow-md">
                        <AnimatedIcon icon={Star} className="w-3 h-3 mr-1 fill-current" type="pulse" />
                        Nổi bật
                      </Badge>
                    )}
                  </div>

                  {/* Image Counter */}
                  {place.images.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
                      {currentImageIndex + 1} / {place.images.length}
                    </div>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {place.images.length > 1 && (
                  <div className="h-1/4 p-4 bg-white border-t">
                    <ScrollArea className="h-full">
                      <div className="flex gap-2">
                        {place.images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`relative flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                              currentImageIndex === idx
                                ? "border-primary shadow-md scale-105"
                                : "border-gray-200 hover:border-gray-300 opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={img.imageData}
                              alt={`${place.name} - ${idx + 1}`}
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
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                  <AnimatedIcon icon={MapPin} className="w-20 h-20 mx-auto text-gray-300 mb-4" type="pulse" />
                  <p className="text-gray-400 font-medium">Chưa có hình ảnh</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Information */}
          <div className="w-1/2 flex flex-col">
            {/* Header */}
            <DialogHeader className="p-6 pb-4 border-b">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                    {place.name}
                  </DialogTitle>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                    <span className="font-medium text-primary">{place.category?.name}</span>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1">
                      <AnimatedIcon icon={Star} className="w-4 h-4 text-yellow-500 fill-yellow-500" type="pulse" />
                      <span className="font-semibold text-gray-900">
                        {place.ratingAvg ? parseFloat(place.ratingAvg).toFixed(1) : "N/A"}
                      </span>
                      <span className="text-gray-400">({place.ratingCount || 0})</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1">
                      <AnimatedIcon icon={Eye} className="w-4 h-4" />
                      <span>{place.viewCount || 0}</span>
                    </div>
                  </div>

                  {/* Quick Badges */}
                  <div className="flex items-center gap-2">
                    {place.isVerified && (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 border">
                        <AnimatedIcon icon={CheckCircle} className="w-3 h-3 mr-1" type="pulse" />
                        Đã xác minh
                      </Badge>
                    )}
                    {place.priceRange && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 border">
                        {PRICE_RANGE_LABELS[place.priceRange]}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {place.status === 'pending' && onApprove && (
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => onApprove(place)}
                    >
                      <AnimatedIcon icon={CheckCircle} className="w-4 h-4 mr-1" type="tap" />
                      Duyệt
                    </Button>
                  )}
                  {place.status === 'pending' && onReject && (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => onReject(place)}
                    >
                      <AnimatedIcon icon={XCircle} className="w-4 h-4 mr-1" type="tap" />
                      Từ chối
                    </Button>
                  )}
                  {onEdit && (
                    <Button size="sm" variant="outline" onClick={() => onEdit(place)}>
                      <AnimatedIcon icon={Edit} className="w-4 h-4 mr-1" type="rotate" />
                      Sửa
                    </Button>
                  )}
                  {onDelete && (
                    <Button size="sm" variant="ghost" onClick={() => onDelete(place)}>
                      <AnimatedIcon icon={Trash2} className="w-4 h-4" type="tap" />
                    </Button>
                  )}
                </div>
              </div>
            </DialogHeader>

            {/* Content - Scrollable */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {/* Thông tin chi tiết Section */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <AnimatedIcon icon={MapPin} className="w-4 h-4 text-blue-600" type="pulse" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Thông tin chi tiết</h3>
                  </div>

                  <div className="space-y-3">
                    {/* Address */}
                    <div className="flex items-start gap-3">
                      <div className="min-w-[100px] text-sm font-medium text-gray-600">Địa chỉ</div>
                      <p className="text-sm text-gray-900">
                        {place.address}
                        {place.ward && `, ${place.ward.name}`}
                        {place.district && `, ${place.district.name}`}
                      </p>
                    </div>

                    {/* Phone */}
                    {place.phoneNumber && (
                      <div className="flex items-center gap-3">
                        <div className="min-w-[100px] text-sm font-medium text-gray-600 flex items-center gap-2">
                          <AnimatedIcon icon={Phone} className="w-4 h-4 text-blue-600" type="rotate" />
                          Điện thoại
                        </div>
                        <a 
                          href={`tel:${place.phoneNumber}`}
                          className="text-sm text-blue-600 hover:underline font-medium"
                        >
                          {place.phoneNumber}
                        </a>
                      </div>
                    )}

                    {/* Website */}
                    {place.website && (
                      <div className="flex items-center gap-3">
                        <div className="min-w-[100px] text-sm font-medium text-gray-600 flex items-center gap-2">
                          <AnimatedIcon icon={Globe} className="w-4 h-4 text-blue-600" type="rotate" />
                          Website
                        </div>
                        <a
                          href={place.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate"
                        >
                          {place.website}
                        </a>
                      </div>
                    )}

                    {/* Facebook */}
                    {place.facebookUrl && (
                      <div className="flex items-center gap-3">
                        <div className="min-w-[100px] text-sm font-medium text-gray-600 flex items-center gap-2">
                          <AnimatedIcon icon={Facebook} className="w-4 h-4 text-blue-600" type="rotate" />
                          Facebook
                        </div>
                        <a
                          href={place.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate"
                        >
                          facebook.com/...
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Opening Hours */}
                {place.openingHours && place.openingHours.length > 0 && (
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <AnimatedIcon icon={Clock} className="w-4 h-4 text-primary" type="pulse" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Giờ mở cửa</h3>
                    </div>
                    <div className="space-y-2">
                      {place.openingHours.map((hour, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">
                            {["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][hour.dayOfWeek]}
                          </span>
                          <span className={hour.isClosed ? "text-red-600 font-medium" : "text-primary font-medium"}>
                            {hour.isClosed ? "Đóng cửa" : `${hour.openTime} - ${hour.closeTime}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Giới thiệu</h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {place.description || place.shortDescription || "Chưa có mô tả chi tiết."}
                  </p>
                </div>

                {/* Map */}
                {place.latitude && place.longitude && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Vị trí bản đồ</h3>
                    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '250px' }}>
                      <CanThoMap
                        places={[place]}
                        showMarkers={true}
                        interactive={false}
                        initialViewState={{
                            latitude: place.latitude,
                            longitude: place.longitude,
                            zoom: 15
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Amenities */}
                {place.amenities && place.amenities.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Tiện nghi</h3>
                    <div className="flex flex-wrap gap-2">
                      {place.amenities.map((amenity, idx) => (
                        <Badge key={idx} variant="outline" className="bg-white">
                          {amenity.amenityType}: {amenity.amenityValue}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {place.tagLinks && place.tagLinks.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {place.tagLinks.map((link, idx) => (
                        <Badge key={idx} className="bg-gray-100 text-gray-700 border-0">
                          {link.tag?.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                    <div>
                      <span className="font-medium">Người tạo:</span> User #{place.createdBy}
                    </div>
                    <div>
                      <span className="font-medium">Ngày tạo:</span>{" "}
                      {new Date(place.createdAt).toLocaleDateString('vi-VN')}
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
