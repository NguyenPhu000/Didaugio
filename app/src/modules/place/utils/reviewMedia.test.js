import { describe, expect, it } from "vitest";

import { buildReviewMediaPayload, REVIEW_MEDIA_LIMIT } from "./reviewMedia";

describe("review media", () => {
  it("keeps at most three valid images in selection order", () => {
    const media = buildReviewMediaPayload([
      { dataUrl: "data:image/jpeg;base64,one" },
      { dataUrl: "data:image/jpeg;base64,two" },
      { dataUrl: "" },
      { dataUrl: "data:image/jpeg;base64,three" },
      { dataUrl: "data:image/jpeg;base64,four" },
    ]);

    expect(REVIEW_MEDIA_LIMIT).toBe(3);
    expect(media).toEqual([
      { mediaData: "data:image/jpeg;base64,one", mediaType: "image", order: 0 },
      { mediaData: "data:image/jpeg;base64,two", mediaType: "image", order: 1 },
      { mediaData: "data:image/jpeg;base64,three", mediaType: "image", order: 2 },
    ]);
  });
});
