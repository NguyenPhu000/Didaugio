import dotenv from "dotenv";
dotenv.config();

import prisma from "./src/config/prismaClient.js";
import { generateMapMarkerUrl } from "./src/utils/cloudinaryHelper.js";

async function executeMigration() {
  console.log("🚀 Bắt đầu Migrate toàn bộ Thumbnail hiện tại lên Cloudinary làm Marker...");

  try {
    // Chỉ lấy các place có thumbnail hợp lệ dạng link hoặc base64, mà chưa từng có markerUrl (hoặc anh muốn đè tất thì xóa)
    // Để an toàn và đồng bộ đủ, em sẽ kiểm tra những place chưa được tích hợp markerUrl (bằng null) nhưng có thumbnail Base64.
    const places = await prisma.place.findMany({
      where: {
        thumbnail: { not: null },
        markerUrl: null, 
      },
      select: { id: true, name: true, thumbnail: true },
    });

    console.log(`📦 Tìm thấy tổng cộng ${places.length} địa điểm cần cải tạo.`);

    let successCount = 0;
    for (let i = 0; i < places.length; i++) {
        const place = places[i];
        console.log(`⌛ [${i + 1}/${places.length}] Đang xử lý: ${place.name} (ID: ${place.id})...`);
        
        const generatedUrl = await generateMapMarkerUrl(place.thumbnail);

        if (generatedUrl) {
            await prisma.place.update({
                where: { id: place.id },
                data: { markerUrl: generatedUrl }
            });
            console.log(`   ✅ Thành công! Link mây: ${generatedUrl}`);
            successCount++;
        } else {
            console.log(`   ⚠️ Bỏ qua. Hình có thể đã lỗi base64 hoặc không đủ tiêu chuẩn.`);
        }
    }

    console.log(`\n🎉 HOÀN TẤT! Đã cải tạo thành công: ${successCount} / ${places.length} địa điểm.`);
  } catch (error) {
    console.error("❌ Xảy ra lỗi ngoài ý muốn:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

executeMigration();
