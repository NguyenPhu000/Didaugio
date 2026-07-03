import prisma from "../../config/prismaClient.js";
import ServiceError from "../../utils/serviceError.js";
import { ERROR_CODES } from "../../config/messages.js";
import { deleteImage } from "../../utils/cloudinaryService.js";
import { uploadPlaceImage } from "../media/media.service.js";

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
    totalActiveCompanionCount,
    isJoined,
  };
};

// 6. Tham gia sự kiện + Nhân bản Trip mẫu
export const joinEvent = async (eventId, userId) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
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
          destinations: true,
        },
      });

      if (tripSample) {
        // Tạo Trip mới cho User
        clonedTrip = await tx.trip.create({
          data: {
            userId: userId,
            title: `[Sự kiện] ${tripSample.title}`,
            description: tripSample.description || `Lịch trình được sao chép từ sự kiện "${event.title}"`,
            thumbnail: tripSample.thumbnail,
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
        if (tripSample.destinations && tripSample.destinations.length > 0) {
          await tx.tripDestination.createMany({
            data: tripSample.destinations.map((dest) => ({
              tripId: clonedTrip.id,
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
            })),
          });
        }

        // Tăng cloneCount của Trip gốc
        await tx.trip.update({
          where: { id: event.tripId },
          data: {
            cloneCount: { increment: 1 },
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
export const pingEvent = async (eventId, placeId, userId) => {
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
  const { placeId, imageUrl, imagePublicId } = data;

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
