import prisma from "../../config/prismaClient.js";
import ServiceError from "../../utils/serviceError.js";
import { ERROR_CODES } from "../../config/messages.js";
import { deleteImage } from "../../utils/cloudinaryService.js";
import { uploadPlaceImage } from "../media/media.service.js";

const EVENT_TRIP_PLACE_SELECT = {
  id: true,
  name: true,
  address: true,
  latitude: true,
  longitude: true,
  thumbnail: true,
  ratingAvg: true,
  images: {
    take: 1,
    orderBy: [{ isCover: "desc" }, { order: "asc" }],
    select: { secureUrl: true, thumbnailUrl: true, imageData: true },
  },
};

// Helper chuyển đổi trang/limit
const toInt = (value, fallback = null) => {
  const number = parseInt(value, 10);
  return Number.isNaN(number) ? fallback : number;
};

// 1. Tạo sự kiện (chỉ dành cho Admin/Superadmin/Staff)
export const createEvent = async (userId, data) => {
  const {
    title,
    description,
    thumbnail,
    thumbnailPublicId,
    startDate,
    endDate,
    location,
    maxParticipants,
    isFeaturedBanner,
    tripId,
    broadcastNotice,
    status,
  } = data;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    throw new ServiceError(
      ERROR_CODES.VALIDATION_ERROR,
      "Ngày bắt đầu không được lớn hơn ngày kết thúc",
      400
    );
  }

  // Nếu có tripId, kiểm tra sự tồn tại của Trip
  if (tripId) {
    const existingTrip = await prisma.trip.findUnique({
      where: { id: tripId },
    });
    if (!existingTrip) {
      throw new ServiceError(
        ERROR_CODES.NOT_FOUND,
        "Lịch trình chuyến đi mẫu không tồn tại",
        404
      );
    }
  }

  // Tự động upload thumbnail nếu gửi base64 từ client
  let finalThumbnail = thumbnail;
  let finalThumbnailPublicId = thumbnailPublicId;

  if (thumbnail && thumbnail.startsWith("data:image/")) {
    try {
      const uploadResult = await uploadPlaceImage(thumbnail, "didaugio/events");
      finalThumbnail = uploadResult.secureUrl;
      finalThumbnailPublicId = uploadResult.publicId;
    } catch (err) {
      console.error("Lỗi upload thumbnail lên Cloudinary:", err);
      throw new ServiceError(
        ERROR_CODES.SERVER_ERROR,
        "Lỗi upload ảnh lên Cloudinary",
        500
      );
    }
  }

  const event = await prisma.event.create({
    data: {
      title,
      description,
      thumbnail: finalThumbnail,
      thumbnailPublicId: finalThumbnailPublicId,
      startDate: start,
      endDate: end,
      location: location || "Cần Thơ",
      maxParticipants,
      isFeaturedBanner: isFeaturedBanner || false,
      tripId,
      broadcastNotice: broadcastNotice || null,
      status: status || "active",
      createdBy: userId,
    },
  });

  return event;
};

