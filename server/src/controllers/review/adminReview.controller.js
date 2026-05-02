import * as adminReviewService from "../../services/review/adminReview.service.js";

export const getAll = async (req, res, next) => {
  try {
    const result = await adminReviewService.getAll(req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách đánh giá hệ thống thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const stats = await adminReviewService.getStats();
    res.json({
      success: true,
      data: stats,
      message: "Lấy thống kê moderation đánh giá thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const moderateReview = async (req, res, next) => {
  try {
    const review = await adminReviewService.moderateReview(
      req.params.id,
      req.body,
      req.user.userId,
    );
    res.json({
      success: true,
      data: review,
      message:
        req.body.status === "hidden"
          ? "Đã ẩn đánh giá"
          : "Đã cập nhật trạng thái đánh giá",
    });
  } catch (error) {
    next(error);
  }
};

export const moderateReply = async (req, res, next) => {
  try {
    const reply = await adminReviewService.moderateReply(
      req.params.replyId,
      req.body,
      req.user.userId,
    );
    res.json({
      success: true,
      data: reply,
      message:
        req.body.status === "hidden"
          ? "Đã ẩn phản hồi"
          : "Đã hiển thị lại phản hồi",
    });
  } catch (error) {
    next(error);
  }
};
