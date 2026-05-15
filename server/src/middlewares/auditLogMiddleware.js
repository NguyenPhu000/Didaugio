import * as auditLogService from "../services/activity/auditLog.service.js";
import { ROLES } from "../config/constants.js";

const MAX_AUDITABLE_ROLE = ROLES.STAFF;

// Vietnamese descriptions for audit actions
const ACTION_DESCRIPTIONS = {
  CREATE: {
    users: "Tạo tài khoản người dùng mới",
    places: "Tạo địa điểm mới",
    categories: "Tạo danh mục mới",
    businesses: "Tạo doanh nghiệp mới",
    business_services: "Tạo dịch vụ doanh nghiệp mới",
    bookings: "Tạo đơn đặt chỗ mới",
    vouchers: "Tạo mã giảm giá mới",
    reviews: "Tạo đánh giá mới",
    review_replies: "Trả lời đánh giá",
    roles: "Tạo vai trò mới",
    permissions: "Tạo quyền mới",
    tags: "Tạo tag mới",
  },
  UPDATE: {
    users: "Cập nhật thông tin người dùng",
    places: "Cập nhật thông tin địa điểm",
    categories: "Cập nhật danh mục",
    businesses: "Cập nhật thông tin doanh nghiệp",
    business_services: "Cập nhật dịch vụ doanh nghiệp",
    bookings: "Cập nhật đơn đặt chỗ",
    vouchers: "Cập nhật mã giảm giá",
    reviews: "Cập nhật đánh giá",
    roles: "Cập nhật vai trò",
    permissions: "Cập nhật quyền",
    tags: "Cập nhật tag",
  },
  DELETE: {
    users: "Xóa tài khoản người dùng",
    places: "Xóa địa điểm",
    categories: "Xóa danh mục",
    businesses: "Xóa doanh nghiệp",
    business_services: "Xóa dịch vụ doanh nghiệp",
    bookings: "Xóa đơn đặt chỗ",
    vouchers: "Xóa mã giảm giá",
    reviews: "Xóa đánh giá",
    review_replies: "Xóa trả lời đánh giá",
    tags: "Xóa tag",
  },
  UPDATE_ROLE: "Thay đổi vai trò người dùng",
  UPDATE_PERMISSIONS: "Cập nhật quyền hạn vai trò",
  ASSIGN_TAGS: "Gán tag cho danh mục",
  SUBMIT_REVIEW: "Gửi địa điểm để duyệt",
  APPROVE: "Phê duyệt",
  REJECT: "Từ chối",
  UPDATE_STATUS: "Cập nhật trạng thái",
  TOGGLE_FEATURED: "Thay đổi trạng thái nổi bật",
  SUSPEND: "Tạm ngưng",
  REACTIVATE: "Kích hoạt lại",
  TERMINATE: "Chấm dứt",
  SIGN_CONTRACT: "Ký hợp đồng",
  UPDATE_DEPOSIT_CONFIG: "Cập nhật cấu hình đặt cọc",
  CONFIRM: "Xác nhận",
  CANCEL: "Hủy bỏ",
  COMPLETE: "Hoàn thành",
  NO_SHOW: "Không đến",
  MARK_PAID: "Đánh dấu đã thanh toán",
  REFUND: "Hoàn tiền",
  BULK_CONFIRM: "Xác nhận hàng loạt",
  BULK_CANCEL: "Hủy hàng loạt",
  BULK_DEACTIVATE: "Vô hiệu hóa hàng loạt",
  REPLY: "Trả lời đánh giá",
  UPDATE_REPLY: "Cập nhật trả lời đánh giá",
  MODERATE_REPLY: "Kiểm duyệt trả lời đánh giá",
  DELETE_REPLY: "Xóa trả lời đánh giá",
  MODERATE_REVIEW: "Kiểm duyệt đánh giá",
  ADMIN_MODERATE_REVIEW_REPLY: "Admin kiểm duyệt trả lời đánh giá",
};

function generateDescription(action, tableName, recordId) {
  const actionDesc = ACTION_DESCRIPTIONS[action];

  if (!actionDesc) {
    return `${action} trên ${tableName} #${recordId}`;
  }

  if (typeof actionDesc === "string") {
    return `${actionDesc} (bản ghi #${recordId})`;
  }

  const tableDesc = actionDesc[tableName];
  if (tableDesc) {
    return `${tableDesc} (bản ghi #${recordId})`;
  }

  return `${action} trên ${tableName} #${recordId}`;
}

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

            const description = generateDescription(action, tableName, recordId);

            auditLogService
              .create({
                userId,
                action,
                tableName,
                recordId,
                description,
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
  description,
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
      description: description || generateDescription(action, tableName, recordId),
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
