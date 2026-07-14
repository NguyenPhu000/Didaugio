import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

export const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_UPLOAD_FIELD_SIZE_BYTES = 64 * 1024;
export const MAX_UPLOAD_FIELDS = 10;
export const MAX_BASE64_DATA_URI_LENGTH =
  Math.ceil((MAX_UPLOAD_FILE_SIZE_BYTES * 4) / 3) + 2048;
export const ALLOWED_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const hasCloudinaryConfig =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(process.env.CLOUDINARY_API_KEY) &&
  Boolean(process.env.CLOUDINARY_API_SECRET);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const allowedMimeTypes = new Set(ALLOWED_UPLOAD_MIME_TYPES);

const storage = hasCloudinaryConfig
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: "didaugio",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
        transformation: [
          { width: 1200, height: 1200, crop: "limit", quality: "auto" },
        ],
      },
    })
  : multer.memoryStorage();

const createUpload = ({ maxFiles = 1, maxFields = MAX_UPLOAD_FIELDS } = {}) =>
  multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_FILE_SIZE_BYTES,
    fieldSize: MAX_UPLOAD_FIELD_SIZE_BYTES,
    files: maxFiles,
    fields: maxFields,
    parts: maxFiles + maxFields,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error(
        "Định dạng tệp không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP hoặc PDF",
      );
      error.statusCode = 400;
      error.errorCode = "VALIDATION_ERROR";
      return cb(error);
    }
    cb(null, true);
  },
  });

const upload = createUpload();

export const uploadSingle = (fieldName) => upload.single(fieldName);

export const uploadMultiple = (fieldName, maxCount = 10) =>
  createUpload({ maxFiles: maxCount }).array(fieldName, maxCount);

export const uploadFields = (fields) =>
  createUpload({
    maxFiles: fields.reduce((total, field) => total + (field.maxCount ?? 1), 0),
  }).fields(fields);

export const businessDocUpload = uploadFields([
  { name: "idCardFront", maxCount: 1 },
  { name: "idCardBack", maxCount: 1 },
  { name: "businessLicense", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

export const deleteFromCloudinary = async (publicId) => {
  if (!hasCloudinaryConfig) {
    return { result: "skipped", reason: "cloudinary_not_configured" };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
};

export default upload;
