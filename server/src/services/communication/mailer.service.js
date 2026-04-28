import nodemailer from "nodemailer";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const EMAIL_FROM = process.env.EMAIL_FROM || "Didaugio <no-reply@didaugio.vn>";

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
export const sendVerificationEmail = async ({ to, token, name }) => {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${encodeURIComponent(
    token,
  )}`;

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
          <p><strong>${name || "BẠN"}</strong></p>
          
          <p style="margin-top: 24px;">Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất quá trình đăng ký và kích hoạt tài khoản, vui lòng xác thực địa chỉ email của bạn:</p>
          
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
Xin chào ${name || "bạn"},

Cảm ơn bạn đã đăng ký tài khoản.

Để hoàn tất quá trình đăng ký, vui lòng truy cập link sau để xác thực email:
${verifyUrl}

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
          <p><strong>${name || "BẠN"}</strong></p>
          
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

Xin chào ${name || "bạn"},

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
