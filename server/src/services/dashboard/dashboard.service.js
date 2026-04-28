import prisma from "../../config/prismaClient.js";

const TIMELINE_DAYS = 7;
const TOP_PLACES_LIMIT = 5;
const TOP_CATEGORIES_LIMIT = 10;

const getDashboardStats = async () => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(Date.now() - TIMELINE_DAYS * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    usersByRole,
    totalPlaces,
    placesByStatus,
    featuredPlaces,
    topViewedPlaces,
    categoriesWithPlaceCounts,
    recentAuditLogs,
    loginSessions,
    activeLoginSessions,
    pendingEmailVerifications,
    pendingPasswordResets,
    totalViews,
    averageRating,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.loginHistory.count({
      where: {
        createdAt: { gte: oneDayAgo },
        status: "active",
      },
      distinct: ["userId"],
    }),
    prisma.user.groupBy({
      by: ["roleId"],
      _count: { id: true },
    }),
    prisma.place.count(),
    prisma.place.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.place.count({ where: { isFeatured: true } }),
    prisma.place.findMany({
      take: TOP_PLACES_LIMIT,
      orderBy: { viewCount: "desc" },
      select: { id: true, name: true, viewCount: true, averageRating: true },
    }),
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { places: true } },
      },
      orderBy: { places: { _count: "desc" } },
      take: TOP_CATEGORIES_LIMIT,
    }),
    prisma.auditLog.count({
      where: { createdAt: { gte: oneWeekAgo } },
    }),
    prisma.loginHistory.count(),
    prisma.loginHistory.count({
      where: { status: "active", expiresAt: { gt: new Date() } },
    }),
    prisma.emailVerification.count({
      where: { verified: false, expiresAt: { gt: new Date() } },
    }),
    prisma.passwordReset.count({
      where: { used: false, expiresAt: { gt: new Date() } },
    }),
    prisma.place.aggregate({ _sum: { viewCount: true } }),
    prisma.place.aggregate({ _avg: { averageRating: true } }),
  ]);

  const placeStatusMap = Object.fromEntries(
    placesByStatus.map((item) => [item.status, item._count.id]),
  );

  const roleStatsMap = Object.fromEntries(
    usersByRole.map((item) => [item.roleId, item._count.id]),
  );

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      byRole: roleStatsMap,
      onlineNow: activeLoginSessions,
    },
    places: {
      total: totalPlaces,
      approved: placeStatusMap.approved || 0,
      pending: placeStatusMap.pending || 0,
      rejected: placeStatusMap.rejected || 0,
      draft: placeStatusMap.draft || 0,
      featured: featuredPlaces,
      totalViews: totalViews._sum.viewCount || 0,
      averageRating: Number((averageRating._avg.averageRating || 0).toFixed(1)),
      topViewed: topViewedPlaces,
    },
    categories: categoriesWithPlaceCounts.map((cat) => ({
      id: cat.id,
      name: cat.name,
      placeCount: cat._count.places,
    })),
    activity: {
      recentLogs: recentAuditLogs,
      totalSessions: loginSessions,
      activeSessions: activeLoginSessions,
    },
    security: {
      pendingEmailVerifications,
      pendingPasswordResets,
    },
  };
};

const getActivityTimeline = async () => {
  const timeline = [];

  for (let i = TIMELINE_DAYS - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dateRange = { gte: date, lt: nextDate };

    const [logins, auditLogs] = await Promise.all([
      prisma.loginHistory.count({ where: { createdAt: dateRange } }),
      prisma.auditLog.count({ where: { createdAt: dateRange } }),
    ]);

    timeline.push({
      date: date.toISOString().split("T")[0],
      logins,
      activities: auditLogs,
    });
  }

  return timeline;
};

const getSystemHealth = async () => {
  const MAX_RECORDS_THRESHOLD = 100000;

  const [totalRecords, recentErrors] = await Promise.all([
    prisma.auditLog.count(),
    Promise.resolve(0),
  ]);

  const dbLoad = Math.min((totalRecords / MAX_RECORDS_THRESHOLD) * 100, 100);

  return {
    database: {
      totalRecords,
      load: Math.round(dbLoad),
      status: dbLoad < 70 ? "healthy" : dbLoad < 90 ? "warning" : "critical",
    },
    api: {
      status: "operational",
    },
    errors: {
      recent: recentErrors,
    },
  };
};

export { getDashboardStats, getActivityTimeline, getSystemHealth };
