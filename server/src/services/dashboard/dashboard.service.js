import prisma from "../../config/prismaClient.js";

const TIMELINE_DAYS = 7;
const TOP_PLACES_LIMIT = 5;
const TOP_CATEGORIES_LIMIT = 10;

const activeUserWhere = { deletedAt: null };
const activePlaceWhere = { deletedAt: null };

const getDashboardStats = async () => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(Date.now() - TIMELINE_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();

  const [
    totalUsers,
    activeUserRows,
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
    prisma.user.count({ where: activeUserWhere }),
    prisma.userSession.groupBy({
      by: ["userId"],
      where: {
        lastUsedAt: { gte: oneDayAgo },
        isActive: true,
        user: activeUserWhere,
      },
      _count: { _all: true },
    }),
    prisma.user.groupBy({
      by: ["roleId"],
      where: activeUserWhere,
      _count: { id: true },
    }),
    prisma.place.count({ where: activePlaceWhere }),
    prisma.place.groupBy({
      by: ["status"],
      where: activePlaceWhere,
      _count: { id: true },
    }),
    prisma.place.count({
      where: { ...activePlaceWhere, isFeatured: true },
    }),
    prisma.place.findMany({
      where: activePlaceWhere,
      take: TOP_PLACES_LIMIT,
      orderBy: { viewCount: "desc" },
      select: { id: true, name: true, viewCount: true, ratingAvg: true },
    }),
    (async () => {
      const rows = await prisma.category.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              places: { where: activePlaceWhere },
            },
          },
        },
        take: 100,
      });
      return rows
        .sort((a, b) => b._count.places - a._count.places)
        .slice(0, TOP_CATEGORIES_LIMIT);
    })(),
    prisma.auditLog.count({
      where: { createdAt: { gte: oneWeekAgo } },
    }),
    prisma.userSession.count({
      where: { user: activeUserWhere },
    }),
    prisma.userSession.count({
      where: {
        isActive: true,
        expiresAt: { gt: now },
        user: activeUserWhere,
      },
    }),
    prisma.emailVerification.count({
      where: { verifiedAt: null, expiresAt: { gt: now } },
    }),
    prisma.passwordReset.count({
      where: { usedAt: null, expiresAt: { gt: now } },
    }),
    prisma.place.aggregate({
      where: activePlaceWhere,
      _sum: { viewCount: true },
    }),
    prisma.place.aggregate({
      where: activePlaceWhere,
      _avg: { ratingAvg: true },
    }),
  ]);

  const activeUsers = activeUserRows.length;

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
      hidden: placeStatusMap.hidden || 0,
      draft: placeStatusMap.draft || 0,
      featured: featuredPlaces,
      totalViews: totalViews._sum.viewCount || 0,
      averageRating: Number((averageRating._avg.ratingAvg || 0).toFixed(1)),
      topViewed: topViewedPlaces.map((p) => ({
        ...p,
        averageRating: p.ratingAvg != null ? Number(p.ratingAvg) : null,
      })),
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

    const [sessionTouches, auditLogs] = await Promise.all([
      prisma.userSession.count({
        where: { lastUsedAt: dateRange },
      }),
      prisma.auditLog.count({ where: { createdAt: dateRange } }),
    ]);

    timeline.push({
      date: date.toISOString().split("T")[0],
      logins: sessionTouches,
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
