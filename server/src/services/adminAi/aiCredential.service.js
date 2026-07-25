import prisma from "../../config/prismaClient.js";
import { decryptField, encryptField } from "../../utils/fieldEncryption.js";

function unavailableSecretError() {
  return Object.assign(new Error("Provider credential is unavailable."), {
    code: "AI_SECRET_UNAVAILABLE",
    statusCode: 503,
  });
}

export function createAiCredentialService({
  client,
  encrypt = encryptField,
  decrypt = decryptField,
}) {
  return {
    async replaceProviderSecret(
      reference,
      plaintext,
      transactionClient = client,
    ) {
      const encrypted = encrypt(plaintext);
      const suffix = String(plaintext).slice(-4);
      const row = await transactionClient.apiKeyManagement.upsert({
        where: { serviceName: reference },
        create: {
          serviceName: reference,
          apiKey: encrypted,
          keySuffix: suffix,
        },
        update: {
          apiKey: encrypted,
          keySuffix: suffix,
          status: "active",
        },
        select: {
          serviceName: true,
          keySuffix: true,
          updatedAt: true,
        },
      });

      return {
        reference: row.serviceName,
        configured: true,
        suffix: row.keySuffix,
        updatedAt: row.updatedAt,
      };
    },

    async getProviderSecretMetadata(reference, includePlaintext = false) {
      const row = await client.apiKeyManagement.findUnique({
        where: { serviceName: reference },
        select: {
          serviceName: true,
          apiKey: true,
          keySuffix: true,
          updatedAt: true,
          status: true,
        },
      });

      let keys = [];
      if (includePlaintext && row?.apiKey && row.status === "active") {
        try {
          const decrypted = decrypt(row.apiKey);
          keys = decrypted
            .split(/[\n,;]+/)
            .map((k) => k.trim())
            .filter(Boolean);
        } catch {}
      }

      return {
        reference,
        configured: Boolean(row && row.status === "active"),
        suffix: row?.keySuffix ?? null,
        updatedAt: row?.updatedAt ?? null,
        keys,
      };
    },

    async resolveProviderSecret(reference) {
      const row = await client.apiKeyManagement.findUnique({
        where: { serviceName: reference },
        select: { apiKey: true, status: true },
      });
      if (!row || row.status !== "active") {
        throw unavailableSecretError();
      }
      return decrypt(row.apiKey);
    },
  };
}

const credentialService = createAiCredentialService({ client: prisma });

export const replaceProviderSecret =
  credentialService.replaceProviderSecret.bind(credentialService);
export const resolveProviderSecret =
  credentialService.resolveProviderSecret.bind(credentialService);
export const getProviderSecretMetadata =
  credentialService.getProviderSecretMetadata.bind(credentialService);
