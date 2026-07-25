import prisma from "../../config/prismaClient.js";
import { DEFAULT_AI_CONFIG } from "../../config/defaultAiConfig.js";
import { encryptField } from "../../utils/fieldEncryption.js";

const AI_CONFIG_KEY = "mobile_ai";
const MAX_VERSION_ROWS = 10;

function conflictError(currentRevision) {
  return Object.assign(new Error("AI configuration changed."), {
    code: "AI_CONFIG_CONFLICT",
    statusCode: 409,
    currentRevision,
  });
}

function unavailableConfigError() {
  return Object.assign(new Error("AI configuration is unavailable."), {
    code: "AI_CONFIG_UNAVAILABLE",
    statusCode: 503,
  });
}

async function acquireRevision(tx, current, expectedRevision) {
  const locked = await tx.aiConfig.updateMany({
    where: { id: current.id, revision: expectedRevision },
    data: { revision: { increment: 1 } },
  });
  if (locked.count === 1) return expectedRevision + 1;

  const latest = await tx.aiConfig.findUnique({
    where: { id: current.id },
    select: { revision: true },
  });
  throw conflictError(latest?.revision ?? current.revision);
}

async function nextVersionNumber(tx, aiConfigId) {
  const aggregate = await tx.aiConfigVersion.aggregate({
    where: { aiConfigId },
    _max: { version: true },
  });
  return (aggregate._max.version ?? 0) + 1;
}

