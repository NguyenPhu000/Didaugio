/**
 * Minimal Multer storage adapter for Cloudinary's upload_stream API.
 * Keeping this adapter local avoids the unmaintained Cloudinary peer range of
 * multer-storage-cloudinary while preserving Multer's file contract.
 */
import { matchesFileSignature } from "../services/document/fileSignature.js";

const normalizeMimeType = (mimeType) =>
  mimeType === "image/jpg" ? "image/jpeg" : mimeType;

const readStreamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.once("error", reject);
    stream.once("end", () => resolve(Buffer.concat(chunks)));
  });

const createValidationError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.errorCode = "VALIDATION_ERROR";
  return error;
};

const uploadBuffer = (cloudinary, uploadOptions, buffer) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, response) => (error ? reject(error) : resolve(response)),
    );

    uploadStream.once("error", reject);
    uploadStream.end(buffer);
  });

export function createCloudinaryStorage({ cloudinary, params = {} } = {}) {
  if (!cloudinary?.uploader?.upload_stream) {
    throw new Error("A configured Cloudinary client is required");
  }

  const resolveParams = async (req, file) => {
    if (typeof params === "function") return params(req, file);

    const entries = await Promise.all(
      Object.entries(params).map(async ([key, value]) => [
        key,
        typeof value === "function" ? await value(req, file) : value,
      ]),
    );

    return Object.fromEntries(entries);
  };

  return {
    _handleFile(req, file, callback) {
      readStreamToBuffer(file.stream)
        .then((buffer) => {
          if (file.truncated) {
            throw createValidationError("Uploaded file exceeds the size limit", 413);
          }

          const mimeType = normalizeMimeType(file.mimetype);
          if (!matchesFileSignature(buffer, mimeType)) {
            throw createValidationError("File content does not match its declared format");
          }

          return resolveParams(req, file).then((uploadOptions) =>
            uploadBuffer(cloudinary, uploadOptions, buffer),
          );
        })
        .then((response) => {
          callback(undefined, {
            path: response.secure_url,
            size: response.bytes,
            filename: response.public_id,
          });
        })
        .catch(callback);
    },

    _removeFile(_req, file, callback) {
      cloudinary.uploader.destroy(
        file.filename,
        { invalidate: true },
        callback,
      );
    },
  };
}
