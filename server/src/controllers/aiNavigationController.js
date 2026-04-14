import aiNavigationService from "../services/aiNavigationService.js";

export const handleNavigate = async (req, res, next) => {
  try {
    const data = await aiNavigationService.getNavigationAdvice(req.body || {});

    res.json({
      success: true,
      data,
      message: "Phân tích điều hướng thành công",
    });
  } catch (error) {
    next(error);
  }
};
