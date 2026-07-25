import prisma from "../../../config/prismaClient.js";
import { aiConfigDataSchema } from "../../../models/schemas/adminAi/adminAi.schema.js";

const AI_CONFIG_KEY = "mobile_ai";
const KILL_SWITCH_KEY = "ai_kill_switch";
const ACTIVE_CACHE_TTL_MS = 30_000;

const DEFAULT_KILL_SWITCH = Object.freeze({
  enabled: false,
  message: null,
  updatedAt: null,
});

function normalizeKillSwitch(row) {
  const value = row?.value;
  if (!value || typeof value !== "object") return DEFAULT_KILL_SWITCH;
  return {
    enabled: value.enabled === true,
    message: typeof value.message === "string" ? value.message : null,
    updatedAt: value.updatedAt ?? null,
  };
}

export function createAiRuntimeConfigService({
  client,
  now = Date.now,
  loadActiveVersion,
}) {
  let activeCache = null;

  async function readActiveVersion() {
    if (loadActiveVersion) return loadActiveVersion();
    const row = await client.aiConfig.findUnique({
      where: { key: AI_CONFIG_KEY },
      select: {
        activeVersion: {
          select: {
            version: true,
            configData: true,
          },
        },
      },
    });
    return row?.activeVersion ?? null;
  }

  async function getKillSwitch() {
    const row = await client.systemConfig.findUnique({
      where: { key: KILL_SWITCH_KEY },
      select: { value: true },
    });
    return normalizeKillSwitch(row);
  }

  function invalidateAiRuntimeCache() {
    activeCache = null;
  }

  async function getActiveAiRuntime() {
    const killSwitch = await getKillSwitch();
    if (killSwitch.enabled) {
      return {
        status: "disabled",
        version: null,
        configData: null,
        killSwitch,
      };
    }

    const currentTime = now();
    if (activeCache && activeCache.expiresAt > currentTime) {
      return { ...activeCache.runtime, killSwitch };
    }

    const active = await readActiveVersion();
    if (!active) {
      return {
        status: "maintenance",
        version: null,
        configData: null,
        killSwitch,
      };
    }

    const runtime = {
      status: "active",
      version: active.version,
      configData: aiConfigDataSchema.parse(active.configData),
    };
    activeCache = {
      runtime,
      expiresAt: currentTime + ACTIVE_CACHE_TTL_MS,
    };
    return { ...runtime, killSwitch };
  }

  async function setAiKillSwitch({ enabled, reason }, actor) {
    const value = {
      enabled,
      message: reason,
      updatedAt: new Date(now()).toISOString(),
    };
    const result = await client.systemConfig.upsert({
      where: { key: KILL_SWITCH_KEY },
      create: {
        key: KILL_SWITCH_KEY,
        value,
        description: "Emergency control for mobile AI runtime.",
        updatedBy: actor.userId,
      },
      update: {
        value,
        updatedBy: actor.userId,
      },
    });
    invalidateAiRuntimeCache();
    return result;
  }

  return {
    getActiveAiRuntime,
    setAiKillSwitch,
    invalidateAiRuntimeCache,
  };
}

const service = createAiRuntimeConfigService({ client: prisma });

export const getActiveAiRuntime =
  service.getActiveAiRuntime.bind(service);
export const setAiKillSwitch =
  service.setAiKillSwitch.bind(service);
export const invalidateAiRuntimeCache =
  service.invalidateAiRuntimeCache.bind(service);
