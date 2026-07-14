import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeSpokenGuideInput,
  toPublicSpokenGuide,
  writeSpokenGuide,
} from "../placeSpokenGuide.service.js";

test("normalizes and orders a complete spoken guide", () => {
  assert.deepEqual(
    normalizeSpokenGuideInput({
      locale: "vi-VN",
      text: "  Gioi thieu  ",
      faqs: [{ question: " Cau hoi? ", answer: " Tra loi " }],
    }),
    {
      locale: "vi-VN",
      text: "Gioi thieu",
      faqs: [{ question: "Cau hoi?", answer: "Tra loi", sortOrder: 0 }],
    },
  );
});

test("normalizes an empty guide to null", () => {
  assert.equal(normalizeSpokenGuideInput({ text: " ", faqs: [] }), null);
  assert.equal(normalizeSpokenGuideInput(null), null);
});

test("rejects more than five FAQs", () => {
  assert.throws(
    () =>
      normalizeSpokenGuideInput({
        text: "Guide",
        faqs: Array.from({ length: 6 }, (_, index) => ({
          question: `Q${index}`,
          answer: `A${index}`,
        })),
      }),
    /toi da 5/i,
  );
});

test("rejects incomplete and oversized content", () => {
  assert.throws(
    () => normalizeSpokenGuideInput({ faqs: [{ question: "Q", answer: "" }] }),
    /day du/i,
  );
  assert.throws(
    () => normalizeSpokenGuideInput({ text: "x".repeat(5001) }),
    /5\.000/i,
  );
});

test("public DTO exposes only spoken content", () => {
  assert.deepEqual(
    toPublicSpokenGuide({
      locale: "vi-VN",
      text: "Guide",
      audioUrl: "secret.mp3",
      status: "READY",
      faqs: [{ id: 7, question: "Q", answer: "A", sortOrder: 0 }],
    }),
    {
      locale: "vi-VN",
      text: "Guide",
      faqs: [{ id: 7, question: "Q", answer: "A", sortOrder: 0 }],
    },
  );
});

test("persists an ordered guide and replaces its FAQs", async () => {
  const calls = [];
  const tx = {
    placeAiGuide: {
      upsert: async (args) => {
        calls.push(["upsert", args]);
        return { id: 12 };
      },
      deleteMany: async (args) => calls.push(["deleteGuide", args]),
    },
    placeGuideFaq: {
      deleteMany: async (args) => calls.push(["deleteFaqs", args]),
      createMany: async (args) => calls.push(["createFaqs", args]),
    },
  };

  await writeSpokenGuide(tx, 9, {
    text: "Guide",
    faqs: [{ question: "Q", answer: "A" }],
  });

  assert.deepEqual(calls.map(([name]) => name), [
    "upsert",
    "deleteFaqs",
    "createFaqs",
  ]);
  assert.deepEqual(calls[2][1].data, [
    { guideId: 12, question: "Q", answer: "A", sortOrder: 0 },
  ]);
});

test("deletes the guide only when null or normalized empty is explicit", async () => {
  let deleteCount = 0;
  const tx = {
    placeAiGuide: {
      deleteMany: async () => {
        deleteCount += 1;
      },
    },
  };

  await writeSpokenGuide(tx, 9, undefined);
  assert.equal(deleteCount, 0);
  await writeSpokenGuide(tx, 9, null);
  assert.equal(deleteCount, 1);
});
