/**
 * DASHBOARD SERVICE - Real-time Statistics & Analytics
 * Optimized queries with proper indexing
 */

const prisma = require("../config/database");

/**
 * Get comprehensive dashboard statistics
 */
const getDashboardStats = async () => {
  try {
    // Parallel queries for better performance
    const [
      // User statistics
      totalUsers,
      activeUsers,
      usersByRole,

      // Place statistics
      totalPlaces,
      placesByStatus,
      featuredPlaces,
      topViewedPlaces,

      // Category statistics
      categoriesWithPlaceCounts,

      // Activity statistics
      recentAuditLogs,
      loginSessions,
      activeLoginSessions,

      // Email & Security
      pendingEmailVerifications,
      pendingPasswordResets,

      // System metrics
      totalViews,
      averageRating,
    ] = await Promise.all([
      // User counts
      prisma.user.count(),

      // Active users (logged in within last 24 hours)
      prisma.loginHistory.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          status: "active",
        },
        distinct: ["userId"],
      }),

      // Users by role
      prisma.user.groupBy({
        by: ["roleId"],
        _count: { id: true },
      }),

      // Total places
      prisma.place.count(),

      // Places by status
      prisma.place.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      // Featured places count
      prisma.place.count({
        where: { isFeatured: true },
      }),

      // Top viewed places
      prisma.place.findMany({
        take: 5,
        orderBy: { viewCount: "desc" },
        select: {
          id: true,
          name: true,
          viewCount: true,
          averageRating: true,
        },
      }),

      // Categories with place counts
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: { places: true },
          },
        },
        orderBy: {
          places: {
            _count: "desc",
          },
        },
        take: 10,
      }),

      // Recent audit logs (last 7 days)
      prisma.auditLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Total login sessions
      prisma.loginHistory.count(),

      // Active sessions
      prisma.loginHistory.count({
        where: {
          status: "active",
          expiresAt: {
            gt: new Date(),
          },
        },
      }),

      // Pending email verifications
      prisma.emailVerification.count({
        where: {
          verified: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      }),

      // Pending password resets
      prisma.passwordReset.count({
        where: {
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      }),

      // Total views across all places
      prisma.place.aggregate({
        _sum: { viewCount: true },
      }),

      // Average rating
      prisma.place.aggregate({
        _avg: { averageRating: true },
      }),
    ]);

    // Transform data for frontend
    const placeStatusMap = {};
    placesByStatus.forEach((item) => {
      placeStatusMap[item.status] = item._count.id;
    });

    const roleStatsMap = {};
    usersByRole.forEach((item) => {
      roleStatsMap[item.roleId] = item._count.id;
    });

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        byRole: roleStatsMap,
        onlineNow: activeLoginSessions, // Approximation based on active sessions
      },
      places: {
        total: totalPlaces,
        approved: placeStatusMap.approved || 0,
        pending: placeStatusMap.pending || 0,
        rejected: placeStatusMap.rejected || 0,
        draft: placeStatusMap.draft || 0,
        featured: featuredPlaces,
        totalViews: totalViews._sum.viewCount || 0,
        averageRating: Number(
          (averageRating._avg.averageRating || 0).toFixed(1),
        ),
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
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

/**
 * Get activity timeline data (for charts)
 * Last 7 days of user activity and place views
 */
const getActivityTimeline = async () => {
  try {
    const days = 7;
    const timeline = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [logins, auditLogs] = await Promise.all([
        prisma.loginHistory.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
        prisma.auditLog.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
      ]);

      timeline.push({
        date: date.toISOString().split("T")[0],
        logins,
        activities: auditLogs,
      });
    }

    return timeline;
  } catch (error) {
    console.error("Error fetching activity timeline:", error);
    throw error;
  }
};

/**
 * Get system health metrics
 */
const getSystemHealth = async () => {
  try {
    const [dbSize, totalRecords, recentErrors] = await Promise.all([
      // Get approximate database size by counting records
      Promise.all([
        prisma.user.count(),
        prisma.place.count(),
        prisma.category.count(),
        prisma.auditLog.count(),
        prisma.loginHistory.count(),
      ]).then((counts) => counts.reduce((sum, count) => sum + count, 0)),

      // Total records
      prisma.auditLog.count(),

      // Recent errors (if you log errors to DB)
      0, // Placeholder - implement error logging if needed
    ]);

    // Calculate load percentages (simplified)
    const maxRecords = 100000; // Threshold
    const dbLoad = Math.min((totalRecords / maxRecords) * 100, 100);

    return {
      database: {
        totalRecords,
        load: Math.round(dbLoad),
        status: dbLoad < 70 ? "healthy" : dbLoad < 90 ? "warning" : "critical",
      },
      api: {
        responseTime: Math.floor(Math.random() * 50) + 100, // ms - replace with real APM
        status: "operational",
      },
      errors: {
        recent: recentErrors,
      },
    };
  } catch (error) {
    console.error("Error fetching system health:", error);
    throw error;
  }
};

module.exports = {
  getDashboardStats,
  getActivityTimeline,
  getSystemHealth,
};
