import { describe, expect, it } from "vitest";

import { getReviewSubmissionError } from "./reviewSubmissionError";

describe("review submission errors", () => {
  it("classifies the review cooldown response", () => {
    expect(
      getReviewSubmissionError({
        response: {
          status: 429,
          data: {
            errorCode: "REVIEW_COOLDOWN",
            message: "Bạn vừa cập nhật đánh giá, vui lòng thử lại sau.",
          },
        },
      }),
    ).toEqual({
      kind: "cooldown",
      message: "Bạn vừa cập nhật đánh giá, vui lòng thử lại sau.",
    });
  });
});