// 2. Cập nhật sự kiện
export const updateEvent = async (eventId, data) => {
  const existingEvent = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!existingEvent) {
    throw new ServiceError(
      ERROR_CODES.NOT_FOUND,
      "Không tìm thấy sự kiện",
      404
    );
  }

  const {
    title,
    description,
    thumbnail,
    thumbnailPublicId,
    startDate,
    endDate,
    location,
    maxParticipants,
    isFeaturedBanner,
    status,
    tripId,
    broadcastNotice,
  } = data;

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (location !== undefined) updateData.location = location;
  if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants;
  if (isFeaturedBanner !== undefined) updateData.isFeaturedBanner = isFeaturedBanner;
  if (status !== undefined) updateData.status = status;
  if (broadcastNotice !== undefined) updateData.broadcastNotice = broadcastNotice || null;

  if (thumbnail !== undefined) {
    let finalThumbnail = thumbnail;
    let finalThumbnailPublicId = thumbnailPublicId;

    if (thumbnail && thumbnail.startsWith("data:image/")) {
      try {
        const uploadResult = await uploadPlaceImage(thumbnail, "didaugio/events");
        finalThumbnail = uploadResult.secureUrl;
        finalThumbnailPublicId = uploadResult.publicId;
      } catch (err) {
        console.error("Lỗi upload thumbnail lên Cloudinary:", err);
        throw new ServiceError(
          ERROR_CODES.SERVER_ERROR,
          "Lỗi upload ảnh lên Cloudinary",
          500
        );
      }
    }

    // Nếu cập nhật thumbnail mới, hãy dọn dẹp thumbnail cũ trên Cloudinary
    if (existingEvent.thumbnailPublicId && existingEvent.thumbnailPublicId !== finalThumbnailPublicId) {
      try {
        await deleteImage(existingEvent.thumbnailPublicId);
      } catch (err) {
        console.error("Lỗi xóa thumbnail cũ khi update event:", err);
      }
    }
    updateData.thumbnail = finalThumbnail;
    updateData.thumbnailPublicId = finalThumbnailPublicId;
  }

  if (startDate !== undefined || endDate !== undefined) {
    const start = new Date(startDate || existingEvent.startDate);
    const end = new Date(endDate || existingEvent.endDate);
    if (start > end) {
      throw new ServiceError(
        ERROR_CODES.VALIDATION_ERROR,
        "Ngày bắt đầu không được lớn hơn ngày kết thúc",
        400
      );
    }
    if (startDate !== undefined) updateData.startDate = start;
    if (endDate !== undefined) updateData.endDate = end;
  }

  if (tripId !== undefined) {
    if (tripId) {
      const existingTrip = await prisma.trip.findUnique({
        where: { id: tripId },
      });
      if (!existingTrip) {
        throw new ServiceError(
          ERROR_CODES.NOT_FOUND,
          "Lịch trình chuyến đi mẫu không tồn tại",
          404
        );
      }
    }
    updateData.tripId = tripId;
  }

  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: updateData,
  });

  return updatedEvent;
};

// 3. Xóa sự kiện (dọn dẹp ảnh mồ côi trên Cloudinary)
export const deleteEvent = async (eventId) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      moments: {
        select: { imagePublicId: true },
      },
    },
  });

  if (!event) {
    throw new ServiceError(
      ERROR_CODES.NOT_FOUND,
      "Không tìm thấy sự kiện",
      404
    );
  }

  // Dọn dẹp ảnh mồ côi trên Cloudinary
  const publicIdsToDelete = [];
  if (event.thumbnailPublicId) {
    publicIdsToDelete.push(event.thumbnailPublicId);
  }
  if (event.moments && event.moments.length > 0) {
    event.moments.forEach((moment) => {
      if (moment.imagePublicId) {
        publicIdsToDelete.push(moment.imagePublicId);
      }
    });
  }

  // Gọi Cloudinary xóa song song
  if (publicIdsToDelete.length > 0) {
    try {
      await Promise.all(publicIdsToDelete.map((id) => deleteImage(id)));
    } catch (err) {
      console.error("Lỗi dọn dẹp ảnh trên Cloudinary khi xóa event:", err);
    }
  }

  // Xóa trong database (Cascade delete tự động xóa EventParticipant, EventMoment, ActiveSession)
  await prisma.event.delete({
    where: { id: eventId },
  });

  return { success: true };
};

