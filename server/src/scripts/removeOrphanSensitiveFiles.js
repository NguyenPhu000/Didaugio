import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import prisma from "../config/prismaClient.js";
import { resolveSensitiveStorageDir } from "../services/document/sensitiveStoragePath.service.js";

const apply = process.argv.includes("--apply");
const requestedFiles = process.argv
  .filter((argument) => argument.startsWith("--file="))
  .map((argument) => argument.split("=", 2)[1])
  .filter(Boolean);

if (requestedFiles.length === 0) {
  throw new Error("At least one --file=<encrypted filename> is required");
}

const storageDirectory = resolveSensitiveStorageDir();

async function main() {
  const [documents, contracts] = await Promise.all([
    prisma.sensitiveDocument.findMany({ select: { encryptedPath: true } }),
    prisma.business.findMany({
      where: { contractPdfPath: { not: null } },
      select: { contractPdfPath: true },
    }),
  ]);
  const referenced = new Set([
    ...documents.map((document) => document.encryptedPath),
    ...contracts.map((business) => business.contractPdfPath),
  ]);

  for (const filename of requestedFiles) {
    if (path.basename(filename) !== filename) {
      throw new Error(`Invalid encrypted filename: ${filename}`);
    }
    if (referenced.has(filename)) {
      throw new Error(`Refusing to remove referenced encrypted file: ${filename}`);
    }
    const filePath = path.join(storageDirectory, filename);
    await fs.access(filePath);
    console.log(`[orphan-sensitive-file] ${apply ? "removing" : "would remove"} ${filename}`);
    if (apply) await fs.unlink(filePath);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("[orphan-sensitive-file] failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
