const toInt = (value, fallback = null) => {
  const number = parseInt(value, 10);
  return Number.isNaN(number) ? fallback : number;
};

export const normalizeItineraryDays = (days) => {
  const safeDays = Array.isArray(days) ? days : [];

  return safeDays
    .map((day, dayIndex) => {
      const dayNumber = Math.max(toInt(day?.dayNumber, dayIndex + 1), 1);
      const safeDestinations = Array.isArray(day?.destinations)
        ? day.destinations
        : [];

      const destinations = safeDestinations
        .map((dest, destIndex) => {
          const placeId = toInt(dest?.placeId);
          if (!placeId) return null;

          const durationMinutes = toInt(dest?.durationMinutes, null);
          const estimatedCost = Number(dest?.estimatedCost);

          return {
            placeId,
            order: Math.max(toInt(dest?.order, destIndex + 1), 1),
            startTime: dest?.startTime ?? null,
            endTime: dest?.endTime ?? null,
            durationMinutes:
              Number.isFinite(durationMinutes) && durationMinutes > 0
                ? durationMinutes
                : null,
            note: dest?.note ?? null,
            transportToNext: dest?.transportToNext ?? null,
            estimatedCost:
              Number.isFinite(estimatedCost) && estimatedCost >= 0
                ? Math.round(estimatedCost)
                : null,
          };
        })
        .filter(Boolean);

      return {
        dayNumber,
        theme:
          typeof day?.theme === "string" && day.theme.trim()
            ? day.theme.trim()
            : `Ngày ${dayNumber}`,
        destinations,
      };
    })
    .filter((day) => day.destinations.length > 0);
};

export const normalizeItinerary = (itinerary, fallbackTotalDays = 1) => {
  const safeFallbackDays = Math.max(toInt(fallbackTotalDays, 1), 1);
  const days = normalizeItineraryDays(itinerary?.days);
  const parsedTotalDays = Math.max(
    toInt(itinerary?.totalDays, safeFallbackDays),
    1,
  );
  const totalDays = Math.max(parsedTotalDays, days.length || 1);
  const estimatedCost = Number(itinerary?.estimatedCost);

  return {
    title:
      typeof itinerary?.title === "string" && itinerary.title.trim()
        ? itinerary.title.trim()
        : `Lịch trình ${totalDays} ngày ở Cần Thơ`,
    description:
      typeof itinerary?.description === "string" && itinerary.description.trim()
        ? itinerary.description.trim()
        : null,
    totalDays,
    estimatedCost:
      Number.isFinite(estimatedCost) && estimatedCost >= 0
        ? Math.round(estimatedCost)
        : null,
    days,
  };
};

/**
 * Server-side Validation để co kéo khung giờ chặng đi khớp với giờ hoạt động thực tế của Place
 * @param {Array} days Các ngày chặng đi của lịch trình sau khi normalize
 * @param {Array} rawPlacesData Danh sách địa điểm đầy đủ từ database (bao gồm openingHours)
 * @returns {Array} Mảng các ngày chặng đi đã được co kéo khớp giờ mở cửa
 */
export const validateAndCorrectItinerary = (days, rawPlacesData) => {
  if (!Array.isArray(days) || !Array.isArray(rawPlacesData)) return days;
  const placeById = new Map(rawPlacesData.map((place) => [place.id, place]));

  return days.map((day) => {
    // Để tính dayOfWeek thực tế, ta sử dụng dayNumber (ví dụ ngày thứ 1, 2, 3...)
    // Mặc định: ngày 1 -> Thứ 2 (dayOfWeek = 1), ngày 2 -> Thứ 3 (dayOfWeek = 2)...
    // Ở Việt Nam, dayOfWeek thường gán: 0=Chủ nhật, 1=Thứ hai, ..., 6=Thứ bảy
    const dayOfWeek = (day.dayNumber) % 7; 

    const destinations = (day.destinations || []).map((dest) => {
      const placeId = toInt(dest.placeId);
      const placeInfo = placeById.get(placeId);
      if (!placeInfo) return dest;

      // Tìm bản ghi mở cửa tương ứng với ngày trong tuần
      const openingHoursList = placeInfo.openingHours || [];
      const openingHour = openingHoursList.find((h) => h.dayOfWeek === dayOfWeek) 
        || openingHoursList.find((h) => !h.isClosed) 
        || openingHoursList[0];

      if (openingHour && !openingHour.isClosed) {
        let updatedStartTime = dest.startTime;
        let updatedEndTime = dest.endTime;

        // Chuẩn hóa định dạng thời gian HH:mm để so sánh chuỗi trực tiếp
        if (openingHour.openTime && dest.startTime && dest.startTime < openingHour.openTime) {
          updatedStartTime = openingHour.openTime;
        }
        if (openingHour.closeTime && dest.endTime && dest.endTime > openingHour.closeTime) {
          updatedEndTime = openingHour.closeTime;
        }

        // Đảm bảo startTime không vượt quá endTime sau khi co kéo
        if (updatedStartTime && updatedEndTime && updatedStartTime > updatedEndTime) {
          updatedStartTime = updatedEndTime;
        }

        return {
          ...dest,
          startTime: updatedStartTime,
          endTime: updatedEndTime,
        };
      }

      return dest;
    });

    return {
      ...day,
      destinations,
    };
  });
};
