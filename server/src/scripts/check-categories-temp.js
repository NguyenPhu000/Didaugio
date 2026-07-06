import prisma from "./src/config/prismaClient.js";

async function main() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    console.log("10 danh mục mới nhất trong DB:");
    console.log(JSON.stringify(categories, null, 2));
  } catch (error) {
    console.error("Lỗi khi query DB:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
