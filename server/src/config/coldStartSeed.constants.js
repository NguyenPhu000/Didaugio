/** Khóa SystemConfig — metadata lần chạy seed cold start (idempotent). */
export const CONTENT_SEED_METADATA_KEY = "content_seed_metadata";

export const CONTENT_SEED_VERSION = 1;

/** Prefix slug — tránh trùng; đổi version nếu cần bộ địa điểm mới. */
export const COLD_SEED_SLUG_PREFIX = "cold-start-v1";

export const COLD_SEED_PLACES = [
  {
    slug: `${COLD_SEED_SLUG_PREFIX}-nha-hang-mau-can-tho`,
    name: "Nhà hàng mẫu (seed)",
    shortDescription: "Địa điểm mẫu để demo Explore — có thể gỡ sau khi có dữ liệu thật.",
    description:
      "Dữ liệu mồi do script seed tạo. Admin có thể lọc `is_seeded` hoặc cập nhật thông tin.",
    address: "1 Đường mẫu, quận trung tâm, Cần Thơ",
    latitude: 10.045162,
    longitude: 105.746857,
    priceRange: "$$",
    priceFrom: 80000,
    priceTo: 350000,
  },
  {
    slug: `${COLD_SEED_SLUG_PREFIX}-cafe-song-mau-can-tho`,
    name: "Cà phê view sông (seed)",
    shortDescription: "Quán cà phê mẫu — thumbnail / review do seed tạo.",
    description: "Dữ liệu mồi. Đánh giá kèm cờ is_seeded để rà soát moderation.",
    address: "2 Đường mẫu, ven sông, Cần Thơ",
    latitude: 10.038,
    longitude: 105.78,
    priceRange: "$",
    priceFrom: 25000,
    priceTo: 75000,
  },
];

/** Tài khoản reviewer chỉ dùng cho nội dung seed (không merge vào user thật). */
export const COLD_SEED_REVIEWERS = [
  {
    email: "cold-seed-reviewer-a@didaugio.local",
    username: "cold_seed_reviewer_a",
    reviewTitle: "Ổn cho demo",
    reviewBody: "Đánh giá mẫu từ seed — nội dung có thể chỉnh hoặc ẩn trong admin.",
    rating: 5,
  },
  {
    email: "cold-seed-reviewer-b@didaugio.local",
    username: "cold_seed_reviewer_b",
    reviewTitle: "Đủ để test danh sách review",
    reviewBody: "Seed B — phục vụ kiểm tra hiển thị nhiều review.",
    rating: 4,
  },
];

export const COLD_SEED_PLACE_IMAGE_CAPTION = "Ảnh minh hoạ seed (placeholder)";

export const COLD_SEED_REVIEW_MEDIA_PLACEHOLDER =
  "https://placehold.co/600x400/e2e8f0/64748b?text=Didaugio+seed";
