/**
 * Business Dashboard Service - SRP: Thống kê dashboard cho doanh nghiệp
 */
import prisma from "../../config/prismaClient.js";

const DASHBOARD_PRESETS = {
  today: "today",
  week: "week",
  month: "month",
};

const toStartOfDayUtc = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const toEndOfDayUtc = (date) => {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
};

const toIsoDate = (date) => toStartOfDayUtc(date).toISOString().slice(0, 10);

const getPresetRange = (presetRaw) => {
  const now = new Date();
  const todayStart = toStartOfDayUtc(now);
  const todayEnd = toEndOfDayUtc(now);

  const preset = presetRaw || DASHBOARD_PRESETS.month;

  if (preset === DASHBOARD_PRESETS.today) {
    return {
      preset,
      from: todayStart,
      to: todayEnd,
    };
  }

  if (preset === DASHBOARD_PRESETS.week) {
    const startOfWeek = toStartOfDayUtc(now);
    const day = startOfWeek.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() + diffToMonday);

    return {
      preset,
      from: startOfWeek,
      to: todayEnd,
    };
  }

  if (preset === DASHBOARD_PRESETS.month) {
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );

    return {
      preset,
      from: startOfMonth,
      to: todayEnd,
    };
  }

  const error = new Error("Preset không hợp lệ. Chỉ hỗ trợ today|week|month");
  error.statusCode = 400;
  throw error;
};

const resolveDashboardPeriod = ({ preset, dateFrom, dateTo } = {}) => {
  if (dateFrom || dateTo) {
    if (!dateFrom || !dateTo) {
      const error = new Error("Cần truyền đủ dateFrom và dateTo");
      error.statusCode = 400;
      throw error;
    }

    const from = toStartOfDayUtc(dateFrom);
    const to = toEndOfDayUtc(dateTo);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      const error = new Error("Định dạng dateFrom/dateTo không hợp lệ");
      error.statusCode = 400;
      throw error;
    }

    if (from > to) {
      const error = new Error("dateFrom không được lớn hơn dateTo");
      error.statusCode = 400;
      throw error;
    }

    return {
      preset: null,
      from,
      to,
    };
  }

  return getPresetRange(preset);
};

export const getDashboard = async (userId, options = {}) => {
  const business = await prisma.business.findUnique({
    where: { ownerId: userId },
    select: { id: true },
  });

  if (!business) {
    const error = new Error("Bạn chưa đăng ký doanh nghiệp");
    error.statusCode = 404;
    throw error;
  }

  const period = resolveDashboardPeriod(options);

  const bookingWhere = {
    service: { businessId: business.id },
    useDate: {
      gte: period.from,
      lte: period.to,
    },
  };

  const completedBookingWhere = {
    ...bookingWhere,
    status: "completed",
  };

  const todayStart = toStartOfDayUtc(new Date());
  const todayEnd = toEndOfDayUtc(new Date());

  const startOfWeek = toStartOfDayUtc(new Date());
  const day = startOfWeek.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() + diffToMonday);

  const [
    placesCount,
    servicesCount,
    bookingsCount,
    bookingsByStatus,
    revenue,
    pendingBookingsToday,
    newBookingsThisWeek,
    avgRating,
    topServicesRaw,
    revenueChartRaw,
  ] = await Promise.all([
    prisma.place.count({
      where: { businessId: business.id, deletedAt: null },
    }),
    prisma.businessService.count({ where: { businessId: business.id } }),
    prisma.booking.count({ where: bookingWhere }),
    prisma.booking.groupBy({
      by: ["status"],
      where: bookingWhere,
      _count: { id: true },
    }),
    prisma.booking.aggregate({
      where: completedBookingWhere,
      _sum: { finalPrice: true, commissionAmount: true },
    }),
    prisma.booking.count({
      where: {
        service: { businessId: business.id },
        status: "pending",
        useDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    }),
    prisma.booking.count({
      where: {
        service: { businessId: business.id },
        createdAt: {
          gte: startOfWeek,
        },
      },
    }),
    prisma.place.aggregate({
      where: { businessId: business.id, deletedAt: null },
      _avg: { ratingAvg: true },
    }),
    prisma.booking.groupBy({
      by: ["serviceId"],
      where: completedBookingWhere,
      _count: { id: true },
      _sum: { finalPrice: true },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    }),
    prisma.booking.groupBy({
      by: ["useDate"],
      where: completedBookingWhere,
      _count: { id: true },
      _sum: { finalPrice: true },
      orderBy: {
        useDate: "asc",
      },
    }),
  ]);

  const services =
    topServicesRaw.length > 0
      ? await prisma.businessService.findMany({
          where: { id: { in: topServicesRaw.map((item) => item.serviceId) } },
          select: { id: true, name: true },
        })
      : [];

  const serviceMap = new Map(services.map((service) => [service.id, service]));

  const topServices = topServicesRaw.map((item) => ({
    id: item.serviceId,
    name: serviceMap.get(item.serviceId)?.name || `Service #${item.serviceId}`,
    bookingCount: item._count.id,
    revenue: item._sum.finalPrice || 0,
  }));

  const revenueChart = revenueChartRaw.map((item) => ({
    date: toIsoDate(item.useDate),
    revenue: item._sum.finalPrice || 0,
    bookings: item._count.id,
  }));

  const statusMap = bookingsByStatus.reduce(
    (acc, item) => ({ ...acc, [item.status]: item._count.id }),
    {},
  );

  const completedCount = statusMap.completed || 0;
  const conversionRateBase =
    (statusMap.pending || 0) +
    (statusMap.confirmed || 0) +
    (statusMap.completed || 0);

  const conversionRate =
    conversionRateBase > 0
      ? Number(((completedCount / conversionRateBase) * 100).toFixed(1))
      : 0;

  const totalRevenue = revenue._sum.finalPrice || 0;
  const totalCommission = revenue._sum.commissionAmount || 0;
  const netRevenue = totalRevenue - totalCommission;

  const overview = {
    placesCount,
    servicesCount,
    bookingsTotal: bookingsCount,
    bookingsByStatus: statusMap,
    pendingBookingsToday,
    newBookingsThisWeek,
    conversionRate,
    totalRevenue,
    totalCommission,
    netRevenue,
    avgRating: Number(avgRating._avg.ratingAvg || 0),
  };

  return {
    period: {
      from: toIsoDate(period.from),
      to: toIsoDate(period.to),
      preset: period.preset,
    },
    overview,
    topServices,
    revenueChart,

    // Backward compatibility for existing web dashboard until it migrates fully.
    placesCount: overview.placesCount,
    servicesCount: overview.servicesCount,
    bookingsCount: overview.bookingsTotal,
    bookingsByStatus: overview.bookingsByStatus,
    totalRevenue: overview.totalRevenue,
    totalCommission: overview.totalCommission,
    netRevenue: overview.netRevenue,
  };
};
