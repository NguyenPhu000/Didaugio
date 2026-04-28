import navigationService from "../../modules/navigation/navigation.service.js";

export const handleNavigate = async (req, res, next) => {
  try {
    const data = await navigationService.recommendRoute(req.body || {});

    res.json({
      success: true,
      data,
      message: "Phân tích điều hướng thành công",
    });
  } catch (error) {
    next(error);
  }
};
