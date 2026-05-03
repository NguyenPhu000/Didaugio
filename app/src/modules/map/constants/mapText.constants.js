const DEFAULT_TARGET_NAME = "điểm đến";

export const MAP_TEXT = Object.freeze({
  common: {
    currentLocationName: "Vị trí hiện tại",
    destinationName: "Điểm đến",
    destinationMissingName: "Điểm đang thiếu",
    destinationNameLower: DEFAULT_TARGET_NAME,
    unknownValue: "unknown",
  },
  layerSwitcher: {
    title: "Chọn kiểu bản đồ",
  },
  loading: {
    map: "Đang tải bản đồ...",
  },
  errors: {
    mapData: "Không tải được dữ liệu",
    retry: "Thử lại",
    routeBuild: "Không thể tính tuyến.",
    routeDirectionTitle: "Không thể lấy chỉ đường",
    routeDirectionMessage: "Kết nối định tuyến gặp lỗi. Vui lòng thử lại.",
    routeFallbackTitle: "Đang dùng tuyến ước tính",
    routeFallbackMessage:
      "Lộ trình có thể lệch nhẹ, vui lòng kiểm tra thực tế khi di chuyển.",
  },
  search: {
    placeholder: "Tìm kiếm địa điểm...",
    cancel: "Hủy",
  },
  web: {
    noticeTitle: "Chế độ web đang sử dụng danh sách",
    noticeSubtext:
      "Bản đồ native không hỗ trợ trên web. Bạn vẫn có thể tìm, lọc và mở địa điểm trên Google Maps.",
    allCategories: "Tất cả",
    summaryFound: (count) => `Tìm thấy ${count} địa điểm`,
    loadingPlaces: "Đang tải dữ liệu...",
    placesLoadError: "Không tải được dữ liệu địa điểm",
    noPlacesForFilters: "Không có địa điểm phù hợp bộ lọc",
    openInGoogleMaps: "Mở trên Google Maps",
  },
  mapConfig: {
    mapStyles: {
      osm: "Bản đồ",
      hybrid: "Vệ tinh",
    },
    categoryLabels: {
      cuisine: "Ẩm thực",
      lodging: "Lưu trú",
      sightseeing: "Tham quan",
      shopping: "Mua sắm",
      ecotourism: "Sinh thái",
      cafe: "Cafe",
      homestay: "Homestay",
      ecoPark: "Khu sinh thái",
      place: "Địa điểm",
    },
  },
  routeFormatting: {
    minuteUnit: "phút",
    hourUnit: "h",
    minuteShortUnit: "p",
    meterUnit: "m",
    kilometerUnit: "km",
  },
  accessibility: {
    openMenu: "Mo menu",
  },
  analytics: {
    routeModeCurrentLocationToPlace: "current_location_to_place",
  },
  routeBuilder: {
    panelTitle: "Xây dựng lộ trình của bạn",
    emptyDraftHint: "Nhấn giữ marker để thêm điểm dừng",
    readyToConfirmHint: "Sẵn sàng xác nhận",
    minimumStopsHint: (minimumStops) => `Cần tối thiểu ${minimumStops} điểm`,
    statusHint: ({ draftCount, canConfirm, minimumStops }) => {
      if (!draftCount) return "Nhấn giữ marker để thêm điểm dừng";
      return `${draftCount} điểm dừng • ${
        canConfirm ? "Sẵn sàng xác nhận" : `Cần tối thiểu ${minimumStops} điểm`
      }`;
    },
    stopFallbackName: (index) => `Điểm dừng ${index + 1}`,
    noStopNotice: "Chưa có điểm dừng. Nhấn giữ marker để thêm vào tuyến.",
    updateRoute: "Cập nhật tuyến",
    confirmRoute: "Xác nhận tuyến",
    clearAll: "Xóa hết",
    pendingArrivalNotice: (targetName) =>
      `Đã đến ${targetName || DEFAULT_TARGET_NAME}. Vui lòng xác nhận trong thông báo.`,
    recoveryTitle: "Bạn đã đi huốt điểm đến",
    recoveryMessage: (targetName, distanceLabel) =>
      `Đang dẫn quay lại ${targetName || DEFAULT_TARGET_NAME}${
        distanceLabel ? ` (${distanceLabel})` : ""
      }.`,
    progressLabel: (completedLegs, legCount) =>
      `Hoàn thành ${Math.min(completedLegs, legCount)}/${legCount} chặng`,
    etaPrefix: "Dự kiến",
    stateCompleted: "Tất cả chặng đã hoàn thành",
    statePendingConfirm: (targetName) =>
      `Đã đến ${targetName || DEFAULT_TARGET_NAME} • Chờ xác nhận`,
    stateRecovery: (targetName) =>
      `Bạn đi huốt ${targetName || DEFAULT_TARGET_NAME} • Đang dẫn quay lại`,
    retryRoute: "Thử lại tuyến",
  },
  arrivalModal: {
    title: "Đã đến điểm đến",
    body: (targetName) =>
      `Bạn đã đến ${targetName || DEFAULT_TARGET_NAME}. Xác nhận để hoàn thành chặng này.`,
    cancel: "Hủy",
    confirm: "Xác nhận",
  },
  navigationStatusBanner: {
    fallbackInfo:
      "Ước tính: thời gian và khoảng cách có thể thay đổi theo giao thông thực tế.",
    optimizedInfo: "Đã tối ưu theo thời gian di chuyển hiện tại.",
    retryingRoute: "Đang thử lại...",
    retryRoute: "Thử lại chỉ đường",
  },
  filters: {
    quickOptions: {
      topRated: "Đánh giá cao",
      trending: "Trending",
      budget: "Giá rẻ",
      premium: "Cao cấp",
      openNow: "Mở cửa gần nhất",
    },
    groupOptions: {
      category: "Mục",
      area: "Vùng",
      quick: "Nhanh",
    },
    pickerTitle: (groupLabel) =>
      `Chọn ${String(groupLabel || "bộ lọc").toLowerCase()} để lọc`,
    allCategories: "Tất cả danh mục",
    categoryFallback: "Danh mục",
    allAreas: "Tất cả khu vực",
    areaFallback: "Khu vực",
    noneApplied: "Chưa áp dụng",
    countApplied: (count) => `${count} bộ lọc`,
    groupFallback: "bộ lọc",
  },
});
