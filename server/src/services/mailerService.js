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
    token
  )}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌍 Xác Thực Email</h1>
          <p>Chào mừng bạn đến với Didaugio</p>
        </div>
        <div class="content">
          <p>Xin chào <strong>${name || "bạn"}</strong>,</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất quá trình đăng ký, vui lòng xác thực địa chỉ email của bạn bằng cách nhấn vào nút bên dưới:</p>
          <div style="text-align: center;">
            <a href="${verifyUrl}" class="button">Xác Thực Email</a>
          </div>
          <p><small>Hoặc sao chép link sau vào trình duyệt:</small></p>
          <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px; font-size: 12px;"><code>${verifyUrl}</code></p>
          <p style="margin-top: 30px;"><strong>⏰ Link này có hiệu lực trong 24 giờ.</strong></p>
          <p style="color: #ef4444; margin-top: 20px;"><strong>⚠️ Lưu ý:</strong> Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.</p>
        </div>
        <div class="footer">
          <p>Email tự động, vui lòng không trả lời.</p>
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
    token
  )}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔑 Đặt Lại Mật Khẩu</h1>
          <p>Yêu cầu khôi phục mật khẩu</p>
        </div>
        <div class="content">
          <p>Xin chào <strong>${name || "bạn"}</strong>,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để tạo mật khẩu mới:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Đặt Lại Mật Khẩu</a>
          </div>
          <p><small>Hoặc sao chép link sau vào trình duyệt:</small></p>
          <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px; font-size: 12px;"><code>${resetUrl}</code></p>
          <p style="margin-top: 30px;"><strong>⏰ Link này có hiệu lực trong 1 giờ.</strong></p>
          <p style="color: #ef4444; margin-top: 20px;"><strong>⚠️ Cảnh báo bảo mật:</strong> Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và giữ an toàn tài khoản của bạn.</p>
        </div>
        <div class="footer">
          <p>Email tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Xin chào ${name || "bạn"},

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.

Để đặt lại mật khẩu, vui lòng truy cập link sau:
${resetUrl}

Link này có hiệu lực trong 1 giờ.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
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
