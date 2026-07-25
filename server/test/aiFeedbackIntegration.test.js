import assert from "node:assert/strict";
import test from "node:test";
import {
  createFeedbackSubmissionService,
} from "../src/services/app/app.service.js";

test("AI feedback updates metadata only and creates a de-identified report", async () => {
  const calls = { lookups: [], updates: [], reports: [] };
  const client = {
    $transaction: async (operation) => operation(client),
    aiRequestLog: {
      findFirst: async (input) => {
        calls.lookups.push(input);
        return { id: 51 };
      },
      update: async (input) => {
        calls.updates.push(input);
        return { id: 51 };
      },
    },
    feedbackReport: {
      create: async (input) => {
        calls.reports.push(input);
        return { id: 91, ...input.data };
      },
    },
  };
  const submitFeedback = createFeedbackSubmissionService({
    client,
    anonymousUserRef: (userId) => `owner:${userId}`,
  });

  await submitFeedback({
    userId: 88,
    reportType: "ai_quality",
    title: "AI not helpful",
    content: "Not relevant",
    targetType: "ai_request",
    targetId: 51,
  });

  assert.deepEqual(calls.updates, [{
    where: { id: 51 },
    data: {
      feedback: "down",
      feedbackReason: "Not relevant",
    },
  }]);
  assert.deepEqual(calls.lookups, [{
    where: {
      id: 51,
      anonymousUserRef: "owner:88",
      status: "success",
      isTest: false,
      feature: {
        in: ["chat", "planner", "voice-introduction"],
      },
    },
    select: { id: true },
  }]);
  assert.equal(calls.reports[0].data.reporterId, null);
  assert.equal(
    JSON.stringify(calls).includes("prompt"),
    false,
  );
  assert.equal(
    JSON.stringify(calls).includes("response"),
    false,
  );
});

test("AI feedback returns the same safe error for guest, foreign, and ineligible logs", async () => {
  const rows = new Map([
    [51, { id: 51, anonymousUserRef: "owner:88", status: "success", isTest: false, feature: "chat" }],
    [52, { id: 52, anonymousUserRef: "owner:99", status: "success", isTest: false, feature: "chat" }],
    [53, { id: 53, anonymousUserRef: "owner:88", status: "error", isTest: false, feature: "chat" }],
    [54, { id: 54, anonymousUserRef: "owner:88", status: "success", isTest: true, feature: "chat" }],
    [55, { id: 55, anonymousUserRef: "owner:88", status: "success", isTest: false, feature: "voice-transcription" }],
  ]);
  const calls = { updates: 0, reports: 0 };
  const client = {
    $transaction: async (operation) => operation(client),
    aiRequestLog: {
      findFirst: async ({ where }) => {
        const row = rows.get(where.id);
        return row &&
          row.anonymousUserRef === where.anonymousUserRef &&
          row.status === where.status &&
          row.isTest === where.isTest &&
          where.feature.in.includes(row.feature)
          ? { id: row.id }
          : null;
      },
      update: async () => {
        calls.updates += 1;
      },
    },
    feedbackReport: {
      create: async () => {
        calls.reports += 1;
      },
    },
  };
  const submitFeedback = createFeedbackSubmissionService({
    client,
    anonymousUserRef: (userId) => `owner:${userId}`,
  });

  const attempts = [
    { userId: null, targetId: 51 },
    { userId: 88, targetId: 52 },
    { userId: 88, targetId: 53 },
    { userId: 88, targetId: 54 },
    { userId: 88, targetId: 55 },
    { userId: 88, targetId: 999 },
  ];
  const errors = [];
  for (const attempt of attempts) {
    await assert.rejects(
      submitFeedback({
        ...attempt,
        reportType: "ai_quality",
        title: "AI helpful",
        content: "up",
        targetType: "ai_request",
      }),
      (error) => {
        errors.push({
          statusCode: error.statusCode,
          code: error.code,
          message: error.message,
        });
        return true;
      },
    );
  }

  assert.deepEqual(
    errors,
    errors.map(() => ({
      statusCode: 404,
      code: "AI_FEEDBACK_TARGET_UNAVAILABLE",
      message: "AI feedback target is unavailable.",
    })),
  );
  assert.equal(calls.updates, 0);
  assert.equal(calls.reports, 0);
});
