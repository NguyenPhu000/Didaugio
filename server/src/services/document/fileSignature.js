const SIGNATURES = {
  "image/jpeg": (buffer) =>
    buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  "image/jpg": (buffer) =>
    buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  "image/png": (buffer) =>
    buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")),
  "image/webp": (buffer) =>
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP",
  "application/pdf": (buffer) =>
    buffer.subarray(0, 5).toString("ascii") === "%PDF-",
};

export const matchesFileSignature = (buffer, mimeType) => {
  if (!Buffer.isBuffer(buffer)) return false;
  return SIGNATURES[mimeType]?.(buffer) === true;
};
