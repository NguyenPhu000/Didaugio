import { PrismaClient } from "@prisma/client";

// Tạo instance Prisma Client - Singleton pattern
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

// Graceful shutdown - Đóng kết nối khi thoát
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