// 4. Lấy danh sách sự kiện
export const getEvents = async (filters = {}) => {
  const {
    status,
    isFeaturedBanner,
    search,
    page = 1,
    limit = 10,
    showAll = false,
  } = filters;

  const where = {};
  if (status) {
    where.status = status;
  } else if (!showAll) {
    // Default: only return active events for public/mobile consumers
    // Admin users with showAll=true can see all statuses
    where.status = "active";
    // Loại trừ sự kiện đã kết thúc (endDate < hôm nay)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    where.endDate = { gte: today };
  }

  if (isFeaturedBanner !== undefined) {
    where.isFeaturedBanner = isFeaturedBanner === "true" || isFeaturedBanner === true;
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const pageNum = Math.max(toInt(page, 1), 1);
  const limitNum = Math.min(Math.max(toInt(limit, 10), 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        startDate: true,
        endDate: true,
        location: true,
        maxParticipants: true,
        status: true,
        isFeaturedBanner: true,
        totalCheckIns: true,
        broadcastNotice: true,
        tripId: true,
        trip: {
          select: {
            id: true,
            totalDays: true,
            destinations: {
              orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
              select: {
                id: true,
                placeId: true,
                dayNumber: true,
                order: true,
                place: {
                  select: {
                    id: true,
                    name: true,
                    latitude: true,
                    longitude: true,
                    thumbnail: true,
                  },
                },
              },
            },
          },
        },
        createdAt: true,
        _count: {
          select: {
            participants: true,
          },
        },
      },
      // Public: sắp xếp theo ngày bắt đầu tăng dần (sự kiện sắp diễn ra lên trước)
      // Admin (showAll): giữ nguyên theo createdAt để dễ quản lý
      orderBy: showAll
        ? { createdAt: "desc" }
        : [{ startDate: "asc" }, { createdAt: "desc" }],
      skip,
      take: limitNum,
    }),
    prisma.event.count({ where }),
  ]);

  return {
    data: events,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// 5. Lấy chi tiết sự kiện
const getEventByIdLegacy = async (eventId, userId = null) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      trip: {
        include: {
          destinations: {
            orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
            include: {
              place: {
                select: {
                  id: true,
                  name: true,
                  latitude: true,
                  longitude: true,
                  address: true,
                  thumbnail: true,
                  ratingAvg: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          participants: true,
          moments: true,
        },
      },
      moments: {
        select: {
          placeId: true,
          userId: true,
        },
      },
    },
  });

  if (!event) {
    throw new ServiceError(
      ERROR_CODES.NOT_FOUND,
      "Không tìm thấy sự kiện",
      404
    );
  }

  // 1. Thống kê active companion counts trên từng chặng (chỉ đếm updatedAt trong 5 phút trở lại)
  const activeThreshold = new Date(Date.now() - 5 * 60 * 1000);
  const activeSessions = await prisma.activeSession.findMany({
    where: {
      eventId: eventId,
      updatedAt: { gte: activeThreshold },
    },
    select: {
      placeId: true,
    },
  });
  const companionSummary = buildActiveCompanionSummary(activeSessions);

  // Tạo map đếm người online từng placeId
  const chặngCompanionCounts = {};
  activeSessions.forEach((s) => {
    chặngCompanionCounts[s.placeId] = (chặngCompanionCounts[s.placeId] || 0) + 1;
  });

  // 2. Gắn số lượng người online vào từng địa điểm trong lịch trình
  if (event.trip && event.trip.destinations) {
    event.trip.destinations = event.trip.destinations.map((dest) => ({
      ...dest,
      activeCompanionCount: chặngCompanionCounts[dest.placeId] || 0,
    }));
  }

  // 3. Tính tổng số lượng companion online trong sự kiện
  const totalActiveCompanionCount = Object.values(chặngCompanionCounts).reduce((acc, curr) => acc + curr, 0);

  // 4. Check xem user hiện tại đã join chưa
  if (event.trip && event.trip.destinations) {
    const checkInSummary = buildEventCheckInSummary({
      destinations: event.trip.destinations,
      moments: event.moments,
      userId,
    });

    event.trip.destinations = event.trip.destinations.map((dest) => ({
      ...dest,
      checkInCount: checkInSummary.byPlace[dest.placeId]?.totalCheckIns || 0,
      checkedInByMe: checkInSummary.byPlace[dest.placeId]?.checkedInByMe || false,
    }));
    event.myCheckedInPlaceIds = checkInSummary.myCheckedInPlaceIds;
    event.checkInSummary = checkInSummary.personal;
    event.checkInByPlace = checkInSummary.byPlace;
  } else {
    event.myCheckedInPlaceIds = [];
    event.checkInSummary = {
      checkedInCount: 0,
      totalDestinations: 0,
      progressPercent: 0,
    };
    event.checkInByPlace = {};
  }

  let isJoined = false;
  if (userId) {
    const participant = await prisma.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: userId,
        },
      },
    });
    isJoined = !!participant;
  }

  return {
    ...event,
    moments: undefined,
    totalActiveCompanionCount,
    activeCompanionSummary: cháº·ngCompanionCounts,
    isJoined,
  };
};

