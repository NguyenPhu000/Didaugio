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
    } else if (sv !== undefined) {
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
      description: "Cài đặt hệ thống du lịch thông minh Cần Thơ",
    },
    update: {
      value: merged,
      updatedBy: userId,
    },
  });

  return merged;
}

export async function getSystemHealth() {
  const uptimeSeconds = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const uptimeStr = `${hours}h ${minutes}m (${uptimeSeconds}s)`;

  let dbHealthy = true;
  let postgisHealthy = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbHealthy = false;
  }

  try {
    await prisma.$queryRaw`SELECT PostGIS_Version()`;
  } catch {
    postgisHealthy = false;
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const errorCount = await prisma.auditLog.count({
    where: {
      action: { contains: "ERROR", mode: "insensitive" },
      createdAt: { gte: oneDayAgo },
    },
  }).catch(() => 0);

  const isHealthy = dbHealthy && postgisHealthy;

  return {
    status: isHealthy ? "healthy" : "unhealthy",
    uptime: uptimeStr,
    database: dbHealthy ? "connected" : "disconnected",
    postgis: postgisHealthy ? "active" : "inactive",
    errorCount,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  };
}

export async function getSystemLogs(limit = 50) {
  const logs = await prisma.auditLog.findMany({
    take: Number(limit) || 50,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
        },
      },
    },
  }).catch(() => []);

  return logs.map((log) => {
    let level = "info";
    const act = (log.action || "").toUpperCase();
    if (act.includes("ERROR") || act.includes("FAIL")) {
      level = "error";
    } else if (act.includes("DELETE") || act.includes("CANCEL") || act.includes("DEACTIVATE")) {
      level = "warn";
    }

    return {
      id: log.id,
      level,
      message: log.description || `${log.action} trên ${log.tableName} (#${log.recordId})`,
      timestamp: log.createdAt,
      user: log.user?.email || log.user?.username || `Người dùng #${log.userId}`,
      action: log.action,
    };
  });
}
