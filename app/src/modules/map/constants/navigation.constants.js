export const NAVIGATION_EVENT_DEDUP_MS = 1800;

/** Thời gian (ms) không nhận GPS trước khi đánh dấu mất tín hiệu */
export const GPS_LOST_TIMEOUT_MS = 7_000;

/** Khoảng cách (m) không có ngã rẽ để kích hoạt giảm sáng màn hình */
export const SCREEN_DIM_ACTIVATE_DISTANCE_M = 1_000;

/** Khoảng cách (m) còn lại đến ngã rẽ để phục hồi sáng màn hình */
export const SCREEN_DIM_DEACTIVATE_DISTANCE_M = 500;

/** Độ mờ của overlay giảm sáng (0–1) */
export const SCREEN_DIM_OVERLAY_OPACITY = 0.3;

/** Tốc độ tối thiểu (m/s) để tính dead reckoning khi mất GPS */
export const DEAD_RECKONING_MIN_SPEED_MPS = 0.5;