// 6. Tham gia sự kiện + Nhân bản Trip mẫu
export const getEventById = async (eventId, userId = null) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      trip: {
        include: {
          destinations: {
            orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
            include: {
              place: {
                select: {
                  id: true,
                  name: true,
                  latitude: true,
                  longitude: true,
                  address: true,
                  thumbnail: true,
                  ratingAvg: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          participants: true,
          moments: true,
        },
      },
      moments: {
        select: {
          placeId: true,
          userId: true,
        },
      },
    },
  });

  if (!event) {
    throw new ServiceError(
      ERROR_CODES.NOT_FOUND,
      "Khong tim thay su kien",
      404
    );
  }

  const activeThreshold = new Date(Date.now() - 5 * 60 * 1000);
  const activeSessions = await prisma.activeSession.findMany({
    where: {
      eventId,
      updatedAt: { gte: activeThreshold },
    },
    select: {
      placeId: true,
    },
  });
  const companionSummary = buildActiveCompanionSummary(activeSessions);

  if (event.trip?.destinations) {
    const checkInSummary = buildEventCheckInSummary({
      destinations: event.trip.destinations,
      moments: event.moments,
      userId,
    });

    event.trip.destinations = event.trip.destinations.map((dest) => ({
      ...dest,
      activeCompanionCount: companionSummary.byPlace[dest.placeId] || 0,
      checkInCount: checkInSummary.byPlace[dest.placeId]?.totalCheckIns || 0,
      checkedInByMe: checkInSummary.byPlace[dest.placeId]?.checkedInByMe || false,
    }));
    event.myCheckedInPlaceIds = checkInSummary.myCheckedInPlaceIds;
    event.checkInSummary = checkInSummary.personal;
    event.checkInByPlace = checkInSummary.byPlace;
  } else {
    event.myCheckedInPlaceIds = [];
    event.checkInSummary = {
      checkedInCount: 0,
      totalDestinations: 0,
      progressPercent: 0,
    };
    event.checkInByPlace = {};
  }

  let isJoined = false;
  if (userId) {
    const participant = await prisma.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });
    isJoined = !!participant;
  }

  return {
    ...event,
    moments: undefined,
    totalActiveCompanionCount: companionSummary.total,
    activeCompanionSummary: companionSummary.byPlace,
    isJoined,
  };
};

