import * as reviewService from "../services/reviewService.js";

export const getAll = async (req, res, next) => {
  try {
    const result = await reviewService.getAll(
      req.query,
      req.user.userId,
      req.user.roleId,
    );
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách đánh giá thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const review = await reviewService.getById(req.params.id);
    res.json({
      success: true,
      data: review,
      message: "Lấy chi tiết đánh giá thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const reply = async (req, res, next) => {
  try {
    const replyData = await reviewService.reply(
      req.params.id,
      req.body.content,
      req.user.userId,
    );
    res.status(201).json({
      success: true,
      message: "Phản hồi đánh giá thành công",
      data: replyData,
    });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const stats = await reviewService.getStats(
      req.user.userId,
      req.user.roleId,
    );
    res.json({
      success: true,
      data: stats,
      message: "Lấy thống kê đánh giá thành công",
    });
  } catch (error) {
    next(error);
  }
};
