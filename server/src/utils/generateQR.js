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

export const generateBookingQR = async (bookingCode, baseUrl) => {
  const verifyUrl = `${baseUrl}/booking/verify/${bookingCode}`;
  return generateQRDataUrl(verifyUrl);
};

export default { generateQRDataUrl, generateQRBuffer, generateBookingQR };
