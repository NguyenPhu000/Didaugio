import { aiConfigDataSchema } from "../../models/schemas/adminAi/adminAi.schema.js";

function conflictError(currentRevision) {
  return Object.assign(new Error("AI configuration changed."), {
    code: "AI_CONFIG_CONFLICT",
    statusCode: 409,
    currentRevision,
  });
}

export const createAiConfigService = ({ repository, credentials }) => ({
  async getConfigView() {
    const view = await repository.getConfigView();
    const secretReference =
      view.draftVersion?.configData?.provider?.secretReference ??
      view.activeVersion?.configData?.provider?.secretReference;
    const providerCredential = secretReference
      ? await credentials.getProviderSecretMetadata(secretReference)
      : {
          reference: null,
          configured: false,
          suffix: null,
          updatedAt: null,
        };
    return { ...view, providerCredential };
  },

  async saveDraft(input, actor) {
    const current = await repository.getForUpdate();
    if (current.revision !== input.revision) {
      throw conflictError(current.revision);
    }

    const configData = aiConfigDataSchema.parse(input.configData);
    if (input.providerSecret) {
      await credentials.replaceProviderSecret(
        configData.provider.secretReference,
        input.providerSecret,
      );
    }

    return repository.saveDraft({
      revision: input.revision,
      configData,
      changeReason: input.changeReason,
      actorId: actor.userId,
    });
  },

  async publishDraft(input, actor) {
    return repository.publishDraft({ ...input, actorId: actor.userId });
  },

  async rollbackConfig(input, actor) {
    const source = await repository.getVersion(input.targetVersion);
    if (!source) {
      throw Object.assign(new Error("Version not found."), {
        statusCode: 404,
        code: "AI_VERSION_NOT_FOUND",
      });
    }

    return repository.publishCopiedVersion({
      sourceVersionId: source.id,
      configData: source.configData,
      changeReason: input.changeReason,
      actorId: actor.userId,
    });
  },
});

export function redactAdminAiAuditData(value) {
  if (!value || typeof value !== "object") return value;
  return {
    revision: value.revision,
    changeReason: value.changeReason,
    configData: value.configData
      ? {
          provider: {
            adapter: value.configData.provider?.adapter,
            model: value.configData.provider?.model,
            secretReference: value.configData.provider?.secretReference,
          },
          changedSections: Object.keys(value.configData),
        }
      : undefined,
  };
}