export const joinEvent = async (eventId, userId) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      thumbnail: true,
      tripId: true,
      maxParticipants: true,
      _count: {
        select: {
          participants: true,
        },
      },
    },
  });

  if (!event) {
    throw new ServiceError(
      ERROR_CODES.NOT_FOUND,
      "Sự kiện không tồn tại",
      404
    );
  }

  // Kiểm tra giới hạn số người tham gia nếu có cấu hình
  if (event.maxParticipants && event._count.participants >= event.maxParticipants) {
    throw new ServiceError(
      ERROR_CODES.VALIDATION_ERROR,
      "Sự kiện đã đạt số người tham gia tối đa",
      400
    );
  }

  // Check xem đã tham gia chưa
  const existingParticipant = await prisma.eventParticipant.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
  });

  if (existingParticipant) {
    throw new ServiceError(
      ERROR_CODES.EXISTED,
      "Bạn đã tham gia sự kiện này rồi",
      400
    );
  }

  // Bắt đầu transaction để tham gia và clone Trip
  const result = await prisma.$transaction(async (tx) => {
    // 1. Thêm vào bảng EventParticipant
    await tx.eventParticipant.create({
      data: {
        eventId,
        userId,
      },
    });

    // 2. Clone Trip mẫu
    let clonedTrip = null;
    if (event.tripId) {
      const tripSample = await tx.trip.findUnique({
        where: { id: event.tripId },
        include: {
          destinations: {
            orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
            include: { place: { select: EVENT_TRIP_PLACE_SELECT } },
          },
        },
      });

      if (tripSample) {
        const tripPlanSample = await tx.tripPlan.findFirst({
          where: {
            userId: tripSample.userId,
            metadata: { path: ["legacyTripId"], equals: event.tripId },
          },
          include: {
            stops: {
              orderBy: [{ dayNumber: "asc" }, { sequence: "asc" }],
              include: { place: { select: EVENT_TRIP_PLACE_SELECT } },
            },
          },
        });

        // Tạo Trip mới cho User
        clonedTrip = await tx.trip.create({
          data: {
            userId: userId,
            title: `[Sự kiện] ${tripSample.title}`,
            description: tripSample.description || `Lịch trình được sao chép từ sự kiện "${event.title}"`,
            thumbnail: resolveTripCloneThumbnail({
              event,
              tripSample,
              tripPlan: tripPlanSample,
            }),
            startDate: tripSample.startDate,
            endDate: tripSample.endDate,
            totalDays: tripSample.totalDays,
            totalDistance: tripSample.totalDistance,
            estimatedCost: tripSample.estimatedCost,
            travelStyle: tripSample.travelStyle,
            groupSize: 1,
            isAiGenerated: false,
            status: "upcoming", // Trạng thái mặc định cho trip tham gia sự kiện
            isPublic: false,
          },
        });

        // Tạo các TripDestination tương ứng
        const cloneRows = buildTripDestinationCloneRows({
          tripId: clonedTrip.id,
          destinations: tripSample.destinations,
          stops: tripPlanSample?.stops,
        });

        if (cloneRows.length > 0) {
          await tx.tripDestination.createMany({
            data: cloneRows,
          });
        }

        // Tăng cloneCount của Trip gốc
        await tx.trip.update({
          where: { id: event.tripId },
          data: {
            cloneCount: { increment: 1 },
          },
        });

        clonedTrip = await tx.trip.findUnique({
          where: { id: clonedTrip.id },
          include: {
            destinations: {
              orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
              include: { place: { select: EVENT_TRIP_PLACE_SELECT } },
            },
          },
        });
      }
    }

    return {
      clonedTrip,
    };
  });

  return {
    message: "Tham gia sự kiện thành công",
    clonedTrip: result.clonedTrip,
  };
};

// 7. Ping vị trí ẩn danh định kỳ trong chặng
export const pingEvent = async (eventId, placeId, userId, location = {}) => {
  // Check xem có thuộc sự kiện đó không và user đã tham gia chưa
  const participant = await prisma.eventParticipant.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
  });

  if (!participant) {
    throw new ServiceError(
      ERROR_CODES.FORBIDDEN,
      "Bạn phải tham gia sự kiện trước khi cập nhật vị trí chặng",
      403
    );
  }

  // Thực hiện upsert ActiveSession. Vì @@unique([eventId, userId]), record sẽ tự động update
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      trip: {
        select: {
          destinations: {
            select: {
              placeId: true,
              place: { select: { latitude: true, longitude: true } },
            },
          },
        },
      },
    },
  });

  validateEventCheckInTarget({
    destinations: event?.trip?.destinations || [],
    placeId,
    latitude: location.latitude,
    longitude: location.longitude,
    radiusMeters: 500,
  });

  const session = await prisma.activeSession.upsert({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
    update: {
      placeId,
      updatedAt: new Date(),
    },
    create: {
      eventId,
      placeId,
      userId,
    },
  });

  return session;
};

