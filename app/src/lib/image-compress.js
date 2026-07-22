import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import i18n from "@/i18n";

const DEFAULT_MAX_BYTES = 200 * 1024;

const estimateBase64Bytes = (base64 = "") => Math.ceil((base64.length * 3) / 4);

/**
 * Nén ảnh từ URI thành data URL JPEG dưới ngưỡng dung lượng cho phép.
 * Tối ưu hóa hiệu năng: Chỉ tạo chuỗi Base64 duy nhất 1 lần ở bước cuối cùng
 * để tránh tràn bộ nhớ RAM và lock UI thread khi thử nghiệm nén nhiều lần.
 *
 * @param {string} uri - URI ảnh gốc.
 * @param {object} [options]
 * @param {number} [options.maxBytes] - Ngưỡng dung lượng tối đa (bytes).
 * @param {number} [options.startWidth] - Chiều rộng khởi đầu khi resize.
 * @param {number} [options.startQuality] - Chất lượng nén khởi đầu (0-1).
 * @param {number} [options.minWidth] - Chiều rộng nhỏ nhất khi giảm dần.
 * @param {number} [options.maxAttempts] - Số lần thử nén tối đa.
 * @returns {Promise<{ dataUrl: string, bytes: number }>}
 */
export async function compressImageToDataUrl(
  uri,
  {
    maxBytes = DEFAULT_MAX_BYTES,
    startWidth = 1280,
    startQuality = 0.86,
    minWidth = 480,
    maxAttempts = 8,
  } = {},
) {
  let nextWidth = startWidth;
  let nextQuality = startQuality;
  let currentUri = uri;
  let finalResultUri = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = await ImageManipulator.manipulateAsync(
      currentUri,
      [{ resize: { width: nextWidth } }],
      {
        compress: nextQuality,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false,
      },
    );

    currentUri = result.uri;
    finalResultUri = result.uri;

    let fileSizeBytes = 0;
    try {
      const fileInfo = await FileSystem.getInfoAsync(result.uri);
      if (fileInfo?.exists && typeof fileInfo?.size === "number") {
        fileSizeBytes = fileInfo.size;
      }
    } catch {
      // Fallback if getInfoAsync fails
    }

    if (fileSizeBytes > 0 && fileSizeBytes <= maxBytes) {
      break;
    }

    nextWidth = Math.max(minWidth, Math.floor((result.width || nextWidth) * 0.82));
    nextQuality = Math.max(0.4, Number((nextQuality - 0.1).toFixed(2)));
  }

  if (finalResultUri) {
    const finalResult = await ImageManipulator.manipulateAsync(
      finalResultUri,
      [],
      {
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      },
    );

    const base64 = finalResult?.base64 || "";
    const bytes = estimateBase64Bytes(base64);

    if (base64) {
      return { dataUrl: `data:image/jpeg;base64,${base64}`, bytes };
    }
  }

  throw new Error(
    i18n.t("errors.imageCompress", { size: Math.round(maxBytes / 1024) }),
  );
}