async function pruneVersionHistory(tx, aiConfigId, protectedIds) {
  const rows = await tx.aiConfigVersion.findMany({
    where: { aiConfigId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  const excess = rows.length - MAX_VERSION_ROWS;
  if (excess <= 0) return;

  const protectedSet = new Set(protectedIds.filter(Boolean));
  const ids = rows
    .filter((row) => !protectedSet.has(row.id))
    .slice(0, excess)
    .map((row) => row.id);
  if (ids.length > 0) {
    await tx.aiConfigVersion.deleteMany({ where: { id: { in: ids } } });
  }
}

export function createAiConfigRepository({ client }) {
  return {
    async getForUpdate() {
      const row = await client.aiConfig.findUnique({
        where: { key: AI_CONFIG_KEY },
        select: { id: true, revision: true },
      });
      if (!row) throw unavailableConfigError();
      return row;
    },

    async getConfigView() {
      const row = await client.aiConfig.findUnique({
        where: { key: AI_CONFIG_KEY },
        include: {
          activeVersion: true,
          draftVersion: true,
          versions: {
            orderBy: [{ version: "desc" }],
            select: {
              id: true,
              version: true,
              status: true,
              changeReason: true,
              createdBy: true,
              createdAt: true,
              publishedAt: true,
            },
          },
        },
      });
      if (!row) throw unavailableConfigError();
      return row;
    },

    async getVersion(version) {
      return client.aiConfigVersion.findFirst({
        where: {
          version,
          aiConfig: { key: AI_CONFIG_KEY },
        },
      });
    },

    async saveDraft({
      revision,
      configData,
      changeReason,
      actorId,
      writeCredential,
    }) {
      return client.$transaction(async (tx) => {
        const current = await tx.aiConfig.findUnique({
          where: { key: AI_CONFIG_KEY },
          select: {
            id: true,
            revision: true,
            activeVersionId: true,
            draftVersionId: true,
          },
        });
        if (!current) throw unavailableConfigError();

        const nextRevision = await acquireRevision(tx, current, revision);
        await writeCredential?.(tx);
        const version = await nextVersionNumber(tx, current.id);
        const draft = await tx.aiConfigVersion.create({
          data: {
            aiConfigId: current.id,
            version,
            status: "draft",
            configData,
            changeReason,
            createdBy: actorId,
          },
        });

        if (current.draftVersionId) {
          await tx.aiConfigVersion.updateMany({
            where: { id: current.draftVersionId, status: "draft" },
            data: { status: "archived" },
          });
        }
        await tx.aiConfig.update({
          where: { id: current.id },
          data: {
            draftVersionId: draft.id,
            updatedBy: actorId,
          },
        });
        await pruneVersionHistory(tx, current.id, [
          current.activeVersionId,
          draft.id,
        ]);

        return { ...draft, revision: nextRevision };
      });
    },

    async publishDraft({ revision, changeReason, actorId }) {
      return client.$transaction(async (tx) => {
        const current = await tx.aiConfig.findUnique({
          where: { key: AI_CONFIG_KEY },
          include: { draftVersion: true },
        });
        if (!current?.draftVersion) throw unavailableConfigError();

        const nextRevision = await acquireRevision(tx, current, revision);
        const publishedAt = new Date();
        if (current.activeVersionId) {
          await tx.aiConfigVersion.updateMany({
            where: { id: current.activeVersionId },
            data: { status: "archived" },
          });
        }
        const published = await tx.aiConfigVersion.update({
          where: { id: current.draftVersion.id },
          data: {
            status: "published",
            changeReason,
            createdBy: actorId,
            publishedAt,
          },
        });

        const draftVersion = await nextVersionNumber(tx, current.id);
        const freshDraft = await tx.aiConfigVersion.create({
          data: {
            aiConfigId: current.id,
            version: draftVersion,
            status: "draft",
            configData: published.configData,
            changeReason: `Draft copy of published version ${published.version}.`,
            createdBy: actorId,
          },
        });
        await tx.aiConfig.update({
          where: { id: current.id },
          data: {
            activeVersionId: published.id,
            draftVersionId: freshDraft.id,
            updatedBy: actorId,
          },
        });
        await pruneVersionHistory(tx, current.id, [
          published.id,
          freshDraft.id,
        ]);

        return { ...published, revision: nextRevision };
      });
    },

    async publishCopiedVersion({
      sourceVersionId,
      configData,
      changeReason,
      actorId,
    }) {
      return client.$transaction(async (tx) => {
        const current = await tx.aiConfig.findUnique({
          where: { key: AI_CONFIG_KEY },
          select: {
            id: true,
            revision: true,
            activeVersionId: true,
            draftVersionId: true,
          },
        });
        if (!current) throw unavailableConfigError();

        const nextRevision = await acquireRevision(
          tx,
          current,
          current.revision,
        );
        if (current.activeVersionId) {
          await tx.aiConfigVersion.updateMany({
            where: { id: current.activeVersionId },
            data: { status: "archived" },
          });
        }
        if (current.draftVersionId) {
          await tx.aiConfigVersion.updateMany({
            where: { id: current.draftVersionId, status: "draft" },
            data: { status: "archived" },
          });
        }

        const version = await nextVersionNumber(tx, current.id);
        const published = await tx.aiConfigVersion.create({
          data: {
            aiConfigId: current.id,
            version,
            status: "published",
            configData,
            changeReason,
            createdBy: actorId,
            publishedAt: new Date(),
          },
        });
        const freshDraft = await tx.aiConfigVersion.create({
          data: {
            aiConfigId: current.id,
            version: version + 1,
            status: "draft",
            configData,
            changeReason: `Draft copy of rollback source ${sourceVersionId}.`,
            createdBy: actorId,
          },
        });
        await tx.aiConfig.update({
          where: { id: current.id },
          data: {
            activeVersionId: published.id,
            draftVersionId: freshDraft.id,
            updatedBy: actorId,
          },
        });
        await pruneVersionHistory(tx, current.id, [
          published.id,
          freshDraft.id,
        ]);

        return { ...published, revision: nextRevision };
      });
    },

    async ensureDefaultAiConfig({
      configData,
      getBootstrapCredential,
    } = {}) {
      return client.$transaction(async (tx) => {
        const root = await tx.aiConfig.upsert({
          where: { key: AI_CONFIG_KEY },
          update: {},
          create: {
            key: AI_CONFIG_KEY,
            status: "bootstrapping",
            revision: 0,
            updatedBy: null,
          },
          select: {
            id: true,
            activeVersionId: true,
            draftVersionId: true,
          },
        });
        const claim = await tx.aiConfig.updateMany({
          where: {
            id: root.id,
            activeVersionId: null,
            draftVersionId: null,
          },
          data: { status: "bootstrapping" },
        });
        if (claim.count === 0) {
          return { bootstrapped: false, id: root.id };
        }

        const active = await tx.aiConfigVersion.create({
          data: {
            aiConfigId: root.id,
            version: 1,
            status: "published",
            configData,
            changeReason: "System bootstrap default configuration.",
            createdBy: null,
            publishedAt: new Date(),
          },
        });
        const draft = await tx.aiConfigVersion.create({
          data: {
            aiConfigId: root.id,
            version: 2,
            status: "draft",
            configData,
            changeReason: "Draft copy of system bootstrap configuration.",
            createdBy: null,
          },
        });
        await tx.aiConfig.update({
          where: { id: root.id },
          data: {
            activeVersionId: active.id,
            draftVersionId: draft.id,
            status: "active",
          },
        });

        const bootstrapCredential = getBootstrapCredential?.();
        if (bootstrapCredential) {
          await tx.apiKeyManagement.upsert({
            where: { serviceName: bootstrapCredential.reference },
            update: {},
            create: {
              serviceName: bootstrapCredential.reference,
              apiKey: bootstrapCredential.encrypted,
              keySuffix: bootstrapCredential.suffix,
            },
          });
        }
        return { bootstrapped: true, id: root.id };
      });
    },
  };
}

const repository = createAiConfigRepository({ client: prisma });

export const getForUpdate = repository.getForUpdate.bind(repository);
export const getConfigView = repository.getConfigView.bind(repository);
export const getVersion = repository.getVersion.bind(repository);
export const saveDraft = repository.saveDraft.bind(repository);
export const publishDraft = repository.publishDraft.bind(repository);
export const publishCopiedVersion =
  repository.publishCopiedVersion.bind(repository);

export async function ensureDefaultAiConfig() {
  const plaintext = process.env.GROQ_API_KEY;
  return repository.ensureDefaultAiConfig({
    configData: DEFAULT_AI_CONFIG,
    getBootstrapCredential: plaintext
      ? () => ({
          reference: "groq-primary",
          encrypted: encryptField(plaintext),
          suffix: String(plaintext).slice(-4),
        })
      : undefined,
  });
}
