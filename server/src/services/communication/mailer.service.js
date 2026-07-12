import nodemailer from "nodemailer";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const EMAIL_FROM = process.env.EMAIL_FROM || "Didaugio <no-reply@didaugio.vn>";

/**
 * Escape HTML special characters to prevent XSS in email templates
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Create SMTP transporter for nodemailer (FREE - Gmail, Outlook, custom SMTP)
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Gửi email xác thực tài khoản
 */
export const sendVerificationEmail = async ({ to, token, otpCode, name }) => {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${encodeURIComponent(
    token,
  )}`;
  const otpHtml = otpCode
    ? `
          <p class="label">MA OTP:</p>
          <div style="margin: 24px 0; padding: 18px; background: #f8fafc; border: 2px solid #000; text-align: center; font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 34px; line-height: 1; letter-spacing: 10px; font-weight: 800; color: #000;">${escapeHtml(otpCode)}</div>
          <p style="font-size: 13px; color: #444;">Ma OTP co hieu luc trong 10 phut. Khong chia se ma nay voi bat ky ai.</p>
    `
    : "";
  const otpText = otpCode
    ? `Ma OTP xac thuc cua ban: ${otpCode}\nMa nay co hieu luc trong 10 phut.\n\n`
    : "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif; 
          line-height: 1.6; 
          color: #000; 
          background: #f5f5f5;
          padding: 20px;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: #fff;
          border: 2px solid #000;
        }
        .header { 
          background: #000; 
          color: #F3E600; 
          padding: 30px; 
          border-bottom: 2px solid #F3E600;
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: #F3E600;
        }
        .header h1 { 
          font-size: 24px; 
          font-weight: 700; 
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 8px;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
        }
        .header p { 
          font-size: 12px; 
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #fff;
          font-family: 'JetBrains Mono', monospace;
        }
        .content { 
          padding: 30px; 
          background: #fff;
          border: 2px solid #000;
          border-top: none;
        }
        .content p { 
          margin-bottom: 16px; 
          color: #000;
          font-size: 14px;
        }
        .label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #666;
          font-family: 'JetBrains Mono', monospace;
          margin-bottom: 8px;
        }
        .button-container { 
          text-align: center; 
          margin: 30px 0;
        }
        .button { 
          display: inline-block; 
          padding: 14px 40px; 
          background: #F3E600;
          color: #000 !important; 
          text-decoration: none; 
          border: 2px solid #000;
          font-weight: 700; 
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: 'JetBrains Mono', monospace;
          box-shadow: 4px 4px 0px 0px #000;
        }
        .link-box { 
          word-break: break-all; 
          background: #f5f5f5; 
          padding: 16px; 
          font-size: 12px;
          border: 2px solid #000;
          margin: 20px 0;
          font-family: 'Courier New', monospace;
        }
        .info-box { 
          background: #F3E600; 
          border: 2px solid #000;
          padding: 16px; 
          margin: 24px 0;
          box-shadow: 4px 4px 0px 0px #000;
        }
        .info-box p {
          margin: 0;
          color: #000;
          font-size: 13px;
          font-weight: 600;
        }
        .warning-box { 
          background: #fff; 
          border: 2px solid #000;
          padding: 16px; 
          margin: 24px 0;
          border-left: 6px solid #000;
        }
        .warning-box p {
          margin: 0;
          color: #000;
          font-size: 13px;
        }
        .footer { 
          text-align: center; 
          padding: 20px;
          background: #000;
          color: #F3E600;
          border-top: 2px solid #F3E600;
        }
        .footer p { 
          margin: 0;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: 'JetBrains Mono', monospace;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚡ XÁC THỰC EMAIL</h1>
          <p>DIDAUGIO // EMAIL VERIFICATION</p>
        </div>
        <div class="content">
          <p class="label">TÀI KHOẢN:</p>
          <p><strong>${escapeHtml(name) || "BẠN"}</strong></p>
          
          <p style="margin-top: 24px;">Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất quá trình đăng ký và kích hoạt tài khoản, vui lòng xác thực địa chỉ email của bạn:</p>
          
          ${otpHtml}

          <div class="button-container">
            <a href="${verifyUrl}" class="button">XÁC THỰC NGAY</a>
          </div>
          
          <p class="label">HOẶC SỬ DỤNG LINK:</p>
          <div class="link-box">${verifyUrl}</div>
          
          <div class="info-box">
            <p>⏰ THỜI HẠN: 24 GIỜ</p>
          </div>
          
          <div class="warning-box">
            <p><strong>⚠️ BẢO MẬT:</strong> Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.</p>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} DIDAUGIO // AUTOMATED EMAIL</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Xin chào ${escapeHtml(name) || "bạn"},

Cảm ơn bạn đã đăng ký tài khoản.

Để hoàn tất quá trình đăng ký, vui lòng truy cập link sau để xác thực email:
${otpText}${verifyUrl}

Link này có hiệu lực trong 24 giờ.

Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.
  `;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject: "Xác thực email",
    text,
    html,
  });

  return { provider: "smtp", to };
};

