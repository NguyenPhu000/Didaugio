import { ERROR_CODES } from "../../config/messages.js";
import ServiceError from "../../utils/serviceError.js";

export const SPOKEN_GUIDE_LIMITS = Object.freeze({
  text: 5000,
  question: 200,
  answer: 2000,
  faqs: 5,
});

const validationError = (message) =>
  new ServiceError(message, 400, ERROR_CODES.VALIDATION_ERROR);

const trim = (value) => (typeof value === "string" ? value.trim() : "");

export const normalizeSpokenGuideInput = (value) => {
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw validationError("Thong tin thuyet minh khong hop le");
  }

  const locale = trim(value.locale) || "vi-VN";
  const text = trim(value.text);
  const rawFaqs = Array.isArray(value.faqs) ? value.faqs : [];

  if (text.length > SPOKEN_GUIDE_LIMITS.text) {
    throw validationError("Bai gioi thieu khong duoc vuot qua 5.000 ky tu");
  }
  if (rawFaqs.length > SPOKEN_GUIDE_LIMITS.faqs) {
    throw validationError("Moi dia diem co toi da 5 cau hoi thuong gap");
  }

  const faqs = rawFaqs.flatMap((faq, index) => {
    const question = trim(faq?.question);
    const answer = trim(faq?.answer);
    if (!question && !answer) return [];
    if (!question || !answer) {
      throw validationError("Moi cau hoi can day du cau hoi va cau tra loi");
    }
    if (question.length > SPOKEN_GUIDE_LIMITS.question) {
      throw validationError("Cau hoi khong duoc vuot qua 200 ky tu");
    }
    if (answer.length > SPOKEN_GUIDE_LIMITS.answer) {
      throw validationError("Cau tra loi khong duoc vuot qua 2.000 ky tu");
    }
    return [{ question, answer, sortOrder: index }];
  });

  if (!text && faqs.length === 0) return null;
  return { locale, text, faqs };
};

export const writeSpokenGuide = async (tx, placeId, value) => {
  if (value === undefined) return;
  const normalized = normalizeSpokenGuideInput(value);
  const numericPlaceId = Number(placeId);

  if (!normalized) {
    await tx.placeAiGuide.deleteMany({ where: { placeId: numericPlaceId } });
    return;
  }

  const guide = await tx.placeAiGuide.upsert({
    where: {
      placeId_locale: { placeId: numericPlaceId, locale: normalized.locale },
    },
    create: {
      placeId: numericPlaceId,
      locale: normalized.locale,
      text: normalized.text || null,
    },
    update: { text: normalized.text || null },
    select: { id: true },
  });

  await tx.placeGuideFaq.deleteMany({ where: { guideId: guide.id } });
  if (normalized.faqs.length > 0) {
    await tx.placeGuideFaq.createMany({
      data: normalized.faqs.map((faq) => ({ ...faq, guideId: guide.id })),
    });
  }
};

export const toPublicSpokenGuide = (guide) => {
  if (!guide) return null;
  const faqs = (guide.faqs || [])
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(({ id, question, answer, sortOrder }) => ({
      id,
      question,
      answer,
      sortOrder,
    }));

  if (!trim(guide.text) && faqs.length === 0) return null;
  return {
    locale: trim(guide.locale) || "vi-VN",
    text: trim(guide.text),
    faqs,
  };
};

export default {
  normalizeSpokenGuideInput,
  writeSpokenGuide,
  toPublicSpokenGuide,
};
