import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Role IDs from constants.js
const ROLES = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  BUSINESS: 3,
};

const permissions = [
  {
    name: "subscriptions.view",
    displayName: "Xem Subscription",
    module: "subscriptions",
    description: "Xem thông tin gói dịch vụ, hóa đơn, lịch sử thanh toán",
  },
  {
    name: "subscriptions.manage",
    displayName: "Quản lý Subscription",
    module: "subscriptions",
    description: "Quản lý gói dịch vụ, nâng cấp/hạ cấp, CRUD plans (admin)",
  },
];

// Role → permission mapping
const rolePermissions = [
  { roleId: ROLES.SUPER_ADMIN, permissionName: "subscriptions.view" },
  { roleId: ROLES.SUPER_ADMIN, permissionName: "subscriptions.manage" },
  { roleId: ROLES.ADMIN, permissionName: "subscriptions.view" },
  { roleId: ROLES.ADMIN, permissionName: "subscriptions.manage" },
  { roleId: ROLES.BUSINESS, permissionName: "subscriptions.view" },
];

async function seedSubscriptionPermissions() {
  console.log("Seeding subscription permissions...");

  // 1. Create permissions
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { displayName: perm.displayName, description: perm.description },
      create: perm,
    });
    console.log(`  ✓ Permission: ${perm.name}`);
  }

  // 2. Assign permissions to roles
  for (const rp of rolePermissions) {
    const permission = await prisma.permission.findUnique({
      where: { name: rp.permissionName },
    });
    if (!permission) {
      console.error(`  ✗ Permission not found: ${rp.permissionName}`);
      continue;
    }

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: rp.roleId,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: rp.roleId,
        permissionId: permission.id,
      },
    });
    console.log(`  ✓ Role ${rp.roleId} → ${rp.permissionName}`);
  }

  console.log("Subscription permissions seeded successfully.");
}

seedSubscriptionPermissions()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