/**
 * Gửi email reset password
 */
export const sendPasswordResetEmail = async ({ to, token, name }) => {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(
    token,
  )}`;

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif; 
          line-height: 1.6; 
          color: #000; 
          background: #f5f5f5;
          padding: 20px;
        }
        .email-wrapper { 
          max-width: 600px; 
          margin: 0 auto; 
          background: #fff;
          border: 2px solid #000;
        }
        .header { 
          background: #000; 
          color: #F3E600; 
          padding: 30px; 
          border-bottom: 2px solid #F3E600;
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: #F3E600;
        }
        .header h1 { 
          font-size: 24px; 
          font-weight: 700; 
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 8px;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
        }
        .header p { 
          font-size: 12px; 
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #fff;
          font-family: 'JetBrains Mono', monospace;
        }
        .content { 
          padding: 30px; 
          background: #fff;
          border: 2px solid #000;
          border-top: none;
        }
        .content p { 
          margin-bottom: 16px; 
          color: #000;
          font-size: 14px;
        }
        .label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #666;
          font-family: 'JetBrains Mono', monospace;
          margin-bottom: 8px;
        }
        .button-container { 
          text-align: center; 
          margin: 30px 0;
        }
        .button { 
          display: inline-block; 
          padding: 14px 40px; 
          background: #F3E600;
          color: #000 !important; 
          text-decoration: none; 
          border: 2px solid #000;
          font-weight: 700; 
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: 'JetBrains Mono', monospace;
          box-shadow: 4px 4px 0px 0px #000;
        }
        .link-box { 
          word-break: break-all; 
          background: #f5f5f5; 
          padding: 16px; 
          font-size: 12px;
          border: 2px solid #000;
          margin: 20px 0;
          font-family: 'Courier New', monospace;
        }
        .info-box { 
          background: #F3E600; 
          border: 2px solid #000;
          padding: 16px; 
          margin: 24px 0;
          box-shadow: 4px 4px 0px 0px #000;
        }
        .info-box p {
          margin: 0;
          color: #000;
          font-size: 13px;
          font-weight: 600;
        }
        .warning-box { 
          background: #fff; 
          border: 2px solid #000;
          padding: 16px; 
          margin: 24px 0;
          border-left: 6px solid #000;
        }
        .warning-box p {
          margin: 0;
          color: #000;
          font-size: 13px;
        }
        .footer { 
          text-align: center; 
          padding: 20px;
          background: #000;
          color: #F3E600;
          border-top: 2px solid #F3E600;
        }
        .footer p { 
          margin: 0;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: 'JetBrains Mono', monospace;
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <h1>🔑 ĐẶT LẠI MẬT KHẨU</h1>
          <p>DIDAUGIO // PASSWORD RESET</p>
        </div>
        <div class="content">
          <p class="label">TÀI KHOẢN:</p>
          <p><strong>${escapeHtml(name) || "BẠN"}</strong></p>
          
          <p style="margin-top: 24px;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để tạo mật khẩu mới:</p>
          
          <div class="button-container">
            <a href="${resetUrl}" class="button">ĐẶT LẠI NGAY</a>
          </div>
          
          <p class="label">HOẶC SỬ DỤNG LINK:</p>
          <div class="link-box">${resetUrl}</div>
          
          <div class="info-box">
            <p>⏰ THỜI HẠN: 1 GIỜ</p>
          </div>
          
          <div class="warning-box">
            <p><strong>⚠️ BẢO MẬT:</strong> Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và giữ an toàn tài khoản của bạn.</p>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} DIDAUGIO // AUTOMATED EMAIL</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
🔑 ĐẶT LẠI MẬT KHẨU

Xin chào ${escapeHtml(name) || "bạn"},

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.

Để đặt lại mật khẩu, vui lòng truy cập link sau:
${resetUrl}

⏰ Link này có hiệu lực trong 1 giờ.

⚠️ CẢNH BÁO BẢO MẬT: Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
  `;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject: "Đặt lại mật khẩu",
    text,
    html,
  });

  return { provider: "smtp", to };
};

/**
 * Gửi email mời nhân viên
 */
