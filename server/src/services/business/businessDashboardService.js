/**
 * Business Dashboard Service - SRP: Thống kê dashboard cho doanh nghiệp
 */
import prisma from "../../config/prismaClient.js";

export const getDashboard = async (userId) => {
  const business = await prisma.business.findUnique({
    where: { ownerId: userId },
    select: { id: true },
  });

  if (!business) {
    const error = new Error("Bạn chưa đăng ký doanh nghiệp");
    error.statusCode = 404;
    throw error;
  }

  const [placesCount, servicesCount, bookingsCount, bookingsByStatus, revenue] =
    await Promise.all([
      prisma.place.count({
        where: { businessId: business.id, deletedAt: null },
      }),
      prisma.businessService.count({ where: { businessId: business.id } }),
      prisma.booking.count({ where: { service: { businessId: business.id } } }),
      prisma.booking.groupBy({
        by: ["status"],
        where: { service: { businessId: business.id } },
        _count: { id: true },
      }),
      prisma.booking.aggregate({
        where: {
          service: { businessId: business.id },
          status: "completed",
        },
        _sum: { finalPrice: true, commissionAmount: true },
      }),
    ]);

  return {
    placesCount,
    servicesCount,
    bookingsCount,
    bookingsByStatus: bookingsByStatus.reduce(
      (acc, item) => ({ ...acc, [item.status]: item._count.id }),
      {},
    ),
    totalRevenue: revenue._sum.finalPrice || 0,
    totalCommission: revenue._sum.commissionAmount || 0,
    netRevenue:
      (revenue._sum.finalPrice || 0) - (revenue._sum.commissionAmount || 0),
  };
};
