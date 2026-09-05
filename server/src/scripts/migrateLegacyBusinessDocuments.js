import "dotenv/config";
import prisma from "../config/prismaClient.js";
import { buildLegacyBusinessDocumentCleanup } from "../services/business/legacyBusinessDocumentMigration.service.js";
import { verifyEncryptedStorageRecord } from "../services/document/encryptedStorageIntegrity.service.js";
import { resolveSensitiveStorageDir } from "../services/document/sensitiveStoragePath.service.js";

const apply = process.argv.includes("--apply");
const storageDirectory = resolveSensitiveStorageDir();

async function main() {
  const [businesses, documents] = await Promise.all([
    prisma.business.findMany({
      where: {
        OR: [
          { idCardFront: { not: null } },
          { idCardBack: { not: null } },
          { businessLicense: { not: null } },
          { idCardFrontPublicId: { not: null } },
          { idCardBackPublicId: { not: null } },
          { businessLicensePublicId: { not: null } },
        ],
      },
      select: {
        id: true,
        idCardFront: true,
        idCardBack: true,
        businessLicense: true,
        idCardFrontPublicId: true,
        idCardBackPublicId: true,
        businessLicensePublicId: true,
      },
    }),
    prisma.sensitiveDocument.findMany({
      select: {
        id: true,
        businessId: true,
        type: true,
        encryptedPath: true,
        iv: true,
        authTag: true,
        checksum: true,
      },
    }),
  ]);

  const verifiedTypesByBusiness = new Map();
  for (const document of documents) {
    const integrity = await verifyEncryptedStorageRecord(document, { storageDirectory });
    if (!integrity.ok) {
      throw new Error(
        `Refusing legacy document cleanup: SensitiveDocument ${document.id} failed ${integrity.reason}`,
      );
    }
    const types = verifiedTypesByBusiness.get(document.businessId) || new Set();
    types.add(document.type);
    verifiedTypesByBusiness.set(document.businessId, types);
  }

  let updates = 0;
  const missing = [];
  for (const business of businesses) {
    const result = buildLegacyBusinessDocumentCleanup(
      business,
      verifiedTypesByBusiness.get(business.id) || new Set(),
    );
    if (Object.keys(result.data).length === 0) continue;

    updates += 1;
    if (result.missingTypes.length > 0) {
      missing.push({ businessId: business.id, types: result.missingTypes });
    }
    if (apply) {
      await prisma.business.update({ where: { id: business.id }, data: result.data });
    }
  }

  console.log(`[legacy-business-document-migration] ${apply ? "applied" : "dry-run"} updates=${updates} missingEncrypted=${missing.length}`);
  for (const item of missing) {
    console.log(`[legacy-business-document-migration] business=${item.businessId} needs_upload=${item.types.join(",")}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("[legacy-business-document-migration] failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
