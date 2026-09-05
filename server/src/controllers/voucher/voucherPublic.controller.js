import * as voucherService from "../../services/voucher/voucher.service.js";

export const getPublicVouchers = async (req, res, next) => {
  try {
    const vouchers = await voucherService.getPublicVouchers(req.query);
    res.json({
      success: true,
      data: vouchers,
      message: "Lấy danh sách voucher khả dụng thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const validatePublicVoucher = async (req, res, next) => {
  try {
    const voucher = await voucherService.validatePublicVoucher(req.body);
    res.json({
      success: true,
      data: voucher,
      message: "Áp dụng voucher thành công",
    });
  } catch (error) {
    next(error);
  }
};
