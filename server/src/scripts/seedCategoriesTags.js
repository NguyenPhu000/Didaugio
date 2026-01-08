/**
 * SEED DATA - CATEGORIES & TAGS
 * Tạo dữ liệu mẫu cho Cần Thơ
 * Run: node src/scripts/seedCategoriesTags.js
 */

import prisma from "../config/prismaClient.js";

console.log("🌱 Seeding Categories & Tags for Cần Thơ\n");

async function seedCategories() {
  console.log("📁 Creating Categories...");

  // 1. Ẩm thực
  const amThuc = await prisma.category.create({
    data: {
      name: "Ẩm thực",
      slug: "am-thuc",
      icon: "UtensilsCrossed",
      color: "#EF4444",
      description: "Khám phá ẩm thực đặc sản Cần Thơ",
      level: 1,
      order: 1,
    },
  });

  const quanAn = await prisma.category.create({
    data: {
      name: "Quán ăn",
      slug: "quan-an",
      icon: "ChefHat",
      parentId: amThuc.id,
      level: 2,
      order: 1,
    },
  });

  await prisma.category.createMany({
    data: [
      {
        name: "Quán bình dân",
        slug: "quan-binh-dan",
        parentId: quanAn.id,
        level: 3,
        order: 1,
      },
      {
        name: "Quán đặc sản",
        slug: "quan-dac-san",
        parentId: quanAn.id,
        level: 3,
        order: 2,
      },
      {
        name: "Quán chay",
        slug: "quan-chay",
        parentId: quanAn.id,
        level: 3,
        order: 3,
      },
    ],
  });

  const nhaHang = await prisma.category.create({
    data: {
      name: "Nhà hàng",
      slug: "nha-hang",
      icon: "Building",
      parentId: amThuc.id,
      level: 2,
      order: 2,
    },
  });

  await prisma.category.createMany({
    data: [
      {
        name: "Nhà hàng địa phương",
        slug: "nha-hang-dia-phuong",
        parentId: nhaHang.id,
        level: 3,
        order: 1,
      },
      {
        name: "Nhà hàng cao cấp",
        slug: "nha-hang-cao-cap",
        parentId: nhaHang.id,
        level: 3,
        order: 2,
      },
    ],
  });

  await prisma.category.create({
    data: {
      name: "Quán cà phê",
      slug: "quan-ca-phe",
      icon: "Coffee",
      parentId: amThuc.id,
      level: 2,
      order: 3,
    },
  });

  // 2. Lưu trú
  const luuTru = await prisma.category.create({
    data: {
      name: "Lưu trú",
      slug: "luu-tru",
      icon: "Hotel",
      color: "#3B82F6",
      description: "Khách sạn, homestay, resort tại Cần Thơ",
      level: 1,
      order: 2,
    },
  });

  const khachSan = await prisma.category.create({
    data: {
      name: "Khách sạn",
      slug: "khach-san",
      parentId: luuTru.id,
      level: 2,
      order: 1,
    },
  });

  await prisma.category.createMany({
    data: [
      {
        name: "1-2 sao",
        slug: "1-2-sao",
        parentId: khachSan.id,
        level: 3,
        order: 1,
      },
      {
        name: "3 sao",
        slug: "3-sao",
        parentId: khachSan.id,
        level: 3,
        order: 2,
      },
      {
        name: "4+ sao",
        slug: "4-sao",
        parentId: khachSan.id,
        level: 3,
        order: 3,
      },
    ],
  });

  await prisma.category.createMany({
    data: [
      {
        name: "Homestay",
        slug: "homestay",
        icon: "Home",
        parentId: luuTru.id,
        level: 2,
        order: 2,
      },
      {
        name: "Resort",
        slug: "resort",
        parentId: luuTru.id,
        level: 2,
        order: 3,
      },
    ],
  });

  // 3. Tham quan
  const thamQuan = await prisma.category.create({
    data: {
      name: "Tham quan",
      slug: "tham-quan",
      icon: "Landmark",
      color: "#10B981",
      description: "Địa điểm du lịch, tham quan tại Cần Thơ",
      level: 1,
      order: 3,
    },
  });

  await prisma.category.createMany({
    data: [
      {
        name: "Chợ nổi",
        slug: "cho-noi",
        parentId: thamQuan.id,
        level: 2,
        order: 1,
      },
      {
        name: "Khu sinh thái",
        slug: "khu-sinh-thai",
        icon: "TreePine",
        parentId: thamQuan.id,
        level: 2,
        order: 2,
      },
      {
        name: "Di tích lịch sử",
        slug: "di-tich-lich-su",
        icon: "Landmark",
        parentId: thamQuan.id,
        level: 2,
        order: 3,
      },
      {
        name: "Bảo tàng",
        slug: "bao-tang",
        icon: "Building",
        parentId: thamQuan.id,
        level: 2,
        order: 4,
      },
      {
        name: "Vườn cây ăn trái",
        slug: "vuon-cay-an-trai",
        icon: "Palmtree",
        parentId: thamQuan.id,
        level: 2,
        order: 5,
      },
    ],
  });

  console.log("✅ Created categories");
  return { amThuc, quanAn, nhaHang, luuTru, khachSan, thamQuan };
}

