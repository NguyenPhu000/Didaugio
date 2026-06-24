/**
 * Contract Template Service — Tạo PDF hợp đồng từ business data
 * Sử dụng pdf-lib: lightweight, no native deps, hỗ trợ embed hình ảnh (chữ ký)
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * Tạo PDF hợp đồng từ thông tin doanh nghiệp
 * @param {Object} businessData - Thông tin doanh nghiệp
 * @param {number} businessData.businessId
 * @param {string} businessData.businessName
 * @param {string} [businessData.taxCode]
 * @param {string} [businessData.address]
 * @param {number} [businessData.commissionRate]
 * @param {string} [businessData.ownerName]
 * @param {string} [businessData.idCardNumberMasked]
 * @param {string} [businessData.contractNumber]
 * @param {string} [businessData.signatureImage] - Base64 PNG chữ ký (nếu có)
 * @param {string} [businessData.signerIp]
 * @param {string} [businessData.contractVersion]
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateContractPdf = async (businessData) => {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  const drawText = (text, x, yPos, options = {}) => {
    const size = options.size || 12;
    const font = options.bold ? timesRomanBold : timesRoman;
    const color = options.color || rgb(0, 0, 0);
    page.drawText(text, { x, y: yPos, size, font, color });
    return yPos - (options.lineHeight || size + 4);
  };

  const drawLine = (yPos) => {
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    return yPos - 10;
  };

  // ── Header ──────────────────────────────────────────────────────────────
  y = drawText("HỢP ĐỒNG HỢP TÁC KINH DOANH", width / 2 - 140, y, {
    size: 18,
    bold: true,
    lineHeight: 28,
  });
  y = drawText("Nền tảng Đi Đâu Giờ", width / 2 - 60, y, {
    size: 13,
    lineHeight: 22,
  });
  y -= 10;
  y = drawLine(y);
  y -= 10;

  // ── Contract info ───────────────────────────────────────────────────────
  const contractDate = new Date().toLocaleDateString("vi-VN");
  const contractNumber =
    businessData.contractNumber ||
    `HD-${businessData.businessId}-${Date.now()}`;

  y = drawText(`Số hợp đồng: ${contractNumber}`, margin, y);
  y = drawText(`Ngày ký: ${contractDate}`, margin, y);
  y -= 10;

  // ── Party A ─────────────────────────────────────────────────────────────
  y = drawText("BÊN A (Nhà cung cấp nền tảng):", margin, y, {
    size: 13,
    bold: true,
  });
  y = drawText("Công ty Đi Đâu Giờ", margin + 20, y);
  y = drawText("Địa chỉ: TP. Hồ Chí Minh, Việt Nam", margin + 20, y);
  y -= 10;

  // ── Party B ─────────────────────────────────────────────────────────────
  y = drawText("BÊN B (Doanh nghiệp):", margin, y, {
    size: 13,
    bold: true,
  });
  y = drawText(
    `Tên doanh nghiệp: ${businessData.businessName || "N/A"}`,
    margin + 20,
    y,
  );
  y = drawText(
    `Mã số thuế: ${businessData.taxCode || "N/A"}`,
    margin + 20,
    y,
  );
  y = drawText(
    `Địa chỉ: ${businessData.address || "N/A"}`,
    margin + 20,
    y,
  );
  y -= 10;

  // ── Terms ───────────────────────────────────────────────────────────────
  y = drawText("ĐIỀU KHOẢN HỢP ĐỒNG:", margin, y, { size: 13, bold: true });
  y -= 5;

  const commissionRate = businessData.commissionRate || 10;
  const terms = [
    `1. Tỷ lệ hoa hồng: ${commissionRate}% trên mỗi giao dịch thành công.`,
    "2. Bên B cam kết cung cấp thông tin doanh nghiệp chính xác, đầy đủ.",
    "3. Bên A có quyền tạm ngưng hoặc chấm dứt dịch vụ nếu Bên B vi phạm điều khoản.",
    "4. Mọi tranh chấp sẽ được giải quyết bằng thương lượng, sau đó là trọng tài.",
    "5. Hợp đồng có hiệu lực từ ngày ký và tự động gia hạn hàng năm.",
    "6. Hợp đồng này được ký điện tử và có giá trị pháp lý theo Luật Giao dịch điện tử 2005.",
  ];

  for (const term of terms) {
    y = drawText(term, margin + 10, y, { size: 11 });
    y -= 2;
  }

  y -= 20;
  y = drawLine(y);
  y -= 15;

  // ── Signature area ──────────────────────────────────────────────────────
  y = drawText("CHỮ KÝ ĐIỆN TỬ", width / 2 - 60, y, {
    size: 13,
    bold: true,
  });
  y -= 5;
  y = drawText(
    "Được ký thông qua hệ thống Đi Đâu Giờ",
    width / 2 - 120,
    y,
    { size: 10, color: rgb(0.4, 0.4, 0.4) },
  );
  y -= 10;

  // Embed chữ ký nếu có
  if (businessData.signatureImage) {
    try {
      const base64Data = businessData.signatureImage.replace(
        /^data:image\/\w+;base64,/,
        "",
      );
      const sigBytes = Buffer.from(base64Data, "base64");
      const sigImage = await pdfDoc.embedPng(sigBytes);
      const sigDims = sigImage.scale(0.3);

      page.drawImage(sigImage, {
        x: width / 2 - sigDims.width / 2,
        y: y - sigDims.height - 10,
        width: sigDims.width,
        height: sigDims.height,
      });
      y -= sigDims.height + 20;
    } catch {
      // Fallback nếu embed thất bại
      page.drawRectangle({
        x: width / 2 - 80,
        y: y - 60,
        width: 160,
        height: 60,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 1,
        opacity: 0,
      });
      y -= 70;
    }
  } else {
    // Placeholder cho chữ ký
    page.drawRectangle({
      x: width / 2 - 80,
      y: y - 60,
      width: 160,
      height: 60,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
      opacity: 0,
    });
    y -= 70;
  }

  // ── Signer info ─────────────────────────────────────────────────────────
  y = drawText(
    `Người đại diện: ${businessData.ownerName || "N/A"}`,
    margin,
    y,
  );
  y = drawText(
    `CCCD: ${businessData.idCardNumberMasked || "***masked***"}`,
    margin,
    y,
  );

  if (businessData.signerIp) {
    y = drawText(`IP ký: ${businessData.signerIp}`, margin, y, {
      size: 9,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // ── Footer ──────────────────────────────────────────────────────────────
  page.drawText(
    "Hợp đồng này được tạo tự động bởi hệ thống Đi Đâu Giờ.",
    {
      x: margin,
      y: 30,
      size: 8,
      font: timesRoman,
      color: rgb(0.5, 0.5, 0.5),
    },
  );

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};

/**
 * Embed chữ ký canvas vào PDF hiện có
 * @param {Buffer} pdfBuffer - PDF gốc
 * @param {string} signatureBase64 - Base64 PNG của chữ ký canvas
 * @param {Object} [position] - Vị trí custom { x, y, width, height }
 * @returns {Promise<Buffer>} PDF với chữ ký đã embed
 */
export const embedSignatureInPdf = async (
  pdfBuffer,
  signatureBase64,
  position = {},
) => {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];

  const base64Data = signatureBase64.replace(
    /^data:image\/\w+;base64,/,
    "",
  );
  const signatureBytes = Buffer.from(base64Data, "base64");
  const signatureImage = await pdfDoc.embedPng(signatureBytes);

  const { width } = lastPage.getSize();

  lastPage.drawImage(signatureImage, {
    x: position.x || width / 2 - 75,
    y: position.y || 200,
    width: position.width || 150,
    height: position.height || 50,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};
