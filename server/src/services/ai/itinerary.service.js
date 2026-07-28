/**
 * itinerary.service.js — AI trip itinerary generation (Groq backend).
 * Uses Groq Cloud AI Gateway via the OpenAI-compatible SDK.
 */
import crypto from "crypto";
import prisma from "../../config/prismaClient.js";
import { ERROR_CODES } from "../../config/messages.js";
import ServiceError from "../../utils/serviceError.js";
import { renderConfiguredPrompt } from "../../lib/promptBuilder.js";
import { createGroqClient, executeGroqCompletionWithPool } from "./groq.service.js";
import {
  logAiProviderEvent,
  toAiServiceError,
} from "./aiProviderPolicy.js";
import { kMeansClustering, solveNearestNeighborTSP } from "../../utils/clustering.js";
import { validateAndCorrectItinerary } from "../../utils/itineraryFormatter.js";
import { buildValidatedCachedItineraryResult, parseAndValidateItineraryOutput } from "./itineraryOutput.js";
import {
  ITINERARY_MONEY_MAX,
  itineraryPreviewSchema,
} from "../../models/schemas/trip/itineraryPreview.schema.js";

const DEFAULT_DESTINATIONS_PER_DAY = 3;
const START_TIME_SLOTS = ["08:00", "11:00", "14:30"];

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

  return Math.min(
    ITINERARY_MONEY_MAX,
    Math.max(30000, Math.round(estimated)),
  );
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
 * Create a deterministic fallback itinerary when AI is unavailable/quota exceeded.
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
  const selectedIds = Array.isArray(preferences.selectedPlaceIds)
    ? preferences.selectedPlaceIds.map((id) => Number(id)).filter(Boolean)
    : [];
  const destinationsPerDay = Math.max(
    1,
    Math.min(
      selectedIds.length > 0
        ? Math.ceil(selectedIds.length / totalDays)
        : DEFAULT_DESTINATIONS_PER_DAY,
      places.length,
      12,
    ),
  );

  const placeById = new Map(places.map((place) => [Number(place?.id), place]));
  const selectedPlaces = selectedIds
    .map((id) => placeById.get(id))
    .filter(Boolean);
  const requiredStops = Math.max(
    selectedPlaces.length || totalDays * destinationsPerDay,
    1,
  );
  const fallbackSource = selectedPlaces.length > 0 ? selectedPlaces : places;
  const pickedPlaces = Array.from(
    { length: requiredStops },
    (_, index) => fallbackSource[index % fallbackSource.length],
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
        const rawEstimatedCost = estimateDestinationCost(
          place,
          groupSize,
          budgetPerPerson,
          totalDays,
          destinationsPerDay,
        );
        // Cap against the remaining preview budget so the total continues to
        // equal the sum of its destination-level cost breakdown.
        const estimatedCost = Math.min(
          rawEstimatedCost,
          Math.max(ITINERARY_MONEY_MAX - totalEstimatedCost, 0),
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

  return itineraryPreviewSchema.parse({
    title: `Lịch trình ${totalDays} ngày ở Cần Thơ`,
    description:
      "Lịch trình dự phòng được tạo từ dữ liệu địa điểm hiện có khi AI tạm thời không khả dụng.",
    totalDays,
    estimatedCost: totalEstimatedCost,
    days,
  });
}

// ─── Itinerary generation ─────────────────────────────────────────────────────

/**
 * Build a structured prompt for trip itinerary generation.
 * @param {Object} preferences - User travel preferences
 * @param {Array}  clusteredPlaces - Available approved places from DB, grouped by day index
 */
function buildItineraryPrompt(
  preferences,
  clusteredPlaces,
  configuredPrompt = "",
  promptVariables = {},
) {
  const { totalDays, travelStyle, groupSize, budget, notes } = preferences;
  const selectedPlaceIds = Array.isArray(preferences.selectedPlaceIds)
    ? preferences.selectedPlaceIds.map((id) => Number(id)).filter(Boolean)
    : [];
  const selectedRequirement = selectedPlaceIds.length > 0
    ? `- Mandatory selected place IDs: ${selectedPlaceIds.join(", ")}. Include every one of these placeId values exactly once when the ID exists in the DB list. Do not reduce the itinerary to only 3 places.`
    : "";

  const minifiedClustered = clusteredPlaces.map((cluster, idx) => ({
    dayNumber: idx + 1,
    places: cluster.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category?.name || "Khác",
    })),
  }));

  return `${renderConfiguredPrompt(configuredPrompt, promptVariables)}

Bạn là trợ lý du lịch thông minh cho Cần Thơ, Việt Nam.
Hãy tạo lịch trình du lịch Cần Thơ chi tiết dựa theo các thông tin sau:

**Thông tin chuyến đi:**
- Số ngày: ${totalDays || 1}
- Phong cách: ${travelStyle || "Tham quan chung"}
- Số người: ${groupSize || 1}
- Ngân sách ước tính: ${budget ? budget + " VNĐ/người" : "Không giới hạn"}
${notes ? `- Ghi chú: ${notes}` : ""}
${selectedRequirement}

**Danh sách địa điểm CSDL khả dụng theo từng ngày:**
${JSON.stringify(minifiedClustered, null, 2)}

**YÊU CẦU NGHIÊM NGẶT:**
1. Bạn CHỈ ĐƯỢC phép xếp địa điểm của cụm Ngày N vào đúng ngày ("dayNumber": N) trong lịch trình đầu ra. Không được hoán đổi địa điểm giữa các ngày.
2. Dùng đúng giá trị số "id" của địa điểm cho trường "placeId" của đầu ra. TUYỆT ĐỐI KHÔNG TỰ TẠO SỐ ID KHÔNG CÓ TRONG CSDL.
3. ĐẶC BIỆT LƯU Ý: Nếu người dùng có yêu cầu hoặc đề cập các địa điểm cụ thể trong Ghi chú ("notes") hoặc tin nhắn trước, bạn BẮT BUỘC phải ưu tiên xếp đầy đủ các địa điểm đó vào lịch trình (dùng đúng placeId tương ứng trong CSDL).
4. Tuyệt đối không dùng dấu hoa thị (*) hoặc markdown bold (*).
5. Trả về JSON hợp lệ khớp với schema yêu cầu, không giải thích gì thêm.

**JSON Schema yêu cầu:**
${JSON.stringify({
    title: "string",
    description: "string",
    totalDays: "number",
    estimatedCost: "number",
    days: [{
      dayNumber: "number",
      theme: "string",
      destinations: [{
        placeId: "number",
        order: "number",
        startTime: "string (HH:mm)",
        endTime: "string (HH:mm)",
        durationMinutes: "number",
        note: "string",
        transportToNext: "string",
        estimatedCost: "number"
      }]
    }]
  }, null, 2)}

Chỉ trả về JSON thuần, không markdown, không giải thích.`;
}