async function seedTags() {
  console.log("\n🏷️  Creating Tags...");

  const tags = await prisma.placeTag.createMany({
    data: [
      // Food tags
      {
        name: "Đặc sản miền Tây",
        slug: "dac-san-mien-tay",
        tagType: "food",
        color: "#F59E0B",
      },
      { name: "Ăn vặt", slug: "an-vat", tagType: "food", color: "#F97316" },
      { name: "Món chay", slug: "mon-chay", tagType: "food", color: "#84CC16" },
      { name: "Hải sản", slug: "hai-san", tagType: "food", color: "#06B6D4" },
      { name: "Lẩu", slug: "lau", tagType: "food", color: "#EF4444" },
      { name: "Bánh", slug: "banh", tagType: "food", color: "#FBBF24" },
      { name: "Cơm", slug: "com", tagType: "food", color: "#F59E0B" },
      { name: "Bún phở", slug: "bun-pho", tagType: "food", color: "#F97316" },

      // Price tags
      { name: "Giá rẻ", slug: "gia-re", tagType: "price", color: "#10B981" },
      {
        name: "Bình dân",
        slug: "binh-dan",
        tagType: "price",
        color: "#22C55E",
      },
      {
        name: "Trung bình",
        slug: "trung-binh",
        tagType: "price",
        color: "#F59E0B",
      },
      { name: "Cao cấp", slug: "cao-cap", tagType: "price", color: "#3B82F6" },
      {
        name: "Sang trọng",
        slug: "sang-trong",
        tagType: "price",
        color: "#8B5CF6",
      },

      // Time tags
      {
        name: "Mở cửa khuya",
        slug: "mo-cua-khuya",
        tagType: "time",
        color: "#6366F1",
      },
      { name: "24/7", slug: "24-7", tagType: "time", color: "#8B5CF6" },
      { name: "Sáng sớm", slug: "sang-som", tagType: "time", color: "#FBBF24" },
      {
        name: "Đông khách",
        slug: "dong-khach",
        tagType: "time",
        color: "#EF4444",
      },

      // Activity tags
      {
        name: "Phù hợp gia đình",
        slug: "phu-hop-gia-dinh",
        tagType: "activity",
        color: "#10B981",
      },
      {
        name: "Đi cặp đôi",
        slug: "di-cap-doi",
        tagType: "activity",
        color: "#EC4899",
      },
      {
        name: "Đi nhóm",
        slug: "di-nhom",
        tagType: "activity",
        color: "#F59E0B",
      },
      {
        name: "Check-in đẹp",
        slug: "check-in-dep",
        tagType: "activity",
        color: "#EC4899",
      },
      {
        name: "Chụp hình",
        slug: "chup-hinh",
        tagType: "activity",
        color: "#A855F7",
      },

      // Ambience tags
      {
        name: "Yên tĩnh",
        slug: "yen-tinh",
        tagType: "ambience",
        color: "#84CC16",
      },
      {
        name: "Sầm uất",
        slug: "sam-uat",
        tagType: "ambience",
        color: "#F97316",
      },
      {
        name: "View đẹp",
        slug: "view-dep",
        tagType: "ambience",
        color: "#06B6D4",
      },
      {
        name: "Gần sông",
        slug: "gan-song",
        tagType: "ambience",
        color: "#0EA5E9",
      },
      {
        name: "Không gian rộng",
        slug: "khong-gian-rong",
        tagType: "ambience",
        color: "#22C55E",
      },
      {
        name: "Ngoài trời",
        slug: "ngoai-troi",
        tagType: "ambience",
        color: "#10B981",
      },

      // Service tags
      {
        name: "Có đỗ xe",
        slug: "co-do-xe",
        tagType: "service",
        color: "#6366F1",
      },
      {
        name: "Wifi miễn phí",
        slug: "wifi-mien-phi",
        tagType: "service",
        color: "#3B82F6",
      },
      {
        name: "Điều hòa",
        slug: "dieu-hoa",
        tagType: "service",
        color: "#06B6D4",
      },
      {
        name: "Ship đồ",
        slug: "ship-do",
        tagType: "service",
        color: "#F59E0B",
      },
      {
        name: "Đặt bàn trước",
        slug: "dat-ban-truoc",
        tagType: "service",
        color: "#8B5CF6",
      },
      {
        name: "Có menu Anh",
        slug: "co-menu-anh",
        tagType: "service",
        color: "#3B82F6",
      },

      // Travel tags
      {
        name: "Gần trung tâm",
        slug: "gan-trung-tam",
        tagType: "travel",
        color: "#EF4444",
      },
      { name: "Dễ tìm", slug: "de-tim", tagType: "travel", color: "#10B981" },
      {
        name: "Trên đường chính",
        slug: "tren-duong-chinh",
        tagType: "travel",
        color: "#3B82F6",
      },
      {
        name: "Cần phương tiện",
        slug: "can-phuong-tien",
        tagType: "travel",
        color: "#F59E0B",
      },

      // AI Signal tags
      {
        name: "Được giới thiệu",
        slug: "duoc-gioi-thieu",
        tagType: "ai_signal",
        color: "#EC4899",
      },
      {
        name: "Hot trend",
        slug: "hot-trend",
        tagType: "ai_signal",
        color: "#EF4444",
      },
      {
        name: "Review tốt",
        slug: "review-tot",
        tagType: "ai_signal",
        color: "#10B981",
      },
    ],
  });

  console.log("✅ Created tags");
  return tags;
}

