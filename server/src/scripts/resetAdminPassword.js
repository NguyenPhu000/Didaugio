import prisma from "../config/prismaClient.js";
import bcrypt from "bcrypt";

async function resetPassword() {
  const newPassword = "Admin@123";
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: 10 },
    data: { 
      password: hashedPassword,
      status: "active",
      emailVerified: true
    },
  });

  console.log("✅ Đã reset password cho Super Admin");
  console.log("📧 Email: nguyenngocphuvlbm@gmail.com");
  console.log("🔑 Password: Admin@123");
  
  await prisma.$disconnect();
}

resetPassword();
