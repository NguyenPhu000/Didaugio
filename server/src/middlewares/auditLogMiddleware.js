import * as auditLogService from "../services/auditLogService.js";

/**
 * Middleware ghi audit log
 * Sử dụng trong các routes cần theo dõi (CREATE, UPDATE, DELETE)
 *
 * @param {string} action - Hành động (CREATE, UPDATE, DELETE)
 * @param {string} tableName - Tên bảng
 * @param {function} getRecordId - Function lấy recordId từ request/response
 * @param {function} getOldData - Function lấy dữ liệu cũ (optional, cho UPDATE/DELETE)
 * @param {function} getNewData - Function lấy dữ liệu mới (optional, cho CREATE/UPDATE)
 */
export const auditLog = ({
  action,
  tableName,
  getRecordId,
  getOldData,
  getNewData,
}) => {
  return async (req, res, next) => {
    // Lưu original send function
    const originalSend = res.send;

    // Override send để capture response
    res.send = function (body) {
      res.send = originalSend; // Restore original

      // Chỉ ghi log khi request thành công (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.userId;

        // Chỉ ghi log cho admin/staff/business (roleId 1-4)
        // Super Admin (1), Admin (2), Moderator (3), Business Owner (4)
        const roleId = req.user?.roleId;
        if (userId && roleId && roleId <= 4) {
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

            const logData = {
              userId,
              action,
              tableName,
              recordId,
              oldData: getOldData ? getOldData(req) : null,
              newData: getNewData ? getNewData(req, parsedBody) : null,
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.headers["user-agent"],
            };

            // Ghi log async (không block response)
            auditLogService.create(logData).catch((error) => {
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

/**
 * Helper: Ghi audit log sau khi thực hiện action (dùng trong service)
 * Dùng khi cần lấy oldData trước khi update/delete
 */
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

