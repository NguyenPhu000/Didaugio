import * as reviewService from "../services/reviewService.js";

export const getAll = async (req, res) => {
  try {
    const result = await reviewService.getAll(
      req.query,
      req.user.userId,
      req.user.roleId,
    );
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const review = await reviewService.getById(req.params.id);
    res.json({ success: true, data: review });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const reply = async (req, res) => {
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
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await reviewService.getStats(req.user.userId, req.user.roleId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
