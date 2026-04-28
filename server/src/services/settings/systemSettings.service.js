import prisma from "../../config/prismaClient.js";
import { DEFAULT_SYSTEM_SETTINGS } from "../../config/defaultSystemSettings.js";

const SETTINGS_KEY = "system_settings";

function deepMerge(target, source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return target;
  }
  const out = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];
    if (
      sv &&
      typeof sv === "object" &&
      !Array.isArray(sv) &&
      tv &&
      typeof tv === "object" &&
      !Array.isArray(tv)
    ) {
      out[key] = deepMerge(tv, sv);
    } else {
      out[key] = sv;
    }
  }
  return out;
}

export async function getMergedSettings() {
  const row = await prisma.systemConfig.findUnique({
    where: { key: SETTINGS_KEY },
  });
  const base = structuredClone(DEFAULT_SYSTEM_SETTINGS);
  if (!row?.value || typeof row.value !== "object") {
    return base;
  }
  return deepMerge(base, row.value);
}

export async function saveSettings(payload, userId) {
  const current = await getMergedSettings();
  const merged = deepMerge(current, payload);

  await prisma.systemConfig.upsert({
    where: { key: SETTINGS_KEY },
    create: {
      key: SETTINGS_KEY,
      value: merged,
      updatedBy: userId,
      description: "Cài đặt hệ thống (giao diện quản trị)",
    },
    update: {
      value: merged,
      updatedBy: userId,
    },
  });

  return merged;
}
