import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function runSeed() {
  try {
    console.log("Bắt đầu seed permissions và role_permissions...");

    // Đọc file SQL
    const sqlFilePath = path.join(
      __dirname,
      "../../prisma/migrations/20260102000000_seed_permissions.sql"
    );
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

    // Tách thành các statements (bỏ qua comments)
    const statements = sqlContent
      .split(";")
      .map((s) => s.trim())
      .filter(
        (s) =>
          s &&
          !s.startsWith("--") &&
          !s.startsWith("/*") &&
          s.toUpperCase().startsWith("INSERT")
      );

    console.log(`Tìm thấy ${statements.length} INSERT statements`);

    // Thực thi từng statement
    for (let i = 0; i < statements.length; i++) {
      try {
        await prisma.$executeRawUnsafe(statements[i]);
        console.log(`[${i + 1}/${statements.length}] Thực thi thành công`);
      } catch (error) {
        // Bỏ qua lỗi duplicate (data đã tồn tại)
        if (error.code === "23505") {
          console.log(
            `[${i + 1}/${statements.length}] Bỏ qua (data đã tồn tại)`
          );
        } else {
          console.error(`[${i + 1}/${statements.length}] Lỗi:`, error.message);
        }
      }
    }

    // Verify kết quả
    console.log("\n=== KIỂM TRA KẾT QUẢ ===");

    const permissionCount = await prisma.permission.count();
    console.log(`Tổng số permissions: ${permissionCount}`);

    const permissionsByModule = await prisma.permission.groupBy({
      by: ["module"],
      _count: true,
    });
    console.log("\nPhân bố permissions theo module:");
    permissionsByModule.forEach((item) => {
      console.log(`  - ${item.module}: ${item._count} quyền`);
    });

    const rolePermissions = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    console.log("\nSố quyền của từng vai trò:");
    rolePermissions.forEach((role) => {
      console.log(
        `  - ${role.displayName} (${role.name}): ${role._count.rolePermissions} quyền`
      );
    });

    console.log("\nSeed hoàn tất thành công!");
  } catch (error) {
    console.error("Lỗi khi seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runSeed();
