import { ROLES } from "../../config/constants.js";
import * as reviewService from "../../services/review/review.service.js";

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
    const businessId =
      req.user.roleId > ROLES.ADMIN ? req.activeBusiness?.id : undefined;
    const review = await reviewService.getById(req.params.id, { businessId });
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
    const businessId =  
      req.user.roleId > ROLES.ADMIN ? req.activeBusiness?.id : undefined;
    const replyData = await reviewService.reply(
      req.params.id,
      req.body.content,
      req.user.userId,
      { businessId },
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

export const updateReply = async (req, res, next) => {
  try {
    const updated = await reviewService.updateReply(
      req.params.replyId,
      req.body.content,
      req.user.userId,
    );
    res.json({
      success: true,
      data: updated,
      message: "Cập nhật phản hồi thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReply = async (req, res, next) => {
  try {
    await reviewService.deleteReply(req.params.replyId, req.user.userId);
    res.json({
      success: true,
      data: null,
      message: "Xóa phản hồi thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const moderateReply = async (req, res, next) => {
  try {
    const updated = await reviewService.moderateReply(
      req.params.replyId,
      req.body.status,
      req.user.userId,
    );
    res.json({
      success: true,
      data: updated,
      message:
        req.body.status === "hidden"
          ? "Đã ẩn phản hồi"
          : "Đã hiển thị lại phản hồi",
    });
  } catch (error) {
    next(error);
  }
};
