import * as repository from "./aiConfig.repository.js";
import {
  getProviderSecretMetadata,
  replaceProviderSecret,
} from "./aiCredential.service.js";
import {
  createAiConfigService,
  redactAdminAiAuditData,
} from "./aiConfig.service.js";
import {
  invalidateAiRuntimeCache,
} from "../ai/runtime/aiRuntimeConfig.js";

const service = createAiConfigService({
  repository,
  credentials: {
    getProviderSecretMetadata,
    replaceProviderSecret,
  },
  invalidateRuntime: invalidateAiRuntimeCache,
});

export const getConfigView = service.getConfigView.bind(service);
export const saveDraft = service.saveDraft.bind(service);
export const publishDraft = service.publishDraft.bind(service);
export const rollbackConfig = service.rollbackConfig.bind(service);
export { ensureDefaultAiConfig } from "./aiConfig.repository.js";
export { replaceProviderSecret, redactAdminAiAuditData };
export { getLogs } from "./aiLog.service.js";
export { getOverview } from "./aiOverview.service.js";
export {
  runAiConfigTest,
} from "../ai/runtime/aiRuntimeExecution.js";
export {
  setAiKillSwitch,
} from "../ai/runtime/aiRuntimeConfig.js";
