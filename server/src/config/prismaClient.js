import { PrismaClient } from "@prisma/client";

// PRISMA_LOG: "query" | "error" | "warn" (comma-separated). Mặc định: "error,warn"
// Set PRISMA_LOG=query,error,warn khi cần debug SQL
const prismaLogEnv = process.env.PRISMA_LOG || "error,warn";
const prismaLogLevels = prismaLogEnv.split(",").map((l) => l.trim()).filter(Boolean);

const prisma = new PrismaClient({
  log: prismaLogLevels,
});

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
