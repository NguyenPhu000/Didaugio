/**
 * Contract Template Service — Tạo PDF hợp đồng từ business data
 * Dùng NotoSerif TTF qua @pdf-lib/fontkit để hỗ trợ tiếng Việt đầy đủ
 */

import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, "../../assets");

const PLATFORM = {
  name: "Truong Dai Hoc Tay Do",
  nameFull: "Trường Đại Học Tây Đô",
  address: "Số 68, đường Trần Chiên, Lê Bình, Cái Răng, Cần Thơ.",
  phone: "1900 1234",
  email: "hotro@didaugio.vn",
  taxCode: "0312987654",
  bankAccount: "1903 6688 9999",
  bankName: "Techcombank",
  website: "https://didaugio.vn",
  representative: "Ông Nguyễn Hồng Phú",
  position: "Người Vận hành",
};

/**
 * Load font bytes (cached after first load)
 */
let _fontRegular = null;
let _fontBold = null;

const loadFonts = async () => {
  if (!_fontRegular) {
    _fontRegular = await fs.readFile(path.join(ASSETS_DIR, "NotoSerif-Regular.ttf"));
  }
  if (!_fontBold) {
    _fontBold = await fs.readFile(path.join(ASSETS_DIR, "NotoSerif-Bold.ttf"));
  }
  return { fontRegular: _fontRegular, fontBold: _fontBold };
};

/**
 * Tạo PDF hợp đồng từ thông tin doanh nghiệp
 * @param {Object} businessData
 * @returns {Promise<Buffer>}
 */
