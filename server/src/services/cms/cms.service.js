import prisma from "../../config/prismaClient.js";
import ServiceError from "../../utils/serviceError.js";
import { ERROR_CODES } from "../../config/messages.js";

/**
 * Lấy toàn bộ data cần thiết cho Explore landing screen trong 1 request duy nhất.
 * Dùng Promise.all() để query song song, giảm thiểu thời gian chờ.
 */
export const getExploreLandingData = async () => {
  const now = new Date();

  const [banners, featuredPlaces, sampleTrips, announcement] = await Promise.all([
    // 1. Banner marketing đang trong thời gian hiển thị
    prisma.bannerMarketing.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { priority: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        linkType: true,
        linkValue: true,
        position: true,
        priority: true,
      },
      take: 5,
    }),

    // 2. Địa điểm nổi bật (isFeatured = true)
    prisma.place.findMany({
      where: {
        isFeatured: true,
        status: "approved",
      },
      take: 8,
      select: {
        id: true,
        name: true,
        thumbnail: true,
        ratingAvg: true,
        address: true,
        slug: true,
        category: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
      },
      orderBy: { ratingAvg: "desc" },
    }),

    // 3. Lịch trình mẫu công khai — destinations dùng đúng tên relation từ schema
    prisma.trip.findMany({
      where: { isPublic: true },
      take: 6,
      select: {
        id: true,
        title: true,
        thumbnail: true,
        totalDays: true,
        estimatedCost: true,
        travelStyle: true,
        cloneCount: true,
        destinations: {
          orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
          select: {
            id: true,
            dayNumber: true,
            order: true,
            startTime: true,
            endTime: true,
            place: {
              select: {
                id: true,
                name: true,
                address: true,
                thumbnail: true,
                latitude: true,
                longitude: true,
                category: { select: { id: true, name: true } },
                images: {
                  take: 2,
                  orderBy: [{ isCover: "desc" }, { id: "asc" }],
                  select: {
                    secureUrl: true,
                    thumbnailUrl: true,
                    imageData: true,
                    isCover: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { cloneCount: "desc" },
    }),

    // 4. Thông báo hệ thống mới nhất (targetType = "all", status = "sent")
    prisma.notificationGlobal.findFirst({
      where: {
        status: "sent",
        targetType: "all",
      },
      orderBy: { sentAt: "desc" },
      select: {
        id: true,
        title: true,
        body: true,
        imageUrl: true,
        sentAt: true,
      },
    }),
  ]);

  return { banners, featuredPlaces, sampleTrips, announcement };
};

/**
 * Lấy danh sách banner marketing đang active
 */
export const getActiveBanners = async () => {
  const now = new Date();
  return prisma.bannerMarketing.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { priority: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      linkType: true,
      linkValue: true,
      position: true,
    },
    take: 10,
  });
};

/**
 * Lấy danh sách địa điểm nổi bật
 */
export const getFeaturedPlaces = async ({ limit = 8 } = {}) => {
  return prisma.place.findMany({
    where: { isFeatured: true, status: "approved" },
    take: Math.min(limit, 20),
    select: {
      id: true,
      name: true,
      thumbnail: true,
      ratingAvg: true,
      address: true,
      slug: true,
      category: { select: { id: true, name: true } },
      district: { select: { id: true, name: true } },
    },
    orderBy: { ratingAvg: "desc" },
  });
};

/**
 * Lấy danh sách lịch trình mẫu công khai
 */
export const getSampleTrips = async ({ limit = 6 } = {}) => {
  return prisma.trip.findMany({
    where: { isPublic: true },
    take: Math.min(limit, 12),
    select: {
      id: true,
      title: true,
      thumbnail: true,
      totalDays: true,
      estimatedCost: true,
      travelStyle: true,
      cloneCount: true,
      destinations: {
        orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
        select: {
          id: true,
          dayNumber: true,
          order: true,
          startTime: true,
          endTime: true,
          place: {
            select: {
              id: true,
              name: true,
              address: true,
              thumbnail: true,
              latitude: true,
              longitude: true,
              category: { select: { id: true, name: true } },
              images: {
                take: 2,
                orderBy: [{ isCover: "desc" }, { id: "asc" }],
                select: {
                  secureUrl: true,
                  thumbnailUrl: true,
                  imageData: true,
                  isCover: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { cloneCount: "desc" },
  });
};

/**
 * Lấy thông báo hệ thống đã gửi (public)
 */
export const getPublicAnnouncements = async ({ limit = 5 } = {}) => {
  return prisma.notificationGlobal.findMany({
    where: { status: "sent", targetType: "all" },
    orderBy: { sentAt: "desc" },
    select: {
      id: true,
      title: true,
      body: true,
      imageUrl: true,
      sentAt: true,
    },
    take: Math.min(limit, 10),
  });
};
