/**
 * Minimal Multer storage adapter for Cloudinary's upload_stream API.
 * Keeping this adapter local avoids the unmaintained Cloudinary peer range of
 * multer-storage-cloudinary while preserving Multer's file contract.
 */
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
      resolveParams(req, file)
        .then(
          (uploadOptions) =>
            new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, response) => (error ? reject(error) : resolve(response)),
              );

              file.stream.once("error", reject);
              uploadStream.once("error", reject);
              file.stream.pipe(uploadStream);
            }),
        )
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
