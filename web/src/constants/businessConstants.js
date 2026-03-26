/**
 * Business module constants — đồng bộ giá trị với server.
 * UI/module business: import `BUSINESS_STATUS` / nhãn từ file này (không import trực tiếp `BUSINESS_STATUS` từ `constants.js`).
 */
import { BUSINESS_STATUS, SERVICE_TYPES } from "./constants.js";

export { BUSINESS_STATUS, SERVICE_TYPES };

export const BUSINESS_TYPE = {
  INDIVIDUAL: "individual",
  HOUSEHOLD: "household",
  COMPANY: "company",
};

export const BUSINESS_TYPE_VALUES = ["individual", "household", "company"];

export const BUSINESS_TYPE_LABELS = {
  [BUSINESS_TYPE.INDIVIDUAL]: "Cá nhân",
  [BUSINESS_TYPE.HOUSEHOLD]: "Hộ kinh doanh",
  [BUSINESS_TYPE.COMPANY]: "Doanh nghiệp",
};

export const BUSINESS_STATUS_LABELS = {
  [BUSINESS_STATUS.PENDING]: "Đang chờ duyệt",
  [BUSINESS_STATUS.APPROVED]: "Đã duyệt",
  [BUSINESS_STATUS.REJECTED]: "Bị từ chối",
  [BUSINESS_STATUS.SUSPENDED]: "Tạm ngưng",
};

export const SERVICE_TYPE_LABELS = {
  [SERVICE_TYPES.ENTRY_TICKET]: "Vé vào cổng",
  [SERVICE_TYPES.TOUR]: "Tour",
  [SERVICE_TYPES.PACKAGE]: "Gói dịch vụ",
  [SERVICE_TYPES.SERVICE]: "Dịch vụ",
  [SERVICE_TYPES.EXPERIENCE]: "Trải nghiệm",
};
