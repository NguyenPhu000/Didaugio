/**
 * geminiService.js — Google Gemini integration for AI trip planning.
 * Uses @google/generative-ai SDK.
 */
import crypto from "crypto";
import prisma from "../../config/prismaClient.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import { ERROR_CODES } from "../../config/messages.js";
import { mapGeminiError } from "../../lib/geminiErrorHandler.js";
import ServiceError from "../../utils/serviceError.js";
import {
  geminiModel,
  geminiStructuredModel,
} from "../../config/geminiClient.js";
import { kMeansClustering, solveNearestNeighborTSP } from "../../utils/clustering.js";
import { validateAndCorrectItinerary } from "../../utils/itineraryFormatter.js";

const DEFAULT_DESTINATIONS_PER_DAY = 3;
const START_TIME_SLOTS = ["08:00", "11:00", "14:30"];

const ItineraryDestinationSchema = z.object({
  placeId: z.number().int(),
  order: z.number().int(),
  startTime: z.string(),
  endTime: z.string(),
  durationMinutes: z.number().int(),
  note: z.string(),
  transportToNext: z.string(),
  estimatedCost: z.number(),
});

const ItineraryDaySchema = z.object({
  dayNumber: z.number().int(),
  theme: z.string(),
  destinations: z.array(ItineraryDestinationSchema),
});

const ItinerarySchema = z.object({
  title: z.string(),
  description: z.string(),
  totalDays: z.number().int(),
  estimatedCost: z.number(),
  days: z.array(ItineraryDaySchema),
});