export const generateContractPdf = async (businessData) => {
  const { fontRegular, fontBold } = await loadFonts();

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontNormal = await pdfDoc.embedFont(fontRegular);
  const fontBoldEmbedded = await pdfDoc.embedFont(fontBold);

  const W = 595;
  const H = 842;
  const margin = 48;
  const lineH = 16;
  const smallLineH = 14;

  let page = pdfDoc.addPage([W, H]);
  let y = H - margin;

  // Helper: vẽ text, tự xuống trang nếu hết chỗ
  const addPage = () => {
    page = pdfDoc.addPage([W, H]);
    y = H - margin;
  };

  const ensureSpace = (needed = 20) => {
    if (y - needed < margin + 30) addPage();
  };

  const txt = (text, x, options = {}) => {
    const size = options.size || 11;
    const font = options.bold ? fontBoldEmbedded : fontNormal;
    const color = options.color || rgb(0.05, 0.05, 0.05);
    const lh = options.lh || (size + 4);
    ensureSpace(lh + 4);
    page.drawText(String(text || ""), { x, y, size, font, color });
    y -= lh;
  };

  const line = (color = rgb(0.8, 0.8, 0.8), thickness = 0.5) => {
    ensureSpace(10);
    page.drawLine({
      start: { x: margin, y },
      end: { x: W - margin, y },
      thickness,
      color,
    });
    y -= 8;
  };

  const gap = (n = 8) => { y -= n; };

  // ── HEADER ────────────────────────────────────────────────────────────────
  // Bên trái: tên tổ chức
  page.drawText(PLATFORM.nameFull.toUpperCase(), {
    x: margin,
    y,
    size: 12,
    font: fontBoldEmbedded,
    color: rgb(0.1, 0.36, 0.86),
  });

  // Bên phải: tính toán căn giữa Quốc hiệu - Tiêu ngữ
  const rightCenter = W - margin - 110;
  const textRep = "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM";
  const wRep = fontBoldEmbedded.widthOfTextAtSize(textRep, 9.5);
  const xRep = rightCenter - (wRep / 2);

  const textMotto = "Độc Lập - Tự Do - Hạnh Phúc";
  const wMotto = fontBoldEmbedded.widthOfTextAtSize(textMotto, 9.5);
  const xMotto = rightCenter - (wMotto / 2);

  const textO = "---o0o---";
  const wO = fontNormal.widthOfTextAtSize(textO, 9);
  const xO = rightCenter - (wO / 2);

  // Bên phải: quốc hiệu
  page.drawText(textRep, {
    x: xRep,
    y,
    size: 9.5,
    font: fontBoldEmbedded,
    color: rgb(0.07, 0.07, 0.07),
  });
  y -= 14;
  page.drawText(PLATFORM.address, {
    x: margin,
    y,
    size: 8,
    font: fontNormal,
    color: rgb(0.42, 0.48, 0.57),
  });
  page.drawText(textMotto, {
    x: xMotto,
    y,
    size: 9.5,
    font: fontBoldEmbedded,
    color: rgb(0.28, 0.35, 0.45),
  });
  y -= 13;
  page.drawText(`Tel: ${PLATFORM.phone}  |  Web: ${PLATFORM.website}`, {
    x: margin,
    y,
    size: 8,
    font: fontNormal,
    color: rgb(0.42, 0.48, 0.57),
  });
  page.drawText(textO, {
    x: xO,
    y,
    size: 9,
    font: fontNormal,
    color: rgb(0.6, 0.65, 0.72),
  });
  y -= 14;
  line(rgb(0.85, 0.87, 0.9), 0.8);
  gap(6);

  // ── SỐ HỢP ĐỒNG & NGÀY ─────────────────────────────────────────────────
  const contractDate = new Date();
  const contractNumber = businessData.contractNumber || `HD-${businessData.businessId}`;
  const dateStr = `Ngày ${contractDate.getDate()} tháng ${contractDate.getMonth() + 1} năm ${contractDate.getFullYear()}`;
  const dateStrWidth = fontNormal.widthOfTextAtSize(dateStr, 10);

  page.drawText(`Hợp đồng số: `, { x: margin, y, size: 10, font: fontNormal, color: rgb(0.35, 0.4, 0.5) });
  page.drawText(contractNumber, { x: margin + 82, y, size: 10, font: fontBoldEmbedded, color: rgb(0.07, 0.07, 0.07) });
  page.drawText(dateStr, { x: W - margin - dateStrWidth, y, size: 10, font: fontNormal, color: rgb(0.35, 0.4, 0.5) });
  y -= 20;

  // ── TIÊU ĐỀ ─────────────────────────────────────────────────────────────
  const title = "HỢP ĐỒNG DỊCH VỤ";
  const titleWidth = fontBoldEmbedded.widthOfTextAtSize(title, 15);
  page.drawText(title, {
    x: (W - titleWidth) / 2,
    y,
    size: 15,
    font: fontBoldEmbedded,
    color: rgb(0.07, 0.07, 0.07),
  });
  y -= 24;

  // ── CĂN CỨ PHÁP LÝ ──────────────────────────────────────────────────────
  const legalBases = [
    "- Căn cứ Luật Thương mại nước CHXHCN Việt Nam năm 2005;",
    "- Căn cứ Bộ Luật dân sự số 91/2015/QH13 ngày 24/11/2015;",
    "- Căn cứ nhu cầu và khả năng thực tế của các bên trong hợp đồng;",
    "- Căn cứ Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 ngày 26/6/2025, có hiệu lực từ ngày 01/01/2026;",
  ];
  for (const basis of legalBases) {
    txt(basis, margin, { size: 8.5, color: rgb(0.4, 0.45, 0.55), lh: 13 });
  }
  gap(6);
  txt("Chúng tôi gồm:", margin, { size: 10.5 });
  gap(4);

  // ── BÊN A ────────────────────────────────────────────────────────────────
  line(rgb(0.85, 0.87, 0.9));
  txt("BÊN SỬ DỤNG DỊCH VỤ (BÊN A)", margin, { size: 10, bold: true });
  gap(2);
  const partyARows = [
    ["Họ và tên", businessData.ownerName || "—"],
    ["Số CCCD", businessData.idCardNumberMasked || "—"],
    ["Ngày cấp", businessData.idCardIssuedDate || "—"],
    ["Nơi cấp", businessData.idCardIssuedPlace || "—"],
    ["Địa chỉ", businessData.address || "—"],
    ["Điện thoại", businessData.phone || "—"],
    ["Email", businessData.email || "—"],
  ];
  for (const [label, value] of partyARows) {
    ensureSpace(smallLineH + 2);
    page.drawText(`${label}: `, { x: margin + 10, y, size: 10, font: fontNormal, color: rgb(0.3, 0.35, 0.45) });
    page.drawText(String(value), { x: margin + 80, y, size: 10, font: fontBoldEmbedded, color: rgb(0.07, 0.07, 0.07) });
    y -= smallLineH;
  }
  gap(8);

  // ── BÊN B ────────────────────────────────────────────────────────────────
  line(rgb(0.85, 0.87, 0.9));
  txt("BÊN CUNG CẤP DỊCH VỤ (BÊN B)", margin, { size: 10, bold: true });
  gap(2);
  const partyBRows = [
    ["Tên tổ chức", PLATFORM.nameFull],
    ["Người đại diện", PLATFORM.representative],
    ["Chức vụ", PLATFORM.position],
    ["Địa chỉ", PLATFORM.address],
    ["Điện thoại", PLATFORM.phone],
    ["Email", PLATFORM.email],
    ["Mã số thuế", PLATFORM.taxCode],
    ["Số tài khoản", `${PLATFORM.bankAccount} (${PLATFORM.bankName})`],
  ];
  for (const [label, value] of partyBRows) {
    ensureSpace(smallLineH + 2);
    page.drawText(`${label}: `, { x: margin + 10, y, size: 10, font: fontNormal, color: rgb(0.3, 0.35, 0.45) });
    page.drawText(String(value), { x: margin + 100, y, size: 10, font: fontBoldEmbedded, color: rgb(0.07, 0.07, 0.07) });
    y -= smallLineH;
  }
  gap(10);

  // ── ĐIỀU KHOẢN ──────────────────────────────────────────────────────────
  line(rgb(0.85, 0.87, 0.9));
  txt("ĐIỀU 1: NỘI DUNG CUNG CẤP DỊCH VỤ", margin, { size: 10, bold: true });
  gap(2);
  txt(`Bên A đồng ý sử dụng Nền tảng Du lịch thông minh iPoint Genie của Bên B để quảng bá địa điểm, dịch vụ du lịch tại Cần Thơ với các tính năng:`, margin + 10, { size: 9.5, lh: 13 });
  gap(4);
  const serviceRows = [
    ["1. Địa điểm hiển thị", "Quảng bá thông tin chi tiết, hình ảnh trên Nền tảng web/app"],
    ["2. Công cụ quản lý", "Trang quản trị (Business Portal) theo dõi doanh thu, đặt chỗ, voucher"],
    ["3. Tích hợp AI", "Hệ thống AI tự động gợi ý lịch trình có chứa địa điểm của Bên A"],
  ];
  for (const [label, value] of serviceRows) {
    ensureSpace(smallLineH + 2);
    page.drawText(`  ${label}: `, { x: margin + 10, y, size: 9.5, font: fontBoldEmbedded, color: rgb(0.07, 0.07, 0.07) });
    page.drawText(value, { x: margin + 130, y, size: 9.5, font: fontNormal, color: rgb(0.25, 0.3, 0.4) });
    y -= smallLineH;
  }
  gap(10);

  line(rgb(0.85, 0.87, 0.9));
  txt("ĐIỀU 2: CHI PHÍ VÀ PHƯƠNG THỨC THANH TOÁN", margin, { size: 10, bold: true });
  gap(2);
  const commissionRate = businessData.commissionRate || 10;
  txt(`- Phí đăng ký gian hàng và quảng bá ban đầu: Miễn phí.`, margin + 10, { size: 9.5, lh: 13 });
  txt(`- Tỷ lệ hoa hồng dịch vụ đặt chỗ thành công (Commission Rate): ${commissionRate}% trên giá trị mỗi đơn đặt phòng/dịch vụ hoàn tất.`, margin + 10, { size: 9.5, lh: 13 });
  txt(`- Đối soát và chi trả doanh thu: Bên B sẽ tự động đối soát doanh thu vào ngày cuối tháng và chuyển khoản cho Bên A trước ngày 05 tháng kế tiếp.`, margin + 10, { size: 9.5, lh: 13 });
  gap(10);

  line(rgb(0.85, 0.87, 0.9));
  txt("ĐIỀU 3: TRÁCH NHIỆM CỦA BÊN A", margin, { size: 10, bold: true });
  gap(2);
  txt(`3.1 Cung cấp đầy đủ giấy tờ pháp lý chính xác (CCCD, Giấy phép kinh doanh, Chứng nhận chuyên môn) khi đăng ký và đảm bảo tính pháp lý của dịch vụ cung cấp.`, margin + 10, { size: 9.5, lh: 13 });
  txt(`3.2 Đảm bảo thông tin về giá cả, hình ảnh, tình trạng phòng/dịch vụ trên Nền tảng là chính xác và khớp với thực tế.`, margin + 10, { size: 9.5, lh: 13 });
  gap(10);

  // ── CHỮ KÝ ĐIỆN TỬ ──────────────────────────────────────────────────────
  line(rgb(0.85, 0.87, 0.9));
  txt("CHỮ KÝ ĐIỆN TỬ", margin, { size: 10, bold: true });
  gap(2);
  txt("Hợp đồng này được ký điện tử và có giá trị pháp lý theo Luật Giao dịch điện tử.", margin + 10, { size: 9.5, lh: 13 });
  gap(15);

  const sigY = y;
  ensureSpace(120);

  // --- CỘT BÊN A (DOANH NGHIỆP) ---
  let yA = sigY;
  page.drawText("ĐẠI DIỆN BÊN A (DOANH NGHIỆP)", { x: margin + 10, y: yA, size: 9.5, font: fontBoldEmbedded, color: rgb(0.1, 0.1, 0.1) });
  yA -= 14;

  if (businessData.signatureImage) {
    try {
      const base64Data = businessData.signatureImage.replace(/^data:image\/\w+;base64,/, "");
      const sigBytes = Buffer.from(base64Data, "base64");
      const sigImage = await pdfDoc.embedPng(sigBytes);
      const maxW = 160;
      const maxH = 60;
      const ratio = sigImage.width / sigImage.height;
      const sigW = Math.min(maxW, sigImage.width);
      const sigH = Math.min(maxH, sigW / ratio);
      page.drawImage(sigImage, { x: margin + 10, y: yA - sigH, width: sigW, height: sigH });
      yA -= (sigH + 8);
    } catch {
      page.drawText("[Lỗi hình ảnh chữ ký]", { x: margin + 10, y: yA, size: 9, font: fontNormal, color: rgb(0.5, 0.5, 0.5) });
      yA -= 14;
    }
  } else {
    page.drawText("CHƯA KÝ", { x: margin + 10, y: yA - 20, size: 12, font: fontBoldEmbedded, color: rgb(0.6, 0.6, 0.6) });
    yA -= 40;
  }

  page.drawText(`Họ tên: ${businessData.ownerName || "—"}`, { x: margin + 10, y: yA, size: 9, font: fontNormal, color: rgb(0.3, 0.35, 0.45) });
  yA -= 13;
  if (businessData.signerIp) {
    page.drawText(`IP ký: ${businessData.signerIp}`, { x: margin + 10, y: yA, size: 8, font: fontNormal, color: rgb(0.5, 0.5, 0.5) });
    yA -= 12;
  }

  // --- CỘT BÊN B (NỀN TẢNG - ĐÃ DUYỆT) ---
  let yB = sigY;
  page.drawText("ĐẠI DIỆN BÊN B (NỀN TẢNG)", { x: W / 2 + 10, y: yB, size: 9.5, font: fontBoldEmbedded, color: rgb(0.1, 0.1, 0.1) });
  yB -= 14;

  const isApproved = businessData.approvedAt || businessData.status === "approved" || businessData.contractSigned;
  if (isApproved) {
    const boxW = 160;
    const boxH = 60;
    
    page.drawRectangle({
      x: W / 2 + 10,
      y: yB - boxH,
      width: boxW,
      height: boxH,
      borderColor: rgb(0.1, 0.6, 0.3), // green-600
      borderWidth: 1.5,
      color: rgb(0.96, 0.99, 0.97), // light green bg
      opacity: 1,
      dashArray: [4, 3],
    });

    const approvalDate = businessData.approvedAt ? new Date(businessData.approvedAt) : new Date();
    const dateText = approvalDate.toLocaleDateString("vi-VN") + " " + approvalDate.toLocaleTimeString("vi-VN");
    const centerX = W / 2 + 10 + (boxW / 2);

    const txtSig = "CHỮ KÝ ĐIỆN TỬ (DIGITAL SIGNATURE)";
    const wSig = fontBoldEmbedded.widthOfTextAtSize(txtSig, 6.5);
    page.drawText(txtSig, { x: centerX - (wSig / 2), y: yB - 13, size: 6.5, font: fontBoldEmbedded, color: rgb(0.1, 0.6, 0.3) });

    const txtOrg = "TRƯỜNG ĐẠI HỌC TÂY ĐÔ";
    const wOrg = fontBoldEmbedded.widthOfTextAtSize(txtOrg, 8);
    page.drawText(txtOrg, { x: centerX - (wOrg / 2), y: yB - 28, size: 8, font: fontBoldEmbedded, color: rgb(0.07, 0.07, 0.07) });

    const txtRep = `Người đại diện: ${PLATFORM.representative}`;
    const wRep = fontNormal.widthOfTextAtSize(txtRep, 7);
    page.drawText(txtRep, { x: centerX - (wRep / 2), y: yB - 41, size: 7, font: fontNormal, color: rgb(0.3, 0.35, 0.45) });

    const txtDate = `Thời gian ký: ${dateText}`;
    const wDate = fontNormal.widthOfTextAtSize(txtDate, 6.5);
    page.drawText(txtDate, { x: centerX - (wDate / 2), y: yB - 53, size: 6.5, font: fontNormal, color: rgb(0.5, 0.5, 0.5) });

    yB -= (boxH + 8);
  } else {
    page.drawText("CHƯA KÝ", { x: W / 2 + 10, y: yB - 20, size: 12, font: fontBoldEmbedded, color: rgb(0.6, 0.6, 0.6) });
    yB -= 40;
  }

  y = Math.min(yA, yB) - 15;

  // ── FOOTER ───────────────────────────────────────────────────────────────
  const allPages = pdfDoc.getPages();
  const lastPage = allPages[allPages.length - 1];
  lastPage.drawText("Hợp đồng này được tạo tự động bởi hệ thống iPoint Genie.", {
    x: margin,
    y: 28,
    size: 7.5,
    font: fontNormal,
    color: rgb(0.55, 0.58, 0.65),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};

/**
 * Embed chữ ký canvas vào PDF hiện có
 * @param {Buffer} pdfBuffer - PDF gốc
 * @param {string} signatureBase64 - Base64 PNG của chữ ký canvas
 * @param {Object} [position] - Vị trí custom { x, y, width, height }
 * @returns {Promise<Buffer>}
 */
export const embedSignatureInPdf = async (pdfBuffer, signatureBase64, position = {}) => {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  const { width } = lastPage.getSize();

  const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, "");
  const signatureBytes = Buffer.from(base64Data, "base64");
  const signatureImage = await pdfDoc.embedPng(signatureBytes);

  lastPage.drawImage(signatureImage, {
    x: position.x || width / 2 - 75,
    y: position.y || 200,
    width: position.width || 150,
    height: position.height || 50,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};