// 8. Tải ảnh khoảnh khắc 1:1 check-in (Viễn cảnh 1)
export const createMoment = async (eventId, userId, data) => {
  const { placeId, imageUrl, imagePublicId, latitude, longitude } = data;

  // Kiểm tra tham gia sự kiện
  const participant = await prisma.eventParticipant.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
  });

  if (!participant) {
    throw new ServiceError(
      ERROR_CODES.FORBIDDEN,
      "Bạn phải tham gia sự kiện trước khi đăng tải khoảnh khắc",
      403
    );
  }

  // Tự động upload ảnh moment nếu gửi base64 từ client
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      trip: {
        select: {
          destinations: {
            select: {
              placeId: true,
              place: { select: { latitude: true, longitude: true } },
            },
          },
        },
      },
    },
  });

  validateEventCheckInTarget({
    destinations: event?.trip?.destinations || [],
    placeId,
    latitude,
    longitude,
  });

  let finalImageUrl = imageUrl;
  let finalImagePublicId = imagePublicId;

  if (imageUrl && imageUrl.startsWith("data:image/")) {
    try {
      const uploadResult = await uploadPlaceImage(imageUrl, "didaugio/event_moments");
      finalImageUrl = uploadResult.secureUrl;
      finalImagePublicId = uploadResult.publicId;
    } catch (err) {
      console.error("Lỗi upload moment lên Cloudinary:", err);
      throw new ServiceError(
        ERROR_CODES.SERVER_ERROR,
        "Lỗi upload ảnh lên Cloudinary",
        500
      );
    }
  }

  // Kiểm tra xem đã đăng moment tại placeId này trong event này chưa (Giới hạn tối đa 1 ảnh/chặng/người)
  const existingMoment = await prisma.eventMoment.findUnique({
    where: {
      eventId_placeId_userId: {
        eventId,
        placeId,
        userId,
      },
    },
  });

  if (existingMoment) {
    // Nếu đã đăng, xóa ảnh cũ trên Cloudinary trước khi ghi đè
    if (existingMoment.imagePublicId && existingMoment.imagePublicId !== finalImagePublicId) {
      try {
        await deleteImage(existingMoment.imagePublicId);
      } catch (err) {
        console.error("Lỗi xóa moment cũ trên Cloudinary:", err);
      }
    }
  }

  // Bắt đầu transaction để tạo moment và tăng tiến trình check-in cộng đồng (Viễn cảnh 2)
  const moment = await prisma.$transaction(async (tx) => {
    // 1. Kiểm tra moment đã tồn tại chưa
    const existingMoment = await tx.eventMoment.findUnique({
      where: {
        eventId_placeId_userId: {
          eventId,
          placeId,
          userId,
        },
      },
      select: { id: true },
    });

    // 2. Lưu EventMoment
    const newMoment = await tx.eventMoment.upsert({
      where: {
        eventId_placeId_userId: {
          eventId,
          placeId,
          userId,
        },
      },
      update: {
        imageUrl: finalImageUrl,
        imagePublicId: finalImagePublicId,
        createdAt: new Date(),
      },
      create: {
        eventId,
        placeId,
        userId,
        imageUrl: finalImageUrl,
        imagePublicId: finalImagePublicId,
      },
    });

    // 3. Chỉ tăng totalCheckIns nếu đây là moment mới (không phải update)
    if (!existingMoment) {
      await tx.event.update({
        where: { id: eventId },
        data: {
          totalCheckIns: { increment: 1 },
        },
      });
    }

    return newMoment;
  });

  return moment;
};

