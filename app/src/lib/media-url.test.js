import { describe, expect, it, vi } from "vitest";
import { resolvePlaceImageUri, resolveTripCoverUri } from "./media-url";

vi.mock("../constants/api", () => ({
  API_BASE_CANDIDATES: ["https://api.didaugio.vn/api"],
  API_BASE_URL: "https://api.didaugio.vn/api",
}));

describe("media URL resolvers", () => {
  it("resolves map place preview images from image object variants", () => {
    expect(
      resolvePlaceImageUri({
        images: [{ imageUrl: "/uploads/places/preview.jpg" }],
      }),
    ).toContain("/uploads/places/preview.jpg");

    expect(
      resolvePlaceImageUri({
        thumbnail_url: "/uploads/places/thumb.jpg",
      }),
    ).toContain("/uploads/places/thumb.jpg");

    expect(
      resolvePlaceImageUri({
        markerUrl: "/uploads/places/marker.jpg",
      }),
    ).toContain("/uploads/places/marker.jpg");

    expect(
      resolvePlaceImageUri({
        imageData: "/uploads/places/root-image.jpg",
      }),
    ).toContain("/uploads/places/root-image.jpg");
  });

  it("resolves trip cover images from trip fields and destination image variants", () => {
    expect(resolveTripCoverUri({ thumbnailUrl: "/uploads/trips/thumb.jpg" })).toContain(
      "/uploads/trips/thumb.jpg",
    );

    expect(resolveTripCoverUri({ coverImage: "/uploads/trips/cover.jpg" })).toContain(
      "/uploads/trips/cover.jpg",
    );

    expect(
      resolveTripCoverUri({
        destinations: [
          {
            place: {
              images: [{ imageUrl: "/uploads/places/stop.jpg" }],
            },
          },
        ],
      }),
    ).toContain("/uploads/places/stop.jpg");
  });
});
