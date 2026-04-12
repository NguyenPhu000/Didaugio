import dotenv from "dotenv";
dotenv.config();
import { createPlace } from "./src/services/placeService.js";

import prisma from "./src/config/prismaClient.js";

async function runSeed() {
  console.log("Đang tạo 1 Place giả lập với ảnh test...");
  
  // Tải hình ảnh Meme thật trên mạng để test!
  const fetchImg = async (url) => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  };

  const testBase64 = await fetchImg("https://i.imgflip.com/7g9g8z.jpg"); // Ảnh Flork thực thụ

  const cat = await prisma.category.findFirst();
  const dis = await prisma.districtCantho.findFirst();

  const fakePlace = {
    name: "Địa điểm Meme Flork Demo",
    categoryId: cat.id, 
    districtId: dis.id, 
    description: "Một địa điểm fake do AI tạo để thử nghiệm Cloudinary",
    shortDescription: "Meme Flork Test Marker",
    address: "Đường Meme 123",
    latitude: 10.027000, 
    longitude: 105.775000, 
    phone: "0123456789",
    images: [{
      imageData: testBase64,
      isCover: true,
      order: 0
    }],
    status: "approved"
  };

  try {
    const newPlace = await createPlace(fakePlace, 1);
    console.log("✅ TẠO PLACE THÀNH CÔNG");
    console.log("Id:", newPlace.id);
    console.log("Name:", newPlace.name);
    console.log("Thumbnail (Base64 gốc):", newPlace.thumbnail?.substring(0, 30) + "...");
    console.log("Marker URL (Cloudinary Sinh ra):", newPlace.markerUrl);
    process.exit(0);
  } catch (err) {
    console.error("❌ LỖI RỒI:", err.message);
    process.exit(1);
  }
}

runSeed();
