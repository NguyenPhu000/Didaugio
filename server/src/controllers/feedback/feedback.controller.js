import appService from "../../services/app/app.service.js";

const getUserId = (req) => req.user?.userId || req.user?.id || null;

export const submitFeedback = async (req, res, next) => {
  try {
    const data = await appService.submitFeedback({
      userId: getUserId(req),
      reportType: req.body.reportType,
      title: req.body.title,
      content: req.body.content,
      targetType: req.body.targetType,
      targetId: req.body.targetId,
      screenshot: req.body.screenshot,
    });

    res.status(201).json({
      success: true,
      data,
      message: "Gửi phản hồi thành công",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  submitFeedback,
};
