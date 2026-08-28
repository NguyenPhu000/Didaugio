const fs = require("fs");
const path = require("path");

// Tạo ảnh 1024x1024 PNG nền midnight + chữ "iPoint" / "Genie" centered.
// Dùng Canvas đơn giản qua @napi-rs/canvas — fail nếu không có. Fallback: tạo file rỗng JPEG ảo? Không — Expo sẽ fail.

// Plan B: dùng ảnh icon.png hiện có + chèn lên canvas.

const root = path.resolve(__dirname, "..");
const iconPath = path.join(root, "assets", "icon.png");
const outPath = path.join(root, "assets", "splash.png");

if (!fs.existsSync(iconPath)) {
  console.error("missing icon.png");
  process.exit(1);
}

// Fallback: copy icon.png thành splash.png (Expo sẽ render cosmic icon làm splash).
// Người dùng sẽ thấy iPoint cosmic logo (không có chữ "Genie") trong ~100ms native splash,
// sau đó React CinematicSplash overlay "iPoint Genie" đầy đủ.
fs.copyFileSync(iconPath, outPath);
console.log("splash.png created from icon.png at", outPath);
