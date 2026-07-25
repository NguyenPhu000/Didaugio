import assert from "node:assert/strict";
import test from "node:test";
import {
  createFeedbackSubmissionService,
} from "../src/services/app/app.service.js";

test("AI feedback updates metadata only and creates a de-identified report", async () => {
  const calls = { updates: [], reports: [] };
  const client = {
    $transaction: async (operation) => operation(client),
    aiRequestLog: {
      findUnique: async () => ({ id: 51 }),
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
  const submitFeedback = createFeedbackSubmissionService({ client });

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

test("AI feedback rejects an unknown request log before creating a report", async () => {
  let reports = 0;
  const client = {
    $transaction: async (operation) => operation(client),
    aiRequestLog: {
      findUnique: async () => null,
      update: async () => {
        throw new Error("must not update");
      },
    },
    feedbackReport: {
      create: async () => {
        reports += 1;
      },
    },
  };
  const submitFeedback = createFeedbackSubmissionService({ client });

  await assert.rejects(
    submitFeedback({
      userId: 88,
      reportType: "ai_quality",
      title: "AI helpful",
      content: "up",
      targetType: "ai_request",
      targetId: 999,
    }),
    (error) => error.statusCode === 404,
  );
  assert.equal(reports, 0);
});
