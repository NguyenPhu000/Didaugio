import tripService from "../../services/trip/trip.service.js";
import tripPlanService from "../../services/trip/tripPlan.service.js";
import * as bookingService from "../../services/booking/booking.service.js";
import tripExecutionService from "../../services/trip/tripExecution.service.js";
import { ERROR_CODES } from "../../config/messages.js";

const getUserId = (req) => req.user?.userId || req.user?.id || null;

const parseId = (raw) => {
  const id = parseInt(raw, 10);
  return Number.isNaN(id) ? null : id;
};

const markDeprecated = (res, replacementPath) => {
  res.set("Deprecation", "true");
  res.set("Warning", `299 - "Deprecated API; use ${replacementPath}"`);
  res.set("Link", `<${replacementPath}>; rel="successor-version"`);
};

export const generateTrip = async (req, res, next) => {
  try {
    const result = await tripService.generateAndSaveTrip(
      getUserId(req),
      req.body || {},
    );
    const isPreview = result?.previewOnly === true;

    res.status(isPreview ? 200 : 201).json({
      success: true,
      data: result,
      message: isPreview
        ? "Da goi y dia diem, hay chon va chot truoc khi tao chuyen di"
        : "Tao chuyen di thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

export const createTrip = async (req, res, next) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      totalDays,
      travelStyle,
      groupSize,
      status,
    } = req.body;

    const ALLOWED_INITIAL_STATUSES = ["planned"];
    const finalStatus = ALLOWED_INITIAL_STATUSES.includes(status) ? status : "planned";

    const trip = await tripService.createTrip(getUserId(req), {
      title,
      description,
      startDate,
      endDate,
      totalDays,
      travelStyle,
      groupSize,
      status: finalStatus,
    });
    res
      .status(201)
      .json({ success: true, data: trip, message: "Tao chuyen di thanh cong" });
  } catch (error) {
    next(error);
  }
};

export const getMyTrips = async (req, res, next) => {
  try {
    const result = await tripService.getMyTrips(getUserId(req), req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lay danh sach chuyen di thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

export const getTripDetail = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json({ success: false, data: null, message: "ID khong hop le" });
    }
    const trip =
      (await tripPlanService.getTripDetail({
        tripId: id,
        actorUserId: getUserId(req),
      })) || (await tripService.getTripDetail(id, getUserId(req)));
    if (!trip) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Khong tim thay chuyen di",
      });
    }
    res.json({
      success: true,
      data: trip,
      message: "Lay chi tiet chuyen di thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

export const updateTrip = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json({ success: false, data: null, message: "ID khong hop le" });
    }
    const trip = await tripService.updateTrip(id, getUserId(req), req.body);
    res.json({
      success: true,
      data: trip,
      message: "Cap nhat chuyen di thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTrip = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json({ success: false, data: null, message: "ID khong hop le" });
    }
    await tripService.deleteTrip(id, getUserId(req));
    res.json({
      success: true,
      data: null,
      message: "Xoa chuyen di thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

export const duplicateTrip = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json({ success: false, data: null, message: "ID khong hop le" });
    }
    const trip = await tripService.duplicateTrip(id, getUserId(req));
    res.status(201).json({
      success: true,
      data: trip,
      message: "Nhan ban chuyen di thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

export const addDestination = async (req, res, next) => {
  try {
    const tripId = parseId(req.params.id);
    if (!tripId) {
      return res
        .status(400)
        .json({ success: false, data: null, message: "ID khong hop le" });
    }
    const dest = await tripPlanService.addClientDestination(tripId, getUserId(req), req.body);
    res.status(201).json({
      success: true,
      data: dest,
      message: "Da them dia diem vao lich trinh",
    });
  } catch (error) {
    next(error);
  }
};

export const removeDestination = async (req, res, next) => {
  try {
    const tripId = parseId(req.params.id);
    const destId = parseId(req.params.destId);
    if (!tripId || !destId) {
      return res
        .status(400)
        .json({ success: false, data: null, message: "ID khong hop le" });
    }
    await tripPlanService.removeClientDestination({
      tripId,
      destinationId: destId,
      actorUserId: getUserId(req),
    });
    res.json({
      success: true,
      data: null,
      message: "Da xoa dia diem khoi lich trinh",
    });
  } catch (error) {
    next(error);
  }
};

export const reorderDestinations = async (req, res, next) => {
  try {
    markDeprecated(res, "/api/profile/trips/:tripId/stops/reorder");
    const tripId = parseId(req.params.id);
    if (!tripId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID khong hop le",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }
    const { dayNumber, orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Danh sach sap xep khong hop le",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }
    const destinations = await tripPlanService.reorderClientDestinations({
      tripId,
      actorUserId: getUserId(req),
      dayNumber,
      orderedIds,
    });
    res.json({
      success: true,
      data: destinations,
      message: "Da cap nhat thu tu lich trinh",
    });
  } catch (error) {
    next(error);
  }
};

export const linkBookingToTripPlan = async (req, res, next) => {
  try {
    const tripId = parseId(req.params.tripId);
    const bookingId = parseId(req.params.bookingId);
    if (!tripId || !bookingId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID khong hop le",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const result = await tripPlanService.linkBookingToTrip({
      bookingId,
      tripId,
      actorUserId: getUserId(req),
      ...req.body,
    });

    return res.json({
      success: true,
      data: result,
      message: "Lien ket booking vao chuyen di thanh cong",
      errorCode: null,
    });
  } catch (error) {
    next(error);
  }
};

export const reorderTripStops = async (req, res, next) => {
  try {
    const tripId = parseId(req.params.tripId);
    if (!tripId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID khong hop le",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const result = await tripPlanService.reorderDestinations({
      tripId,
      actorUserId: getUserId(req),
      updates: req.body.updates,
    });

    return res.json({
      success: true,
      data: result,
      message: "Sap xep lich trinh thanh cong",
      errorCode: null,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDestination = async (req, res, next) => {
  try {
    const tripId = parseId(req.params.id);
    const destId = parseId(req.params.destId);
    if (!tripId || !destId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID khong hop le",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }
    const dest = await tripPlanService.updateClientDestination({
      tripId,
      destinationId: destId,
      actorUserId: getUserId(req),
      data: req.body,
    });
    res.json({ success: true, data: dest, message: "Da cap nhat dia diem" });
  } catch (error) {
    next(error);
  }
};

export const moveDestination = async (req, res, next) => {
  try {
    markDeprecated(res, "/api/profile/trips/:tripId/stops/reorder");
    const tripId = parseId(req.params.id);
    const destId = parseId(req.params.destId);
    if (!tripId || !destId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID khong hop le",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }
    const { newDayNumber, newOrder, startTime, endTime, note } = req.body;
    const dest = await tripPlanService.moveClientDestination({
      tripId,
      actorUserId: getUserId(req),
      destinationId: destId,
      newDayNumber,
      newOrder,
      startTime,
      endTime,
      note,
    });
    res.json({
      success: true,
      data: dest,
      message: "Da chuyen dia diem sang ngay khac",
    });
  } catch (error) {
    next(error);
  }
};

export const moveTripStop = async (req, res, next) => {
  try {
    const tripId = parseId(req.params.tripId);
    const stopId = parseId(req.params.stopId);
    if (!tripId || !stopId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID khong hop le",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const { newDayNumber, newOrder, startTime, endTime, note } = req.body;
    const dest = await tripPlanService.moveClientDestination({
      tripId,
      actorUserId: getUserId(req),
      destinationId: stopId,
      newDayNumber,
      newOrder,
      startTime,
      endTime,
      note,
    });

    res.json({
      success: true,
      data: dest,
      message: "Da chuyen diem dung sang ngay khac",
      errorCode: null,
    });
  } catch (error) {
    next(error);
  }
};

export const createTripShare = async (req, res, next) => {
  try {
    const tripId = parseId(req.params.id);
    if (!tripId) {
      return res
        .status(400)
        .json({ success: false, data: null, message: "ID khong hop le" });
    }
    const share = await tripService.createTripShare(
      tripId,
      getUserId(req),
      req.body,
    );
    res.status(201).json({
      success: true,
      data: share,
      message: "Tao link chia se thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

export const getTripShares = async (req, res, next) => {
  try {
    const tripId = parseId(req.params.id);
    if (!tripId) {
      return res
        .status(400)
        .json({ success: false, data: null, message: "ID khong hop le" });
    }
    const shares = await tripService.getTripShares(tripId, getUserId(req));
    res.json({
      success: true,
      data: shares,
      message: "Lay danh sach chia se thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

export const accessTripShare = async (req, res, next) => {
  try {
    const { shareCode } = req.params;
    const { password } = req.body || {};
    const result = await tripService.accessTripShare(shareCode, password);
    res.json({
      success: true,
      data: result,
      message: "Truy cap chuyen di thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTripShare = async (req, res, next) => {
  try {
    const shareId = parseId(req.params.shareId);
    if (!shareId) {
      return res
        .status(400)
        .json({ success: false, data: null, message: "ID khong hop le" });
    }
    await tripService.deleteTripShare(shareId, getUserId(req));
    res.json({
      success: true,
      data: null,
      message: "Xoa link chia se thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

export const linkMyBookingToTrip = async (req, res, next) => {
  try {
    markDeprecated(
      res,
      "/api/profile/trips/:tripId/bookings/:bookingId/link",
    );
    const bookingId = parseId(req.params.id);
    const tripId = parseId(req.body?.tripId);
    if (!bookingId || !tripId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID khong hop le",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const linkedTrip = await tripPlanService.linkBookingToTrip({
      bookingId,
      tripId,
      actorUserId: getUserId(req),
      attachMode: req.body?.attachMode,
      dateRangeMode: req.body?.dateRangeMode,
    });
    const booking = await bookingService.getMyBookingDetail(
      bookingId,
      getUserId(req),
    );

    res.json({
      success: true,
      data: {
        ...booking,
        linkedTrip,
      },
      message: "Lien ket booking vao trip thanh cong",
      errorCode: null,
    });
  } catch (error) {
    next(error);
  }
};

export const syncTripSession = async (req, res, next) => {
  try {
    const tripId = parseId(req.params.tripId);
    if (!tripId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID hanh trinh khong hop le",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const session = await tripExecutionService.upsertSession(
      getUserId(req),
      tripId,
      req.body,
    );

    res.json({
      success: true,
      data: session,
      message: "Dong bo trang thai phien di chuyen thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

export const getTripSession = async (req, res, next) => {
  try {
    const tripId = parseId(req.params.tripId);
    if (!tripId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID hanh trinh khong hop le",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const session = await tripExecutionService.getSession(
      getUserId(req),
      tripId,
    );

    res.json({
      success: true,
      data: session,
      message: "Lay thong tin phien di chuyen thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

export const endTripSession = async (req, res, next) => {
  try {
    const tripId = parseId(req.params.tripId);
    if (!tripId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID hanh trinh khong hop le",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const session = await tripExecutionService.endSession(
      getUserId(req),
      tripId,
      req.body?.status || "completed",
    );

    res.json({
      success: true,
      data: session,
      message: "Ket thuc phien di chuyen thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getMyTrips,
  generateTrip,
  createTrip,
  getTripDetail,
  updateTrip,
  deleteTrip,
  duplicateTrip,
  addDestination,
  removeDestination,
  reorderDestinations,
  linkBookingToTripPlan,
  reorderTripStops,
  updateDestination,
  moveDestination,
  moveTripStop,
  createTripShare,
  getTripShares,
  accessTripShare,
  deleteTripShare,
  linkMyBookingToTrip,
  syncTripSession,
  getTripSession,
  endTripSession,
};
