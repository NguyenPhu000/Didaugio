import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const roles = [
  { id: 1, name: "super_admin", displayName: "Super Admin", description: "System Super Administrator", isSystem: true, isProtected: true },
  { id: 2, name: "admin", displayName: "Administrator", description: "System Administrator", isSystem: true, isProtected: true },
  { id: 3, name: "business", displayName: "Business Owner", description: "Business Owner/Partner", isSystem: true, isProtected: true },
  { id: 4, name: "staff", displayName: "Business Staff", description: "Business Employee/Staff", isSystem: true, isProtected: true },
  { id: 5, name: "user", displayName: "Regular User", description: "End User/Traveler", isSystem: true, isProtected: true },
  { id: 6, name: "guest", displayName: "Guest User", description: "Anonymous Guest", isSystem: true, isProtected: true },
];

async function main() {
  console.log("Seeding roles...");
  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        isSystem: role.isSystem,
        isProtected: role.isProtected,
      },
      create: role,
    });
    console.log(`  ✓ Role: ${role.name}`);
  }
  console.log("Roles seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
