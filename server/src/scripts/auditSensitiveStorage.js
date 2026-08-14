import "dotenv/config";
import fs from "node:fs/promises";
import prisma from "../config/prismaClient.js";
import { verifyEncryptedStorageRecord } from "../services/document/encryptedStorageIntegrity.service.js";
import { resolveSensitiveStorageDir } from "../services/document/sensitiveStoragePath.service.js";

const storageDirectory = resolveSensitiveStorageDir();

const verify = async (record) => ({
  id: record.id,
  kind: record.kind,
  businessId: record.businessId,
  type: record.type,
  ...(await verifyEncryptedStorageRecord(record, { storageDirectory })),
});

async function main() {
  const [documents, contracts] = await Promise.all([
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
    prisma.business.findMany({
      where: { contractPdfPath: { not: null } },
      select: {
        id: true,
        contractPdfPath: true,
        contractPdfIv: true,
        contractPdfAuthTag: true,
        contractPdfChecksum: true,
      },
    }),
  ]);

  const records = [
    ...documents.map((document) => ({ ...document, kind: "document" })),
    ...contracts.map((business) => ({
      id: `contract:${business.id}`,
      kind: "contract",
      businessId: business.id,
      type: "contract_pdf",
      encryptedPath: business.contractPdfPath,
      iv: business.contractPdfIv,
      authTag: business.contractPdfAuthTag,
      checksum: business.contractPdfChecksum,
    })),
  ];
  const results = await Promise.all(records.map(verify));
  const failed = results.filter((result) => !result.ok);
  const files = (await fs.readdir(storageDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name !== ".gitkeep")
    .map((entry) => entry.name);
  const referenced = new Set(records.map((record) => record.encryptedPath));
  const orphanFiles = files.filter((filename) => !referenced.has(filename));

  console.log(`[sensitive-storage-audit] checked=${results.length} valid=${results.length - failed.length} failed=${failed.length} orphan=${orphanFiles.length}`);
  for (const result of failed) {
    console.error(`[sensitive-storage-audit] invalid kind=${result.kind} business=${result.businessId} type=${result.type} reason=${result.reason}`);
  }
  for (const filename of orphanFiles) {
    console.error(`[sensitive-storage-audit] orphan file=${filename}`);
  }
  if (failed.length > 0 || orphanFiles.length > 0) process.exitCode = 1;
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("[sensitive-storage-audit] failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
