import crypto from "node:crypto";
import Groq from "groq-sdk";
import prisma from "../../../config/prismaClient.js";
import { aiConfigDataSchema } from "../../../models/schemas/adminAi/adminAi.schema.js";
import {
  completeAiRequest,
  reserveAiRequest,
} from "../../adminAi/aiLog.service.js";
import { resolveProviderSecret } from "../../adminAi/aiCredential.service.js";
import { toAiServiceError } from "../aiProviderPolicy.js";
import { buildAllowedContext } from "./aiContextPolicy.js";
import {
  getActiveAiRuntime,
} from "./aiRuntimeConfig.js";
import { evaluateKeywordSafety } from "./aiKeywordSafety.js";

const RUNTIME_ERROR_CODES = new Set([
  "AI_DISABLED",
  "AI_MAINTENANCE",
  "AI_SAFETY_BLOCKED",
  "AI_DAILY_QUOTA_EXCEEDED",
  "AI_LOG_KEY_UNAVAILABLE",
  "AI_SECRET_UNAVAILABLE",
]);

function runtimeError(message, statusCode, code) {
  return Object.assign(new Error(message), {
    code,
    errorCode: code,
    statusCode,
  });
}

function stableRuntimeError(error) {
  const code = error?.code ?? error?.errorCode;
  if (RUNTIME_ERROR_CODES.has(code)) {
    if (!error.code) error.code = code;
    if (!error.errorCode) error.errorCode = code;
    return error;
  }
  return toAiServiceError(error);
}

function outputText(result) {
  if (typeof result === "string") return result;
  return String(
    result?.outputText ??
      result?.reply ??
      result?.text ??
      result?.content ??
      "",
  );
}

function tokenMetadata(result) {
  return {
    inputTokens:
      result?.inputTokens ??
      result?.usage?.prompt_tokens ??
      result?.usage?.input_tokens ??
      null,
    outputTokens:
      result?.outputTokens ??
      result?.usage?.completion_tokens ??
      result?.usage?.output_tokens ??
      null,
  };
}

function unavailableRuntime(runtime) {
  if (runtime.status === "disabled") {
    return runtimeError(
      runtime.killSwitch?.message || "AI runtime is disabled.",
      503,
      "AI_DISABLED",
    );
  }
  return runtimeError(
    "AI runtime is under maintenance.",
    503,
    "AI_MAINTENANCE",
  );
}

async function loadTestConfigSnapshot(source) {
  const row = await prisma.aiConfig.findUnique({
    where: { key: "mobile_ai" },
    select: {
      activeVersion: {
        select: { version: true, configData: true },
      },
      draftVersion: {
        select: { version: true, configData: true },
      },
    },
  });
  return source === "draft" ? row?.draftVersion : row?.activeVersion;
}

async function executeGroqConfigTest({
  configData,
  feature,
  inputText,
  context,
  secret,
}) {
  const startedAt = Date.now();
  const client = new Groq({
    apiKey: secret,
    baseURL: configData.provider.baseUrl,
  });
  const renderedSystemPrompt = [
    configData.prompts[feature],
    Object.keys(context).length > 0
      ? `Allowed context:\n${JSON.stringify(context)}`
      : null,
  ].filter(Boolean).join("\n\n");
  const completion = await client.chat.completions.create(
    {
      model: configData.provider.model,
      messages: [
        { role: "system", content: renderedSystemPrompt },
        { role: "user", content: inputText },
      ],
      temperature: configData.modelParameters.temperature,
      top_p: configData.modelParameters.topP,
      max_tokens: configData.modelParameters.maxTokens,
    },
    { timeout: configData.modelParameters.timeoutMs },
  );

  return {
    outputText: completion.choices?.[0]?.message?.content ?? "",
    inputTokens: completion.usage?.prompt_tokens ?? null,
    outputTokens: completion.usage?.completion_tokens ?? null,
    finishReason: completion.choices?.[0]?.finish_reason ?? null,
    latencyMs: Date.now() - startedAt,
  };
}

