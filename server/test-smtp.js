/**
 * Test SMTP Connection
 *
 * Usage:
 *   node test-smtp.js
 *
 * This script verifies your SMTP configuration in .env file
 */

import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, ".env") });

console.log("🔍 Testing SMTP Configuration...\n");

// Check if required env vars exist
const requiredVars = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];
const missing = requiredVars.filter((v) => !process.env[v]);

if (missing.length > 0) {
  console.error("❌ Missing required environment variables:");
  missing.forEach((v) => console.error(`   - ${v}`));
  console.error("\n💡 Please check your .env file\n");
  process.exit(1);
}

console.log("📋 Current SMTP Configuration:");
console.log(`   Host: ${process.env.SMTP_HOST}`);
console.log(`   Port: ${process.env.SMTP_PORT}`);
console.log(`   Secure: ${process.env.SMTP_SECURE || "false"}`);
console.log(`   User: ${process.env.SMTP_USER}`);
console.log(`   Pass: ${process.env.SMTP_PASS?.substring(0, 4)}****`);
console.log(`   From: ${process.env.EMAIL_FROM || "Not set"}\n`);

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

console.log("🔌 Connecting to SMTP server...");

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error("\n❌ SMTP Connection Failed!\n");
    console.error("Error:", error.message);
    console.error("\n💡 Common Solutions:\n");

    if (error.message.includes("authentication")) {
      console.error("   1. Check SMTP_USER and SMTP_PASS in .env");
      console.error("   2. For Gmail: Use App Password (not regular password)");
      console.error("      → https://myaccount.google.com/apppasswords");
      console.error(
        "   3. Make sure 2-Step Verification is enabled for Gmail\n"
      );
    } else if (error.message.includes("ECONNREFUSED")) {
      console.error("   1. Check SMTP_HOST and SMTP_PORT");
      console.error("   2. Check firewall/antivirus blocking port 587");
      console.error(
        "   3. Try using a different network (VPN may block SMTP)\n"
      );
    } else {
      console.error("   1. Double-check all SMTP settings in .env");
      console.error("   2. Try a different SMTP provider");
      console.error("   3. Check server logs for more details\n");
    }

    process.exit(1);
  } else {
    console.log("\n✅ SMTP Connection Successful!\n");
    console.log("🎉 Your email configuration is working correctly.");
    console.log("📧 You can now send verification emails.\n");

    // Optional: Send test email
    if (process.argv.includes("--send-test")) {
      console.log("📨 Sending test email...");

      const testEmail = process.env.SMTP_USER;
      transporter.sendMail(
        {
          from: process.env.EMAIL_FROM || `Didaugio <${process.env.SMTP_USER}>`,
          to: testEmail,
          subject: "✅ SMTP Test - Didaugio",
          text: "This is a test email from Didaugio. Your SMTP configuration is working!",
          html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
              <h2 style="color: #10b981;">✅ SMTP Test Successful!</h2>
              <p>Your SMTP configuration is working correctly.</p>
              <p>Email sent from: <strong>${process.env.SMTP_USER}</strong></p>
              <p>Time: <strong>${new Date().toLocaleString()}</strong></p>
              <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 12px;">
                This is an automated test email from Didaugio.
              </p>
            </div>
          </div>
        `,
        },
        (err, info) => {
          if (err) {
            console.error("\n❌ Failed to send test email:", err.message);
            process.exit(1);
          } else {
            console.log(`\n✅ Test email sent to: ${testEmail}`);
            console.log(`📬 Message ID: ${info.messageId}`);
            console.log(
              "\n💡 Check your inbox (and spam folder) for the test email.\n"
            );
            process.exit(0);
          }
        }
      );
    } else {
      console.log("💡 Tip: Run with --send-test flag to send a test email:");
      console.log("   node test-smtp.js --send-test\n");
      process.exit(0);
    }
  }
});

// Handle timeout
setTimeout(() => {
  console.error(
    "\n⏱️  Connection timeout. Please check your network and SMTP settings.\n"
  );
  process.exit(1);
}, 10000);
