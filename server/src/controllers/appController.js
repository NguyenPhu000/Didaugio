import appService from "../services/appService.js";

const getUserId = (req) => req.user?.userId || req.user?.id || null;

export const getHome = async (req, res) => {
  try {
    const data = await appService.getHomeData(req.query);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in getHome:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Khong the lay du lieu trang chu",
    });
  }
};

export const searchPlaces = async (req, res) => {
  try {
    const result = await appService.searchPlaces(req.query);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("Error in searchPlaces:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || "Khong the tim kiem dia diem",
    });
  }
};

export const getPlaceDetail = async (req, res) => {
  try {
    const placeId = parseInt(req.params.id, 10);
    if (Number.isNaN(placeId)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID dia diem khong hop le",
      });
    }

    const data = await appService.getPlaceDetail(placeId, getUserId(req));
    if (!data) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Khong tim thay dia diem",
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in getPlaceDetail:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Khong the lay chi tiet dia diem",
    });
  }
};

export const getPlaceReviews = async (req, res) => {
  try {
    const placeId = parseInt(req.params.id, 10);
    if (Number.isNaN(placeId)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID dia diem khong hop le",
      });
    }

    const result = await appService.getPlaceReviews(placeId, req.query);
    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error in getPlaceReviews:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Khong the lay danh sach danh gia",
    });
  }
};

export const createReview = async (req, res) => {
  try {
    const placeId = parseInt(req.params.id, 10);
    if (Number.isNaN(placeId)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID dia diem khong hop le",
      });
    }

    const review = await appService.createOrUpdateReview(
      placeId,
      getUserId(req),
      req.body,
    );

    return res.status(201).json({
      success: true,
      data: review,
      message: "Gui danh gia thanh cong",
    });
  } catch (error) {
    console.error("Error in createReview:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      data: null,
      message: error.message || "Khong the gui danh gia",
    });
  }
};

export const getServices = async (req, res) => {
  try {
    const result = await appService.getServices(req.query);
    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error in getServices:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Khong the lay danh sach dich vu",
    });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const data = await appService.getMyProfileSummary(getUserId(req));
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in getMyProfile:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      data: null,
      message: error.message || "Khong the lay thong tin profile",
    });
  }
};

export const getMySavedPlaces = async (req, res) => {
  try {
    const result = await appService.getMySavedPlaces(getUserId(req), req.query);
    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error in getMySavedPlaces:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Khong the lay danh sach dia diem da luu",
    });
  }
};

export const savePlace = async (req, res) => {
  try {
    const placeId = parseInt(req.params.placeId, 10);
    if (Number.isNaN(placeId)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID dia diem khong hop le",
      });
    }

    const data = await appService.savePlace(
      getUserId(req),
      placeId,
      req.body?.note || null,
    );

    return res.status(201).json({
      success: true,
      data,
      message: "Da luu dia diem",
    });
  } catch (error) {
    console.error("Error in savePlace:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      data: null,
      message: error.message || "Khong the luu dia diem",
    });
  }
};

export const unsavePlace = async (req, res) => {
  try {
    const placeId = parseInt(req.params.placeId, 10);
    if (Number.isNaN(placeId)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID dia diem khong hop le",
      });
    }

    await appService.unsavePlace(getUserId(req), placeId);
    return res.json({
      success: true,
      data: null,
      message: "Da bo luu dia diem",
    });
  } catch (error) {
    console.error("Error in unsavePlace:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Khong the bo luu dia diem",
    });
  }
};

export const getMyTrips = async (req, res) => {
  try {
    const result = await appService.getMyTrips(getUserId(req), req.query);
    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error in getMyTrips:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Khong the lay danh sach hanh trinh",
    });
  }
};

export const generateTrip = async (req, res) => {
  try {
    const userId = getUserId(req);
    const preferences = req.body || {};
    const trip = await appService.generateAndSaveTrip(userId, preferences);
    return res.status(201).json({ success: true, data: trip });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Error in generateTrip:", error);
    return res.status(status).json({
      success: false,
      data: null,
      message: error.message || "Khong the tao lich trinh",
    });
  }
};

export const submitFeedback = async (req, res) => {
  try {
    const data = await appService.submitFeedback({
      userId: getUserId(req),
      reportType: req.body?.reportType,
      title: req.body?.title,
      content: req.body?.content,
      targetType: req.body?.targetType,
      targetId: req.body?.targetId,
      screenshot: req.body?.screenshot,
    });

    return res.status(201).json({
      success: true,
      data,
      message: "Gui phan hoi thanh cong",
    });
  } catch (error) {
    console.error("Error in submitFeedback:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      data: null,
      message: error.message || "Khong the gui phan hoi",
    });
  }
};

export default {
  getHome,
  searchPlaces,
  getPlaceDetail,
  getPlaceReviews,
  createReview,
  getServices,
  getMyProfile,
  getMySavedPlaces,
  savePlace,
  unsavePlace,
  getMyTrips,
  generateTrip,
  submitFeedback,
};
