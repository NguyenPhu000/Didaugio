import { describe, expect, it } from "vitest";

import { toReviewDraft } from "./reviewDraft";

describe("review draft", () => {
  it("hydrates a review into an editable draft with three images at most", () => {
    expect(
      toReviewDraft({
        rating: 4,
        content: "Không gian thoáng",
        visitType: "family",
        media: [
          { mediaData: "https://cdn.example/one.jpg" },
          { mediaData: "https://cdn.example/two.jpg" },
          { mediaData: "https://cdn.example/three.jpg" },
          { mediaData: "https://cdn.example/four.jpg" },
        ],
      }),
    ).toEqual({
      rating: 4,
      content: "Không gian thoáng",
      visitType: "family",
      media: [
        { dataUrl: "https://cdn.example/one.jpg" },
        { dataUrl: "https://cdn.example/two.jpg" },
        { dataUrl: "https://cdn.example/three.jpg" },
      ],
    });
  });
});
