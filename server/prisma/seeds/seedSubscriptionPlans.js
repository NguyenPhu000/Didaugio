import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const plans = [
  {
    name: "Basic",
    slug: "basic",
    description: "Gói cơ bản cho doanh nghiệp nhỏ bắt đầu kinh doanh",
    priceMonthly: 150_000,
    priceYearly: 1_500_000,
    maxPlaces: 2,
    maxBookings: 50,
    maxStaff: 1,
    features: [],
    isActive: true,
    sortOrder: 1,
  },
  {
    name: "Plus",
    slug: "plus",
    description: "Gói mở rộng cho doanh nghiệp phát triển",
    priceMonthly: 300_000,
    priceYearly: 3_000_000,
    maxPlaces: 5,
    maxBookings: 200,
    maxStaff: 3,
    features: ["analytics"],
    isActive: true,
    sortOrder: 2,
  },
  {
    name: "Pro",
    slug: "pro",
    description: "Gói chuyên nghiệp không giới hạn cho doanh nghiệp lớn",
    priceMonthly: 600_000,
    priceYearly: 6_000_000,
    maxPlaces: -1,
    maxBookings: -1,
    maxStaff: 10,
    features: ["analytics", "priority_support", "api_access", "heatmap"],
    isActive: true,
    sortOrder: 3,
  },
];

async function seedSubscriptionPlans() {
  console.log("Seeding subscription plans...");

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        maxPlaces: plan.maxPlaces,
        maxBookings: plan.maxBookings,
        maxStaff: plan.maxStaff,
        features: plan.features,
        isActive: plan.isActive,
        sortOrder: plan.sortOrder,
      },
      create: plan,
    });
    console.log(`  ✓ ${plan.name} (${plan.slug})`);
  }

  console.log("Subscription plans seeded successfully.");
}

seedSubscriptionPlans()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
