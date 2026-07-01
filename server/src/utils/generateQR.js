import QRCode from "qrcode";

export const generateQRDataUrl = async (data) => {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 300,
  });
};

export const generateQRBuffer = async (data) => {
  return QRCode.toBuffer(data, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 300,
  });
};

export const buildBookingQRPayload = (bookingCode, action = "checkin") => {
  return JSON.stringify({
    type: "didaugio.booking",
    version: 1,
    action,
    bookingCode: String(bookingCode || "").trim().toUpperCase(),
  });
};

export const generateBookingQR = async (bookingCode, _baseUrl, action = "checkin") => {
  return generateQRDataUrl(buildBookingQRPayload(bookingCode, action));
};

export default {
  generateQRDataUrl,
  generateQRBuffer,
  buildBookingQRPayload,
  generateBookingQR,
};
