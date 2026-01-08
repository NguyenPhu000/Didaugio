/**
 * Seed Permissions for Activity Modules
 * Modules: Email Verification, Password Reset, Audit Log, Login History
 *
 * Run: node src/scripts/seedActivityPermissions.js
 */

import prisma from "../config/prismaClient.js";

const activityPermissions = [
  // Email Verification
  {
    name: "email_verification.view",
    displayName: "Xem danh sách xác thực email",
    module: "email_verification",
    description: "Quyền xem danh sách email verifications",
  },
  {
    name: "email_verification.create",
    displayName: "Tạo/Gửi lại email xác thực",
    module: "email_verification",
    description: "Quyền tạo token và gửi lại email xác thực",
  },

  // Password Reset
  {
    name: "password_reset.view",
    displayName: "Xem danh sách reset mật khẩu",
    module: "password_reset",
    description: "Quyền xem danh sách password reset requests",
  },

  // Audit Log
  {
    name: "audit_log.view",
    displayName: "Xem lịch sử hoạt động",
    module: "audit_log",
    description: "Quyền xem audit logs",
  },

  // Login History
  {
    name: "login_history.view",
    displayName: "Xem lịch sử đăng nhập",
    module: "login_history",
    description: "Quyền xem tất cả login history",
  },
  {
    name: "login_history.revoke",
    displayName: "Vô hiệu hóa session",
    module: "login_history",
    description: "Quyền revoke session của user khác",
  },
];

async function seedPermissions() {
  console.log("Starting to seed activity permissions...");

  // 1. Tạo permissions
  for (const perm of activityPermissions) {
    const existing = await prisma.permission.findUnique({
      where: { name: perm.name },
    });

    if (existing) {
      console.log(`Permission "${perm.name}" already exists, skipping...`);
    } else {
      await prisma.permission.create({
        data: perm,
      });
      console.log(`Created permission: ${perm.name}`);
    }
  }

  // 2. Gán permissions cho Super Admin (roleId = 1) và Admin (roleId = 2)
  const adminRoles = [1, 2]; // Super Admin, Admin
  const allPermissionNames = activityPermissions.map((p) => p.name);

  for (const roleId of adminRoles) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      console.log(`Role ${roleId} not found, skipping...`);
      continue;
    }

    for (const permName of allPermissionNames) {
      const permission = await prisma.permission.findUnique({
        where: { name: permName },
      });

      if (!permission) continue;

      const existingRolePerm = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId: permission.id,
          },
        },
      });

      if (existingRolePerm) {
        console.log(
          `Role ${role.name} already has permission "${permName}", skipping...`
        );
      } else {
        await prisma.rolePermission.create({
          data: {
            roleId,
            permissionId: permission.id,
          },
        });
        console.log(`Assigned "${permName}" to role "${role.name}"`);
      }
    }
  }

  console.log("\nSeed activity permissions completed!");
}

seedPermissions()
  .catch((error) => {
    console.error("Error seeding permissions:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

