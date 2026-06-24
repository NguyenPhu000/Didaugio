/**
 * Contract Generation Listener — Tự động tạo hợp đồng PDF khi business được approve
 * Chạy ngầm (background), KHÔNG block API response.
 *
 * Flow: Business Approved Event → createContract → log kết quả
 */

import eventEmitter, { EVENTS } from "../../utils/eventEmitter.js";
import { createContract } from "./contractStorage.service.js";
import logger from "../../config/logger.js";

const LOG_PREFIX = "[ContractGen]";

/**
 * Khởi tạo listener lắng nghe sự kiện BUSINESS.APPROVED
 * để tự động generate hợp đồng PDF ngầm.
 *
 * Gọi hàm này 1 lần duy nhất khi server khởi động.
 */
export function initContractGenerationListener() {
  eventEmitter.on(EVENTS.BUSINESS.APPROVED, async (eventData) => {
    const { id, businessName } = eventData;

    try {
      logger.info(`${LOG_PREFIX} Bắt đầu tạo hợp đồng cho business ${id} (${businessName})`);

      const contract = await createContract({
        businessId: id,
        businessName: eventData.businessName,
        businessType: eventData.businessType,
        taxCode: eventData.taxCode,
        address: eventData.address,
        commissionRate: eventData.commissionRate,
        ownerName: eventData.ownerName,
        idCardNumberMasked: eventData.idCardNumberMasked,
      });

      logger.info(
        `${LOG_PREFIX} Tạo hợp đồng thành công: business=${id}, checksum=${contract.checksum.substring(0, 16)}...`,
      );
    } catch (error) {
      // Background task KHÔNG được crash main process
      logger.error(`${LOG_PREFIX} Lỗi tạo hợp đồng cho business ${id}:`, error);
    }
  });

  logger.info(`${LOG_PREFIX} Contract generation listener initialized`);
}
