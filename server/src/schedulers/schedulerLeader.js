import { randomUUID } from "node:crypto";
import logger from "../config/logger.js";

const DEFAULT_LEASE_KEY = "scheduler:leader";
const DEFAULT_TTL_MS = 30_000;
const RENEW_SCRIPT = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('PEXPIRE', KEYS[1], ARGV[2])
  end
  return 0
`;
const RELEASE_SCRIPT = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  end
  return 0
`;

export function createSchedulerLeader({
  redis,
  starters,
  key = DEFAULT_LEASE_KEY,
  ttlMs = DEFAULT_TTL_MS,
  token = randomUUID(),
  scheduleEvery = setInterval,
  clearScheduled = clearInterval,
  log = logger,
}) {
  let activeStops = [];
  let timer = null;

  const isActive = () => activeStops.length > 0;
  const stopActive = () => {
    for (const stop of activeStops.splice(0)) {
      try {
        if (typeof stop === "function") stop();
        else if (typeof stop?.stop === "function") stop.stop();
        else clearInterval(stop);
      } catch (error) {
        log.error("[scheduler] failed to stop leader job", { error: error.message });
      }
    }
  };
  const startActive = () => {
    if (isActive()) return;
    activeStops = starters.map((starter) => starter()).filter(Boolean);
    // Preserve active state even when every starter returns nothing.
    if (activeStops.length === 0) activeStops = [() => {}];
    log.info("[scheduler] replica acquired leader lease");
  };

  const tryAcquire = async () => {
    const result = await redis.set(key, token, { NX: true, PX: ttlMs });
    if (result === "OK") startActive();
  };

  const runOnce = async () => {
    if (!redis) {
      startActive();
      return;
    }

    if (isActive()) {
      const renewed = await redis.eval(RENEW_SCRIPT, {
        keys: [key],
        arguments: [token, String(ttlMs)],
      });
      if (Number(renewed) === 1) return;
      stopActive();
      log.warn("[scheduler] replica lost leader lease");
    }

    await tryAcquire();
  };

  return {
    runOnce,
    start() {
      if (timer) return;
      void runOnce().catch((error) => log.error("[scheduler] leader election failed", { error: error.message }));
      timer = scheduleEvery(
        () => void runOnce().catch((error) => log.error("[scheduler] leader election failed", { error: error.message })),
        Math.max(1_000, Math.floor(ttlMs / 3)),
      );
    },
    async stop() {
      if (timer) clearScheduled(timer);
      timer = null;
      stopActive();
      if (redis) {
        await redis.eval(RELEASE_SCRIPT, { keys: [key], arguments: [token] });
      }
    },
  };
}