function toPositiveInt(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function addMinutesToTime(startTime, minutesToAdd) {
  const [hourText, minuteText] = String(startTime || "08:00").split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  const safeHour = Number.isFinite(hour) ? hour : 8;
  const safeMinute = Number.isFinite(minute) ? minute : 0;
  const totalMinutes = safeHour * 60 + safeMinute + Math.max(minutesToAdd, 0);

  const normalizedHour = Math.floor((totalMinutes / 60) % 24);
  const normalizedMinute = totalMinutes % 60;

  return `${String(normalizedHour).padStart(2, "0")}:${String(normalizedMinute).padStart(2, "0")}`;
}

function estimateDestinationCost(
  place,
  groupSize,
  budgetPerPerson,
  totalDays,
  destinationsPerDay,
) {
  const placePriceFrom = Number(place?.priceFrom ?? place?.price_from);
  const baseCost =
    Number.isFinite(placePriceFrom) && placePriceFrom > 0
      ? placePriceFrom
      : 120000;

  const safeGroup = Math.max(1, Math.min(groupSize, 8));
  let estimated = baseCost * (1 + (safeGroup - 1) * 0.35);

  if (Number.isFinite(budgetPerPerson) && budgetPerPerson > 0) {
    const totalStops = Math.max(totalDays * destinationsPerDay, 1);
    const budgetPerStopForGroup = (budgetPerPerson * safeGroup) / totalStops;
    estimated = Math.min(
      Math.max(estimated, 30000),
      budgetPerStopForGroup * 1.25,
    );
  }

  return Math.max(30000, Math.round(estimated));
}

function buildDayTheme(dayNumber, travelStyle) {
  if (travelStyle) {
    return `Ngày ${dayNumber} - ${travelStyle}`;
  }
  if (dayNumber === 1) return "Khám phá trung tâm";
  if (dayNumber === 2) return "Ẩm thực và trải nghiệm địa phương";
  return `Hành trình ngày ${dayNumber}`;
}

/**
 * Create a deterministic fallback itinerary when Gemini is unavailable/quota exceeded.
 * @param {Object} preferences
 * @param {Array} places
 */
export function generateFallbackItinerary(preferences = {}, places = []) {
  if (!Array.isArray(places) || places.length === 0) {
    throw new ServiceError(
      "Không có địa điểm nào phù hợp với yêu cầu",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  const totalDays = Math.min(
    Math.max(toPositiveInt(preferences.totalDays, 1), 1),
    7,
  );
  const groupSize = Math.max(toPositiveInt(preferences.groupSize, 1), 1);
  const budgetPerPerson = Number(preferences.budget);
  const destinationsPerDay = Math.max(
    1,
    Math.min(DEFAULT_DESTINATIONS_PER_DAY, places.length),
  );

  const requiredStops = Math.max(totalDays * destinationsPerDay, 1);
  const pickedPlaces = Array.from(
    { length: requiredStops },
    (_, index) => places[index % places.length],
  );

  let totalEstimatedCost = 0;

  const days = Array.from({ length: totalDays }, (_, dayIndex) => {
    const dayNumber = dayIndex + 1;

    const destinations = Array.from(
      { length: destinationsPerDay },
      (_, slot) => {
        const place = pickedPlaces[dayIndex * destinationsPerDay + slot];
        const placeId = Number(place?.id);
        if (!Number.isFinite(placeId)) return null;

        const startTime =
          START_TIME_SLOTS[slot] ||
          addMinutesToTime(
            START_TIME_SLOTS[START_TIME_SLOTS.length - 1],
            (slot - START_TIME_SLOTS.length + 1) * 150,
          );
        const durationMinutes = slot === destinationsPerDay - 1 ? 150 : 120;
        const endTime = addMinutesToTime(startTime, durationMinutes);
        const estimatedCost = estimateDestinationCost(
          place,
          groupSize,
          budgetPerPerson,
          totalDays,
          destinationsPerDay,
        );

        totalEstimatedCost += estimatedCost;

        return {
          placeId,
          order: slot + 1,
          startTime,
          endTime,
          durationMinutes,
          note: `Gợi ý tham quan ${place?.name || "địa điểm"}`,
          transportToNext:
            slot === destinationsPerDay - 1
              ? "Nghỉ ngơi"
              : "Di chuyển bằng xe máy",
          estimatedCost,
        };
      },
    ).filter(Boolean);

    return {
      dayNumber,
      theme: buildDayTheme(dayNumber, preferences.travelStyle),
      destinations,
    };
  });

  return {
    title: `Lịch trình ${totalDays} ngày ở Cần Thơ`,
    description:
      "Lịch trình dự phòng được tạo từ dữ liệu địa điểm hiện có khi AI tạm thời không khả dụng.",
    totalDays,
    estimatedCost: totalEstimatedCost,
    days,
  };
}

// ─── Itinerary generation ─────────────────────────────────────────────────────

/**
 * Build a structured prompt for trip itinerary generation.
 * @param {Object} preferences - User travel preferences
 * @param {Array}  clusteredPlaces - Available approved places from DB, grouped by day index
 */
function buildItineraryPrompt(preferences, clusteredPlaces) {
  const { totalDays, travelStyle, groupSize, budget, notes } = preferences;

  const minifiedClustered = clusteredPlaces.map((cluster, idx) => ({
    dayNumber: idx + 1,
    places: cluster.map((p) => ({
      i: p.id,
      n: p.name,
      c: p.category?.name || "Khác",
    })),
  }));

  return `Bạn là trợ lý du lịch thông minh cho Cần Thơ, Việt Nam.
Hãy tạo lịch trình du lịch Cần Thơ chi tiết dựa theo các thông tin sau:

**Thông tin chuyến đi:**
- Số ngày: ${totalDays || 1}
- Phong cách: ${travelStyle || "Tham quan chung"}
- Số người: ${groupSize || 1}
- Ngân sách ước tính: ${budget ? budget + " VNĐ/người" : "Không giới hạn"}
${notes ? `- Ghi chú: ${notes}` : ""}

**Danh sách địa điểm ĐÃ PHÂN CỤM THEO TỪNG NGÀY (i = ID, n = Tên, c = Danh mục):**
${JSON.stringify(minifiedClustered)}

**YÊU CẦU NGHIÊM NGẶT:**
1. Bạn CHỈ ĐƯỢC phép xếp địa điểm của cụm Ngày N vào đúng ngày ("dayNumber": N) trong lịch trình đầu ra. Không được hoán đổi địa điểm giữa các ngày.
2. Dùng đúng ID ("i") của địa điểm cho trường "placeId" của đầu ra.
3. Trả về JSON hợp lệ khớp với schema yêu cầu, không giải thích gì thêm.`;
}

/**
 * Generate a trip itinerary via Gemini structured output.
 * @param {Object} preferences
 * @param {Array}  places
 * @returns {{ parsed: Object, raw: string, tokensUsed: number, responseTimeMs: number }}
 */
export async function generateItinerary(preferences, places) {
  const jsonSchema = zodToJsonSchema(ItinerarySchema, { target: "openApi3" });
  const model = geminiStructuredModel(jsonSchema);

  // Phân cụm địa điểm bằng K-Means trước khi gọi Gemini AI
  const totalDays = toPositiveInt(preferences.totalDays, 1);
  const clusteredPlaces = kMeansClustering(places, totalDays);

  // Caching nâng cao
  const placeIds = places.map((p) => p.id).sort((a, b) => a - b).join(",");
  const filterHash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ ...preferences, placeIds }))
    .digest("hex");

  try {
    const cached = await prisma.cachedItinerary.findUnique({
      where: { filterHash },
    });
    if (cached) {
      return {
        parsed: cached.itineraryData,
        raw: JSON.stringify(cached.itineraryData),
        tokensUsed: 0,
        responseTimeMs: 0,
      };
    }
  } catch (err) {
    // Bỏ qua lỗi đọc cache và gọi trực tiếp Gemini
  }

  const prompt = buildItineraryPrompt(preferences, clusteredPlaces);
  const start = Date.now();

  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (err) {
    const mapped = mapGeminiError(err);
    throw new ServiceError(
      mapped?.body?.message || "Loi khi goi Gemini API",
      mapped?.status || 503,
      mapped?.body?.errorCode || "AI_ERROR",
    );
  }

  const responseTimeMs = Date.now() - start;
  const tokensUsed = result.response.usageMetadata?.totalTokenCount ?? null;
  const rawText = result.response.text();

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new ServiceError(
      "Gemini trả về JSON không hợp lệ",
      502,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  // 1. Validate và co kéo thời gian khớp giờ mở cửa thực tế
  parsed.days = validateAndCorrectItinerary(parsed.days, places);

  // 2. Tối ưu hóa thứ tự chặng đi bằng TSP Solver trong từng ngày
  parsed.days = parsed.days.map((day) => {
    const destinations = day.destinations || [];
    if (destinations.length <= 2) return day;

    // Lấy tọa độ địa lý của các điểm trong ngày này để giải TSP
    const dayPlaces = destinations.map((d) => {
      const p = places.find((pl) => pl.id === d.placeId);
      return {
        ...d,
        latitude: p?.latitude,
        longitude: p?.longitude,
      };
    });

    const optimizedDayPlaces = solveNearestNeighborTSP(dayPlaces);

    // Sắp xếp lại khung giờ theo thứ tự tăng dần ban đầu để giữ cấu trúc logic (sáng, trưa, tối) của AI
    const sortedTimes = destinations
      .map((d) => ({ start: d.startTime, end: d.endTime, duration: d.durationMinutes }))
      .sort((a, b) => (a.start || "").localeCompare(b.start || ""));

    const optimizedDestinations = optimizedDayPlaces.map((d, index) => {
      const timeSlot = sortedTimes[index] || {};
      return {
        placeId: d.placeId,
        order: index + 1,
        startTime: timeSlot.start || d.startTime,
        endTime: timeSlot.end || d.endTime,
        durationMinutes: timeSlot.duration || d.durationMinutes,
        note: d.note,
        transportToNext: d.transportToNext,
        estimatedCost: d.estimatedCost,
      };
    });

    return {
      ...day,
      destinations: optimizedDestinations,
    };
  });

  // Lưu cache (upsert tránh race khi nhiều request cùng filterHash)
  try {
    await prisma.cachedItinerary.upsert({
      where: { filterHash },
      create: { filterHash, itineraryData: parsed },
      update: { itineraryData: parsed },
    });
  } catch {
    // Bỏ qua lỗi ghi cache — vẫn trả kết quả Gemini cho client
  }

  return { parsed, raw: rawText, tokensUsed, responseTimeMs };
}

export { geminiModel };
