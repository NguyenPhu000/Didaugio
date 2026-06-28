/**
 * Contract Generation Listener — Tự động tạo hợp đồng PDF khi business được approve
 * Chạy ngầm (background), KHÔNG block API response.
 *
 * Flow: Business Approved Event → createContract → log kết quả
 */

import eventEmitter, { EVENTS } from "../../utils/eventEmitter.js";
import { createContract } from "./contractStorage.service.js";
import prisma from "../../config/prismaClient.js";
import { decryptField, isEncrypted } from "../../utils/fieldEncryption.js";
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

      // Truy vấn đầy đủ thông tin từ DB để tránh mất dữ liệu chữ ký
      const rawBusiness = await prisma.business.findUnique({
        where: { id },
        select: {
          businessName: true,
          businessType: true,
          taxCode: true,
          idCardNumber: true,
          commissionRate: true,
          contractSigned: true,
          signerMetadata: true,
          approvedAt: true,
          status: true,
          owner: {
            select: {
              email: true,
              profile: { select: { fullName: true, address: true, phone: true } },
            },
          },
        },
      });

      if (!rawBusiness) {
        logger.error(`${LOG_PREFIX} Không tìm thấy doanh nghiệp ${id} trong DB`);
        return;
      }

      const getDecrypted = (val) => {
        if (!val) return "";
        if (isEncrypted(val)) {
          try {
            return decryptField(val);
          } catch {
            return "";
          }
        }
        return val;
      };

      const decTaxCode = getDecrypted(rawBusiness.taxCode);
      const decIdCard = getDecrypted(rawBusiness.idCardNumber);
      const meta = typeof rawBusiness.signerMetadata === "object" && rawBusiness.signerMetadata !== null 
        ? rawBusiness.signerMetadata 
        : {};

      const contract = await createContract({
        businessId: id,
        businessName: rawBusiness.businessName || businessName,
        businessType: rawBusiness.businessType,
        taxCode: decTaxCode || "",
        address: rawBusiness.owner?.profile?.address || "",
        commissionRate: rawBusiness.commissionRate ? Number(rawBusiness.commissionRate) : 10,
        ownerName: rawBusiness.owner?.profile?.fullName || "",
        idCardNumberMasked: decIdCard || "",
        idCardIssuedDate: meta.idCardIssuedDate || "",
        idCardIssuedPlace: meta.idCardIssuedPlace || "",
        phone: rawBusiness.owner?.profile?.phone || "",
        email: rawBusiness.owner?.email || "",
        signatureImage: meta.signatureData || null,
        approvedAt: rawBusiness.approvedAt || null,
        status: rawBusiness.status || null,
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
