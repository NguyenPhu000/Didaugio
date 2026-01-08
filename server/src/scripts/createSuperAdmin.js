import prisma from "../config/prismaClient.js";
import bcrypt from "bcrypt";

async function createSuperAdmin() {
  try {
    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const existingAdmin = await prisma.user.findFirst({
      where: { roleId: 1 },
    });

    if (existingAdmin) {
      console.log("✅ Super Admin đã tồn tại:");
      console.log("   Email:", existingAdmin.email);
      console.log("   ID:", existingAdmin.id);
      return;
    }

    const superAdmin = await prisma.user.create({
      data: {
        email: "superadmin@didaugio.com",
        password: hashedPassword,
        roleId: 1,
        status: "active",
        emailVerified: true,
      },
    });

    console.log("🎉 Tạo Super Admin thành công!");
    console.log("📧 Email: superadmin@didaugio.com");
    console.log("🔑 Password: Admin@123");
    console.log("🆔 User ID:", superAdmin.id);
    console.log("\n✨ Bây giờ bạn có thể đăng nhập với tài khoản này!");
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
