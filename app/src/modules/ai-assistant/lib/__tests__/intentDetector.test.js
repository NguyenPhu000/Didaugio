import { detectIntent, detectAllIntents, INTENT_TYPES } from "../intentDetector";

describe("detectIntent", () => {
  // NAVIGATE
  test("detects NAVIGATE - đi đến", () => {
    expect(detectIntent("đi đến Bến Ninh Kiều")).toBe("NAVIGATE");
  });
  test("detects NAVIGATE - chỉ đường", () => {
    expect(detectIntent("chỉ đường đến chợ Cần Thơ")).toBe("NAVIGATE");
  });
  test("detects NAVIGATE - bao xa", () => {
    expect(detectIntent("từ đây đến đó bao xa")).toBe("NAVIGATE");
  });
  test("detects NAVIGATE - mấy phút", () => {
    expect(detectIntent("mấy phút đi xe máy")).toBe("NAVIGATE");
  });

  // BOOK
  test("detects BOOK - đặt bàn", () => {
    expect(detectIntent("cho tôi đặt bàn lúc 7 giờ")).toBe("BOOK");
  });
  test("detects BOOK - còn chỗ", () => {
    expect(detectIntent("còn chỗ không bạn")).toBe("BOOK");
  });
  test("detects BOOK - mua vé", () => {
    expect(detectIntent("mua vé tham quan ở đâu")).toBe("BOOK");
  });

  // EAT
  test("detects EAT - ăn gì", () => {
    expect(detectIntent("hôm nay ăn gì ngon")).toBe("EAT");
  });
  test("detects EAT - đặc sản", () => {
    expect(detectIntent("đặc sản Cần Thơ là gì")).toBe("EAT");
  });
  test("detects EAT - nhà hàng", () => {
    expect(detectIntent("nhà hàng gần đây")).toBe("EAT");
  });

  // NEARBY
  test("detects NEARBY - gần đây", () => {
    expect(detectIntent("có gì vui gần đây không")).toBe("NEARBY");
  });
  test("detects NEARBY - xung quanh", () => {
    expect(detectIntent("xung quanh khu vực này có gì")).toBe("NEARBY");
  });
  test("detects NEARBY - gần tôi", () => {
    expect(detectIntent("địa điểm gần tôi nhất")).toBe("NEARBY");
  });

  // SCHEDULE
  test("detects SCHEDULE - lịch trình", () => {
    expect(detectIntent("giúp tôi lên lịch trình 3 ngày")).toBe("SCHEDULE");
  });
  test("detects SCHEDULE - hành trình", () => {
    expect(detectIntent("hành trình du lịch Cần Thơ")).toBe("SCHEDULE");
  });
  test("detects SCHEDULE - tour", () => {
    expect(detectIntent("có tour nào hay không")).toBe("SCHEDULE");
  });

  // VOICE
  test("detects VOICE - giới thiệu", () => {
    expect(detectIntent("giới thiệu về Bến Ninh Kiều")).toBe("VOICE");
  });
  test("detects VOICE - kể về", () => {
    expect(detectIntent("kể về lịch sử chùa Ông")).toBe("VOICE");
  });

  // WEATHER
  test("detects WEATHER - thời tiết", () => {
    expect(detectIntent("thời tiết hôm nay thế nào")).toBe("WEATHER");
  });
  test("detects WEATHER - trời mưa", () => {
    expect(detectIntent("trời có mưa không")).toBe("WEATHER");
  });

  // OPEN_HOURS
  test("detects OPEN_HOURS - giờ mở cửa", () => {
    expect(detectIntent("giờ mở cửa của nơi này là mấy giờ")).toBe("OPEN_HOURS");
  });

  // GENERAL fallback
  test("returns GENERAL for unrecognized text", () => {
    expect(detectIntent("xin chào")).toBe(INTENT_TYPES.GENERAL);
  });
  test("returns GENERAL for empty string", () => {
    expect(detectIntent("")).toBe(INTENT_TYPES.GENERAL);
  });
  test("returns GENERAL for null/undefined", () => {
    expect(detectIntent(null)).toBe(INTENT_TYPES.GENERAL);
    expect(detectIntent(undefined)).toBe(INTENT_TYPES.GENERAL);
  });
});

describe("detectAllIntents", () => {
  test("detects multiple intents in compound query", () => {
    const intents = detectAllIntents("nhà hàng gần đây và chỉ đường đến đó");
    expect(intents).toContain("EAT");
    expect(intents).toContain("NEARBY");
  });

  test("returns GENERAL array for empty input", () => {
    expect(detectAllIntents("")).toEqual([INTENT_TYPES.GENERAL]);
  });
});