export const sendStaffInvitationEmail = async ({
  to,
  token,
  businessName,
  roleName,
  expiresAt,
}) => {
  const inviteUrl = `${FRONTEND_URL}/invite?token=${encodeURIComponent(token)}`;
  const expiryDate = new Date(expiresAt).toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.6;
          color: #000;
          background: #f5f5f5;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #fff;
          border: 2px solid #000;
        }
        .header {
          background: #000;
          color: #F3E600;
          padding: 30px;
          border-bottom: 2px solid #F3E600;
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: #F3E600;
        }
        .header h1 {
          font-size: 24px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 8px;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
        }
        .header p {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #fff;
          font-family: 'JetBrains Mono', monospace;
        }
        .content {
          padding: 30px;
          background: #fff;
          border: 2px solid #000;
          border-top: none;
        }
        .content p {
          margin-bottom: 16px;
          color: #000;
          font-size: 14px;
        }
        .label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #666;
          font-family: 'JetBrains Mono', monospace;
          margin-bottom: 8px;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .button {
          display: inline-block;
          padding: 14px 40px;
          background: #F3E600;
          color: #000 !important;
          text-decoration: none;
          border: 2px solid #000;
          font-weight: 700;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: 'JetBrains Mono', monospace;
          box-shadow: 4px 4px 0px 0px #000;
        }
        .link-box {
          word-break: break-all;
          background: #f5f5f5;
          padding: 16px;
          font-size: 12px;
          border: 2px solid #000;
          margin: 20px 0;
          font-family: 'Courier New', monospace;
        }
        .info-box {
          background: #F3E600;
          border: 2px solid #000;
          padding: 16px;
          margin: 24px 0;
          box-shadow: 4px 4px 0px 0px #000;
        }
        .info-box p {
          margin: 0;
          color: #000;
          font-size: 13px;
          font-weight: 600;
        }
        .warning-box {
          background: #fff;
          border: 2px solid #000;
          padding: 16px;
          margin: 24px 0;
          border-left: 6px solid #000;
        }
        .warning-box p {
          margin: 0;
          color: #000;
          font-size: 13px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          background: #000;
          color: #F3E600;
          border-top: 2px solid #F3E600;
        }
        .footer p {
          margin: 0;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: 'JetBrains Mono', monospace;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📨 LỜI MỜI LÀM VIỆC</h1>
          <p>DIDAUGIO // STAFF INVITATION</p>
        </div>
        <div class="content">
          <p>Xin chào,</p>

          <p>Bạn đã được mời tham gia <strong>${escapeHtml(businessName)}</strong> trên nền tảng Đi Đâu Giớ? với vai trò <strong>${escapeHtml(roleName) || "Nhân viên"}</strong>.</p>

          <p>Nhấn vào nút bên dưới để đăng ký tài khoản và bắt đầu làm việc:</p>

          <div class="button-container">
            <a href="${inviteUrl}" class="button">ĐĂNG KÝ NGAY</a>
          </div>

          <p class="label">HOẶC SỬ DỤNG LINK:</p>
          <div class="link-box">${inviteUrl}</div>

          <div class="info-box">
            <p>⏰ LINK HẾT HẠN: ${expiryDate}</p>
          </div>

          <div class="warning-box">
            <p><strong>⚠️ LƯU Ý:</strong> Nếu bạn không mong đợi lời mời này, vui lòng bỏ qua email này. Link chỉ sử dụng được một lần.</p>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} DIDAUGIO // AUTOMATED EMAIL</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
📨 LỜI MỜI LÀM VIỆC

Xin chào,

Bạn đã được mời tham gia ${escapeHtml(businessName)} trên nền tảng Đi Đâu Giớ? với vai trò ${escapeHtml(roleName) || "Nhân viên"}.

Để đăng ký tài khoản, vui lòng truy cập link sau:
${inviteUrl}

⏰ Link hết hạn: ${expiryDate}

⚠️ Nếu bạn không mong đợi lời mời này, vui lòng bỏ qua email này.
  `;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject: `Lời mời làm việc tại ${escapeHtml(businessName)}`,
    text,
    html,
  });

  return { provider: "smtp", to };
};

/**
 * Gửi OTP xác thực hợp đồng điện tử qua email
 */
export const sendContractVerificationEmail = async ({ to, code, name }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          line-height: 1.6;
          color: #1e293b;
          background: #f8fafc;
          padding: 24px;
        }
        .container {
          max-width: 500px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          overflow: hidden;
        }
        .header {
          background: #0f172a;
          color: #ffffff;
          padding: 24px;
          text-align: center;
        }
        .content {
          padding: 32px 24px;
        }
        .otp-box {
          background: #f1f5f9;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          font-size: 32px;
          font-weight: 800;
          letter-spacing: 6px;
          color: #2563eb;
          margin: 24px 0;
          border: 1px dashed #cbd5e1;
        }
        .footer {
          background: #f8fafc;
          padding: 16px 24px;
          font-size: 11px;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin: 0;">Đi Đâu Giờ?</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase;">Xác thực hợp đồng điện tử</p>
        </div>
        <div class="content">
          <p>Xin chào <strong>${escapeHtml(name)}</strong>,</p>
          <p>Bạn đang thực hiện ký kết hợp đồng dịch vụ điện tử trên hệ thống Đi Đâu Giờ. Dưới đây là mã OTP để xác nhận và đóng dấu chữ ký điện tử của bạn:</p>
          <div class="otp-box">${code}</div>
          <p style="font-size: 13px; color: #64748b;">Mã OTP này có hiệu lực trong vòng 5 phút. Vui lòng không cung cấp mã xác thực này cho bất kỳ ai khác.</p>
        </div>
        <div class="footer">
          Đây là email tự động từ hệ thống Đi Đâu Giờ. Vui lòng không phản hồi email này.
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject: "[Đi Đâu Giờ] Mã OTP xác nhận ký hợp đồng dịch vụ điện tử",
    html,
  });
};