// 9. Lấy danh sách ảnh khoảnh khắc ẩn danh của chặng (Viễn cảnh 1)
export const getMoments = async (eventId, placeId, query = {}) => {
  const { page = 1, limit = 20 } = query;

  const pageNum = Math.max(toInt(page, 1), 1);
  const limitNum = Math.min(Math.max(toInt(limit, 20), 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const where = { eventId };
  if (placeId != null && Number.isFinite(placeId)) {
    where.placeId = placeId;
  }

  const [moments, total] = await Promise.all([
    prisma.eventMoment.findMany({
      where,
      select: {
        id: true,
        imageUrl: true,
        createdAt: true,
        // Không select userId để đảm bảo ẩn danh cho Viễn cảnh 1
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limitNum,
    }),
    prisma.eventMoment.count({ where }),
  ]);

  return {
    data: moments,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// 10. Xóa ảnh khoảnh khắc (Admin hoặc chính user)
export const deleteMoment = async (momentId, userId, isAdmin = false) => {
  const moment = await prisma.eventMoment.findUnique({
    where: { id: momentId },
  });

  if (!moment) {
    throw new ServiceError(
      ERROR_CODES.NOT_FOUND,
      "Không tìm thấy ảnh khoảnh khắc",
      404
    );
  }

  // Quyền: Phải là Admin hoặc chính chủ sở hữu
  if (moment.userId !== userId && !isAdmin) {
    throw new ServiceError(
      ERROR_CODES.FORBIDDEN,
      "Bạn không có quyền xóa khoảnh khắc này",
      403
    );
  }

  // Xóa ảnh vật lý trên Cloudinary
  if (moment.imagePublicId) {
    try {
      await deleteImage(moment.imagePublicId);
    } catch (err) {
      console.error("Lỗi xóa moment trên Cloudinary:", err);
    }
  }

  // Xóa trong database
  await prisma.eventMoment.delete({
    where: { id: momentId },
  });

  return { success: true };
};

// 11. Đăng thông báo khẩn cấp từ BTC (Viễn cảnh 4)
export const updateBroadcast = async (eventId, broadcastNotice) => {
  const existingEvent = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!existingEvent) {
    throw new ServiceError(
      ERROR_CODES.NOT_FOUND,
      "Không tìm thấy sự kiện",
      404
    );
  }

  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: {
      broadcastNotice: broadcastNotice || null,
    },
    select: {
      id: true,
      title: true,
      broadcastNotice: true,
    },
  });

  return updatedEvent;
};

export const DEFAULT_CHECK_IN_RADIUS_M = 75;

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const calculateDistanceMeters = (lat1, lng1, lat2, lng2) => {
  const aLat = toNumber(lat1);
  const aLng = toNumber(lng1);
  const bLat = toNumber(lat2);
  const bLng = toNumber(lng2);
  if (aLat === null || aLng === null || bLat === null || bLng === null) {
    return null;
  }

  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusM = 6371000;
  const deltaLat = toRadians(bLat - aLat);
  const deltaLng = toRadians(bLng - aLng);
  const calc =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(aLat)) *
      Math.cos(toRadians(bLat)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  return earthRadiusM * 2 * Math.atan2(Math.sqrt(calc), Math.sqrt(1 - calc));
};

const normalizePositiveInt = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const buildActiveCompanionSummary = (activeSessions = []) => {
  const byPlace = {};

  activeSessions.forEach((session) => {
    const placeId = normalizePositiveInt(session?.placeId);
    if (!placeId) return;
    byPlace[placeId] = (byPlace[placeId] || 0) + 1;
  });

  return {
    byPlace,
    total: Object.values(byPlace).reduce((acc, curr) => acc + curr, 0),
  };
};

const resolvePlaceImage = (place) => {
  const firstImage = Array.isArray(place?.images) ? place.images[0] : null;
  return (
    place?.thumbnail ||
    firstImage?.secureUrl ||
    firstImage?.thumbnailUrl ||
    firstImage?.imageData ||
    null
  );
};

export const resolveTripCloneThumbnail = ({
  event = null,
  tripSample = null,
  tripPlan = null,
} = {}) => {
  if (event?.thumbnail) return event.thumbnail;
  if (tripSample?.thumbnail) return tripSample.thumbnail;
  if (tripPlan?.coverImage) return tripPlan.coverImage;

  const legacyDestination = Array.isArray(tripSample?.destinations)
    ? tripSample.destinations.find((dest) => resolvePlaceImage(dest?.place))
    : null;
  if (legacyDestination) return resolvePlaceImage(legacyDestination.place);

  const planStop = Array.isArray(tripPlan?.stops)
    ? tripPlan.stops.find((stop) => resolvePlaceImage(stop?.place))
    : null;
  return planStop ? resolvePlaceImage(planStop.place) : null;
};

const toKm = (meters) => {
  const value = Number(meters);
  if (!Number.isFinite(value) || value < 0) return null;
  return Number((value / 1000).toFixed(2));
};

export const buildTripDestinationCloneRows = ({
  tripId,
  destinations = [],
  stops = [],
} = {}) => {
  const safeTripId = normalizePositiveInt(tripId);
  if (!safeTripId) return [];

  if (Array.isArray(destinations) && destinations.length > 0) {
    return destinations.map((dest) => ({
      tripId: safeTripId,
      placeId: dest.placeId,
      dayNumber: dest.dayNumber,
      order: dest.order,
      startTime: dest.startTime,
      endTime: dest.endTime,
      durationMinutes: dest.durationMinutes,
      note: dest.note,
      transportToNext: dest.transportToNext,
      distanceToNext: dest.distanceToNext,
      estimatedCost: dest.estimatedCost,
      status: "planned",
    }));
  }

  return (Array.isArray(stops) ? stops : []).map((stop) => ({
    tripId: safeTripId,
    placeId: stop.placeId,
    dayNumber: stop.dayNumber,
    order: stop.sequence ?? stop.order ?? 1,
    startTime: stop.arrivalTime ?? stop.startTime ?? null,
    endTime: stop.departureTime ?? stop.endTime ?? null,
    durationMinutes: stop.durationMinutes,
    note: stop.note,
    transportToNext: stop.transportToNext,
    distanceToNext:
      stop.routeDistanceM == null
        ? stop.distanceToNext ?? null
        : toKm(stop.routeDistanceM),
    estimatedCost: stop.estimatedCost,
    status: "planned",
  }));
};

export const buildEventCheckInSummary = ({
  destinations = [],
  moments = [],
  userId = null,
} = {}) => {
  const normalizedUserId = normalizePositiveInt(userId);
  const routePlaceIds = destinations
    .map((destination) => normalizePositiveInt(destination?.placeId ?? destination?.place?.id))
    .filter(Boolean);
  const routePlaceIdSet = new Set(routePlaceIds);
  const myCheckedInPlaceIdSet = new Set();
  const counts = {};

  for (const placeId of routePlaceIds) {
    counts[placeId] = { placeId, totalCheckIns: 0, checkedInByMe: false };
  }

  for (const moment of moments) {
    const placeId = normalizePositiveInt(moment?.placeId);
    if (!placeId || !routePlaceIdSet.has(placeId)) continue;
    counts[placeId] = counts[placeId] || {
      placeId,
      totalCheckIns: 0,
      checkedInByMe: false,
    };
    counts[placeId].totalCheckIns += 1;

    if (normalizedUserId && normalizePositiveInt(moment?.userId) === normalizedUserId) {
      counts[placeId].checkedInByMe = true;
      myCheckedInPlaceIdSet.add(placeId);
    }
  }

  const myCheckedInPlaceIds = Array.from(myCheckedInPlaceIdSet).sort((a, b) => a - b);
  const totalDestinations = routePlaceIds.length;
  const checkedInCount = myCheckedInPlaceIds.length;

  return {
    myCheckedInPlaceIds,
    byPlace: counts,
    personal: {
      checkedInCount,
      totalDestinations,
      progressPercent:
        totalDestinations > 0
          ? Math.round((checkedInCount / totalDestinations) * 100)
          : 0,
    },
  };
};

export const validateEventCheckInTarget = ({
  destinations = [],
  placeId,
  latitude = null,
  longitude = null,
  radiusMeters = DEFAULT_CHECK_IN_RADIUS_M,
} = {}) => {
  const targetPlaceId = normalizePositiveInt(placeId);
  const destination = destinations.find(
    (item) => normalizePositiveInt(item?.placeId ?? item?.place?.id) === targetPlaceId,
  );

  if (!destination) {
    throw new ServiceError(
      "Dia diem check-in khong thuoc su kien",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const currentLat = toNumber(latitude);
  const currentLng = toNumber(longitude);
  if (currentLat === null || currentLng === null) {
    return { destination, distanceMeters: null, withinRadius: null };
  }

  const distance = calculateDistanceMeters(
    currentLat,
    currentLng,
    destination?.place?.latitude,
    destination?.place?.longitude,
  );

  if (distance !== null && distance > radiusMeters) {
    throw new ServiceError(
      `Ban dang qua xa diem check-in (${Math.round(distance)}m)`,
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  return { destination, distanceMeters: distance, withinRadius: distance !== null };
};
