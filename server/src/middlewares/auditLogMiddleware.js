import * as auditLogService from "../services/auditLogService.js";
import { ROLES } from "../config/constants.js";

const MAX_AUDITABLE_ROLE = ROLES.STAFF;

export const auditLog = ({ action, tableName, getRecordId, getOldData, getNewData }) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function (body) {
      res.send = originalSend;

      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.userId;
        const roleId = req.user?.roleId;

        if (userId && roleId && roleId <= MAX_AUDITABLE_ROLE) {
          try {
            let parsedBody = null;
            try {
              parsedBody = typeof body === "string" ? JSON.parse(body) : body;
            } catch {
              parsedBody = body;
            }

            const recordId = getRecordId
              ? getRecordId(req, parsedBody)
              : parseInt(req.params.id) || parsedBody?.data?.id || 0;

            auditLogService
              .create({
                userId,
                action,
                tableName,
                recordId,
                oldData: getOldData ? getOldData(req) : null,
                newData: getNewData ? getNewData(req, parsedBody) : null,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.headers["user-agent"],
              })
              .catch((error) => {
                console.error("Failed to create audit log:", error);
              });
          } catch (error) {
            console.error("Audit log middleware error:", error);
          }
        }
      }

      return originalSend.call(this, body);
    };

    next();
  };
};

export const createAuditLog = async ({
  userId,
  action,
  tableName,
  recordId,
  oldData,
  newData,
  ipAddress,
  userAgent,
}) => {
  try {
    await auditLogService.create({
      userId,
      action,
      tableName,
      recordId,
      oldData,
      newData,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
};

export default { auditLog, createAuditLog };