async function assignTagsToCategories() {
  console.log("\n🔗 Assigning Tags to Categories...");

  // Get categories
  const quanAn = await prisma.category.findUnique({
    where: { slug: "quan-an" },
  });
  const nhaHang = await prisma.category.findUnique({
    where: { slug: "nha-hang" },
  });
  const quanCafe = await prisma.category.findUnique({
    where: { slug: "quan-ca-phe" },
  });
  const khachSan = await prisma.category.findUnique({
    where: { slug: "khach-san" },
  });
  const choNoi = await prisma.category.findUnique({
    where: { slug: "cho-noi" },
  });

  // Get tags
  const tags = await prisma.placeTag.findMany();
  const getTag = (slug) => tags.find((t) => t.slug === slug)?.id;

  // Quán ăn
  await prisma.categoryTag.createMany({
    data: [
      {
        categoryId: quanAn.id,
        tagId: getTag("dac-san-mien-tay"),
        isDefault: true,
      },
      { categoryId: quanAn.id, tagId: getTag("gia-re"), isDefault: true },
      { categoryId: quanAn.id, tagId: getTag("binh-dan"), isDefault: true },
      {
        categoryId: quanAn.id,
        tagId: getTag("phu-hop-gia-dinh"),
        isDefault: false,
      },
      { categoryId: quanAn.id, tagId: getTag("co-do-xe"), isDefault: false },
    ],
  });

  // Nhà hàng
  await prisma.categoryTag.createMany({
    data: [
      { categoryId: nhaHang.id, tagId: getTag("cao-cap"), isDefault: true },
      { categoryId: nhaHang.id, tagId: getTag("view-dep"), isDefault: true },
      {
        categoryId: nhaHang.id,
        tagId: getTag("dat-ban-truoc"),
        isDefault: true,
      },
      { categoryId: nhaHang.id, tagId: getTag("dieu-hoa"), isDefault: false },
      {
        categoryId: nhaHang.id,
        tagId: getTag("wifi-mien-phi"),
        isDefault: false,
      },
    ],
  });

  // Quán cafe
  await prisma.categoryTag.createMany({
    data: [
      {
        categoryId: quanCafe.id,
        tagId: getTag("check-in-dep"),
        isDefault: true,
      },
      { categoryId: quanCafe.id, tagId: getTag("yen-tinh"), isDefault: true },
      {
        categoryId: quanCafe.id,
        tagId: getTag("wifi-mien-phi"),
        isDefault: true,
      },
      {
        categoryId: quanCafe.id,
        tagId: getTag("di-cap-doi"),
        isDefault: false,
      },
      { categoryId: quanCafe.id, tagId: getTag("view-dep"), isDefault: false },
    ],
  });

  // Khách sạn
  await prisma.categoryTag.createMany({
    data: [
      {
        categoryId: khachSan.id,
        tagId: getTag("gan-trung-tam"),
        isDefault: true,
      },
      { categoryId: khachSan.id, tagId: getTag("co-do-xe"), isDefault: true },
      {
        categoryId: khachSan.id,
        tagId: getTag("wifi-mien-phi"),
        isDefault: true,
      },
      { categoryId: khachSan.id, tagId: getTag("dieu-hoa"), isDefault: false },
      {
        categoryId: khachSan.id,
        tagId: getTag("phu-hop-gia-dinh"),
        isDefault: false,
      },
    ],
  });

  // Chợ nổi
  await prisma.categoryTag.createMany({
    data: [
      {
        categoryId: choNoi.id,
        tagId: getTag("dac-san-mien-tay"),
        isDefault: true,
      },
      { categoryId: choNoi.id, tagId: getTag("check-in-dep"), isDefault: true },
      {
        categoryId: choNoi.id,
        tagId: getTag("phu-hop-gia-dinh"),
        isDefault: true,
      },
      { categoryId: choNoi.id, tagId: getTag("sang-som"), isDefault: false },
      { categoryId: choNoi.id, tagId: getTag("gan-song"), isDefault: false },
    ],
  });

  console.log("✅ Assigned tags to categories");
}

async function main() {
  try {
    // Clean up
    console.log("🧹 Cleaning up...");
    await prisma.categoryTag.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.placeTag.deleteMany({});

    // Seed
    await seedCategories();
    await seedTags();
    await assignTagsToCategories();

    // Summary
    console.log("\n📊 Summary:");
    const categoryCount = await prisma.category.count();
    const tagCount = await prisma.placeTag.count();
    const categoryTagCount = await prisma.categoryTag.count();

    console.log(`   ✅ ${categoryCount} categories created`);
    console.log(`   ✅ ${tagCount} tags created`);
    console.log(`   ✅ ${categoryTagCount} category-tag links created`);

    console.log("\n🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
