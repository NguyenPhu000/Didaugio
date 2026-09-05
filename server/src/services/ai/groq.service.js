/**
 * groq.service.js — Groq Cloud AI integration.
 * Uses the official Groq SDK.
 */
import Groq from "groq-sdk";
import logger from "../../config/logger.js";
import { resolveProviderSecret } from "../adminAi/aiCredential.service.js";
import { renderConfiguredPrompt } from "../../lib/promptBuilder.js";
import {
  logAiProviderEvent,
  normalizeProviderMessages,
  toAiServiceError,
} from "./aiProviderPolicy.js";
import { executeAiRequest } from "./runtime/aiRuntimeExecution.js";
import prisma from "../../config/prismaClient.js";
import {
  findPlacesNearby,
  findNearestDistrict,
  findNearestWard,
  findRelatedPlacesByKeywords,
} from "../../utils/spatialQuery.js";

// Pre-compiled Regular Expressions for better performance
const REGEX_EXTRACT_PLACES = /[\(\[\{]\s*(?:PLACES?|PLACE_ID|ID)\s*:\s*([\d\s,]+)\s*[\)\]\}]/gi;
const REGEX_STRIP_TAGS = /[\(\[\{]\s*(?:PLACES?|PLACE_ID|PLACES_ID|MÃ_ID|MÃ|ID)\s*:\s*[\d\s,]+\s*[\)\]\}]/gi;
const REGEX_STRIP_PARENS = /[\(\[\{]\s*(?:MÃ\s*ID|PLACE\s*ID|PLACES?|MÃ|ID)?\s*#?\s*:?\s*[\d\s,]+\s*[\)\]\}]/gi;
const REGEX_STRIP_BARE_ID = /\b(?:MÃ\s*ID|PLACE\s*ID|PLACES?|MÃ|ID)\s*#?\s*:?\s*\d+\b/gi;
const REGEX_STRIP_EMPTY_PARENS = /[\(\[\{]\s*[\)\]\}]/g;
const REGEX_MULTIPLE_SPACES = / {2,}/g;
const REGEX_SPLIT_KEYS = /[\n,;]+/;

export function createGroqClient({ apiKey, baseUrl = "https://api.groq.com" } = {}) {
  if (!apiKey) {
    throw Object.assign(new Error("Groq credential is unavailable."), {
      code: "AI_SECRET_UNAVAILABLE",
      errorCode: "AI_SECRET_UNAVAILABLE",
      statusCode: 503,
    });
  }
  return new Groq({ apiKey, baseURL: baseUrl });
}

export function parseApiKeyPool(secretString) {
  if (!secretString || typeof secretString !== "string") return [];
  return secretString
    .split(REGEX_SPLIT_KEYS)
    .map((k) => k.trim())
    .filter(Boolean);
}

export async function resolveGroqProviderOptions(configData, feature) {
  const apiKeySecret = await resolveProviderSecret(configData.provider.secretReference);
  const apiKeys = parseApiKeyPool(apiKeySecret);
  
  return {
    apiKey: apiKeys[0] || "",
    apiKeys,
    baseUrl: configData.provider.baseUrl,
    model: configData.provider.model,
    temperature: configData.modelParameters.temperature,
    topP: configData.modelParameters.topP,
    maxTokens: configData.modelParameters.maxTokens,
    timeoutMs: configData.modelParameters.timeoutMs,
    configuredPrompt: configData.prompts[feature],
  };
}

// Bộ nhớ lưu thời gian cooldown của các Key bị Rate Limit (Key -> Timestamp hết hạn phạt)
const keyCooldownMap = new Map();
// Counter duy trì vị trí xoay vòng Round-Robin
let keyRoundRobinIndex = 0;

const COOLDOWN_DURATION_MS = 60 * 1000; // 60 giây phạt khi đụng 429

/**
 * Kiểm tra xem Key có đang trong thời gian cooldown hay không.
 */
function isKeyCoolingDown(apiKey) {
  const expireTime = keyCooldownMap.get(apiKey);
  if (!expireTime) return false;
  if (Date.now() > expireTime) {
    keyCooldownMap.delete(apiKey);
    return false;
  }
  return true;
}

/**
 * Đánh dấu Key bị tạm dừng sử dụng trong COOLDOWN_DURATION_MS (60s).
 */
function markKeyCooldown(apiKey) {
  keyCooldownMap.set(apiKey, Date.now() + COOLDOWN_DURATION_MS);
}

/**
 * Thực thi gọi Groq API sử dụng Key Pool với cơ chế Round-Robin + 60s Cooldown Memory.
 */
export async function executeGroqCompletionWithPool(providerOptions, executionCallback) {
  const keys = providerOptions?.apiKeys?.length > 0
    ? providerOptions.apiKeys
    : [providerOptions?.apiKey].filter(Boolean);

  if (!keys.length) {
    const client = createGroqClient(providerOptions);
    return executionCallback(client);
  }

  // 1. Lọc lấy danh sách các Key khả dụng (không nằm trong thời gian 60s cooldown)
  let availableKeys = keys.filter((k) => !isKeyCoolingDown(k));

  // Nếu tất cả các key đều bị cooldown, fallback sử dụng toàn bộ key danh sách gốc
  if (availableKeys.length === 0) {
    logger.warn(`[Groq Key Pool] Tất cả ${keys.length} Keys đều đang trong trạng thái Cooldown. Thử lại toàn bộ pool...`);
    availableKeys = keys;
  }

  // 2. Chọn vị trí bắt đầu theo cơ chế Round-Robin để chia đều tải
  const startIndex = keyRoundRobinIndex % availableKeys.length;
  keyRoundRobinIndex = (keyRoundRobinIndex + 1) % Number.MAX_SAFE_INTEGER;

  // Sắp xếp lại danh sách key ưu tiên từ vị trí startIndex
  const rotatedKeys = [
    ...availableKeys.slice(startIndex),
    ...availableKeys.slice(0, startIndex),
  ];

  let lastError;
  for (let i = 0; i < rotatedKeys.length; i++) {
    const currentKey = rotatedKeys[i];
    try {
      const client = createGroqClient({ ...providerOptions, apiKey: currentKey });
      const result = await executionCallback(client);
      
      // Xóa khỏi cooldown nếu gọi thành công
      keyCooldownMap.delete(currentKey);
      return result;
    } catch (error) {
      lastError = toAiServiceError(error);
      const statusCode = lastError.statusCode || error?.status || error?.response?.status;
      const errorCode = lastError.code || error?.code;
      
      // Nhận diện lỗi Rate Limit (429) hoặc Key hỏng/hết hạn (401/403/INVALID_API_KEY)
      const isRateLimitOrInvalid =
        statusCode === 429 ||
        statusCode === 401 ||
        statusCode === 403 ||
        errorCode === "QUOTA_EXCEEDED" ||
        errorCode === "INVALID_API_KEY" ||
        errorCode === "UNAUTHORIZED";

      if (isRateLimitOrInvalid) {
        // Đánh dấu Key hỏng/429 vào danh sách tạm dừng 60s để bỏ qua ở các request sau
        markKeyCooldown(currentKey);

        if (i < rotatedKeys.length - 1) {
          logger.info(
            `[Groq Key Pool] Key ...${currentKey.slice(-6)} không khả dụng (Code: ${statusCode || errorCode}). LẬP TỨC xoay sang Key tiếp theo...`
          );
          // Tiếp tục vòng lặp NGAY LẬP TỨC (0ms delay) sang key tiếp theo trong rotatedKeys
          continue;
        }
      }
      throw lastError;
    }
  }
  throw lastError;
}

/**
 * Format price range to human-readable Vietnamese string.
 * @param {number|null} from
 * @param {number|null} to
 * @returns {string}
 */
function formatPriceRange(from, to) {
  if (!from && !to) return "Chưa cập nhật";
  
  const fmt = (v) => {
    if (!v || v <= 0) return null;
    if (v >= 1_000_000) {
      const millions = v / 1_000_000;
      return Number.isInteger(millions) ? `${millions} triệu` : `${millions.toFixed(1)} triệu`;
    }
    return `${Math.round(v / 1000)}k`;
  };
  
  const f = fmt(from);
  const t = fmt(to);
  
  if (f && t) return f === t ? f : `${f} - ${t}`;
  return f || t || "Chưa cập nhật";
}

const appendLocationContext = (parts, context) => {
  if (context.locationContext) {
    const { district, ward, coords } = context.locationContext;
    const location = ["Ngu canh vi tri hien tai cua nguoi dung:", ward && `Phuong/Xa ${ward},`, district && `Quan/Huyen ${district},`, "Can Tho."].filter(Boolean);
    parts.push(`\n${location.join(" ")}`);
    if (coords) parts.push(`Toa do GPS hien tai: ${coords.latitude}, ${coords.longitude}`);
    return;
  }
  if (context.currentCity) parts.push(`\nNgu canh vi tri: Tinh/Thanh pho — ${context.currentCity}`);
  if (context.currentCoords?.latitude && context.currentCoords?.longitude) {
    parts.push(`Toa do GPS: ${context.currentCoords.latitude}, ${context.currentCoords.longitude}`);
  }
};

const appendPreferenceContext = (parts, context) => {
  if (context.travelPreferences) {
    const { travelStyles, budget, notes } = context.travelPreferences;
    const preferences = [travelStyles?.length && `Gu du lich: ${travelStyles.join(", ")}`, budget && `Ngan sach du tinh: ${budget}`, notes && `Ghi chu ca nhan: ${notes}`].filter(Boolean);
    if (preferences.length) parts.push(`\nThong tin so thich cua nguoi dung de ca nhan hoa goi y:\n${preferences.join("\n")}`);
  } else if (context.preferences?.travelStyles?.length) {
    parts.push(`So thich: ${context.preferences.travelStyles.join(", ")}`);
  }
  if (context.visitedPlaceIds?.length) parts.push(`Da xem: ${context.visitedPlaceIds.slice(-5).join(", ")}`);
};

const formatPlaceLine = (place) => {
  const category = place.categoryName || place.category?.name || "Dia diem";
  const price = formatPriceRange(place.priceFrom, place.priceTo);
  const details = [place.address && `Dia chi: ${place.address}`, price && `Gia: ${price}`, place.ratingAvg && `Danh gia: ${place.ratingAvg}/5`, place.shortDescription && `Mo ta: ${place.shortDescription.substring(0, 80)}`].filter(Boolean);
  return `- ID ${place.id}: "${place.name}" (Danh muc: ${category}${details.length ? `, ${details.join(", ")}` : ""})`;
};

const appendPlacesContext = (parts, context) => {
  if (!Array.isArray(context.systemPlaces) || context.systemPlaces.length === 0) {
    parts.push(`\nQUY TAC CHONG BIA DAT: Hien tai CSDL chua co dia diem nao phu hop. Ban KHONG DUOC BIA NOI bat ky ten quan/dia diem nao. Hay thong bao: "Genie chua tim thay dia diem phu hop trong CSDL ne" va hoi lai nhu cau cua nguoi dung.`);
    return;
  }
  const allowedNames = context.systemPlaces.map((place) => `"${place.name}"`).join(", ");
  const formattedPlaceLines = context.systemPlaces.map(formatPlaceLine).join("\n");
  parts.push(
    `\nQUY TAC CHONG BIA DAT KHAC NGHIET (ZERO HALLUCINATION):`,
    `DANH SACH TEN DIA DIEM DUY NHAT DUOC PHEP NHAC TOI: [ ${allowedNames} ]`,
    `TUYET DOI KHONG TU NOI HOAC BIA BAT KY TEN QUAN/DIA DIEM NAO KHAC BEN NGOAI DANH SACH TREN.`,
    `Neu nguoi dung hoi mon an/quan ma trong CSDL khong co, hay tra loi thang than: "Hien tai Genie chua co thong tin quan nay trong he thong Can Tho ne" va goi y 1 trong cac quan co san trong danh sach CSDL duoi day.`,
    `\nDANH SACH CHI TIET DIA DIEM CSDL:\n${formattedPlaceLines}`,
    `\nQUY TAC [PLACES:...] TAG — BAT BUOC TUAN THU:`,
    `1. TUYET DOI CAM viet bat ky ma ID nao (nhu (PLACES:254), [PLACES:254], ID 240, (ID 240), ma 240...) VAO TRONG NOI DUNG VAN BAN TRA LOI.`,
    `2. O CUOI CUNG cua toan bo cau tra loi, DINH KEM DUY NHAT 1 dong he thong chua TAT CA ID dia diem duoc goi y.`,
    `3. FORMAT CHINH XAC: [PLACES: id1, id2, id3, id4, id5]`,
    `4. SO LUONG ID phai KHOP CHINH XAC voi so luong dia diem duoc nhac trong van ban. Van ban nhac 5 dia diem = phai co 5 ID. Van ban nhac 3 = phai co 3 ID.`,
    `5. VI DU DUNG: Neu goi y 5 dia diem co ID 10, 25, 37, 42, 56 thi dong cuoi la: [PLACES: 10, 25, 37, 42, 56]`,
    `6. NGHIEM CAM viet nhieu dong [PLACES:...] rieng le. Chi duy nhat 1 block.`,
    `7. Neu KHONG goi y dia diem nao, KHONG can dong [PLACES:...]`,
  );
};

/**
 * Build system prompt for the travel assistant persona with user context.
 */
function buildGroqSystemPrompt(context = {}, configuredPrompt = "") {
  const parts = [
    renderConfiguredPrompt(configuredPrompt, context),
    `Ban la "Genie" — tro ly du lich ao cua ung dung "iPoint Genie", dong vai mot nguoi ban dia phuong Can Tho am hieu, hay di day di do.`,
    `Nhiem vu: tu van lich trinh, goi y quan an, diem check-in mot cach tu nhien, nhu dang tro chuyen voi ban be.`,
    ``,
    `Phong cach tra loi:`,
    `- Tro chuyen tu nhien, nhu dang nhan tin cho ban, KHONG phai robot doc danh sach`,
    `- Dung ngon ngu mien Nam nhe nhang: "ne", "do", "ha", "nghen", "oi" o cuoi cau khi phu hop`,
    `- Khi goi y dia diem: ke nhu dang gioi thieu cho ban, nhan manh diem dac biet nhat truoc`,
    `- Neu nguoi dung yeu cau so luong cu the (vi du: "goi y 5 cho", "goi y 10 cho"), hay goi y DUNG so luong do tu danh sach CSDL. Neu nguoi dung khong chi dinh so luong, hay goi y 3-5 cho cu the kem GIA THAT tu du lieu, KHONG noi chung chung`,
    `- DIEM THEN CHOT: So luong dia diem trong van ban phai KHOP CHINH XAC voi so luong ID trong [PLACES:...]. Vi du: neu van ban nhac 5 dia diem, phai co dung 5 ID. Neu van ban nhac 3, phai co dung 3 ID.`,
    `- Neu nguoi dung hoi mo ho (vi du: "di dau choi"), hay hoi lai cho ro: muon an gi, budget bao nhieu, thich kieu nao`,
    `- Nho ngu canh cuoc tro chuyen truoc do, neu user tung hoi thi nhac lai de tao lien mach`,
    `- Neu nguoi dung che "dat qua" hoac muon "re hon", goi y thay the tu du lieu co gia thap hon`,
    `- Tra loi ngan gon, xuong dong ro rang, moi y cach mot dong trong cho de doc tren dien thoai`,
    ``,
    `Dinh dang gia ca (RAT QUAN TRONG):`,
    `- Gia duoi 1 trieu: viet dang "120k", "50k", "250k"`,
    `- Gia tu 1 trieu tro len: viet dang "1.5 trieu", "2 trieu"`,
    `- Khoang gia: "120k - 250k" hoac "1.5 - 2 trieu"`,
    `- KHONG BAO GIO viet dang "120000d" hay "1500000d" — rat kho doc`,
    ``,
    `Nguyen tac bat buoc:`,
    `- Neu khong biet → thanh that noi "Genie chua co thong tin ne", KHONG bia dat`,
    `- Tra loi bang tieng Viet tru khi duoc yeu cau`,
    `- NGHIEM CAM su dung bat ky emoji hoac bieu tuong nao trong van ban tra ve. Chi tra ve van ban chu thuan tuy.`,
  ];

  appendLocationContext(parts, context);

  // 2. Thoi gian (Time-aware Context)
  const hour = new Date().getHours();
  const timeOfDay = context.timeOfDay || (hour < 5 ? "Buoi toi" : hour < 11 ? "Buoi sang" : hour < 14 ? "Buoi trua" : hour < 18 ? "Buoi chieu" : "Buoi toi");
  parts.push(`Thoi diem hien tai: ${timeOfDay}`);

  appendPreferenceContext(parts, context);

  appendPlacesContext(parts, context);

  parts.push(`\nLUU Y BAT BUOC CUOI CUNG: Khong bao gio nhac den bat ky ten dia diem nao nam ngoai danh sach CSDL tren.`);

  return parts.join("\n");
}

/**
 * Send a chat completion request to Groq.
 */
export async function chatWithGroq(messages, context = {}, providerOptions = {}) {
  const {
    model,
    temperature,
    topP,
    maxTokens,
    timeoutMs,
    configuredPrompt,
  } = providerOptions;
  
  const systemPrompt = buildGroqSystemPrompt(context, configuredPrompt);
  const normalizedMessages = normalizeProviderMessages(messages);
  const startedAt = Date.now();
  let completion;

  try {
    completion = await executeGroqCompletionWithPool(
      providerOptions,
      (client) => client.chat.completions.create(
        {
          model,
          messages: [{ role: "system", content: systemPrompt }, ...normalizedMessages],
          temperature,
          top_p: topP,
          max_tokens: maxTokens,
        },
        { timeout: timeoutMs }
      )
    );
  } catch (error) {
    const aiError = toAiServiceError(error);
    logAiProviderEvent({ feature: "chat", model, startedAt, code: aiError.code });
    throw aiError;
  }

  const replyText = completion.choices[0]?.message?.content || "";
  
  logAiProviderEvent({
    feature: "chat",
    model,
    startedAt,
    completion,
  });

  // Extract [PLACES: id1, id2] seamlessly with matchAll
  const suggestedPlaceIds = [];
  for (const match of replyText.matchAll(REGEX_EXTRACT_PLACES)) {
    match[1].split(",").forEach((idStr) => {
      const id = parseInt(idStr.trim(), 10);
      if (!isNaN(id)) suggestedPlaceIds.push(id);
    });
  }

  // Strip ALL ID variations efficiently
  const finalReply = replyText
    .replace(REGEX_STRIP_TAGS, "")
    .replace(REGEX_STRIP_PARENS, "")
    .replace(REGEX_STRIP_BARE_ID, "")
    .replace(REGEX_STRIP_EMPTY_PARENS, "")
    .replace(REGEX_MULTIPLE_SPACES, " ")
    .trim();

  return {
    reply: finalReply,
    suggestedPlaceIds: [...new Set(suggestedPlaceIds)],
    inputTokens: completion.usage?.prompt_tokens ?? null,
    outputTokens: completion.usage?.completion_tokens ?? null,
  };
}

/**
 * Validate và chuẩn hóa tọa độ GPS từ context.
 */
export function getValidatedCoordinates(context = {}) {
  const coords = context.currentCoords;
  if (!coords) return null;
  const { latitude, longitude } = coords;
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    ? { latitude, longitude }
    : null;
}

/**
 * Normalize text for diacritic-insensitive matching.
 */
function normalizeText(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Normalize a raw DB place object to a consistent key-value contract for the client.
 * Client expects: id, name, address, description, images (array of {secureUrl, thumbnailUrl}),
 * thumbnailUrl, priceFrom, priceTo, ratingAvg, reviewCount, categoryName, category, ward, district.
 */
function normalizeResponsePlace(raw) {
  if (!raw) return null;

  const images = Array.isArray(raw.images) ? raw.images : [];
  const firstImage = images[0] || {};

  // Ưu tiên: URL cloud (Cloudinary) → thumbnail_url → image_data (Base64) → thumbnail cột places
  const resolvedImageUrl =
    firstImage.secureUrl ||
    firstImage.thumbnailUrl ||
    firstImage.imageData ||
    raw.thumbnail ||
    null;

  return {
    id: raw.id,
    name: raw.name || "",
    address: raw.address || "",
    description: raw.description || "",
    images,
    thumbnailUrl: firstImage.thumbnailUrl || firstImage.secureUrl || firstImage.imageData || raw.thumbnail || null,
    imageUrl: resolvedImageUrl,
    // Expose imageData riêng để client-side resolvePlaceImageUri có thể nhận diện Base64
    imageData: firstImage.imageData || null,
    priceFrom: Number(raw.priceFrom ?? 0),
    priceTo: Number(raw.priceTo ?? 0),
    ratingAvg: raw.ratingAvg ? parseFloat(raw.ratingAvg) : 0,
    reviewCount: Number(raw.reviewCount ?? raw._count?.reviews ?? 0),
    categoryName: raw.categoryName || raw.category?.name || "",
    category: raw.category || null,
    ward: raw.ward || null,
    district: raw.district || null,
  };
}

/**
 * Match systemPlaces against suggestedPlaceIds (ID tag) and fallback name-match in reply text.
 * Returns normalized place objects with consistent key-value contract.
 */
function resolveResponsePlaces(systemPlaces, suggestedPlaceIds, reply) {
  const responsePlaces = [];
  const matchedIds = new Set();

  // Primary: ID tag match — preserves AI's recommended order
  if (suggestedPlaceIds?.length > 0) {
    const placeMap = new Map(systemPlaces.map((p) => [p.id, p]));
    for (const id of suggestedPlaceIds) {
      if (placeMap.has(id)) {
        responsePlaces.push(normalizeResponsePlace(placeMap.get(id)));
        matchedIds.add(id);
      }
    }
  }

  // Fallback: normalized name-match in reply text
  const replyNorm = normalizeText(reply);
  for (const p of systemPlaces) {
    if (!matchedIds.has(p.id)) {
      const nameNorm = normalizeText(p.name);
      if (nameNorm.length >= 3 && replyNorm.includes(nameNorm)) {
        responsePlaces.push(normalizeResponsePlace(p));
        matchedIds.add(p.id);
      }
    }
  }

  return responsePlaces;
}

/**
 * Core business logic for Groq Chat.
 * Resolves context, fetches places, calls AI, matches returned place IDs.
 *
 * @param {{ messages: Array, context: Object, userId?: number|string }} params
 * @returns {{ reply: string, relatedPlaces: Array, requestLogId: number|null }}
 */
export async function processGroqChat({ messages, context = {}, userId }) {
  // 1. Travel preferences from user profile
  let travelPreferences = null;
  if (userId) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { travelPreferences: true },
    });
    travelPreferences = profile?.travelPreferences;
  }

  // 2. Spatial query for nearby places when client sends GPS coords
  let systemPlaces = [];
  let locationContext = null;
  const currentCoords = getValidatedCoordinates(context);

  if (currentCoords) {
    const { latitude: lat, longitude: lng } = currentCoords;
    systemPlaces = await findPlacesNearby(lat, lng, 10, 20);

    const district = await findNearestDistrict(lat, lng);
    const ward = await findNearestWard(lat, lng);
    if (district) {
      locationContext = {
        district: district.name,
        ward: ward ? ward.name : null,
        coords: { latitude: lat, longitude: lng },
      };
    }
  }

  // 3. Keyword fallback when no GPS or no nearby places found
  const lastUserMessage =
    [...messages].reverse().find((m) => m.role === "user")?.content || "";

  if (systemPlaces.length === 0) {
    systemPlaces = await findRelatedPlacesByKeywords(lastUserMessage);
  }

  // 4. Execute AI request
  const execution = await executeAiRequest({
    feature: "chat",
    user: { userId },
    inputText: lastUserMessage,
    context: {
      currentCity: locationContext?.district || context.currentCity,
      timeOfDay: context.timeOfDay,
      travelPreferences,
      places: systemPlaces,
      messages,
    },
    operation: async ({ configData, context: allowedContext }) => {
      const providerOptions = await resolveGroqProviderOptions(configData, "chat");
      const activePlaces =
        allowedContext.places?.length > 0 ? allowedContext.places : systemPlaces;
      return chatWithGroq(
        allowedContext.messages || [{ role: "user", content: lastUserMessage }],
        { ...allowedContext, systemPlaces: activePlaces },
        providerOptions,
      );
    },
  });

  const { reply, suggestedPlaceIds } = execution.result;

  // 5. Match returned place IDs → place objects
  const relatedPlaces = resolveResponsePlaces(systemPlaces, suggestedPlaceIds, reply);

  return {
    reply,
    relatedPlaces,
    requestLogId: execution.requestLogId ?? null,
  };
}

export { buildGroqSystemPrompt };
