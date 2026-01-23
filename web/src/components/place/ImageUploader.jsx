import { useState, useRef, memo, useCallback } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  Star,
  Camera,
} from "lucide-react";
import { Button, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { IMAGE_UPLOAD_CONFIG } from "@/constants/placeConstants";
import { compressImage } from "@/utils/imageUtils";

/**
 * IMAGE UPLOADER - REDESIGNED
 * Component để upload và quản lý hình ảnh địa điểm
 * Design: Hero image + Thumbnail grid như Travel App
 * Features: Drag & drop, Cover image, Caption, Reorder
 */

const { MAX_IMAGES, MAX_FILE_SIZE } = IMAGE_UPLOAD_CONFIG;

const ImageUploader = memo(({ images = [], onChange, error }) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback(
    (files) => {
      if (!files || files.length === 0) return;

      // Check total images limit
      if (images.length + files.length > MAX_IMAGES) {
        alert(`Chỉ được tải lên tối đa ${MAX_IMAGES} hình ảnh`);
        return;
      }

      const filePromises = Array.from(files).map((file) => {
        if (!file.type.startsWith("image/")) {
          return Promise.reject(`File ${file.name} không phải là hình ảnh`);
        }
        return compressImage(file, images.length);
      });

      setUploading(true);
      Promise.all(filePromises)
        .then((results) => {
          const newItems = results.map((item, index) => ({
            ...item,
            order: images.length + index,
          }));
          onChange([...images, ...newItems]);
          setUploading(false);
        })
        .catch((error) => {
          alert(error);
          setUploading(false);
        });
    },
    [images, onChange]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    // Update order
    newImages.forEach((img, i) => {
      img.order = i;
    });
    // If removed image was cover, set first image as cover
    if (images[index].isCover && newImages.length > 0) {
      newImages[0].isCover = true;
    }
    onChange(newImages);
  };

  const setPrimaryImage = (index) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isCover: i === index,
    }));
    onChange(newImages);
  };

  const updateCaption = (index, caption) => {
    const newImages = [...images];
    newImages[index].caption = caption;
    onChange(newImages);
  };

  const coverImage = images.find((img) => img.isCover) || images[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Thư viện ảnh</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Kéo thả để sắp xếp thứ tự hiển thị
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <span
            className={cn(
              "px-3 py-1 rounded-full",
              images.length >= MAX_IMAGES
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            )}
          >
            {images.length} / {MAX_IMAGES} ảnh
          </span>
        </div>
      </div>

      {/* Hero Image Display */}
      {coverImage && (
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative">
            <img
              src={coverImage.imageData}
              alt={coverImage.caption || "Cover"}
              className="w-full h-full object-cover"
            />

            {/* Cover Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-bold">Ảnh bìa (Cover)</span>
            </div>

            {/* Image Info */}
            {coverImage.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6">
                <p className="text-white font-medium">{coverImage.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Area - Compact when has images */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl transition-all",
          dragActive
            ? "border-primary bg-primary/5 scale-105"
            : "border-gray-300 hover:border-gray-400",
          error && "border-red-500",
          uploading && "opacity-50 pointer-events-none",
          images.length > 0 ? "p-4" : "p-8"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={images.length >= MAX_IMAGES || uploading}
        />

        {uploading ? (
          <div className="flex items-center justify-center gap-3 py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Đang xử lý hình ảnh...
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "flex items-center gap-4",
              images.length === 0 && "flex-col text-center"
            )}
          >
            {images.length === 0 ? (
              <>
                <div className="p-4 bg-primary/10 rounded-full">
                  <Camera className="h-12 w-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-gray-700">
                    Thêm hình ảnh địa điểm
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Kéo thả hình ảnh vào đây hoặc nhấn nút bên dưới
                  </p>
                </div>
                <Button
                  type="button"
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={images.length >= MAX_IMAGES}
                  className="mt-2"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Chọn ảnh từ thiết bị
                </Button>
                <p className="text-xs text-muted-foreground">
                  Tối đa {MAX_IMAGES} ảnh • Mỗi ảnh &lt; 5MB • JPG, PNG, WEBP
                </p>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    Thêm ảnh mới
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Kéo thả hoặc nhấn nút để thêm
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={images.length >= MAX_IMAGES}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Thêm ảnh
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-500">⚠️</div>
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Thumbnail Grid */}
      {images.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-700">
            Tất cả hình ảnh ({images.length})
          </Label>
          <div className="grid grid-cols-4 gap-3">
            {images.map((image, index) => (
              <div
                key={index}
                className={cn(
                  "relative group rounded-xl overflow-hidden border-3 transition-all hover:scale-105 cursor-pointer",
                  image.isCover
                    ? "border-yellow-400 ring-2 ring-yellow-400 ring-offset-2"
                    : "border-gray-200 hover:border-primary"
                )}
                onClick={() => !image.isCover && setPrimaryImage(index)}
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-gray-100 relative">
                  <img
                    src={image.imageData}
                    alt={image.caption || `Ảnh ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Cover Badge */}
                  {image.isCover && (
                    <div className="absolute top-1.5 left-1.5 bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="h-2.5 w-2.5 fill-current" />
                      Cover
                    </div>
                  )}

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Index */}
                  <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground italic">
            💡 Nhấn vào ảnh để đặt làm ảnh bìa • Ảnh đầu tiên sẽ hiển thị trong
            danh sách
          </p>
        </div>
      )}
    </div>
  );
});

ImageUploader.displayName = "ImageUploader";

export default ImageUploader;
