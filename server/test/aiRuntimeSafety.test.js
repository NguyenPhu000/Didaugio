import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateKeywordSafety,
} from "../src/services/ai/runtime/aiKeywordSafety.js";
import {
  buildAllowedContext,
  isFreshContextSource,
} from "../src/services/ai/runtime/aiContextPolicy.js";

test("keyword safety performs normalized substring matching and treats regex syntax literally", () => {
  assert.deepEqual(
    evaluateKeywordSafety("  Nội   dung TỪ CẤM ở đây  ", {
      blockedKeywords: ["từ cấm"],
      matchMode: "substring",
      diacriticInsensitive: false,
    }),
    { blocked: true, keyword: "từ cấm" },
  );
  assert.deepEqual(
    evaluateKeywordSafety("chuỗi (a+)+$ được nhắc nguyên văn", {
      blockedKeywords: ["(a+)+$"],
      matchMode: "substring",
      diacriticInsensitive: false,
    }),
    { blocked: true, keyword: "(a+)+$" },
  );
});

test("keyword safety supports optional Vietnamese diacritic folding", () => {
  assert.equal(
    evaluateKeywordSafety("noi dung tu cam", {
      blockedKeywords: ["từ cấm"],
      matchMode: "substring",
      diacriticInsensitive: true,
    }).blocked,
    true,
  );
});

test("context policy requires both an enabled source and an allowlisted field", () => {
  assert.deepEqual(
    buildAllowedContext(
      {
        currentCity: "Cần Thơ",
        budget: 1_000_000,
        email: "private@example.com",
        currentCoords: { latitude: 10, longitude: 105 },
      },
      {
        enabledSources: ["coarseLocation"],
        fieldAllowlist: ["currentCity", "budget"],
        maxTokens: 500,
      },
    ),
    { currentCity: "Cần Thơ" },
  );
});

test("context policy removes nested direct identifiers and exact coordinates", () => {
  assert.deepEqual(
    buildAllowedContext(
      {
        places: [{
          id: 4,
          name: "Bến Ninh Kiều",
          email: "owner@example.com",
          phone: "0900000000",
          latitude: 10.03,
          longitude: 105.78,
          coordinates: [105.78, 10.03],
        }],
      },
      {
        enabledSources: ["places"],
        fieldAllowlist: ["places"],
        maxTokens: 500,
      },
    ),
    { places: [{ id: 4, name: "Bến Ninh Kiều" }] },
  );
});

test("context policy keeps only whole fields that fit the configured budget", () => {
  assert.deepEqual(
    buildAllowedContext(
      {
        currentCity: "Cần Thơ",
        messages: ["x".repeat(100)],
      },
      {
        enabledSources: ["coarseLocation", "sessionMessages"],
        fieldAllowlist: ["currentCity", "messages"],
        maxTokens: 8,
      },
    ),
    { currentCity: "Cần Thơ" },
  );
});

test("freshness policy rejects future, malformed, and expired timestamps", () => {
  const now = Date.parse("2026-07-25T00:10:00.000Z");

  assert.equal(
    isFreshContextSource("2026-07-25T00:09:30.000Z", 60, now),
    true,
  );
  assert.equal(
    isFreshContextSource("2026-07-25T00:08:59.000Z", 60, now),
    false,
  );
  assert.equal(
    isFreshContextSource("2026-07-25T00:10:01.000Z", 60, now),
    false,
  );
  assert.equal(isFreshContextSource("not-a-date", 60, now), false);
});
