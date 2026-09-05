import prisma from "../config/prismaClient.js";

async function main() {
  try {
    const userCount = await prisma.user.count();
    const placeCount = await prisma.place.count();
    const canonicalPlanCount = await prisma.tripPlan.count();
    const canonicalStopCount = await prisma.tripStop.count();
    const bookingCount = await prisma.booking.count();
    const paymentCount = await prisma.payment.count();
    const provinceCount = await prisma.province.count();

    console.log("=== DATABASE REAL-TIME AUDIT STATS ===");
    console.log(`- Users: ${userCount}`);
    console.log(`- Places: ${placeCount}`);
    console.log(`- Canonical TripPlans: ${canonicalPlanCount}`);
    console.log(`- Canonical TripStops: ${canonicalStopCount}`);
    console.log(`- Bookings: ${bookingCount}`);
    console.log(`- Payments: ${paymentCount}`);
    console.log(`- Provinces: ${provinceCount}`);
  } catch (error) {
    console.error("Database Connection Audit Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