/**
 * Generate a trip itinerary via Groq chat completion with structured JSON output.
 * @param {Object} preferences
 * @param {Array}  places
 * @returns {{ parsed: Object, raw: string, tokensUsed: number, responseTimeMs: number }}
 */
export async function generateItinerary(
  preferences,
  places,
  providerOptions = {},
  providerContext = {},
) {
  // Phân cụm địa điểm bằng K-Means trước khi gọi AI
  const totalDays = Math.min(
    Math.max(toPositiveInt(preferences.totalDays, 1), 1),
    7,
  );
  const rawAllowedPlaces =
    Array.isArray(providerContext?.places) && providerContext.places.length > 0
      ? providerContext.places
      : Array.isArray(places) && places.length > 0
        ? places
        : [];

  // Nếu người dùng chọn/yêu cầu địa điểm cụ thể, đưa các địa điểm đó lên đầu mảng
  const selectedIds = new Set(
    Array.isArray(preferences.selectedPlaceIds)
      ? preferences.selectedPlaceIds.map((id) => Number(id)).filter(Boolean)
      : [],
  );

  const allowedPlaces = selectedIds.size > 0
    ? [
        ...rawAllowedPlaces.filter((p) => selectedIds.has(p.id)),
        ...rawAllowedPlaces.filter((p) => !selectedIds.has(p.id)),
      ]
    : rawAllowedPlaces;

  const clusteredPlaces = kMeansClustering(allowedPlaces, totalDays);

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
    const cachedResult = buildValidatedCachedItineraryResult(cached, places);
    if (cachedResult) return cachedResult;
  } catch {
    // Bỏ qua lỗi đọc cache và gọi trực tiếp AI
  }

  const prompt = buildItineraryPrompt(
    {
      totalDays:
        providerContext.tripDuration ?? preferences.totalDays,
      travelStyle:
        providerContext.travelPreferences?.travelStyles?.join(", ") ||
        undefined,
      groupSize:
        providerContext.partySize ?? preferences.groupSize,
      budget: providerContext.budget,
      notes: preferences.notes,
    },
    clusteredPlaces,
    providerOptions.configuredPrompt,
    providerContext,
  );
  const start = Date.now();

  let rawText;
  let tokensUsed = null;
  try {
    const completion = await executeGroqCompletionWithPool(
      providerOptions,
      async (client) => {
        return client.chat.completions.create(
          {
            model: providerOptions.model,
            messages: [{ role: "user", content: prompt }],
            temperature: Math.min(providerOptions.temperature, 0.3),
            top_p: providerOptions.topP,
            max_tokens: providerOptions.maxTokens,
            response_format: { type: "json_object" },
          },
          { timeout: providerOptions.timeoutMs },
        );
      },
    );
    rawText = completion.choices[0]?.message?.content || "";
    tokensUsed = completion.usage?.total_tokens ?? null;
    logAiProviderEvent({
      feature: "itinerary",
      model: providerOptions.model,
      startedAt: start,
      completion,
    });
  } catch (err) {
    const aiError = toAiServiceError(err);
    logAiProviderEvent({
      feature: "itinerary",
      model: providerOptions.model,
      startedAt: start,
      code: aiError.code,
    });
    throw aiError;
  }

  let parsed;
  try {
    parsed = parseAndValidateItineraryOutput(rawText, places);
  } catch (parseError) {
    console.warn(
      `[Itinerary AI] Invalid output from provider (${parseError.message}). Using candidate places fallback.`
    );
    parsed = buildFallbackItinerary(places, totalDays, preferences);
  }

  // 1. Validate và co kéo thời gian khớp giờ mở cửa thực tế
  parsed.days = validateAndCorrectItinerary(parsed.days, places);

  // 2. Tối ưu hóa thứ tự chặng đi bằng TSP Solver trong từng ngày
  parsed.days = parsed.days.map((day) => {
    const destinations = day.destinations || [];
    if (destinations.length <= 2) return day;

    const dayPlaces = destinations.map((d) => {
      const p = places.find((pl) => pl.id === d.placeId);
      return {
        ...d,
        latitude: p?.latitude,
        longitude: p?.longitude,
      };
    });

    const optimizedDayPlaces = solveNearestNeighborTSP(dayPlaces);

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
    // Bỏ qua lỗi ghi cache — vẫn trả kết quả cho client
  }

  return {
    parsed,
    raw: rawText,
    tokensUsed,
    responseTimeMs: Date.now() - start,
  };
}