export function createAiRuntimeExecutionService({
  getRuntime = getActiveAiRuntime,
  logs = { reserveAiRequest, completeAiRequest },
  requestId = crypto.randomUUID,
  now = Date.now,
  loadSnapshot = loadTestConfigSnapshot,
  resolveSecret = resolveProviderSecret,
  executeTestProvider = executeGroqConfigTest,
} = {}) {
  async function executeAiRequest({
    feature,
    user,
    isTest = false,
    inputText,
    context,
    operation,
    runtimeOverride,
  }) {
    const runtime = runtimeOverride ?? await getRuntime();
    if (runtime.status !== "active") throw unavailableRuntime(runtime);

    const id = requestId();
    const startedAt = now();
    const { configData } = runtime;
    await logs.reserveAiRequest({
      requestId: id,
      userId: user?.userId,
      feature,
      provider: configData.provider.adapter,
      model: configData.provider.model,
      configVersion: runtime.version,
      dailyLimit: configData.quotas.freeDailyRequests,
      isTest,
    });

    let completed = false;
    try {
      const inputSafety = evaluateKeywordSafety(
        inputText,
        configData.safety,
      );
      if (inputSafety.blocked) {
        await logs.completeAiRequest(id, {
          inputTokens: null,
          outputTokens: null,
          latencyMs: now() - startedAt,
          status: "blocked",
          errorCode: "AI_SAFETY_BLOCKED",
          safetyBlocked: true,
        });
        completed = true;
        throw runtimeError(
          configData.safety.safeResponse,
          422,
          "AI_SAFETY_BLOCKED",
        );
      }

      const allowedContext = buildAllowedContext(
        context,
        configData.context,
      );
      const result = await operation({
        configData,
        inputText,
        context: allowedContext,
        requestId: id,
      });
      const tokens = tokenMetadata(result);
      const outputSafety = evaluateKeywordSafety(
        outputText(result),
        configData.safety,
      );
      if (outputSafety.blocked) {
        await logs.completeAiRequest(id, {
          ...tokens,
          latencyMs: now() - startedAt,
          status: "blocked",
          errorCode: "AI_SAFETY_BLOCKED",
          safetyBlocked: true,
        });
        completed = true;
        throw runtimeError(
          configData.safety.safeResponse,
          422,
          "AI_SAFETY_BLOCKED",
        );
      }

      await logs.completeAiRequest(id, {
        ...tokens,
        latencyMs: now() - startedAt,
        status: "success",
        errorCode: null,
        safetyBlocked: false,
      });
      completed = true;
      return { requestId: id, result };
    } catch (error) {
      const stableError = stableRuntimeError(error);
      if (!completed) {
        await logs.completeAiRequest(id, {
          inputTokens: null,
          outputTokens: null,
          latencyMs: now() - startedAt,
          status: "error",
          errorCode: stableError.code,
          safetyBlocked: false,
        });
      }
      throw stableError;
    }
  }

  async function runAiConfigTest(
    { source, feature, message, context },
    actor,
  ) {
    if (source !== "draft" && source !== "published") {
      throw runtimeError(
        "AI configuration snapshot is unavailable.",
        404,
        "AI_VERSION_NOT_FOUND",
      );
    }
    const snapshot = await loadSnapshot(source);
    if (!snapshot) {
      throw runtimeError(
        "AI configuration snapshot is unavailable.",
        404,
        "AI_VERSION_NOT_FOUND",
      );
    }
    const configData = aiConfigDataSchema.parse(snapshot.configData);
    const runtime = {
      status: "active",
      version: snapshot.version,
      configData,
      killSwitch: { enabled: false, message: null, updatedAt: null },
    };
    const allowedContext = buildAllowedContext(context, configData.context);
    const execution = await executeAiRequest({
      feature,
      user: actor,
      isTest: true,
      inputText: message,
      context,
      runtimeOverride: runtime,
      operation: async (operationInput) => {
        const secret = await resolveSecret(
          configData.provider.secretReference,
        );
        return executeTestProvider({
          ...operationInput,
          feature,
          secret,
        });
      },
    });
    const providerResult = execution.result;

    return {
      requestId: execution.requestId,
      renderedPrompt: {
        system: configData.prompts[feature],
        user: "[REDACTED_TEST_MESSAGE]",
      },
      context: allowedContext,
      provider: {
        provider: configData.provider.adapter,
        model: configData.provider.model,
        status: "success",
        inputTokens: tokenMetadata(providerResult).inputTokens,
        outputTokens: tokenMetadata(providerResult).outputTokens,
        latencyMs: providerResult.latencyMs ?? null,
        finishReason: providerResult.finishReason ?? null,
      },
    };
  }

  return { executeAiRequest, runAiConfigTest };
}

const service = createAiRuntimeExecutionService();

export const executeAiRequest =
  service.executeAiRequest.bind(service);
export const runAiConfigTest =
  service.runAiConfigTest.bind(service);
