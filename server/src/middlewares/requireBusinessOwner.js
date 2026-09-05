import { ROLES } from "../config/constants.js";
import { ERROR_CODES, ERROR_MESSAGES } from "../config/messages.js";

/** Restrict business-management routes to the business account owner. */
export const requireBusinessOwner = (req, res, next) => {
  if (req.user?.roleId === ROLES.BUSINESS) {
    return next();
  }

  return res.status(403).json({
    success: false,
    data: null,
    message: ERROR_MESSAGES.FORBIDDEN,
    errorCode: ERROR_CODES.FORBIDDEN,
  });
};

export default requireBusinessOwner;
