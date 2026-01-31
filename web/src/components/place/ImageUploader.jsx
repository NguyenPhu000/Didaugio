import { useState, useRef, memo, useCallback } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  Star,
  Camera,
  Trash2,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { IMAGE_UPLOAD_CONFIG } from "@/constants/placeConstants";
import { compressImage } from "@/utils/imageUtils";

/**
 * IMAGE UPLOADER - T.I.M STYLE
 * Technical Industrial Minimalism Design
 * Component để upload và quản lý hình ảnh địa điểm
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
        alert(`ERR: LIMIT EXCEEDED. MAX ${MAX_IMAGES}`);
        return;
      }

      const filePromises = Array.from(files).map((file) => {
        if (!file.type.startsWith("image/")) {
          return Promise.reject(`INVALID TYPE: ${file.name}`);
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
          alert(`UPLOAD ERROR: ${error}`);
          setUploading(false);
        });
    },
    [images, onChange],
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

  const coverImage = images.find((img) => img.isCover) || images[0];

  return (
    <div className="space-y-6">
      {/* Header Metric */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-gray-500" />
          <Label className="text-base font-bold font-mono uppercase tracking-wider">
            MEDIA_GALLERY
          </Label>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 font-mono uppercase">
              Capacity
            </span>
            <span
              className={cn(
                "text-sm font-mono font-bold",
                images.length >= MAX_IMAGES ? "text-red-600" : "text-gray-700",
              )}
            >
              {images.length.toString().padStart(2, "0")}/
              {MAX_IMAGES.toString().padStart(2, "0")}
            </span>
          </div>
          <div
            className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              images.length >= MAX_IMAGES ? "bg-red-500" : "bg-emerald-500",
            )}
          ></div>
        </div>
      </div>

      {/* Main Viewport (Cover) */}
      {coverImage ? (
        <div className="rounded-sm border border-gray-200 bg-gray-50 p-1 relative group">
          <div className="aspect-[21/9] bg-gray-200 relative overflow-hidden rounded-sm">
            <img
              src={coverImage.imageData}
              alt="Cover Viewport"
              className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
            />

            {/* HUD Overlay */}
            <div className="absolute inset-0 border-[1px] border-white/20 m-2 pointer-events-none">
              <div className="absolute top-0 left-0 p-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-mono">
                VIEWPORT_MAIN :: COVER
              </div>
              <div className="absolute bottom-0 right-0 p-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-mono">
                IMG_ID: {images.indexOf(coverImage)}
              </div>
            </div>

            <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-sm shadow-sm flex items-center gap-1 font-mono uppercase">
              <Star className="h-3 w-3 fill-current" /> PRIMARY
            </div>
          </div>
        </div>
      ) : (
        <div className="aspect-[21/9] bg-gray-100 border border-dashed border-gray-300 rounded-sm flex flex-col items-center justify-center text-gray-400 font-mono text-sm">
          <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
          [NO_MEDIA_DATA]
        </div>
      )}

      {/* Upload Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Upload Button Area */}
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-sm cursor-pointer transition-all relative overflow-hidden",
            dragActive
              ? "border-blue-500 bg-blue-50/50"
              : "border-gray-300 hover:border-gray-800 hover:bg-gray-50",
            uploading && "opacity-50 cursor-not-allowed",
            error && "border-red-500 bg-red-50/10",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            disabled={images.length >= MAX_IMAGES || uploading}
            onChange={(e) => handleFileSelect(e.target.files)}
          />

          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
              <span className="text-xs font-mono font-bold text-blue-600 animate-pulse">
                UPLOADING...
              </span>
            </>
          ) : (
            <>
              <div className="absolute top-2 left-2 text-[10px] font-mono text-gray-400">
                CMD: ADD
              </div>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-xs font-bold text-gray-600 uppercase font-mono">
                Select Files
              </span>
              <span className="text-[10px] text-gray-400 mt-1 text-center px-4">
                Drag'n'drop supported
              </span>
            </>
          )}
        </div>

        {/* Image Grid Items */}
        {images.map((image, index) => (
          <div
            key={index}
            className={cn(
              "aspect-square relative group bg-gray-100 rounded-sm overflow-hidden border transition-all cursor-pointer",
              image.isCover
                ? "border-emerald-500 ring-1 ring-emerald-500 ring-offset-2 ring-offset-white"
                : "border-gray-200 hover:border-blue-500",
            )}
            onClick={() => setPrimaryImage(index)}
          >
            <img
              src={image.imageData}
              alt={`img-${index}`}
              className="w-full h-full object-cover"
            />

            {/* Index Number */}
            <div className="absolute font-mono top-0 left-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-br-sm backdrop-blur-sm">
              {String(index + 1).padStart(2, "0")}
            </div>

            {/* Overlay Controls */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
              {image.isCover ? (
                <span className="text-emerald-400 font-mono text-xs font-bold flex items-center gap-1 border border-emerald-400 px-2 py-1 rounded-sm bg-emerald-400/10">
                  <CheckCircle2 className="w-3 h-3" /> ACTIVE
                </span>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white/10 hover:bg-emerald-500 hover:text-white text-white rounded-sm border border-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPrimaryImage(index);
                  }}
                  title="Set as Cover"
                >
                  <Star className="w-4 h-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-white/10 hover:bg-red-500 hover:text-white text-white rounded-sm border border-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-sm text-red-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-mono font-bold tracking-tight uppercase">
            SYSTEM_ALERT :: {error}
          </span>
        </div>
      )}

      <div className="flex justify-between items-center text-xs text-gray-400 font-mono border-t pt-2">
        <span>MAX_SIZE: {(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB</span>
        <span>FORMATS: JPG, PNG, WEBP</span>
      </div>
    </div>
  );
});

ImageUploader.displayName = "ImageUploader";

export default ImageUploader;
