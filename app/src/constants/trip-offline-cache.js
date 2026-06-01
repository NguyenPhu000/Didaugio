/** Thời gian cache trip trên thiết bị — đủ cho một chuyến đi (7 ngày). */
export const TRIP_OFFLINE_GC_MS = 7 * 24 * 60 * 60 * 1000;

/** Thời gian tối đa persist React Query xuống AsyncStorage. */
export const TRIP_OFFLINE_MAX_AGE_MS = TRIP_OFFLINE_GC_MS;

/** Bump khi đổi shape cache trips → tự xóa persist cũ trên mọi thiết bị. */
export const REACT_QUERY_PERSIST_BUSTER = "v3";
