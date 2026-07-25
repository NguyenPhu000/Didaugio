import * as repository from "./aiConfig.repository.js";
import {
  getProviderSecretMetadata,
  replaceProviderSecret,
} from "./aiCredential.service.js";
import {
  createAiConfigService,
  redactAdminAiAuditData,
} from "./aiConfig.service.js";

const service = createAiConfigService({
  repository,
  credentials: {
    getProviderSecretMetadata,
    replaceProviderSecret,
  },
});

export const getConfigView = service.getConfigView.bind(service);
export const saveDraft = service.saveDraft.bind(service);
export const publishDraft = service.publishDraft.bind(service);
export const rollbackConfig = service.rollbackConfig.bind(service);
export { ensureDefaultAiConfig } from "./aiConfig.repository.js";
export { replaceProviderSecret, redactAdminAiAuditData };
