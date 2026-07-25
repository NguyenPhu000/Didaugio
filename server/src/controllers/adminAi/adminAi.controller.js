import { ROLES } from "../../config/constants.js";
import { createAuditLog } from "../../middlewares/auditLogMiddleware.js";
import {
  getConfigView,
  getLogs as getAiLogs,
  getOverview as getAiOverview,
  publishDraft,
  redactAdminAiAuditData,
  rollbackConfig as rollbackAiConfig,
  runAiConfigTest,
  saveDraft as saveAiDraft,
  setAiKillSwitch,
} from "../../services/adminAi/index.js";

function sendSuccess(res, data, message) {
  return res.json({ success: true, data, message });
}

function requestAuditContext(req) {
  return {
    userId: req.user.userId,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers["user-agent"],
  };
}

function redactAuditMetadata(value) {
  if (!value || typeof value !== "object") return value;
  if (value.configData) return redactAdminAiAuditData(value);

  const {
    blockedKeywords,
    prompt,
    prompts,
    providerResponse,
    providerSecret,
    renderedPrompt,
    ...metadata
  } = value;
  return metadata;
}

async function recordAudit(req, {
  action = "UPDATE",
  tableName,
  recordId = 0,
  description,
  oldData,
  newData,
}) {
  await createAuditLog({
    ...requestAuditContext(req),
    action,
    tableName,
    recordId,
    description,
    oldData: redactAuditMetadata(oldData),
    newData: redactAuditMetadata(newData),
  });
}

function canManageProviderSecret(req) {
  return req.user.roleId === ROLES.SUPER_ADMIN ||
    req.userPermissions?.has("ai.secrets.manage") === true;
}

const ADMIN_AI_ERROR_CODE = /^AI_[A-Z0-9_]+$/;

export function normalizeAdminAiError(error) {
  if (
    !error ||
    typeof error.code !== "string" ||
    !ADMIN_AI_ERROR_CODE.test(error.code)
  ) {
    return error;
  }

  const normalized = new Error(error.message);
  if (Number.isInteger(error.statusCode)) {
    normalized.statusCode = error.statusCode;
  }
  normalized.errorCode = error.code;
  if (
    error.code === "AI_CONFIG_CONFLICT" &&
    Number.isSafeInteger(error.currentRevision) &&
    error.currentRevision >= 0
  ) {
    normalized.currentRevision = error.currentRevision;
  }
  return normalized;
}

export const getOverview = async (req, res, next) => {
  try {
    return sendSuccess(res, await getAiOverview(req.query), "AI overview retrieved.");
  } catch (error) {
    return next(normalizeAdminAiError(error));
  }
};

export const getConfig = async (req, res, next) => {
  try {
    return sendSuccess(res, await getConfigView(), "AI configuration retrieved.");
  } catch (error) {
    return next(normalizeAdminAiError(error));
  }
};

export const saveDraft = async (req, res, next) => {
  try {
    if (req.body.providerSecret && !canManageProviderSecret(req)) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Provider secret management permission is required.",
        errorCode: "FORBIDDEN",
      });
    }

    const draft = await saveAiDraft(req.body, req.user);
    await recordAudit(req, {
      tableName: "ai_config_versions",
      recordId: draft.id,
      description: "AI configuration draft saved.",
      newData: draft,
    });
    if (req.body.providerSecret) {
      await recordAudit(req, {
        tableName: "api_keys_management",
        description: "AI provider credential replaced.",
        newData: {
          changeReason: req.body.changeReason,
          credentialReplaced: true,
        },
      });
    }
    return sendSuccess(res, draft, "AI configuration draft saved.");
  } catch (error) {
    return next(normalizeAdminAiError(error));
  }
};

export const testConfig = async (req, res, next) => {
  try {
    return sendSuccess(
      res,
      await runAiConfigTest(req.body, req.user),
      "AI configuration test completed.",
    );
  } catch (error) {
    return next(normalizeAdminAiError(error));
  }
};

export const publishConfig = async (req, res, next) => {
  try {
    const published = await publishDraft(req.body, req.user);
    await recordAudit(req, {
      tableName: "ai_config_versions",
      recordId: published.id,
      description: "AI configuration published.",
      newData: published,
    });
    return sendSuccess(res, published, "AI configuration published.");
  } catch (error) {
    return next(normalizeAdminAiError(error));
  }
};

export const rollbackConfig = async (req, res, next) => {
  try {
    const published = await rollbackAiConfig(req.body, req.user);
    await recordAudit(req, {
      tableName: "ai_config_versions",
      recordId: published.id,
      description: "AI configuration rolled back.",
      newData: published,
    });
    return sendSuccess(res, published, "AI configuration rolled back.");
  } catch (error) {
    return next(normalizeAdminAiError(error));
  }
};

export const updateKillSwitch = async (req, res, next) => {
  try {
    const result = await setAiKillSwitch(req.body, req.user);
    await recordAudit(req, {
      tableName: "system_configs",
      recordId: result.id,
      description: "AI kill switch updated.",
      newData: {
        enabled: req.body.enabled,
        changeReason: req.body.reason,
      },
    });
    return sendSuccess(res, result, "AI kill switch updated.");
  } catch (error) {
    return next(normalizeAdminAiError(error));
  }
};

export const getLogs = async (req, res, next) => {
  try {
    return sendSuccess(res, await getAiLogs(req.query), "AI request logs retrieved.");
  } catch (error) {
    return next(normalizeAdminAiError(error));
  }
};
