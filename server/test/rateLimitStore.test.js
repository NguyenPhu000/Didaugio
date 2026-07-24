import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildAiRateLimitKey,
} from "../src/middlewares/rateLimitMiddleware.js";

test("AI limiter isolates authenticated users behind one IP", () => {
  assert.equal(
    buildAiRateLimitKey({ user: { id: 41 }, ip: "10.0.0.1" }),
    "user:41",
  );
  assert.equal(
    buildAiRateLimitKey({ user: { id: 42 }, ip: "10.0.0.1" }),
    "user:42",
  );
});

test("AI limiter keeps one authenticated user in the same bucket across IPs", () => {
  assert.equal(
    buildAiRateLimitKey({ user: { userId: 41 }, ip: "10.0.0.1" }),
    "user:41",
  );
  assert.equal(
    buildAiRateLimitKey({ user: { userId: 41 }, ip: "203.0.113.9" }),
    "user:41",
  );
});

test("AI limiter falls back to a normalized socket IP without trusting headers", () => {
  assert.equal(
    buildAiRateLimitKey({
      ip: "::ffff:192.0.2.44",
      headers: { "x-forwarded-for": "198.51.100.7" },
    }),
    "ip:192.0.2.44",
  );
  assert.equal(
    buildAiRateLimitKey({ socket: { remoteAddress: "2001:DB8::1" } }),
    "ip:2001:db8::1",
  );
});

test("AI limiter never stringifies malformed user IDs into a shared user bucket", () => {
  assert.equal(
    buildAiRateLimitKey({ user: { id: { valueOf: () => 7 } }, ip: "10.0.0.7" }),
    "ip:10.0.0.7",
  );
  assert.equal(
    buildAiRateLimitKey({ user: { id: [7] }, ip: "10.0.0.8" }),
    "ip:10.0.0.8",
  );
  assert.equal(
    buildAiRateLimitKey({ user: { id: "   " }, ip: "10.0.0.9" }),
    "ip:10.0.0.9",
  );
});

test("AI router authenticates once, then rate-limits every AI endpoint", () => {
  const routeSource = readFileSync(
    new URL("../src/routes/ai/ai.route.js", import.meta.url),
    "utf8",
  );
  const routesSource = readFileSync(
    new URL("../src/routes/index.js", import.meta.url),
    "utf8",
  );

  const authenticateIndex = routeSource.indexOf("router.use(authenticate)");
  const limiterIndex = routeSource.indexOf("router.use(aiUserLimiter)");
  assert.ok(authenticateIndex >= 0, "AI router must authenticate before handling routes");
  assert.ok(limiterIndex > authenticateIndex, "AI limiter must run after authentication");

  for (const endpoint of [
    "/place-summary",
    "/chat",
    "/groq-chat",
    "/voice/transcribe",
    "/voice/speech",
    "/hybrid-plan",
    "/navigate",
  ]) {
    assert.match(routeSource, new RegExp(`router\\.post\\(\\s*["']${endpoint}`));
  }

  assert.doesNotMatch(routeSource, /router\.post\([^;]*authenticate/);
  assert.doesNotMatch(routesSource, /app\.use\("\/api\/ai\/(?:groq-chat|voice|navigate)"/);
});

test("AI limiter configuration rejects zero and invalid environment maxima", () => {
  const source = readFileSync(
    new URL("../src/middlewares/rateLimitMiddleware.js", import.meta.url),
    "utf8",
  );

  assert.match(source, /Number\.isSafeInteger\(maxFromEnv\)\s*&&\s*maxFromEnv\s*>\s*0/);
  assert.match(source, /namespace:\s*"ai-user"/);
  assert.match(source, /keyGenerator:\s*buildAiRateLimitKey/);
});

const invokeLimiter = (limiter, req) => new Promise((resolve, reject) => {
  const headers = new Map();
  const res = {
    statusCode: 200,
    writableEnded: false,
    headersSent: false,
    setHeader: (name, value) => headers.set(name.toLowerCase(), value),
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.writableEnded = true;
      resolve({ statusCode: this.statusCode, body, headers, rateLimit: req.rateLimit });
    },
  };

  limiter(req, res, () => {
    resolve({ statusCode: res.statusCode, headers, rateLimit: req.rateLimit });
  }).catch(reject);
});

test("AI limiter returns the existing 429 contract with Retry-After", async () => {
  const originalMax = process.env.GROQ_CHAT_RATE_LIMIT_MAX;
  process.env.GROQ_CHAT_RATE_LIMIT_MAX = "1";

  try {
    const { aiUserLimiter } = await import(
      `../src/middlewares/rateLimitMiddleware.js?rate-limit-test=${Date.now()}`
    );
    const first = await invokeLimiter(aiUserLimiter, {
      user: { id: 81 },
      ip: "198.51.100.81",
    });
    const second = await invokeLimiter(aiUserLimiter, {
      user: { id: 81 },
      ip: "198.51.100.81",
    });

    assert.equal(first.rateLimit.current, 1);
    assert.equal(second.statusCode, 429);
    assert.equal(second.body.errorCode, "RATE_LIMIT_EXCEEDED");
    assert.ok(Number(second.headers.get("retry-after")) > 0);
  } finally {
    if (originalMax === undefined) delete process.env.GROQ_CHAT_RATE_LIMIT_MAX;
    else process.env.GROQ_CHAT_RATE_LIMIT_MAX = originalMax;
  }
});
